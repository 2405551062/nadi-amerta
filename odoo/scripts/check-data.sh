#!/usr/bin/env bash
set -uo pipefail
cd /mnt/c/xampp/htdocs/nadiamerta/odoo

echo "=== databases ==="
docker compose exec -T db psql -U odoo -d postgres -tA \
  -c "SELECT datname FROM pg_database WHERE datistemplate=false ORDER BY datname;"

echo "=== nadi_amerta module state (in nadi) ==="
docker compose exec -T db psql -U odoo -d nadi -tA \
  -c "SELECT name||' -> '||state FROM ir_module_module WHERE name='nadi_amerta';"

echo "=== villa count (in nadi) ==="
docker compose exec -T db psql -U odoo -d nadi -tA \
  -c "SELECT count(*) FROM product_template WHERE x_kind='villa';"

echo "=== sample villas ==="
docker compose exec -T db psql -U odoo -d nadi \
  -c "SELECT x_slug, list_price, x_availability FROM product_template WHERE x_kind='villa' ORDER BY list_price LIMIT 8;"
