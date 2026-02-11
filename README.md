# breachrabbit-web-panel

Bootstrap skeleton for BreachRabbit Web Panel (OpenLiteSpeed + Nginx + Next.js control panel foundation).

## One-command install (Ubuntu)

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/breachrabbit/breachrabbit-web-panel/main/install/install.sh)
```

## Как запустить установку (пошагово)

> Требуется **Ubuntu** и запуск от `root` (или через `sudo`).

### Вариант 1 — сразу из GitHub (рекомендуется)

```bash
sudo bash -c "$(curl -fsSL https://raw.githubusercontent.com/breachrabbit/breachrabbit-web-panel/main/install/install.sh)"
```

### Вариант 2 — через clone репозитория

```bash
git clone https://github.com/breachrabbit/breachrabbit-web-panel.git
cd breachrabbit-web-panel
chmod +x install/install.sh
sudo ./install/install.sh
```

## Что делает установщик (part 1)

1. Checks Ubuntu updates and installs them.
2. Installs standard utilities (`curl`, `git`, `jq`, `ufw`, `fail2ban`, etc.).
3. Installs core stack components:
   - OpenLiteSpeed
   - Nginx
   - MariaDB
   - Redis
   - Certbot
   - Node.js + npm
   - PHP-FPM + PHP MySQL extension
4. Generates random credentials for first boot and prints a summary table with URLs/logins/passwords.

## Где смотреть доступы после установки

After completion, installer writes a credentials report to:

- `/root/breachrabbit-install-summary.txt`

And prepares skeleton env for the panel in:

- `/opt/breachrabbit/config/.env`

## Troubleshooting

- If you previously saw `Refusing to operate on alias name or linked unit file: lsws.service`, pull latest installer and rerun it.
- If you saw the same error for `openlitespeed.service`, this is also handled now: installer falls back to start-only when enable is rejected for alias/linked units.
- The installer now auto-detects the proper OpenLiteSpeed unit (`openlitespeed.service` / `lshttpd.service`) and intentionally does not enable `lsws.service` aliases; it falls back to `lswsctrl` when needed.

## Post-install verification checklist

After reboot, run:

```bash
systemctl status openlitespeed nginx mariadb redis-server cron --no-pager || systemctl status lshttpd nginx mariadb redis-server cron --no-pager
```

Expected result: all listed services should be `active (running)`.

### MariaDB warning after root password change

You may see this line in `systemctl status mariadb` logs:

`Access denied for user 'root'@'localhost' (using password: NO)`

This appears because Ubuntu's `/etc/mysql/debian-start` tries local checks without your custom root password. In this installer flow, root auth is intentionally switched to password mode, so this warning can appear while MariaDB itself remains healthy.

Verify real DB health with:

```bash
mysql -uroot -p -e "SELECT VERSION();"
mysqladmin -uroot -p ping
```

If both commands succeed, MariaDB is operational for the panel.

## Next step after successful install (Next.js panel)

This repository now includes a deployable Next.js 14 app bootstrap.

### Local run

```bash
npm install
npm run dev
```

Open:

- `http://localhost:3000` — starter dashboard
- `http://localhost:3000/api/health` — JSON health probe

### Production run on the server

```bash
npm install
npm run build
npm run start
```

Run the app on port `3000` and keep nginx configured as reverse-proxy (`http://SERVER_IP`).

### Environment variables for readiness widget

The starter UI checks these variables and marks each as `OK`/`MISSING`:

- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `REDIS_URL`
- `NEXTAUTH_SECRET`
