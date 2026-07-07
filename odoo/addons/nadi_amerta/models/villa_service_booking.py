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

    @api.depends("product_id", "slot_date")
    def _compute_name(self):
        for b in self:
            b.name = "%s · %s" % (b.product_id.name or "Service", b.slot_date or "")
