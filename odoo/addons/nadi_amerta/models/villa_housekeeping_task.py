# -*- coding: utf-8 -*-
"""
villa.housekeeping.task — BPMN B24/B25, UC-HK1 (ERD gap §1.5.1).

Created automatically when a reservation checks out (turnover), or manually
for stayover / deep-clean work. Completing the task advances the villa's
x_availability toward "available" (ready for sale).
"""
import json

from odoo import api, fields, models

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
        return super().create(vals_list)

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
