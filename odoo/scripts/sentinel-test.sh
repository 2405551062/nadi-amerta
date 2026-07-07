#!/usr/bin/env bash
# Irrefutable live-data proof: change Villa Tirta's price in Odoo, so the
# frontend (which mirrors the same mock price) can only match if it is really
# reading Odoo. Pass "set" to apply the sentinel, "reset" to restore 8,500,000.
set -uo pipefail
cd /mnt/c/xampp/htdocs/nadiamerta/odoo

price="${2:-7777777}"
[ "${1:-set}" = "reset" ] && price=8500000

docker compose exec -T db psql -U odoo -d nadi -tA \
  -c "UPDATE product_template SET list_price=${price} WHERE x_slug='villa-tirta';"
docker compose exec -T db psql -U odoo -d nadi -tA \
  -c "SELECT 'villa-tirta price now: '||list_price FROM product_template WHERE x_slug='villa-tirta';"
