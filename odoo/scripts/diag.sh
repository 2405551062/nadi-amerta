#!/usr/bin/env bash
set -uo pipefail
cd /mnt/c/xampp/htdocs/nadiamerta/odoo

echo "=== all containers (any project) ==="
docker ps -a --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}'

echo "=== compose ps ==="
docker compose ps

echo "=== inspect restart reasons ==="
for c in odoo-db-1 odoo-odoo-1; do
  docker inspect "$c" --format "$c: restarts={{.RestartCount}} status={{.State.Status}} exit={{.State.ExitCode}} oom={{.State.OOMKilled}} startedAt={{.State.StartedAt}}" 2>/dev/null
done

echo "=== watching events for 45s (looking for die/kill/stop) ==="
timeout 45 docker events --filter type=container --format '{{.Time}} {{.Actor.Attributes.name}} {{.Action}}' 2>&1

echo "=== done ==="
