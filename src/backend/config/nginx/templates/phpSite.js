export function renderPhpSiteConfig(site) {
  return `server {
  listen 80;
  server_name ${site.domain};

  root ${site.root ?? `/var/www/${site.name}`};
  index index.php index.html;

  location / {
    try_files $uri $uri/ /index.php?$query_string;
  }

  location ~ \\.php$ {
    include snippets/fastcgi-php.conf;
    fastcgi_pass unix:/run/php/php8.2-fpm.sock;
  }
}`;
}
