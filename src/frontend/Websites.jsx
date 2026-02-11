import React from "react";

const SITE_TYPE_META = {
  static: { label: "Static", color: "#0ea5e9", icon: "🧱" },
  php: { label: "PHP", color: "#7c3aed", icon: "🐘" },
  reverse_proxy: { label: "Reverse Proxy", color: "#f59e0b", icon: "🔁" },
  docker_proxy: { label: "Docker Proxy", color: "#2563eb", icon: "🐳" },
};

const isProxyType = (type) => type === "reverse_proxy" || type === "docker_proxy";

function TypeBadge({ siteType }) {
  const meta = SITE_TYPE_META[siteType] ?? { label: siteType, color: "#64748b", icon: "❓" };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        background: `${meta.color}20`,
        color: meta.color,
        border: `1px solid ${meta.color}66`,
        borderRadius: "999px",
        padding: "2px 8px",
        fontSize: "12px",
        fontWeight: 600,
      }}
    >
      <span aria-hidden>{meta.icon}</span>
      {meta.label}
    </span>
  );
}

export function Websites({ websites, onEdit, onDelete, onEditProxyTarget, onEnableWebsocket }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          <th align="left">Name</th>
          <th align="left">Domain</th>
          <th align="left">Type</th>
          <th align="left">Proxy target</th>
          <th align="left">Actions</th>
        </tr>
      </thead>
      <tbody>
        {websites.map((site) => {
          const proxyType = isProxyType(site.site_type);

          return (
            <tr key={site.id}>
              <td>{site.name}</td>
              <td>{site.domain}</td>
              <td>
                <TypeBadge siteType={site.site_type} />
              </td>
              <td>{proxyType ? site.upstream ?? "—" : "—"}</td>
              <td>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button type="button" onClick={() => onEdit?.(site)}>
                    Edit
                  </button>
                  {proxyType && (
                    <>
                      <button type="button" onClick={() => onEditProxyTarget?.(site)}>
                        Edit proxy target
                      </button>
                      <button type="button" onClick={() => onEnableWebsocket?.(site)}>
                        Enable websocket
                      </button>
                    </>
                  )}
                  <button type="button" onClick={() => onDelete?.(site)}>
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
