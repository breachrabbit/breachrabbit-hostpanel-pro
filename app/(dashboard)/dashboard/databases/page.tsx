"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  Database as DatabaseIcon,
  MoreVertical,
  ExternalLink,
  Trash2,
  Key,
  HardDrive,
} from "lucide-react";
import { formatBytes } from "@/lib/utils";

// Mock data
const mockDatabases = [
  {
    id: "1",
    name: "blog_wp",
    type: "MARIADB",
    sizeBytes: BigInt(245000000),
    users: [
      { username: "blog_user", host: "localhost" },
    ],
    linkedSite: "blog.example.com",
    createdAt: new Date("2025-01-10"),
  },
  {
    id: "2",
    name: "shop_wp",
    type: "MARIADB",
    sizeBytes: BigInt(512000000),
    users: [
      { username: "shop_user", host: "localhost" },
    ],
    linkedSite: "shop.example.com",
    createdAt: new Date("2025-01-15"),
  },
  {
    id: "3",
    name: "analytics_db",
    type: "POSTGRESQL",
    sizeBytes: BigInt(1200000000),
    users: [
      { username: "analytics_user", host: "localhost" },
      { username: "readonly_user", host: "localhost" },
    ],
    linkedSite: null,
    createdAt: new Date("2025-02-01"),
  },
];

function getDBTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    MARIADB: "MariaDB",
    POSTGRESQL: "PostgreSQL",
    MONGODB: "MongoDB",
  };
  return labels[type] || type;
}

export default function DatabasesPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredDatabases = mockDatabases.filter((db) =>
    db.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalSize = mockDatabases.reduce(
    (acc, db) => acc + Number(db.sizeBytes),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Databases</h1>
          <p className="text-muted-foreground">
            Manage MySQL/MariaDB and PostgreSQL databases
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Database
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Databases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{mockDatabases.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Size
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatBytes(totalSize)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Database Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {mockDatabases.reduce((acc, db) => acc + db.users.length, 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search databases..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Databases List */}
      <div className="space-y-4">
        {filteredDatabases.map((db) => (
          <Card key={db.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <DatabaseIcon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{db.name}</CardTitle>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant="outline">
                        {getDBTypeLabel(db.type)}
                      </Badge>
                      {db.linkedSite && (
                        <Badge variant="secondary" className="text-xs">
                          {db.linkedSite}
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

            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Size */}
                <div className="flex items-center gap-3 rounded-lg bg-secondary/50 p-3">
                  <HardDrive className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Size</p>
                    <p className="font-semibold">{formatBytes(db.sizeBytes)}</p>
                  </div>
                </div>

                {/* Users */}
                <div className="flex items-center gap-3 rounded-lg bg-secondary/50 p-3">
                  <Key className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Users</p>
                    <p className="font-semibold">{db.users.length}</p>
                  </div>
                </div>

                {/* Created */}
                <div className="flex items-center gap-3 rounded-lg bg-secondary/50 p-3">
                  <DatabaseIcon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="font-semibold">
                      {db.createdAt.toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <ExternalLink className="mr-2 h-3 w-3" />
                    Adminer
                  </Button>
                  <Button variant="outline" size="sm">
                    <Key className="h-3 w-3" />
                  </Button>
                  <Button variant="outline" size="sm" className="text-destructive">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Users List */}
              {db.users.length > 0 && (
                <div className="mt-4 space-y-2 rounded-lg border p-3">
                  <p className="text-sm font-medium">Database Users</p>
                  <div className="space-y-1">
                    {db.users.map((user, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="font-mono text-muted-foreground">
                          {user.username}@{user.host}
                        </span>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm">
                            Change Password
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive">
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    <Plus className="mr-2 h-3 w-3" />
                    Add User
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredDatabases.length === 0 && (
        <Card className="p-12 text-center">
          <DatabaseIcon className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No databases found</h3>
          <p className="text-muted-foreground">
            {searchQuery
              ? "Try adjusting your search"
              : "Get started by creating your first database"}
          </p>
          {!searchQuery && (
            <Button className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Create Database
            </Button>
          )}
        </Card>
      )}
    </div>
  );
}
