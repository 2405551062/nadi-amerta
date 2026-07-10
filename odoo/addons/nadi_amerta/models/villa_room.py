# -*- coding: utf-8 -*-
"""
villa.room — Note 2 §1. A villa is a multi-unit property (product.template
x_total_rooms); each bookable/serviceable unit is a real room record with a
stable code (e.g. TIR-01). Housekeeping tasks point at a specific room so the
housekeeper knows exactly which unit to service.
"""
import re

from odoo import api, fields, models

# Canonical per-villa unit counts — the single source of truth so a fresh clone
# and an already-installed DB both converge to the same rooms without a manual
# shell step. Keyed by product.template.x_slug.
ROOM_COUNTS = {
    "villa-tirta": 2,
    "villa-surya": 3,
    "villa-chandra": 4,
    "villa-lotus": 3,
    "villa-frangipani": 3,
    "villa-hibiscus": 3,
    "villa-bambu": 3,
    "villa-jepun": 5,
}


class VillaRoom(models.Model):
    _name = "villa.room"
    _description = "Villa Room / Unit"
    _order = "product_id, code"

    name = fields.Char(compute="_compute_name", store=True)
    code = fields.Char(string="Room code", required=True, index=True)
    product_id = fields.Many2one(
        "product.template", string="Villa", required=True, ondelete="cascade",
        domain=[("x_kind", "=", "villa")],
    )
    floor = fields.Char(string="Floor / wing")
    active = fields.Boolean(default=True)
    # Operator-set room status — separate from the housekeeping task ladder;
    # this is the room-level board the ops user sees when they open a villa.
    status = fields.Selection(
        [("ready", "Ready"), ("occupied", "Occupied"), ("maintenance", "Maintenance")],
        string="Status", default="ready",
    )

    _sql_constraints = [
        ("code_uniq", "unique(code)", "Room code must be unique."),
    ]

    @api.depends("product_id", "code")
    def _compute_name(self):
        for r in self:
            r.name = "%s · %s" % (r.product_id.name or "Villa", r.code or "")

    @api.model
    def _prefix_for(self, product):
        """Three-letter code prefix from the villa name, e.g. 'Villa Tirta' → TIR."""
        base = (product.name or "").replace("Villa", "").strip()
        letters = re.sub(r"[^A-Za-z]", "", base) or "RM"
        return letters[:3].upper()

    @api.model
    def generate_for_villas(self):
        """Create the missing room records for every villa, one per unit
        (product.template.x_total_rooms). Idempotent — safe to re-run."""
        created = self.env["villa.room"]
        villas = self.env["product.template"].search([("x_kind", "=", "villa")])
        for villa in villas:
            total = villa.x_total_rooms or 1
            prefix = self._prefix_for(villa)
            for n in range(1, total + 1):
                code = "%s-%02d" % (prefix, n)
                exists = self.search_count([("code", "=", code)])
                if not exists:
                    created |= self.create({"product_id": villa.id, "code": code})
        return created

    @api.model
    def _nadi_bootstrap_rooms(self):
        """Ensure every villa has its canonical unit count and its room records.
        Called from data/rooms.xml <function> so it runs on install AND update —
        a freshly cloned repo gets its rooms with no manual shell step. Idempotent.
        Only raises a villa's count (never shrinks) so manual additions survive."""
        Villa = self.env["product.template"]
        for slug, count in ROOM_COUNTS.items():
            villa = Villa.search([("x_slug", "=", slug), ("x_kind", "=", "villa")], limit=1)
            if villa and (not villa.x_total_rooms or villa.x_total_rooms < count):
                villa.x_total_rooms = count
        return self.generate_for_villas()
