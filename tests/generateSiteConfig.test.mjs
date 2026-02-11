import test from "node:test";
import assert from "node:assert/strict";

import { generateSiteConfig } from "../src/backend/config/nginx/generateSiteConfig.js";

test("generates static config", () => {
  const config = generateSiteConfig({
    name: "landing",
    domain: "landing.local",
    site_type: "static",
  });

  assert.match(config, /root \/var\/www\/landing/);
});

test("generates php config", () => {
  const config = generateSiteConfig({
    name: "portal",
    domain: "portal.local",
    site_type: "php",
  });

  assert.match(config, /fastcgi_pass/);
});

test("generates reverse proxy config with websocket headers", () => {
  const config = generateSiteConfig({
    name: "api",
    domain: "api.local",
    site_type: "reverse_proxy",
    upstream: "http://10.0.0.20:8080",
    websocketEnabled: true,
  });

  assert.match(config, /proxy_pass http:\/\/10.0.0.20:8080/);
  assert.match(config, /Upgrade \$http_upgrade/);
});

test("generates docker proxy config", () => {
  const config = generateSiteConfig({
    name: "socket",
    domain: "socket.local",
    site_type: "docker_proxy",
    upstream: "socket-service:3000",
  });

  assert.match(config, /upstream socket_docker_upstream/);
  assert.match(config, /proxy_pass http:\/\/socket_docker_upstream/);
});
