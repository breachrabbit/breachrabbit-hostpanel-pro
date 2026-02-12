#!/bin/bash

set -e

echo "🚀 Breach Rabbit Web Panel Installer"
echo "====================================="

if [ "$EUID" -ne 0 ]; then
  echo "❌ Please run as root"
  exit 1
fi

read -p "Enter domain for panel (e.g panel.example.com): " PANEL_DOMAIN
read -p "Enter email for SSL: " SSL_EMAIL

echo "🔄 Updating system..."
apt update && apt upgrade -y

echo "📦 Installing base packages..."
apt install -y curl wget git unzip software-properties-common \
  build-essential ufw nginx redis-server postgresql postgresql-contrib

echo "🔥 Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

echo "🗄 Installing OpenLiteSpeed..."
wget -O - http://rpms.litespeedtech.com/debian/enable_lst_debian_repo.sh | bash
apt update
apt install -y openlitespeed lsphp82

echo "💾 Installing Restic..."
apt install -y restic

echo "🔐 Installing acme.sh..."
curl https://get.acme.sh | sh
~/.acme.sh/acme.sh --register-account -m $SSL_EMAIL

echo "🐘 Configuring PostgreSQL..."
sudo -u postgres psql <<EOF
CREATE USER hostpanel WITH PASSWORD 'hostpanelpass';
CREATE DATABASE hostpanel OWNER hostpanel;
EOF

echo "📂 Deploying panel..."
cd /opt
git clone https://github.com/breachrabbit/breach-rabbit-web-panel.git panel
cd panel

echo "📦 Installing dependencies..."
npm install

echo "⚙️ Creating .env file..."
cat > .env <<EOF
DATABASE_URL="postgresql://hostpanel:hostpanelpass@localhost:5432/hostpanel"
REDIS_URL="redis://localhost:6379"
NEXTAUTH_URL="https://$PANEL_DOMAIN"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
OLS_API_URL="http://localhost:7080"
OLS_API_USER="admin"
OLS_API_PASS="admin"
SERVER_ROOT="/var/www"
ACME_EMAIL="$SSL_EMAIL"
EOF

echo "🗄 Running Prisma..."
npx prisma generate
npx prisma migrate deploy

echo "🏗 Building app..."
npm run build

echo "📦 Installing PM2..."
npm install -g pm2

echo "🚀 Starting app..."
pm2 start npm --name "breach-panel" -- start
pm2 startup
pm2 save

echo "🌐 Configuring Nginx reverse proxy..."
cat > /etc/nginx/sites-available/panel <<EOF
server {
    listen 80;
    server_name $PANEL_DOMAIN;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

ln -sf /etc/nginx/sites-available/panel /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

echo "🔐 Installing SSL certificate..."
apt install -y certbot python3-certbot-nginx
certbot --nginx -d $PANEL_DOMAIN --non-interactive --agree-tos -m $SSL_EMAIL

echo "🔥 Configuring firewall..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

echo "✅ Installation complete!"
echo "====================================="
echo "🌍 Visit: https://$PANEL_DOMAIN"
echo ""
echo "Next steps:"
echo "- Set OpenLiteSpeed admin password:"
echo "  /usr/local/lsws/admin/misc/admpass.sh"
echo ""
echo "- OLS admin panel:"
echo "  https://server-ip:7080"
echo ""
echo "Panel is running via PM2"
