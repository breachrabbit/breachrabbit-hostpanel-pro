"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  Globe,
  MoreVertical,
  ExternalLink,
  Settings,
  Trash2,
  FolderOpen,
  Database as DatabaseIcon,
  FileText,
} from "lucide-react";
import { formatBytes } from "@/lib/utils";
import Link from "next/link";

// Mock data - will be replaced with API calls
const mockSites = [
  {
    id: "1",
    domain: "blog.example.com",
    type: "WORDPRESS",
    status: "ACTIVE",
    phpVersion: "8.2",
    sslEnabled: true,
    sslExpiry: new Date("2025-04-15"),
    bandwidth24h: 45200000,
    requests24h: 1234,
    avgResponseTime: 125,
  },
  {
    id: "2",
    domain: "shop.example.com",
    type: "WORDPRESS",
    status: "ACTIVE",
    phpVersion: "8.2",
    sslEnabled: true,
    sslExpiry: new Date("2025-02-26"),
    bandwidth24h: 82300000,
    requests24h: 856,
    avgResponseTime: 98,
  },
  {
    id: "3",
    domain: "app.example.com",
    type: "DOCKER_PROXY",
    status: "ACTIVE",
    proxyTarget: "localhost:3000",
    sslEnabled: true,
    sslExpiry: new Date("2025-04-30"),
    bandwidth24h: 12800000,
    requests24h: 342,
    avgResponseTime: 45,
  },
];

function getSiteTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    WORDPRESS: "WordPress",
    STATIC: "Static",
    PHP: "PHP",
    NODEJS_PROXY: "Node.js",
    DOCKER_PROXY: "Docker",
    CUSTOM_PROXY: "Proxy",
  };
  return labels[type] || type;
}

function getSSLDaysLeft(expiry: Date): number {
  const now = new Date();
  const diff = expiry.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function SitesPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSites = mockSites.filter((site) =>
    site.domain.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sites</h1>
          <p className="text-muted-foreground">
            Manage your websites and applications
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Site
        </Button>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search sites..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Sites Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredSites.map((site) => {
          const sslDaysLeft = site.sslEnabled ? getSSLDaysLeft(site.sslExpiry!) : 0;
          const sslStatus =
            sslDaysLeft < 14
              ? "error"
              : sslDaysLeft < 30
              ? "warning"
              : "success";

          return (
            <Card key={site.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`status-dot ${site.status.toLowerCase()}`} />
                    <div>
                      <CardTitle className="text-lg">{site.domain}</CardTitle>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {getSiteTypeLabel(site.type)}
                        </Badge>
                        {site.phpVersion && (
                          <Badge variant="secondary" className="text-xs">
                            PHP {site.phpVersion}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* SSL Status */}
                {site.sslEnabled && (
                  <div className="flex items-center justify-between rounded-lg bg-secondary/50 p-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-2 w-2 rounded-full bg-${sslStatus}`}
                      />
                      <span className="text-sm font-medium">SSL Certificate</span>
                    </div>
                    <span
                      className={`text-sm font-semibold ${
                        sslStatus === "error"
                          ? "text-error"
                          : sslStatus === "warning"
                          ? "text-warning"
                          : "text-success"
                      }`}
                    >
                      {sslDaysLeft}d
                    </span>
                  </div>
                )}

                {/* Proxy Target (for proxy sites) */}
                {site.proxyTarget && (
                  <div className="flex items-center justify-between rounded-lg bg-secondary/50 p-3">
                    <span className="text-sm text-muted-foreground">Proxy to</span>
                    <span className="text-sm font-mono">{site.proxyTarget}</span>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Requests (24h)</p>
                    <p className="font-semibold">{site.requests24h.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Traffic (24h)</p>
                    <p className="font-semibold">{formatBytes(site.bandwidth24h)}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Avg Response</p>
                    <p className="font-semibold">{site.avgResponseTime}ms</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-4 gap-2">
                  <Button variant="outline" size="sm" className="gap-1" asChild>
                    <Link href={`https://${site.domain}`} target="_blank">
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1">
                    <FolderOpen className="h-3 w-3" />
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1">
                    <DatabaseIcon className="h-3 w-3" />
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1">
                    <FileText className="h-3 w-3" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm">
                    <Settings className="mr-2 h-3 w-3" />
                    Settings
                  </Button>
                  <Button variant="outline" size="sm" className="text-destructive">
                    <Trash2 className="mr-2 h-3 w-3" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredSites.length === 0 && (
        <Card className="p-12 text-center">
          <Globe className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No sites found</h3>
          <p className="text-muted-foreground">
            {searchQuery
              ? "Try adjusting your search"
              : "Get started by creating your first site"}
          </p>
          {!searchQuery && (
            <Button className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Create Site
            </Button>
          )}
        </Card>
      )}
    </div>
  );
}
