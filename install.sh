#!/bin/bash
set -e

echo "🐇 Breach Rabbit HostPanel Pro: Установка через Yandex Mirror..."
echo "======================================================================"

# 1. Переключаем СИСТЕМУ на Яндекс (самый быстрый канал)
echo "ℹ Шаг 1: Настройка зеркал Yandex для Ubuntu..."
sed -i 's/archive.ubuntu.com/mirror.yandex.ru/g' /etc/apt/sources.list
sed -i 's/security.ubuntu.com/mirror.yandex.ru/g' /etc/apt/sources.list

apt-get update && apt-get install -y curl wget git gnupg2 lsb-release ca-certificates sudo

# 2. Добавляем репозитории
echo "ℹ Шаг 2: Добавление внешних репозиториев..."

# PHP (Оригинал, зеркал в РФ нет, качаем напрямую с Launchpad)
add-apt-repository ppa:ondrej/php -y

# MariaDB 11.4 (Тут лучше Timeweb, у Яндекса 11.4 может не быть в noble)
mkdir -p /etc/apt/keyrings
curl -fsSL https://mirror.timeweb.ru/mariadb/publicKey | gpg --dearmor -o /etc/apt/keyrings/mariadb-keyring.gpg
echo "deb [signed-by=/etc/apt/keyrings/mariadb-keyring.gpg] https://mirror.timeweb.ru/mariadb/repo/11.4/ubuntu noble main" > /etc/apt/sources.list.d/mariadb.list

# OpenLiteSpeed (Оригинал)
wget -O - https://rpms.litespeedtech.com/debian/enable_lst_debian_repo.sh | bash

# 3. Установка пакетов
echo "ℹ Шаг 3: Установка серверного стека..."
apt-get update
apt-get install -y php8.3 php8.3-fpm php8.4 php8.4-fpm \
                   openlitespeed nginx mariadb-server redis-server \
                   postgresql postgresql-contrib nodejs npm

# 4. Настройка PostgreSQL (Фикс для 15+)
echo "ℹ Шаг 4: Настройка PostgreSQL..."
sudo -u postgres psql -c "CREATE DATABASE breachrabbit;" || true
sudo -u postgres psql -c "CREATE USER br_admin WITH PASSWORD 'admin123';" || true
sudo -u postgres psql -d breachrabbit -c "ALTER SCHEMA public OWNER TO br_admin;"
sudo -u postgres psql -d breachrabbit -c "GRANT ALL ON SCHEMA public TO br_admin;"

# 5. Настройка окружения и PostCSS (Свет!)
echo "ℹ Шаг 5: Настройка конфигов и стилей..."
SERVER_IP=$(curl -s icanhazip.com || hostname -I | awk '{print $1}')

cat > .env <<EOF
DATABASE_URL="postgresql://br_admin:admin123@localhost:5432/breachrabbit"
REDIS_URL="redis://localhost:6379"
NEXTAUTH_URL="http://$SERVER_IP:3000"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
EOF

# Фикс для Tailwind
cat > postcss.config.js <<EOF
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF

# 6. Сборка проекта
echo "ℹ Шаг 6: Установка npm и билд приложения..."
npm install
npx prisma generate
npx prisma db push --accept-data-loss
npx ts-node prisma/seed.ts || true

rm -rf .next
npm run build

# 7. PM2 Запуск
npm install -g pm2
pm2 delete breachrabbit-panel 2>/dev/null || true
pm2 start npm --name "breachrabbit-panel" -- start
pm2 save

echo "======================================================================"
echo "✅ УСТАНОВКА ЗАВЕРШЕНА НА ЗЕРКАЛАХ YANDEX!"
echo "🌍 Адрес: http://$SERVER_IP:3000"
echo "======================================================================"
