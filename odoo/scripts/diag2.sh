#!/usr/bin/env bash
set -uo pipefail

echo "=== 1. inside the odoo container (does werkzeug accept?) ==="
docker exec odoo-odoo-1 python3 -c "import urllib.request; print('container-internal HTTP', urllib.request.urlopen('http://localhost:8069/web/login', timeout=8).status)" 2>&1

echo "=== 2. listening sockets in container ==="
docker exec odoo-odoo-1 sh -c "ss -tlnp 2>/dev/null | grep 8069 || netstat -tlnp 2>/dev/null | grep 8069 || echo 'no ss/netstat'" 2>&1

echo "=== 3. from WSL host to published port ==="
curl -s -o /dev/null -w "WSL-host localhost:8069 -> HTTP %{http_code}\n" --max-time 8 http://localhost:8069/web/login 2>&1

echo "=== 4. iptables DNAT rules for 8069 (docker port publish) ==="
iptables -t nat -L DOCKER -n 2>/dev/null | grep 8069 || echo "no iptables rule (nft?)"

echo "=== 5. latest odoo log after last start ==="
cd /mnt/c/xampp/htdocs/nadiamerta/odoo
docker compose logs --tail 6 odoo 2>&1 | sed 's/^/    /'

echo "=== done ==="
