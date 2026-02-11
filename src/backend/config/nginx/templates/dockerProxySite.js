function websocketBlock(site) {
  if (!site.websocketEnabled) {
    return "";
  }

  return `\n    proxy_http_version 1.1;\n    proxy_set_header Upgrade $http_upgrade;\n    proxy_set_header Connection \"upgrade\";`;
}

export function renderDockerProxyConfig(site) {
  if (!site.upstream) {
    throw new Error("docker_proxy site requires upstream");
  }

  return `upstream ${site.name}_docker_upstream {
  server ${site.upstream};
}

server {
  listen 80;
  server_name ${site.domain};

  location / {
    proxy_pass http://${site.name}_docker_upstream;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;${websocketBlock(site)}
  }
}`;
}
