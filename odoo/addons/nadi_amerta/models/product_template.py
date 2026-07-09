# -*- coding: utf-8 -*-
"""
Villa & service attributes on product.template (ERD: product.product).
Villas and additional services are both products; x_kind distinguishes them.
"""
from odoo import api, fields, models


class ProductTemplate(models.Model):
    _inherit = "product.template"

    # ERD custom fields --------------------------------------------------
    x_kind = fields.Selection(
        [
            ("villa", "Villa"),
            ("service", "Additional Service"),
            ("fnb", "Food & Beverage"),
            ("supply", "Housekeeping Supply"),
        ],
        string="Nadi kind",
        default="villa",
        index=True,
        help="Distinguishes villas, add-on services, and F&B menu items.",
    )
    x_villa_type = fields.Char(string="Villa collection")  # e.g. "Riverside Collection"
    x_view = fields.Selection(
        [("river", "River"), ("rice", "Rice paddy"), ("garden", "Garden")],
        string="View",
    )
    x_bedrooms = fields.Integer(string="Bedrooms")
    x_capacity = fields.Integer(string="Max guests")
    # Room inventory (Note #3): a villa represents N identical bookable units.
    # Availability = number of overlapping reservations is below this count.
    x_total_rooms = fields.Integer(
        string="Total rooms/units", default=1,
        help="How many identical units of this villa can be booked at the same time.",
    )
    x_rooms_available_now = fields.Integer(
        string="Rooms available now", compute="_compute_rooms_available_now",
    )
    x_size_m2 = fields.Integer(string="Size (m²)")
    x_min_stay = fields.Integer(string="Minimum nights", default=2)
    x_slug = fields.Char(string="URL slug", index=True)
    x_facilities = fields.Text(string="Facilities", help="One facility per line.")
    x_excerpt = fields.Char(string="Short excerpt")

    # Live villa status (BPMN B10/B25). Availability = absence of overlapping
    # reservations; this field is the *housekeeping* readiness state.
    x_availability = fields.Selection(
        [
            ("available", "Available"),
            ("occupied", "Occupied"),
            ("cleaning", "Cleaning"),
            ("inspection", "Inspection"),
            ("maintenance", "Maintenance"),
        ],
        string="Villa status",
        default="available",
        tracking=True,
    )

    # Convenience for the housekeeping inventory page (UC-HK2). Real stock
    # lives in the Inventory app; this is just the reorder threshold.
    x_min_stock = fields.Integer(string="Reorder minimum")
    x_stock_qty = fields.Integer(string="On hand")
    x_stock_unit = fields.Char(string="Unit")
    x_supplier = fields.Char(string="Supplier")

    # -- Additional service attributes (x_kind = service) ----------------
    x_chapter = fields.Selection(
        [("Wellness", "Wellness"), ("Journeys", "Journeys"), ("Occasions", "Occasions")],
        string="Service chapter",
    )
    x_duration = fields.Char(string="Duration")
    # Note 2 §5 — a service runs at a realistic, villa-provided time & place, e.g.
    # "Sunrise yoga starts 06:30 on the yoga deck." The guest picks the day; the
    # villa fixes the time. x_service_time is a comma-separated list of the slots
    # the villa offers for this service (single entry = a fixed daily time).
    x_service_time = fields.Char(
        string="Service time(s)",
        help="Comma-separated realistic start times the villa offers, e.g. '06:30' or '10:00, 15:00'.",
    )
    x_service_location = fields.Char(string="Service location", help="Where it happens, e.g. 'Yoga deck'.")

    # -- F&B menu attributes (x_kind = fnb) ------------------------------
    x_category = fields.Char(string="Menu category")
    x_dietary = fields.Char(string="Dietary tags", help="Comma-separated: vegan, gf.")
    x_featured = fields.Boolean(string="Chef's featured")

    reservation_ids = fields.One2many(
        "villa.reservation", "product_id", string="Reservations"
    )
    # Note 2 §1 — the individual bookable units of this villa (villa.room).
    room_ids = fields.One2many("villa.room", "product_id", string="Rooms / units")

    def _overlap_count(self, check_in, check_out):
        """How many non-cancelled reservations overlap [check_in, check_out)."""
        self.ensure_one()
        return self.env["villa.reservation"].search_count(
            [
                ("product_id", "=", self.id),
                ("state", "not in", ["cancelled", "draft"]),
                ("check_in_date", "<", check_out),
                ("check_out_date", ">", check_in),
            ]
        )

    def is_available_between(self, check_in, check_out):
        """True while at least one unit is free across [check_in, check_out)."""
        self.ensure_one()
        return self._overlap_count(check_in, check_out) < (self.x_total_rooms or 1)

    def _compute_rooms_available_now(self):
        """Units free today = total rooms minus reservations currently in-house."""
        today = fields.Date.context_today(self)
        for v in self:
            if v.x_kind != "villa":
                v.x_rooms_available_now = 0
                continue
            in_house = self.env["villa.reservation"].search_count(
                [
                    ("product_id", "=", v.id),
                    ("state", "not in", ["cancelled", "draft", "checked_out"]),
                    ("check_in_date", "<=", today),
                    ("check_out_date", ">", today),
                ]
            )
            v.x_rooms_available_now = max((v.x_total_rooms or 1) - in_house, 0)
