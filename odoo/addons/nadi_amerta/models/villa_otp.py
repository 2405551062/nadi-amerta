# -*- coding: utf-8 -*-
"""
villa.otp — passwordless email login codes (design/04 §8).
Stores a short-lived 6-digit code per email; the BFF calls request_otp/verify_otp
over JSON-RPC. On successful verify, the guest's res.partner is found or created
and its id returned, so the session binds to a real partner.
"""
import random
from datetime import datetime, timedelta

from odoo import api, fields, models


class VillaOtp(models.Model):
    _name = "villa.otp"
    _description = "Login OTP"
    _order = "create_date desc"

    email = fields.Char(required=True, index=True)
    code = fields.Char(required=True)
    expires_at = fields.Datetime(required=True)
    consumed = fields.Boolean(default=False)

    @api.model
    def request_otp(self, email):
        """Generate + store a code, email it, and return it (dev echo)."""
        email = (email or "").strip().lower()
        if not email:
            return {"ok": False, "error": "email required"}
        code = "%06d" % random.randint(0, 999999)
        self.create({
            "email": email,
            "code": code,
            "expires_at": fields.Datetime.now() + timedelta(minutes=10),
        })
        # Send via Odoo mail (delivered only if an outgoing server is configured;
        # queued otherwise). Never raise on transport failure in dev.
        try:
            self.env["mail.mail"].sudo().create({
                "subject": "Your Nadi Amerta sign-in code",
                "email_to": email,
                "body_html": (
                    "<p>Your sign-in code is <strong style='font-size:20px;letter-spacing:3px'>%s</strong>.</p>"
                    "<p>It expires in 10 minutes. If you didn't request this, ignore this message.</p>"
                    "<p>— Nadi Amerta, Ubud</p>" % code
                ),
            }).send(raise_exception=False)
        except Exception:
            pass
        # dev echo lets the flow be tested without SMTP; disable in production.
        return {"ok": True, "dev_code": code}

    @api.model
    def verify_otp(self, email, code):
        """Validate the code; on success find/create the partner and return it."""
        email = (email or "").strip().lower()
        rec = self.search([
            ("email", "=", email),
            ("code", "=", (code or "").strip()),
            ("consumed", "=", False),
            ("expires_at", ">=", fields.Datetime.now()),
        ], limit=1, order="create_date desc")
        if not rec:
            return {"ok": False, "error": "Invalid or expired code"}
        rec.consumed = True
        partner = self.env["res.partner"].search([("email", "=", email)], limit=1)
        if not partner:
            partner = self.env["res.partner"].create({
                "name": email.split("@")[0].title(),
                "email": email,
            })
        return {"ok": True, "partner_id": partner.id, "name": partner.name}
