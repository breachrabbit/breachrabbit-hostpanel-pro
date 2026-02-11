# breachrabbit-web-panel

## Implemented in this task

- Added `site_type` to the site model with allowed values:
  - `static`
  - `php`
  - `reverse_proxy`
  - `docker_proxy`
- Added `Websites` table UI with:
  - type badge (color + icon),
  - upstream column for proxy types,
  - proxy actions: **Edit proxy target** and **Enable websocket**.
- Split nginx config generation by `site_type` into dedicated template modules under `src/backend/config/nginx/templates`.
