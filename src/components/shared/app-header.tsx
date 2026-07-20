"use client";

import { LogOut, ShieldCheck, MapPin, MapPinned } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { SessionUser } from "@/lib/types";

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN_REGIONAL: "Admin Regional",
  ADMIN_LOKAL: "Admin Lokal",
};

const ROLE_ICONS: Record<string, React.ReactNode> = {
  SUPER_ADMIN: <ShieldCheck className="h-3.5 w-3.5" />,
  ADMIN_REGIONAL: <MapPin className="h-3.5 w-3.5" />,
  ADMIN_LOKAL: <MapPinned className="h-3.5 w-3.5" />,
};

export function AppHeader({
  user,
  onLogout,
}: {
  user: SessionUser;
  onLogout: () => void;
}) {
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold tracking-tight sm:text-base">
              Sistema Finansa
            </h1>
            <p className="hidden text-xs text-muted-foreground sm:block">
              Manejamentu Finansa Rejional — Timor-Leste
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium leading-tight">{user.name}</p>
            <div className="flex items-center justify-end gap-1.5">
              <Badge variant="secondary" className="gap-1 text-xs">
                {ROLE_ICONS[user.role]}
                {ROLE_LABELS[user.role]}
              </Badge>
            </div>
          </div>
          <Avatar className="h-9 w-9 border">
            <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <Button
            variant="ghost"
            size="icon"
            onClick={onLogout}
            title="Sai (Logout)"
            className="h-9 w-9"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
