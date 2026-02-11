export const SITE_TYPES = ["static", "php", "reverse_proxy", "docker_proxy"];

export class SiteModel {
  constructor({
    id,
    name,
    domain,
    site_type = "static",
    root = null,
    upstream = null,
    websocketEnabled = false,
  }) {
    if (!SITE_TYPES.includes(site_type)) {
      throw new Error(`Unsupported site_type: ${site_type}`);
    }

    this.id = id;
    this.name = name;
    this.domain = domain;
    this.site_type = site_type;
    this.root = root;
    this.upstream = upstream;
    this.websocketEnabled = websocketEnabled;
  }

  isProxyType() {
    return this.site_type === "reverse_proxy" || this.site_type === "docker_proxy";
  }
}
