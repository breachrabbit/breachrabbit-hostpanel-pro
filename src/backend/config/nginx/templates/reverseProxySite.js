function websocketBlock(site) {
  if (!site.websocketEnabled) {
    return "";
  }

  return `\n    proxy_http_version 1.1;\n    proxy_set_header Upgrade $http_upgrade;\n    proxy_set_header Connection \"upgrade\";`;
}

export function renderReverseProxyConfig(site) {
  if (!site.upstream) {
    throw new Error("reverse_proxy site requires upstream");
  }

  return `server {
  listen 80;
  server_name ${site.domain};

  location / {
    proxy_pass ${site.upstream};
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;${websocketBlock(site)}
  }
}`;
}
