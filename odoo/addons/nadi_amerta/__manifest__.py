# -*- coding: utf-8 -*-
{
    "name": "Nadi Amerta — Villa Reservation",
    "version": "17.0.1.0.0",
    "summary": "Villa reservation, housekeeping, and guest requests for Nadi Amerta (Bali).",
    "description": """
Custom backing models for the Nadi Amerta villa platform, per the contractual ERD
(design/09-odoo-integration.md, design/10-traceability.md):

  * villa.reservation        — the ERD's custom reservation model
  * villa.housekeeping.task   — BPMN B24/B25 (ERD gap §1.5.1)
  * villa.guest.request       — BPMN B11 / UC-FO5 (ERD gap §1.5.3)
  * product.template x_ fields — villa attributes (x_kind, x_villa_type, ...)
  * res.partner x_ fields      — guest identity + preferences

Inventory (UC-HK2) reuses the standard Odoo Inventory app (stock).
The Next.js BFF talks to these models over the JSON-RPC external API.
""",
    "author": "Nadi Amerta",
    "website": "https://nadiamerta.com",
    "category": "Services/Hospitality",
    "license": "LGPL-3",
    "depends": [
        "base",
        "mail",
        "product",
        "sale_management",
        "account",
        "stock",
        "contacts",
    ],
    "data": [
        "security/nadi_amerta_groups.xml",
        "security/ir.model.access.csv",
        "data/nadi_data.xml",
        "data/villas.xml",
        "data/services.xml",
        "data/menu.xml",
        "data/supplies.xml",
        "data/transactions.xml",
        "data/service_access.xml",
        "data/staff.xml",
        "data/cron.xml",
        "views/villa_reservation_views.xml",
        "views/villa_housekeeping_views.xml",
        "views/villa_guest_request_views.xml",
        "views/product_template_views.xml",
        "views/menus.xml",
    ],
    "application": True,
    "installable": True,
}
