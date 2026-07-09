# -*- coding: utf-8 -*-
"""
villa.reservation — the ERD's custom reservation model.

One reservation per stay, linked to one sale.order that carries the villa
nights plus any service / F&B lines. Availability is the absence of an
overlapping non-cancelled reservation for the villa product.

Workflow (BPMN): draft → confirmed (B4) → checked_in (B7) → checked_out (B18),
or → cancelled. Checking out spawns a housekeeping turnover task (B24).
"""
from odoo import api, fields, models
from odoo.exceptions import UserError, ValidationError


class VillaReservation(models.Model):
    _name = "villa.reservation"
    _description = "Villa Reservation"
    _inherit = ["mail.thread", "mail.activity.mixin"]
    _order = "check_in_date desc, id desc"

    name = fields.Char(
        string="Reference", required=True, copy=False, readonly=True,
        default=lambda self: "New", index=True,
    )
    partner_id = fields.Many2one(
        "res.partner", string="Guest", required=True, tracking=True,
    )
    product_id = fields.Many2one(
        "product.template", string="Villa", required=True, tracking=True,
        domain=[("x_kind", "=", "villa")],
    )
    sale_order_id = fields.Many2one("sale.order", string="Sale Order", copy=False)

    check_in_date = fields.Date(string="Check-in", required=True, tracking=True)
    check_out_date = fields.Date(string="Check-out", required=True, tracking=True)
    nights = fields.Integer(string="Nights", compute="_compute_nights", store=True)
    guests = fields.Integer(string="Guests", default=2)

    state = fields.Selection(
        [
            ("draft", "Draft"),
            ("confirmed", "Confirmed"),
            ("checked_in", "Checked in"),
            ("checked_out", "Checked out"),
            ("cancelled", "Cancelled"),
        ],
        string="Status", default="draft", tracking=True, index=True,
    )
    source = fields.Selection(
        [
            ("direct", "Direct"),
            ("walkin", "Walk-in"),
            ("agent", "Agent"),
            ("ota", "OTA"),
        ],
        string="Source", default="direct",
    )
    channel = fields.Char(string="OTA channel")
    notes = fields.Text(string="Notes")

    amount_total = fields.Monetary(
        string="Total", related="sale_order_id.amount_total", store=True,
    )
    amount_due = fields.Monetary(
        string="Balance", compute="_compute_amount_due", store=True,
    )
    currency_id = fields.Many2one(
        "res.currency", related="sale_order_id.currency_id", store=True,
    )

    # -- payment (Midtrans Snap; gateway ref + settlement state) ----------
    payment_state = fields.Selection(
        [
            ("unpaid", "Unpaid"),
            ("pending", "Pending"),
            ("deposit", "Deposit paid"),
            ("paid", "Paid"),
        ],
        string="Payment", default="unpaid", tracking=True, index=True,
    )
    payment_ref = fields.Char(string="Payment reference", copy=False, tracking=True)
    payment_method = fields.Char(string="Payment method")
    paid_amount = fields.Float(string="Amount paid")
    # Note #7 — a real posted customer invoice (account.move), generated from the
    # linked sale order so finance sees genuine accounting entries.
    invoice_id = fields.Many2one("account.move", string="Invoice", copy=False)

    housekeeping_task_ids = fields.One2many(
        "villa.housekeeping.task", "reservation_id", string="Housekeeping tasks",
    )
    request_ids = fields.One2many(
        "villa.guest.request", "reservation_id", string="Guest requests",
    )

    # -- computes --------------------------------------------------------
    @api.depends("check_in_date", "check_out_date")
    def _compute_nights(self):
        for r in self:
            if r.check_in_date and r.check_out_date:
                r.nights = (r.check_out_date - r.check_in_date).days
            else:
                r.nights = 0

    @api.depends("sale_order_id.amount_total", "sale_order_id.amount_invoiced")
    def _compute_amount_due(self):
        for r in self:
            order = r.sale_order_id
            if order:
                paid = sum(
                    order.invoice_ids.mapped("amount_total")
                    if order.invoice_ids else [0.0]
                )
                r.amount_due = max(order.amount_total - paid, 0.0)
            else:
                r.amount_due = 0.0

    # -- constraints -----------------------------------------------------
    @api.constrains("check_in_date", "check_out_date")
    def _check_dates(self):
        for r in self:
            if r.check_out_date and r.check_in_date and r.check_out_date <= r.check_in_date:
                raise ValidationError("Check-out must be after check-in.")

    @api.constrains("check_in_date", "check_out_date", "product_id", "state")
    def _check_capacity(self):
        """Note #3 — allow concurrent bookings up to the villa's room count.
        A villa is full only when overlapping reservations reach x_total_rooms."""
        for r in self:
            if r.state in ("cancelled", "draft"):
                continue
            overlapping = self.search_count(
                [
                    ("id", "!=", r.id),
                    ("product_id", "=", r.product_id.id),
                    ("state", "not in", ["cancelled", "draft"]),
                    ("check_in_date", "<", r.check_out_date),
                    ("check_out_date", ">", r.check_in_date),
                ]
            )
            capacity = r.product_id.x_total_rooms or 1
            if overlapping >= capacity:
                raise ValidationError(
                    "%s is fully booked for those dates — all %d room(s) are taken."
                    % (r.product_id.name, capacity)
                )

    # -- create ----------------------------------------------------------
    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            if vals.get("name", "New") == "New":
                vals["name"] = self.env["ir.sequence"].next_by_code(
                    "villa.reservation"
                ) or "RES/%s" % self.env["ir.sequence"].sudo().search([], limit=1).id
        return super().create(vals_list)

    # -- workflow (BPMN) -------------------------------------------------
    def _ensure_sale_order(self):
        """Create the linked sale.order with the villa nights line."""
        self.ensure_one()
        if self.sale_order_id:
            return self.sale_order_id
        product = self.product_id.product_variant_id
        order = self.env["sale.order"].create({
            "partner_id": self.partner_id.id,
            "order_line": [(0, 0, {
                "product_id": product.id,
                "product_uom_qty": self.nights,
                "name": "%s — %s to %s" % (
                    self.product_id.name, self.check_in_date, self.check_out_date,
                ),
            })],
        })
        self.sale_order_id = order.id
        return order

    def _notify(self, subject, body_html):
        """Send a transactional email to the guest (queued if no SMTP)."""
        self.ensure_one()
        if not self.partner_id.email:
            return
        try:
            self.env["mail.mail"].sudo().create({
                "subject": subject,
                "email_to": self.partner_id.email,
                "body_html": body_html,
            }).send(raise_exception=False)
        except Exception:
            pass

    def action_confirm(self):
        """B4 — confirm booking & update system, notify the guest (B5)."""
        for r in self:
            r._ensure_sale_order()
            r.sale_order_id.action_confirm()
            r.state = "confirmed"
            r._notify(
                "Your Nadi Amerta reservation is confirmed",
                "<p>Dear %s,</p><p>Your stay at <strong>%s</strong> is confirmed.</p>"
                "<p>Reference <strong>%s</strong> · %s to %s · %s guest(s).</p>"
                "<p>We look forward to welcoming you by the river.</p>"
                "<p>— The Nadi Amerta, Ubud</p>" % (
                    r.partner_id.name, r.product_id.name, r.name,
                    r.check_in_date, r.check_out_date, r.guests,
                ),
            )
        return True

    @api.model
    def _cron_generate_invoices(self, limit=20):
        """Note #7 + #1/#2 — fill the invoice database in the background so the
        booking request stays fast. Invoices confirmed reservations that don't
        have one yet, a small batch at a time."""
        pending = self.search(
            [("state", "in", ["confirmed", "checked_in", "checked_out"]),
             ("invoice_id", "=", False)],
            limit=limit,
        )
        for r in pending:
            try:
                r._ensure_invoice()
                self.env.cr.commit()
            except Exception:
                self.env.cr.rollback()
        # Note #11 — service bookings + billed dining orders also output invoices.
        for b in self.env["villa.service.booking"].search(
            [("state", "!=", "cancelled"), ("invoice_id", "=", False)], limit=limit
        ):
            try:
                b._ensure_invoice()
                self.env.cr.commit()
            except Exception:
                self.env.cr.rollback()
        for o in self.env["villa.fnb.order"].search(
            [("state", "=", "billed"), ("invoice_id", "=", False)], limit=limit
        ):
            try:
                o._ensure_invoice()
                self.env.cr.commit()
            except Exception:
                self.env.cr.rollback()
        return True

    def register_payment(self, ref, amount, state="paid", method=False):
        """Record a Midtrans settlement against the reservation (called by the BFF
        after the gateway confirms). Does not touch the sale order / ledger —
        real account.move posting is deferred to the fiscal localization."""
        for r in self:
            r.payment_ref = ref
            r.paid_amount = amount
            r.payment_state = state
            if method:
                r.payment_method = method
            r.message_post(body="Payment %s recorded: %s (ref %s)" % (
                state, amount, ref,
            ))
        return True

    def _ensure_invoice(self):
        """Note #7 — generate + post a real account.move invoice from the sale
        order, then (demo money) register full payment so it reads as Paid.
        Idempotent: returns the existing invoice if one is already linked."""
        self.ensure_one()
        if self.invoice_id:
            return self.invoice_id
        order = self._ensure_sale_order()
        if order.state not in ("sale", "done"):
            order.action_confirm()
        if order.invoice_status == "no":
            return False
        invoices = order._create_invoices()
        if not invoices:
            return False
        invoices.action_post()
        self.invoice_id = invoices[:1].id
        self._register_demo_payment(invoices)
        return self.invoice_id

    def _register_demo_payment(self, invoices):
        """Register a full payment against each invoice (demonstration funds)."""
        for inv in invoices:
            if inv.state != "posted" or inv.payment_state in ("paid", "in_payment", "reversed"):
                continue
            try:
                wizard = self.env["account.payment.register"].with_context(
                    active_model="account.move", active_ids=inv.ids,
                ).create({})
                wizard.action_create_payments()
            except Exception:
                pass

    def action_check_in(self):
        """B7 — check-in process; villa becomes occupied."""
        for r in self:
            r.state = "checked_in"
            r.product_id.x_availability = "occupied"
        return True

    def action_check_out(self):
        """B18 — process check-out; spawn turnover task (B24)."""
        for r in self:
            r.state = "checked_out"
            r.product_id.x_availability = "cleaning"
            self.env["villa.housekeeping.task"].create({
                "reservation_id": r.id,
                "product_id": r.product_id.id,
                "task_type": "turnover",
                "state": "todo",
            })
        return True

    def action_cancel(self):
        for r in self:
            if r.sale_order_id and r.sale_order_id.state == "sale":
                r.sale_order_id._action_cancel()
            r.state = "cancelled"
        return True
