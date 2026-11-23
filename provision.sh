
#!/usr/bin/env bash
# Provisioning de todo-vm : installation de Docker Engine + plugin Docker Compose
# Script idempotent : peut être relancé sans risque (vagrant provision).
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive

echo ">>> 1. Paquets de base"
apt-get update -y
apt-get install -y ca-certificates curl git jq

echo ">>> 2. Docker (dépôt officiel docker.com)"
if ! command -v docker >/dev/null 2>&1; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc

  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
    > /etc/apt/sources.list.d/docker.list

  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io \
                     docker-buildx-plugin docker-compose-plugin
fi

echo ">>> 3. Activation du service Docker"
systemctl enable --now docker

echo ">>> 4. Droits Docker pour l'utilisateur vagrant (sans sudo)"
usermod -aG docker vagrant

echo "============================================="
echo " VM prête"
docker --version
docker compose version
echo "  - IP privée : 192.168.56.10"
echo "============================================="
