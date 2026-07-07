# -*- coding: utf-8 -*-
"""
villa.stock.move — an auditable inventory movement trail (UC-HK2).
Each restock (or consumption) is logged as a movement with who/when/why, so
"restock" is a recorded transaction, not a silent number bump. product.template
also inherits a helper to apply a movement atomically.
"""
from odoo import api, fields, models


class VillaStockMove(models.Model):
    _name = "villa.stock.move"
    _description = "Inventory Movement"
    _order = "create_date desc"

    product_id = fields.Many2one(
        "product.template", string="Item", required=True,
        domain=[("x_kind", "=", "supply")],
    )
    delta = fields.Integer(string="Change", required=True)
    resulting_qty = fields.Integer(string="On hand after")
    reason = fields.Selection(
        [("restock", "Restock"), ("consume", "Consumption"), ("adjust", "Adjustment")],
        default="restock", required=True,
    )
    note = fields.Char()
    user_id = fields.Many2one("res.users", default=lambda s: s.env.user, string="By")


class ProductTemplate(models.Model):
    _inherit = "product.template"

    stock_move_ids = fields.One2many("villa.stock.move", "product_id", string="Movements")

    def apply_stock_move(self, delta, reason="restock", note=False):
        """Adjust on-hand by delta and record the movement. Returns new qty."""
        self.ensure_one()
        new_qty = (self.x_stock_qty or 0) + int(delta)
        self.x_stock_qty = new_qty
        self.env["villa.stock.move"].create({
            "product_id": self.id,
            "delta": int(delta),
            "resulting_qty": new_qty,
            "reason": reason,
            "note": note or False,
        })
        return new_qty
