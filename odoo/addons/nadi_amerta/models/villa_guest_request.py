# -*- coding: utf-8 -*-
"""
villa.guest.request — BPMN B11, UC-FO5 (ERD gap §1.5.3).

Guest requests and complaints raised from the portal, tracked by the front
office until resolved. Uses mail.thread so staff replies are logged.
"""
from odoo import api, fields, models


class VillaGuestRequest(models.Model):
    _name = "villa.guest.request"
    _description = "Guest Request / Complaint"
    _inherit = ["mail.thread", "mail.activity.mixin"]
    _order = "create_date desc"

    name = fields.Char(string="Subject", required=True)
    request_type = fields.Selection(
        [("request", "Request"), ("complaint", "Complaint")],
        string="Type", default="request", required=True,
    )
    partner_id = fields.Many2one("res.partner", string="Guest", required=True)
    reservation_id = fields.Many2one("villa.reservation", string="Reservation")
    product_id = fields.Many2one(
        "product.template", string="Villa", related="reservation_id.product_id", store=True,
    )
    # Which room/unit the request or complaint is about (Notes 2 §3).
    room_id = fields.Many2one(
        "villa.room", string="Room / unit",
        domain="[('product_id', '=', product_id)]",
    )
    detail = fields.Text(string="Detail")
    priority = fields.Selection(
        [("low", "Low"), ("medium", "Medium"), ("high", "High")],
        string="Priority", default="medium",
    )
    state = fields.Selection(
        [("open", "Open"), ("in_progress", "In progress"), ("resolved", "Resolved")],
        string="Status", default="open", tracking=True, index=True,
    )
    assignee_id = fields.Many2one("res.users", string="Handled by")

    # Note #4 — a request may consume a housekeeping supply once resolved
    # (e.g. "extra yoga mats" draws down the yoga-mat stock).
    supply_product_id = fields.Many2one(
        "product.template", string="Consumes supply",
        domain=[("x_kind", "=", "supply")],
        help="If set, resolving this request draws this item down from inventory.",
    )
    supply_qty = fields.Integer(string="Quantity", default=1)
    supply_applied = fields.Boolean(string="Stock drawn", default=False, copy=False)

    # Note 2 §3 — how the ticket is resolved. Inventory requests draw a supply
    # down from stock; maintenance complaints (e.g. "the AC is broken") are
    # routed to engineering and the villa is flagged for maintenance instead —
    # they are NEVER settled from inventory.
    resolution_route = fields.Selection(
        [("inventory", "Inventory"), ("maintenance", "Maintenance / engineering"), ("none", "Information only")],
        string="Resolution route", compute="_compute_resolution_route", store=True,
    )
    maintenance_flagged = fields.Boolean(string="Sent to engineering", default=False, copy=False)

    @api.depends("request_type", "supply_product_id")
    def _compute_resolution_route(self):
        for r in self:
            if r.request_type == "complaint":
                r.resolution_route = "maintenance"
            elif r.supply_product_id:
                r.resolution_route = "inventory"
            else:
                r.resolution_route = "none"

    def _email(self, subject, line):
        for r in self:
            if not r.partner_id.email:
                continue
            try:
                r.env["mail.mail"].sudo().create({
                    "subject": subject,
                    "email_to": r.partner_id.email,
                    "body_html": "<p>Dear %s,</p><p>%s</p><p>— The Nadi Amerta front office</p>"
                    % (r.partner_id.name, line),
                }).send(raise_exception=False)
            except Exception:
                pass

    @api.model_create_multi
    def create(self, vals_list):
        records = super().create(vals_list)
        for r in records:
            r._email(
                "We've received your request",
                "Your request &ldquo;%s&rdquo; has reached our front office and is being looked after." % r.name,
            )
        return records

    def action_take(self):
        self.write({"state": "in_progress", "assignee_id": self.env.user.id})

    def action_flag_maintenance(self):
        """Note 2 §3 — route a complaint to engineering: flag the ticket and put
        the villa into maintenance status. Never touches inventory."""
        for r in self:
            r.maintenance_flagged = True
            r.state = "in_progress"
            if not r.assignee_id:
                r.assignee_id = self.env.user.id
            if r.product_id:
                r.product_id.x_availability = "maintenance"
                r.product_id.message_post(
                    body="Maintenance raised from guest complaint: %s" % (r.name or "")
                )
        return True

    def action_resolve(self):
        self.write({"state": "resolved"})
        for r in self:
            # Note 2 §3 — only inventory-type requests draw stock. Complaints
            # (maintenance route) are resolved by engineering, never from stock.
            is_inventory = r.request_type == "request"
            if is_inventory and r.supply_product_id and r.supply_qty and not r.supply_applied:
                r.supply_product_id.apply_stock_move(
                    -abs(r.supply_qty), reason="consume",
                    note="Guest request: %s" % r.name,
                )
                r.supply_applied = True
            # A resolved maintenance complaint clears the villa back to cleaning
            # (housekeeping re-inspects before it returns to sale).
            if r.request_type == "complaint" and r.maintenance_flagged and r.product_id:
                if r.product_id.x_availability == "maintenance":
                    r.product_id.x_availability = "cleaning"
            r._email("Your request has been resolved",
                     "Your request &ldquo;%s&rdquo; has been resolved. Please let us know if there's anything more." % r.name)
