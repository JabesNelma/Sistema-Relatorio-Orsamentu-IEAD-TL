"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, Users, QrCode } from "lucide-react";
import { SuperAdminOverview } from "./overview-tab";
import { UsersManagement } from "./users-management";
import { QrManagement } from "./qr-management";

export function SuperAdminDashboard() {
  const [tab, setTab] = useState("overview");
  // bump this to force-refresh child tabs after cross-tab actions
  const [refreshKey, setRefreshKey] = useState(0);
  const bump = () => setRefreshKey((k) => k + 1);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">
          Dashboard Super Admin
        </h2>
        <p className="text-sm text-muted-foreground">
          Jeransa total utilizadór, QR login, no estatistika finansa 全 systema.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 sm:w-auto sm:grid-cols-3">
          <TabsTrigger value="overview" className="gap-1.5">
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">Iha Omun</span>
            <span className="sm:hidden">Omun</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Utilizadór</span>
            <span className="sm:hidden">User</span>
          </TabsTrigger>
          <TabsTrigger value="qr" className="gap-1.5">
            <QrCode className="h-4 w-4" />
            <span className="hidden sm:inline">QR Code</span>
            <span className="sm:hidden">QR</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <SuperAdminOverview />
        </TabsContent>
        <TabsContent value="users" className="mt-6">
          <UsersManagement key={`users-${refreshKey}`} onChange={bump} />
        </TabsContent>
        <TabsContent value="qr" className="mt-6">
          <QrManagement key={`qr-${refreshKey}`} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
