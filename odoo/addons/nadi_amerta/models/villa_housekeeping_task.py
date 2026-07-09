# -*- coding: utf-8 -*-
"""
villa.housekeeping.task — BPMN B24/B25, UC-HK1 (ERD gap §1.5.1).

Created automatically when a reservation checks out (turnover), or manually
for stayover / deep-clean work. Completing the task advances the villa's
x_availability toward "available" (ready for sale).
"""
import json

from odoo import api, fields, models
from odoo.exceptions import UserError

CHECKLISTS = {
    "turnover": ["Strip & replace linen", "Bathroom & amenities", "Pool skim & deck", "Minibar restock", "Inspection photos"],
    "stayover": ["Refresh linen & towels", "Amenity top-up", "Deck & pool check"],
    "deep": ["Full villa deep clean", "AC service access", "Garden path reset"],
}


class VillaHousekeepingTask(models.Model):
    _name = "villa.housekeeping.task"
    _description = "Housekeeping Task"
    _inherit = ["mail.thread"]
    _order = "create_date desc"

    name = fields.Char(string="Reference", compute="_compute_name", store=True)
    product_id = fields.Many2one(
        "product.template", string="Villa", required=True,
        domain=[("x_kind", "=", "villa")],
    )
    reservation_id = fields.Many2one("villa.reservation", string="Reservation")
    task_type = fields.Selection(
        [("turnover", "Turnover"), ("stayover", "Stayover"), ("deep", "Deep clean")],
        string="Type", default="turnover", required=True,
    )
    assignee_id = fields.Many2one("res.users", string="Assigned to")
    # Note #5 — which room/unit within the villa this task covers, and before/after
    # photo evidence the housekeeper uploads on completion.
    # Note 2 §1 — room_id points at a real villa.room; room_label mirrors its code
    # (kept for back-compat / free-text fallback).
    room_id = fields.Many2one(
        "villa.room", string="Room / unit",
        domain="[('product_id', '=', product_id)]",
    )
    room_label = fields.Char(string="Room label", help="Which unit of the villa, e.g. 'TIR-02'.")

    @api.onchange("room_id")
    def _onchange_room_id(self):
        for t in self:
            if t.room_id:
                t.room_label = t.room_id.code
    # Plain Binary (stored inline) — avoids the attachment image-processing path so
    # any uploaded photo saves without server-side thumbnailing.
    photo_before = fields.Binary(string="Photo — before")
    photo_after = fields.Binary(string="Photo — after")
    due = fields.Datetime(string="Due")
    state = fields.Selection(
        [
            ("todo", "To do"),
            ("doing", "Cleaning"),
            ("inspection", "Inspection"),
            ("done", "Done"),
        ],
        string="Status", default="todo", tracking=True, index=True,
    )
    checklist_json = fields.Text(
        string="Checklist",
        help="JSON array of {label, done} — mirrors the housekeeping UI.",
    )
    # Villa board room status — the housekeeper's sign-off report management
    # (back office / HR) reviews after the checklist is complete.
    conclusion = fields.Text(string="Completion notes")
    submitted_at = fields.Datetime(string="Submitted at")
    submitted_by_id = fields.Many2one("res.users", string="Submitted by")

    @api.depends("product_id", "task_type")
    def _compute_name(self):
        for t in self:
            t.name = "%s · %s" % (
                t.product_id.name or "Villa", dict(self._fields["task_type"].selection).get(t.task_type, "")
            )

    @api.model_create_multi
    def create(self, vals_list):
        # Seed a checklist for the task type unless one was provided.
        for vals in vals_list:
            if not vals.get("checklist_json"):
                labels = CHECKLISTS.get(vals.get("task_type", "turnover"), CHECKLISTS["turnover"])
                # reflect initial progress from state so seeded tasks look right
                state = vals.get("state", "todo")
                done_upto = {"todo": 0, "doing": 2, "inspection": len(labels), "done": len(labels)}.get(state, 0)
                vals["checklist_json"] = json.dumps(
                    [{"label": l, "done": i < done_upto} for i, l in enumerate(labels)]
                )
            self._sync_room_label(vals)
        return super().create(vals_list)

    def write(self, vals):
        # Keep room_label mirrored on the room code when a room is chosen via API.
        self._sync_room_label(vals)
        return super().write(vals)

    @api.model
    def _sync_room_label(self, vals):
        """When room_id is set (BFF write, no onchange), copy its code to room_label."""
        if vals.get("room_id"):
            room = self.env["villa.room"].browse(vals["room_id"])
            if room.exists():
                vals["room_label"] = room.code

    def toggle_item(self, index):
        """Flip one checklist item; auto-advance when all are done. Returns the list."""
        self.ensure_one()
        items = json.loads(self.checklist_json or "[]")
        if 0 <= index < len(items):
            items[index]["done"] = not items[index]["done"]
        self.checklist_json = json.dumps(items)
        if items and all(i["done"] for i in items) and self.state != "done":
            self.state = "inspection"
            self.product_id.x_availability = "inspection"
        return items

    def action_submit(self, conclusion=None):
        """The housekeeper signs off: checklist must be fully checked; records
        their completion notes and marks the task Done. The room (or villa, if
        no specific room) becomes ready for sale. Back office / HR reviews the
        conclusion afterward — see the Housekeeping reports panel."""
        for t in self:
            items = json.loads(t.checklist_json or "[]")
            if not items or not all(i.get("done") for i in items):
                raise UserError("Complete every checklist item before submitting.")
            t.conclusion = conclusion or t.conclusion
            t.submitted_at = fields.Datetime.now()
            t.submitted_by_id = self.env.user.id
            t.state = "done"
            if t.room_id:
                t.room_id.status = "ready"
            t.product_id.x_availability = "available"
        return True

    def action_advance(self):
        """Advance one step; reaching Done marks the villa Available (B25)."""
        ladder = ["todo", "doing", "inspection", "done"]
        for t in self:
            idx = ladder.index(t.state)
            if idx < len(ladder) - 1:
                t.state = ladder[idx + 1]
            if t.state == "inspection":
                t.product_id.x_availability = "inspection"
            if t.state == "done":
                t.product_id.x_availability = "available"
        return True
