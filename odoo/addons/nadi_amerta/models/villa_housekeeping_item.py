# -*- coding: utf-8 -*-
"""
villa.housekeeping.item — Notes 2 §4. A real, tickable checklist row so a
housekeeper working inside Odoo (not just the web app) can check items off.
Kept in sync with villa.housekeeping.task.checklist_json (the JSON the Next.js
housekeeping board reads/writes) so both interfaces stay consistent.
"""
from odoo import fields, models


class VillaHousekeepingItem(models.Model):
    _name = "villa.housekeeping.item"
    _description = "Housekeeping Checklist Item"
    _order = "sequence, id"

    task_id = fields.Many2one(
        "villa.housekeeping.task", string="Task", required=True,
        ondelete="cascade", index=True,
    )
    name = fields.Char(string="Step", required=True)
    done = fields.Boolean(string="Done")
    sequence = fields.Integer(default=10)

    def write(self, vals):
        res = super().write(vals)
        # Ticking an item (backend or web) rewrites the task's checklist_json.
        if "done" in vals or "name" in vals or "sequence" in vals:
            self.mapped("task_id")._sync_checklist_json()
        return res

    def unlink(self):
        tasks = self.mapped("task_id")
        res = super().unlink()
        tasks._sync_checklist_json()
        return res
