#!/usr/bin/env bash
# Install Docker Engine + Compose plugin inside the WSL2 Ubuntu distro.
# Run as root: wsl -d Ubuntu-24.04 -u root -- bash /mnt/c/xampp/htdocs/nadiamerta/odoo/scripts/wsl-docker-setup.sh
set -euo pipefail

echo ">> Enabling systemd in /etc/wsl.conf"
cat > /etc/wsl.conf <<'EOF'
[boot]
systemd=true
EOF

echo ">> apt update + prerequisites"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y ca-certificates curl gnupg

echo ">> Adding Docker's official GPG key + repo"
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
. /etc/os-release
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu ${VERSION_CODENAME} stable" \
  > /etc/apt/sources.list.d/docker.list

echo ">> Installing Docker Engine + Compose plugin"
apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

echo ">> Docker installed:"
docker --version
docker compose version

echo ">> Done. A 'wsl --shutdown' is required so systemd/dockerd start on next boot."
