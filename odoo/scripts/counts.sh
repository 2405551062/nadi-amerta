#!/usr/bin/env bash
cd /mnt/c/xampp/htdocs/nadiamerta/odoo
q() { docker compose exec -T db psql -U odoo -d nadi -tA -c "$1"; }
echo "villas    : $(q "SELECT count(*) FROM product_template WHERE x_kind='villa';")"
echo "services  : $(q "SELECT count(*) FROM product_template WHERE x_kind='service';")"
echo "menu      : $(q "SELECT count(*) FROM product_template WHERE x_kind='fnb';")"
echo "supplies  : $(q "SELECT count(*) FROM product_template WHERE x_kind='supply';")"
echo "guests    : $(q "SELECT count(*) FROM res_partner WHERE email LIKE '%@example.com';")"
echo "reservns  : $(q "SELECT count(*) FROM villa_reservation;")"
echo "  by state: $(q "SELECT string_agg(state||':'||c,', ') FROM (SELECT state,count(*) c FROM villa_reservation GROUP BY state) t;")"
echo "requests  : $(q "SELECT count(*) FROM villa_guest_request;")"
echo "hk tasks  : $(q "SELECT count(*) FROM villa_housekeeping_task;")"
echo "fnb orders: $(q "SELECT count(*) FROM villa_fnb_order;")"
echo "fnb lines : $(q "SELECT count(*) FROM villa_fnb_order_line;")"
