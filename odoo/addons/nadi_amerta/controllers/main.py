# -*- coding: utf-8 -*-
"""
Lightweight public health endpoint so the Next.js BFF can verify connectivity
before falling back to mock data. All real data access goes through the
JSON-RPC external API (execute_kw), not custom controllers.
"""
from odoo import http
from odoo.http import request


class NadiAmertaController(http.Controller):

    @http.route("/nadi/health", type="http", auth="public", methods=["GET"], csrf=False)
    def health(self, **kw):
        villas = request.env["product.template"].sudo().search_count(
            [("x_kind", "=", "villa")]
        )
        return request.make_json_response({
            "status": "ok",
            "service": "nadi_amerta",
            "villas": villas,
        })
