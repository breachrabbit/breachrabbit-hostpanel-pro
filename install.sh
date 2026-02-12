#!/bin/bash
set -e

echo "🐇 Breach Rabbit HostPanel Pro: Установка High-End стека (Yandex + Timeweb)"
echo "======================================================================"

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }
print_info() { echo -e "${YELLOW}ℹ $1${NC}"; }

if [ "$EUID" -ne 0 ]; then 
    print_error "Запустите от имени root (sudo)"
    exit 1
fi

# 1. Системные зеркала на Yandex (самые быстрые в СНГ)
print_info "Шаг 1/11: Настройка зеркал Yandex и обновление системы..."
sed -i 's/archive.ubuntu.com/mirror.yandex.ru/g' /etc/apt/sources.list
sed -i 's/security.ubuntu.com/mirror.yandex.ru/g' /etc/apt/sources.list
apt-get update && apt-get upgrade -y
apt-get install -y curl wget gnupg2 lsb-release ca-certificates software-properties-common sudo
print_success "Система обновлена через Yandex"

# 2. Добавление репозиториев (Фикс GPG и 404)
print_info "Шаг 2/11: Добавление репозиториев..."
mkdir -p /etc/apt/keyrings

# PHP (Ondrej Sury)
add-apt-repository ppa:ondrej/php -y

# MariaDB 11.4 (Зеркало Timeweb - самое стабильное для 11.4 на Noble)
curl -fsSL https://mirror.timeweb.ru/mariadb/publicKey | gpg --dearmor -o /etc/apt/keyrings/mariadb-keyring.gpg
echo "deb [signed-by=/etc/apt/keyrings/mariadb-keyring.gpg] https://mirror.timeweb.ru/mariadb/repo/11.4/ubuntu noble main" > /etc/apt/sources.list.d/mariadb.list

# Nginx Mainline
curl -fsSL https://nginx.org/keys/nginx_signing.key | gpg --dearmor -o /etc/apt/keyrings/nginx-archive-keyring.gpg
echo "deb [signed-by=/etc/apt/keyrings/nginx-archive-keyring.gpg] http://nginx.org/packages/mainline/ubuntu `lsb_release -cs` nginx" > /etc/apt/sources.list.d/nginx.list

# Node.js 20.x
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc
