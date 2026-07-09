# -*- coding: utf-8 -*-
"""
villa.fnb.order — in-villa dining order (UC-C5/UC-FB1, BPMN B9/B15/B16).
Guest places it; kitchen advances it Received → Kitchen → Delivering → Billed.
On Billed it is charged to the villa folio (finance sees it).
"""
from odoo import api, fields, models


class VillaFnbOrder(models.Model):
    _name = "villa.fnb.order"
    _description = "In-Villa Dining Order"
    _inherit = ["nadi.invoiceable"]
    _order = "create_date desc"

    name = fields.Char(default="New", copy=False)
    partner_id = fields.Many2one("res.partner", string="Guest", required=True)
    reservation_id = fields.Many2one("villa.reservation", string="Reservation")
    product_villa_id = fields.Many2one(
        "product.template", string="Deliver to villa",
        domain=[("x_kind", "=", "villa")],
    )
    placed = fields.Char(string="Placed at")
    # Note 2 §4 — the guest chooses when the order is delivered: as soon as
    # ready, or a specific clock time they pick (e.g. 19:30).
    timing = fields.Selection(
        [("asap", "As soon as ready"), ("scheduled", "Scheduled")],
        string="Timing", default="asap",
    )
    scheduled_time = fields.Char(string="Scheduled for", help="Guest-chosen delivery time, e.g. 19:30.")
    note = fields.Text()
    state = fields.Selection(
        [
            ("received", "Received"),
            ("kitchen", "In kitchen"),
            ("delivering", "On its way"),
            ("billed", "Billed"),
        ],
        default="received", index=True,
    )
    line_ids = fields.One2many("villa.fnb.order.line", "order_id", string="Items")
    amount_total = fields.Float(compute="_compute_total", store=True)
    invoice_id = fields.Many2one("account.move", string="Invoice", copy=False)

    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            if vals.get("name", "New") == "New":
                vals["name"] = self.env["ir.sequence"].next_by_code("villa.fnb.order") or "FNB"
        orders = super().create(vals_list)
        # Note 2 §4 — the charge appears in the guest's invoices as soon as the
        # order is placed (folio charge), not only once the kitchen bills it.
        for o in orders:
            try:
                o._ensure_invoice()
            except Exception:
                pass
        return orders

    @api.depends("line_ids.subtotal")
    def _compute_total(self):
        for o in self:
            o.amount_total = sum(o.line_ids.mapped("subtotal"))

    _FLOW = ["received", "kitchen", "delivering", "billed"]

    def action_advance(self):
        for o in self:
            i = self._FLOW.index(o.state)
            if i < len(self._FLOW) - 1:
                o.state = self._FLOW[i + 1]
            # Note #11 — on Billed, output a real invoice to the folio.
            if o.state == "billed":
                try:
                    o._ensure_invoice()
                except Exception:
                    pass
        return True

    def _ensure_invoice(self):
        """Note #11 — a dining order outputs a real invoice once billed."""
        self.ensure_one()
        if self.invoice_id or not self.line_ids:
            return self.invoice_id
        move = self._nadi_generate_invoice(
            self.partner_id,
            [(l.product_id, l.qty or 1, l.product_id.name) for l in self.line_ids],
        )
        if move:
            self.invoice_id = move.id
        return self.invoice_id


class VillaFnbOrderLine(models.Model):
    _name = "villa.fnb.order.line"
    _description = "Dining Order Line"

    order_id = fields.Many2one("villa.fnb.order", required=True, ondelete="cascade")
    product_id = fields.Many2one(
        "product.template", string="Dish", required=True,
        domain=[("x_kind", "=", "fnb")],
    )
    qty = fields.Integer(string="Qty", default=1)
    price = fields.Float(related="product_id.list_price", store=True)
    subtotal = fields.Float(compute="_compute_subtotal", store=True)

    @api.depends("qty", "price")
    def _compute_subtotal(self):
        for l in self:
            l.subtotal = l.qty * l.price
