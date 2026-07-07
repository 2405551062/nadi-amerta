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

    def action_resolve(self):
        self.write({"state": "resolved"})
        for r in self:
            r._email("Your request has been resolved",
                     "Your request &ldquo;%s&rdquo; has been resolved. Please let us know if there's anything more." % r.name)
