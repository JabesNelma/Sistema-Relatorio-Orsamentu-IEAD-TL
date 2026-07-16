"use client";

import { useAuthContext as useAuth } from "@/components/auth/auth-provider";
import { AppHeader } from "@/components/shared/app-header";
import { AppFooter } from "@/components/shared/app-footer";
import { LoginScreen } from "@/components/auth/login-screen";
import { SuperAdminDashboard } from "@/components/super-admin/super-admin-dashboard";
import { RegionalDashboard } from "@/components/regional/regional-dashboard";
import { LokalDashboard } from "@/components/lokal/lokal-dashboard";
import { Loader2, ShieldCheck } from "lucide-react";

export default function Home() {
  const { user, loading, logout } = useAuth();

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-gradient-to-br from-emerald-50 via-background to-amber-50/40">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg">
          <ShieldCheck className="h-7 w-7" />
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Karga sistema...
        </div>
      </div>
    );
  }

  // Not authenticated → login screen (no header/footer)
  if (!user) {
    return <LoginScreen />;
  }

  // Authenticated → role-based dashboard
  return (
    <div className="flex min-h-screen flex-col bg-muted/10">
      <AppHeader user={user} onLogout={logout} />
      <main className="flex-1">
        {user.role === "SUPER_ADMIN" && <SuperAdminDashboard />}
        {user.role === "ADMIN_REGIONAL" && <RegionalDashboard />}
        {user.role === "ADMIN_LOKAL" && <LokalDashboard />}
      </main>
      <AppFooter />
    </div>
  );
}
