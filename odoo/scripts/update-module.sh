#!/usr/bin/env bash
# Upgrade the nadi_amerta module in the existing `nadi` DB after editing the addon.
#   wsl -d Ubuntu-24.04 -u root -- bash /mnt/c/xampp/htdocs/nadiamerta/odoo/scripts/update-module.sh
set -euo pipefail
cd "$(dirname "$0")/.."

echo ">> Upgrading nadi_amerta in database 'nadi'"
docker compose exec -T odoo odoo \
  -d nadi \
  -u nadi_amerta \
  --stop-after-init

echo ">> Restarting Odoo server"
docker compose restart odoo
echo ">> Done."
