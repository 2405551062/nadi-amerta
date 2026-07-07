#!/usr/bin/env bash
# Initialize the `nadi` database with base deps + the nadi_amerta module + demo data.
# Safe to run once after `docker compose up -d`. Re-running errors if `nadi` exists
# (use scripts/update-module.sh to upgrade an existing DB instead).
#
#   wsl -d Ubuntu-24.04 -u root -- bash /mnt/c/xampp/htdocs/nadiamerta/odoo/scripts/init-db.sh
set -euo pipefail
cd "$(dirname "$0")/.."

echo ">> Waiting for Odoo container to be healthy…"
until docker compose exec -T db pg_isready -U odoo >/dev/null 2>&1; do sleep 2; done

echo ">> Creating + initializing database 'nadi' with nadi_amerta (incl. demo data)"
docker compose exec -T odoo odoo \
  -d nadi \
  -i nadi_amerta \
  --without-demo=False \
  --stop-after-init

echo ">> Done. Odoo is serving at http://localhost:8069 (db: nadi, login: admin / admin)"
