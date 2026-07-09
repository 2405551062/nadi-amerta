# -*- coding: utf-8 -*-
"""
Staff accounts (Note #6). Each staff member is a res.users carrying a job title
and one of the Nadi Amerta role groups, so the ops consoles can be shown per job.
"""
from odoo import fields, models


class ResUsers(models.Model):
    _inherit = "res.users"

    x_job_title = fields.Char(string="Job position")
