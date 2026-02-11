#!/bin/bash
set -e

# ============================================
# LM Panel Installation Script
# ============================================

# Конфигурация (можно переопределить через переменные окружения или аргументы)
DOMAIN="${DOMAIN:-}"               # если указан, будет выпущен SSL для панели
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@example.com}"
PANEL_PORT="${PANEL_PORT:-3000}"
PANEL_USER="${PANEL_USER:-admin}"
PANEL_PASSWORD="${PANEL_PASSWORD:-}"  # если пусто – сгенерируется
OLS_ADMIN_USER="${OLS_ADMIN_USER:-admin}"
OLS_ADMIN_PASS="${OLS_ADMIN_PASS:-}"
REPO_URL="${REPO_URL:-https://github.com/yourname/lmpanel.git}"
BRANCH="${BRANCH:-main}"
INSTALL_DIR="${INSTALL_DIR:-/opt/lmpanel}"
DB_TYPE="${DB_TYPE:-sqlite}"       # sqlite или mysql

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Функции логирования
info() { echo -e "${GREEN}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# Проверка root
if [[ $EUID -ne 0 ]]; then
   error "Этот скрипт должен выполняться от root"
fi

# ============================================
# 1. Системные обновления и базовые пакеты
# ============================================
install_base() {
    info "Обновление системы и установка базовых пакетов..."
    apt update && apt upgrade -y
    apt install -y curl wget git ufw nftables build-essential \
                   software-properties-common apt-transport-https \
                   ca-certificates gnupg lsb-release
}

# ============================================
# 2. Установка OpenLiteSpeed
# ============================================
install_ols() {
    info "Установка OpenLiteSpeed..."
    wget -O - https://repo.litespeed.sh | bash
    apt install -y openlitespeed
    # Установка PHP (версии по умолчанию, можно добавить выбор)
    apt install -y lsphp81 lsphp81-mysql lsphp81-curl lsphp81-mbstring \
                   lsphp81-xml lsphp81-zip lsphp81-intl lsphp81-gd
    # Создаём симлинк для php
    ln -sf /usr/local/lsws/lsphp81/bin/php /usr/bin/php

    # Настройка администратора OLS, если не задан пароль — генерируем
    if [[ -z "$OLS_ADMIN_PASS" ]]; then
        OLS_ADMIN_PASS=$(openssl rand -base64 12)
    fi
    # Смена пароля админа OLS
    echo -e "$OLS_ADMIN_PASS\n$OLS_ADMIN_PASS" | /usr/local/lsws/admin/misc/admpass.sh

    # Включаем API OLS (изменяем конфиг)
    OLS_CONFIG="/usr/local/lsws/conf/httpd_config.conf"
    sed -i 's/^adminapi\s\+enable\s\+0/adminapi enable 1/' "$OLS_CONFIG"
    # Перезапуск OLS
    systemctl restart lsws
}

# ============================================
# 3. Установка Nginx
# ============================================
install_nginx() {
    info "Установка Nginx..."
    apt install -y nginx
    systemctl enable nginx
    systemctl start nginx
}

# ============================================
# 4. Установка MariaDB
# ============================================
install_mariadb() {
    info "Установка MariaDB..."
    apt install -y mariadb-server mariadb-client
    systemctl enable mariadb
    systemctl start mariadb

    # Безопасная установка (автоматизация)
    mysql -e "DELETE FROM mysql.user WHERE User='';"
    mysql -e "DROP DATABASE IF EXISTS test;"
    mysql -e "DELETE FROM mysql.db WHERE Db='test' OR Db='test\\_%';"
    mysql -e "FLUSH PRIVILEGES;"
}

# ============================================
# 5. Установка Node.js, PM2, и необходимых утилит
# ============================================
install_node() {
    info "Установка Node.js 20.x..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
    npm install -g pm2
}

# ============================================
# 6. Клонирование репозитория и сборка панели
# ============================================
setup_panel_code() {
    info "Клонирование панели из $REPO_URL (ветка $BRANCH)..."
    if [[ -d "$INSTALL_DIR" ]]; then
        warn "Директория $INSTALL_DIR уже существует, будет перезаписана."
        rm -rf "$INSTALL_DIR"
    fi
    git clone -b "$BRANCH" "$REPO_URL" "$INSTALL_DIR"
    cd "$INSTALL_DIR"

    info "Установка зависимостей Node.js..."
    npm install

    # Создаём .env.local
    cp .env.example .env.local 2>/dev/null || touch .env.local

    # Генерация пароля администратора панели, если не задан
    if [[ -z "$PANEL_PASSWORD" ]]; then
        PANEL_PASSWORD=$(openssl rand -base64 12)
    fi

    # Записываем пароль в .env.local (будет использован при первом запуске seed)
    cat >> .env.local <<EOF
DATABASE_URL="file:./prisma/data.db?connection_limit=1"
PANEL_ADMIN_USERNAME="$PANEL_USER"
PANEL_ADMIN_PASSWORD_HASH=""
PANEL_SECRET="$(openssl rand -base64 32)"
EOF

    # Выполняем миграцию Prisma и seed (создание админа)
    info "Настройка базы данных..."
    npx prisma migrate deploy
    # Создаём администратора через seed
    NODE_OPTIONS="--require dotenv/config" npx prisma db seed
}

# ============================================
# 7. Настройка базы данных (если MySQL)
# ============================================
setup_database() {
    if [[ "$DB_TYPE" == "mysql" ]]; then
        info "Создание базы данных и пользователя для панели..."
        DB_NAME="lmpanel"
        DB_USER="lmpanel"
        DB_PASS=$(openssl rand -base64 12)
        mysql -e "CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
        mysql -e "CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS';"
        mysql -e "GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';"
        mysql -e "FLUSH PRIVILEGES;"

        # Обновляем .env.local
        sed -i "s|^DATABASE_URL=.*|DATABASE_URL=\"mysql://$DB_USER:$DB_PASS@localhost:3306/$DB_NAME\"|" "$INSTALL_DIR/.env.local"
    else
        info "Используется SQLite (по умолчанию)."
    fi
}

# ============================================
# 8. Запуск панели через PM2
# ============================================
start_panel() {
    info "Сборка Next.js приложения..."
    cd "$INSTALL_DIR"
    npm run build

    info "Запуск панели через PM2..."
    pm2 start npm --name "lmpanel" -- start -- -p "$PANEL_PORT"
    pm2 save
    pm2 startup systemd -u root --hp /root
}

# ============================================
# 9. Настройка Nginx reverse proxy для панели
# ============================================
setup_nginx_panel() {
    info "Настройка Nginx для панели управления..."

    # Определяем IP сервера
    SERVER_IP=$(curl -s ifconfig.me || hostname -I | awk '{print $1}')

    if [[ -n "$DOMAIN" ]]; then
        # Используем домен
        NGINX_SERVER_NAME="$DOMAIN"
        # Позже можно получить SSL
    else
        NGINX_SERVER_NAME="$SERVER_IP"
    fi

    cat > /etc/nginx/sites-available/lmpanel <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name $NGINX_SERVER_NAME;

    location / {
        proxy_pass http://127.0.0.1:$PANEL_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

    ln -sf /etc/nginx/sites-available/lmpanel /etc/nginx/sites-enabled/
    nginx -t && systemctl reload nginx

    # Если указан домен, выпускаем SSL
    if [[ -n "$DOMAIN" ]]; then
        info "Выпуск SSL-сертификата для $DOMAIN через Let's Encrypt..."
        apt install -y certbot python3-certbot-nginx
        certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email "$ADMIN_EMAIL"
    fi
}

# ============================================
# 10. Установка дополнительных компонентов (Restic, FileBrowser, ttyd и т.д.)
# ============================================
install_extras() {
    info "Установка Restic..."
    apt install -y restic

    info "Установка acme.sh..."
    curl https://get.acme.sh | sh -s email="$ADMIN_EMAIL"

    info "Установка FileBrowser..."
    curl -fsSL https://raw.githubusercontent.com/filebrowser/get/master/get.sh | bash
    # Создаём конфиг для FileBrowser (будет проксироваться через панель)
    mkdir -p /etc/filebrowser
    cat > /etc/filebrowser/config.json <<EOF
{
  "port": 8081,
  "baseURL": "/files",
  "address": "127.0.0.1",
  "log": "stdout",
  "database": "/etc/filebrowser/database.db",
  "root": "/"
}
EOF
    # Создаём systemd unit для FileBrowser
    cat > /etc/systemd/system/filebrowser.service <<EOF
[Unit]
Description=File Browser
After=network.target

[Service]
ExecStart=/usr/local/bin/filebrowser -c /etc/filebrowser/config.json
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF
    systemctl daemon-reload
    systemctl enable filebrowser
    systemctl start filebrowser
}

# ============================================
# 11. Настройка фаервола (UFW)
# ============================================
setup_firewall() {
    info "Настройка UFW..."
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow ssh
    ufw allow http
    ufw allow https
    # Порт OLS admin (если нужен удалённо)
    ufw allow 7080/tcp
    echo "y" | ufw enable
}

# ============================================
# 12. Итоговая сводка
# ============================================
show_summary() {
    info "========================================="
    info "Установка LM Panel завершена успешно!"
    info "========================================="
    echo ""
    echo -e "${GREEN}Панель управления доступна по адресу:${NC}"
    if [[ -n "$DOMAIN" ]]; then
        echo "   https://$DOMAIN"
    else
        SERVER_IP=$(curl -s ifconfig.me || hostname -I | awk '{print $1}')
        echo "   http://$SERVER_IP"
    fi
    echo ""
    echo -e "${GREEN}Учетные данные для входа в панель:${NC}"
    echo "   Логин: $PANEL_USER"
    echo "   Пароль: $PANEL_PASSWORD"
    echo ""
    echo -e "${GREEN}OpenLiteSpeed Admin:${NC}"
    echo "   URL: http://$SERVER_IP:7080"
    echo "   Логин: $OLS_ADMIN_USER"
    echo "   Пароль: $OLS_ADMIN_PASS"
    echo ""
    if [[ "$DB_TYPE" == "mysql" ]]; then
        echo -e "${GREEN}База данных панели:${NC}"
        echo "   Имя БД: $DB_NAME"
        echo "   Пользователь: $DB_USER"
        echo "   Пароль: $DB_PASS"
        echo ""
    fi
    echo -e "${YELLOW}Обязательно сохраните эти пароли в безопасном месте!${NC}"
}

# ============================================
# Основная функция
# ============================================
main() {
    install_base
    install_ols
    install_nginx
    install_mariadb       # можно сделать опционально
    install_node
    setup_panel_code
    setup_database
    start_panel
    setup_nginx_panel
    install_extras
    setup_firewall
    show_summary
}

main "$@"