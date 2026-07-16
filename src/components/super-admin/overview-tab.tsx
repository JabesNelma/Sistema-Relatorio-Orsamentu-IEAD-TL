"use client";

import { useEffect, useState } from "react";
import {
  Users,
  MapPin,
  FileText,
  DollarSign,
  QrCode,
  ShieldCheck,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiFetch, formatCurrency, formatDate, formatNumber } from "@/lib/api";
import type { RegionInfo } from "@/lib/types";

type DashboardData = {
  stats: {
    totalRegional: number;
    totalLokal: number;
    totalSukus: number;
    totalRegions: number;
    totalReports: number;
    totalQrTokens: number;
    activeQrTokens: number;
    grandTotalPersembahan: number;
    grandTotalPerpuluhan: number;
    grandTotalKontribusi: number;
    grandTotal: number;
  };
  regions: (RegionInfo & {
    sukuCount: number;
    adminCount: number;
    reportCount: number;
  })[];
  recentReports: {
    id: number;
    date: string;
    sukuName: string;
    municipalityName: string;
    total: number;
    createdByName: string;
    createdAt: string;
  }[];
};

export function SuperAdminOverview() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<DashboardData>("/api/dashboard")
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <p className="text-sm text-muted-foreground">
        Monu karga estatistika. Tenta fali.
      </p>
    );
  }

  const { stats } = data;

  const statCards = [
    {
      label: "Admin Regional",
      value: stats.totalRegional,
      icon: MapPin,
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      label: "Admin Lokal",
      value: stats.totalLokal,
      icon: Users,
      color: "text-amber-600 bg-amber-50",
    },
    {
      label: "Total Suku",
      value: stats.totalSukus,
      icon: MapPin,
      color: "text-rose-600 bg-rose-50",
    },
    {
      label: "Total Laporan",
      value: stats.totalReports,
      icon: FileText,
      color: "text-violet-600 bg-violet-50",
    },
    {
      label: "QR Token Aktif",
      value: `${stats.activeQrTokens}/${stats.totalQrTokens}`,
      icon: QrCode,
      color: "text-cyan-600 bg-cyan-50",
    },
    {
      label: "Total Pemasukan",
      value: formatCurrency(stats.grandTotal),
      icon: DollarSign,
      color: "text-emerald-600 bg-emerald-50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {statCards.map((card) => (
          <Card key={card.label} className="border-border/60">
            <CardContent className="p-4">
              <div className={`mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg ${card.color}`}>
                <card.icon className="h-5 w-5" />
              </div>
              <p className="text-2xl font-bold tracking-tight">{card.value}</p>
              <p className="text-xs text-muted-foreground">{card.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Category breakdown */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
            Pemasukan tuir Kategoria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { label: "Persembahan", value: stats.grandTotalPersembahan, color: "bg-emerald-500" },
              { label: "Perpuluhan", value: stats.grandTotalPerpuluhan, color: "bg-amber-500" },
              { label: "Kontribusi", value: stats.grandTotalKontribusi, color: "bg-rose-500" },
            ].map((cat) => {
              const pct = stats.grandTotal > 0 ? (cat.value / stats.grandTotal) * 100 : 0;
              return (
                <div key={cat.label} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{cat.label}</span>
                    <span className="text-sm font-bold">{formatCurrency(cat.value)}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div className={`h-full rounded-full ${cat.color}`} style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground">{pct.toFixed(1)}% husi total</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Region cards + Recent activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Regions */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4 text-emerald-600" />
              Estatistika tuir Rejiaun
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.regions.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 p-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs">{r.code}</Badge>
                    <p className="truncate font-medium">{r.name}</p>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatNumber(r.sukuCount)} suku • {r.adminCount} admin • {formatNumber(r.reportCount)} laporan
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Atividade Recenti
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
              {data.recentReports.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Sei la iha atividade recenti.
                </p>
              ) : (
                data.recentReports.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border/40 p-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {r.sukuName}{" "}
                        <span className="font-normal text-muted-foreground">
                          ({r.municipalityName})
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(r.date)} • husi {r.createdByName}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-bold text-emerald-600">
                      {formatCurrency(r.total)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
