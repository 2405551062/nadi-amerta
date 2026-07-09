# -*- coding: utf-8 -*-
"""
villa.service.booking — a guest adding an additional service to their stay
(UC-C5 / BPMN B9). Maps to product.product (x_kind=service). Billed to the
villa folio (settled at checkout) or paid now.
"""
from odoo import api, fields, models


class VillaServiceBooking(models.Model):
    _name = "villa.service.booking"
    _description = "Service Booking"
    _inherit = ["nadi.invoiceable"]
    _order = "slot_date, id"

    name = fields.Char(compute="_compute_name", store=True)
    partner_id = fields.Many2one("res.partner", string="Guest", required=True)
    reservation_id = fields.Many2one("villa.reservation", string="Reservation")
    product_id = fields.Many2one(
        "product.template", string="Service", required=True,
        domain=[("x_kind", "=", "service")],
    )
    slot_date = fields.Date(string="Day")
    slot_time = fields.Char(string="Time")
    persons = fields.Integer(string="Persons", default=1)
    billing = fields.Selection(
        [("folio", "Villa folio"), ("now", "Pay now")],
        string="Billing", default="folio",
    )
    price = fields.Float(string="Price", related="product_id.list_price", store=True)
    notes = fields.Text()
    state = fields.Selection(
        [("planned", "Planned"), ("delivered", "Delivered"), ("cancelled", "Cancelled")],
        default="planned",
    )
    invoice_id = fields.Many2one("account.move", string="Invoice", copy=False)

    @api.depends("product_id", "slot_date")
    def _compute_name(self):
        for b in self:
            b.name = "%s · %s" % (b.product_id.name or "Service", b.slot_date or "")

    @api.model_create_multi
    def create(self, vals_list):
        bookings = super().create(vals_list)
        # Note 2 §5 — a "pay now" (Midtrans) booking outputs an invoice straight
        # away so it shows in the guest's invoices. Folio bookings settle later.
        for b in bookings:
            if b.billing == "now" and b.product_id.list_price:
                try:
                    b._ensure_invoice()
                except Exception:
                    pass
        return bookings

    def _ensure_invoice(self):
        """Note #11 — a service booking outputs a real invoice (billed to folio)."""
        self.ensure_one()
        if self.invoice_id or self.state == "cancelled":
            return self.invoice_id
        move = self._nadi_generate_invoice(
            self.partner_id,
            [(self.product_id, max(self.persons or 1, 1), self.product_id.name)],
        )
        if move:
            self.invoice_id = move.id
        return self.invoice_id
