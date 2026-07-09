# -*- coding: utf-8 -*-
"""
nadi.invoiceable — shared helper (Note #7/#11) to turn a set of product lines
into a real posted account.move invoice + a demo payment, via a sale order.
Reused by service bookings and dining orders so they output invoices like
reservations do.
"""
from odoo import models


class NadiInvoiceable(models.AbstractModel):
    _name = "nadi.invoiceable"
    _description = "Nadi Invoiceable Mixin"

    def _nadi_generate_invoice(self, partner, lines):
        """lines: iterable of (product_template, qty, label). Creates a sale
        order, invoices + posts it, registers a demo payment. Returns the move
        (or False if nothing to invoice)."""
        lines = [(p, q, n) for (p, q, n) in lines if p and q]
        if not partner or not lines:
            return False
        order = self.env["sale.order"].create({
            "partner_id": partner.id,
            "order_line": [
                (0, 0, {
                    "product_id": prod.product_variant_id.id,
                    "product_uom_qty": qty,
                    "name": label or prod.name,
                })
                for (prod, qty, label) in lines
            ],
        })
        order.action_confirm()
        if order.invoice_status == "no":
            return False
        invoices = order._create_invoices()
        if not invoices:
            return False
        invoices.action_post()
        self._nadi_register_payment(invoices)
        return invoices[:1]

    def _nadi_register_payment(self, invoices):
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
