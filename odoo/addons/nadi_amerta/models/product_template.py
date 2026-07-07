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

    # -- F&B menu attributes (x_kind = fnb) ------------------------------
    x_category = fields.Char(string="Menu category")
    x_dietary = fields.Char(string="Dietary tags", help="Comma-separated: vegan, gf.")
    x_featured = fields.Boolean(string="Chef's featured")

    reservation_ids = fields.One2many(
        "villa.reservation", "product_id", string="Reservations"
    )

    def is_available_between(self, check_in, check_out):
        """True if no non-cancelled reservation overlaps [check_in, check_out)."""
        self.ensure_one()
        overlapping = self.env["villa.reservation"].search_count(
            [
                ("product_id", "=", self.id),
                ("state", "not in", ["cancelled", "draft"]),
                ("check_in_date", "<", check_out),
                ("check_out_date", ">", check_in),
            ]
        )
        return overlapping == 0
