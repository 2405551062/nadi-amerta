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
    _order = "create_date desc"

    name = fields.Char(default="New", copy=False)
    partner_id = fields.Many2one("res.partner", string="Guest", required=True)
    reservation_id = fields.Many2one("villa.reservation", string="Reservation")
    product_villa_id = fields.Many2one(
        "product.template", string="Deliver to villa",
        domain=[("x_kind", "=", "villa")],
    )
    placed = fields.Char(string="Placed at")
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

    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            if vals.get("name", "New") == "New":
                vals["name"] = self.env["ir.sequence"].next_by_code("villa.fnb.order") or "FNB"
        return super().create(vals_list)

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
        return True


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
