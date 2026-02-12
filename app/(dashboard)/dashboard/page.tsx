"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Server, Globe, Database, HardDrive, Cpu, Activity } from "lucide-react";
import { formatBytes } from "@/lib/utils";

export default function DashboardPage() {
  // This would come from API
  const stats = {
    sites: { active: 5, total: 7 },
    databases: { count: 8, totalSize: 2.4 * 1024 * 1024 * 1024 },
    cpu: { usage: 45, cores: 4 },
    memory: { used: 12.4 * 1024 * 1024 * 1024, total: 16 * 1024 * 1024 * 1024 },
    disk: { used: 85 * 1024 * 1024 * 1024, total: 250 * 1024 * 1024 * 1024 },
    uptime: 432000, // 5 days in seconds
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's an overview of your server.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* CPU Usage */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.cpu.usage}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.cpu.cores} cores available
            </p>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${stats.cpu.usage}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Memory Usage */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatBytes(stats.memory.used)}
            </div>
            <p className="text-xs text-muted-foreground">
              of {formatBytes(stats.memory.total)}
            </p>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-primary transition-all"
                style={{
                  width: `${(Number(stats.memory.used) / Number(stats.memory.total)) * 100}%`,
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Disk Space */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disk Space</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatBytes(stats.disk.used)}
            </div>
            <p className="text-xs text-muted-foreground">
              of {formatBytes(stats.disk.total)}
            </p>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-primary transition-all"
                style={{
                  width: `${(Number(stats.disk.used) / Number(stats.disk.total)) * 100}%`,
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Active Sites */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sites</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sites.active}</div>
            <p className="text-xs text-muted-foreground">
              {stats.sites.active} active, {stats.sites.total - stats.sites.active} stopped
            </p>
          </CardContent>
        </Card>

        {/* Databases */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Databases</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.databases.count}</div>
            <p className="text-xs text-muted-foreground">
              {formatBytes(stats.databases.totalSize)} total
            </p>
          </CardContent>
        </Card>

        {/* Server Uptime */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.floor(stats.uptime / 86400)}d
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.floor((stats.uptime % 86400) / 3600)}h{" "}
              {Math.floor((stats.uptime % 3600) / 60)}m
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sites</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                domain: "blog.example.com",
                type: "WordPress",
                status: "active",
                ssl: 45,
              },
              {
                domain: "shop.example.com",
                type: "WordPress",
                status: "active",
                ssl: 12,
              },
              {
                domain: "api.example.com",
                type: "Docker Proxy",
                status: "active",
                ssl: 89,
              },
            ].map((site) => (
              <div
                key={site.domain}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex items-center gap-4">
                  <div className={`status-dot ${site.status}`} />
                  <div>
                    <p className="font-medium">{site.domain}</p>
                    <p className="text-sm text-muted-foreground">{site.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">SSL: {site.ssl} days</p>
                  <p
                    className={`text-xs ${
                      site.ssl < 14
                        ? "text-error"
                        : site.ssl < 30
                        ? "text-warning"
                        : "text-success"
                    }`}
                  >
                    {site.ssl < 14
                      ? "Expiring soon"
                      : site.ssl < 30
                      ? "Renew soon"
                      : "Valid"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
