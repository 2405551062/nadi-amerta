# -*- coding: utf-8 -*-
"""Guest identity + preferences on res.partner (ERD: res.partner x_ fields)."""
from odoo import fields, models


class ResPartner(models.Model):
    _inherit = "res.partner"

    x_nik_paspor = fields.Char(string="NIK / Passport")
    x_nationality = fields.Char(string="Nationality")

    # CRM preferences surfaced in the guest portal profile page
    x_dietary = fields.Char(string="Dietary preferences", help="Comma-separated tags.")
    x_pillow = fields.Char(string="Pillow / firmness preference")
    x_arrival_drink = fields.Char(string="Arrival drink")
    x_loyalty_tier = fields.Selection(
        [
            ("standard", "Standard"),
            ("silver", "Silver"),
            ("gold", "Gold"),
            ("platinum", "Platinum"),
        ],
        string="Loyalty tier",
        default="standard",
    )

    reservation_ids = fields.One2many(
        "villa.reservation", "partner_id", string="Reservations"
    )
