import {
  renderDockerProxyConfig,
  renderPhpSiteConfig,
  renderReverseProxyConfig,
  renderStaticSiteConfig,
} from "./templates/index.js";

export function generateSiteConfig(site) {
  switch (site.site_type) {
    case "static":
      return renderStaticSiteConfig(site);
    case "php":
      return renderPhpSiteConfig(site);
    case "reverse_proxy":
      return renderReverseProxyConfig(site);
    case "docker_proxy":
      return renderDockerProxyConfig(site);
    default:
      throw new Error(`Unsupported site_type: ${site.site_type}`);
  }
}
