#!/usr/bin/env bash
# Provisioning de la VM todo-vm : Node.js 22, clone de l'app, service systemd, redirection 5111 -> 3000
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive

APP_DIR=/home/vagrant/todo-list-app
APP_PORT=3000   # port d'écoute codé en dur dans src/index.js
PUBLIC_PORT=5111
DB_DIR=/var/lib/todo-app

# 1. Dépendances système
apt-get update -y
apt-get install -y git curl build-essential python3 iptables-persistent

# 2. Node.js 22 (si absent)
if ! command -v node >/dev/null 2>&1 || [ "$(node -v | cut -d. -f1)" != "v22" ]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi

# 3. Clone (ou mise à jour) de l'app
if [ ! -d "$APP_DIR/.git" ]; then
  sudo -u vagrant git clone https://github.com/dockersamples/todo-list-app "$APP_DIR"
else
  sudo -u vagrant git -C "$APP_DIR" pull --ff-only
fi

# 4. Dépendances Node (sqlite3 est utilisé par défaut, pas besoin de MySQL)
sudo -u vagrant bash -c "cd '$APP_DIR' && npm install --omit=dev"

# 5. Dossier de la base SQLite
mkdir -p "$DB_DIR"
chown vagrant:vagrant "$DB_DIR"

# 6. Service systemd
cat > /etc/systemd/system/todo-app.service <<EOF
[Unit]
Description=Todo list app (dockersamples)
After=network.target

[Service]
User=vagrant
WorkingDirectory=$APP_DIR
Environment=SQLITE_DB_LOCATION=$DB_DIR/todo.db
ExecStart=/usr/bin/node src/index.js
Restart=always

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable --now todo-app.service

# 7. Redirection 5111 -> 3000 (trafic externe et loopback), persistante au reboot
iptables -t nat -C PREROUTING -p tcp --dport "$PUBLIC_PORT" -j REDIRECT --to-port "$APP_PORT" 2>/dev/null \
  || iptables -t nat -A PREROUTING -p tcp --dport "$PUBLIC_PORT" -j REDIRECT --to-port "$APP_PORT"
iptables -t nat -C OUTPUT -o lo -p tcp --dport "$PUBLIC_PORT" -j REDIRECT --to-port "$APP_PORT" 2>/dev/null \
  || iptables -t nat -A OUTPUT -o lo -p tcp --dport "$PUBLIC_PORT" -j REDIRECT --to-port "$APP_PORT"
netfilter-persistent save

echo "============================================="
echo " Todo app démarrée"
echo "  - Depuis le host : http://localhost:$PUBLIC_PORT"
echo "  - Via IP privée  : http://192.168.56.10:$PUBLIC_PORT"
echo "============================================="
