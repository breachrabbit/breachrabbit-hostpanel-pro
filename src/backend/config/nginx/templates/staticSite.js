export function renderStaticSiteConfig(site) {
  return `server {
  listen 80;
  server_name ${site.domain};

  root ${site.root ?? `/var/www/${site.name}`};
  index index.html;

  location / {
    try_files $uri $uri/ =404;
  }
}`;
}
