"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  Download,
  Loader2,
  DollarSign,
  FileText,
  MapPin,
  TrendingUp,
  FileSpreadsheet,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { apiFetch, formatCurrency, formatNumber, formatDate } from "@/lib/api";
import type { FinancialReportRow, RegionalSummary } from "@/lib/types";
import { toast } from "sonner";

type RegionalData = {
  region: { id: number; name: string; code: string };
  summary: RegionalSummary;
};

const chartConfig = {
  persembahan: { label: "Persembahan", color: "oklch(0.646 0.222 41.116)" },
  perpuluhan: { label: "Perpuluhan", color: "oklch(0.6 0.118 184.704)" },
  kontribusi: { label: "Kontribusi", color: "oklch(0.769 0.188 70.08)" },
  total: { label: "Total", color: "oklch(0.646 0.222 41.116)" },
} satisfies ChartConfig;

export function RegionalDashboard() {
  const [data, setData] = useState<RegionalData | null>(null);
  const [reports, setReports] = useState<FinancialReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    Promise.all([
      apiFetch<RegionalData>("/api/financial/regional-summary"),
      apiFetch<{ reports: FinancialReportRow[] }>("/api/financial/reports?limit=200"),
    ])
      .then(([d, r]) => {
        setData(d);
        setReports(r.reports);
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Monu karga"))
      .finally(() => setLoading(false));
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/export/excel", { cache: "no-store" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Monu ekspor");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Laporan_Keuangan_${data?.region.name?.replace(/\s+/g, "_") ?? "Regional"}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Ekspor Excel ho suksessu!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Monu ekspor Excel");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!data) {
    return <p className="text-sm text-muted-foreground">Monu karga dadus.</p>;
  }

  const { region, summary } = data;

  const statCards = [
    { label: "Total Persembahan", value: summary.totalPersembahan, icon: DollarSign, color: "text-emerald-600 bg-emerald-50" },
    { label: "Total Perpuluhan", value: summary.totalPerpuluhan, icon: DollarSign, color: "text-cyan-600 bg-cyan-50" },
    { label: "Total Kontribusi", value: summary.totalKontribusi, icon: DollarSign, color: "text-amber-600 bg-amber-50" },
    { label: "Grand Total", value: summary.grandTotal, icon: TrendingUp, color: "text-emerald-600 bg-emerald-50" },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono">{region.code}</Badge>
            <h2 className="text-2xl font-bold tracking-tight">{region.name}</h2>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Rekapitulasaun pemasukan husi Admin Lokal hotu iha rejiaun ne&apos;e.
          </p>
        </div>
        <Button
          onClick={handleExport}
          disabled={exporting}
          className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
        >
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
          Ekspor ba Excel
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statCards.map((c) => (
          <Card key={c.label} className="border-border/60">
            <CardContent className="p-4">
              <div className={`mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg ${c.color}`}>
                <c.icon className="h-5 w-5" />
              </div>
              <p className="text-xl font-bold tracking-tight sm:text-2xl">
                {formatCurrency(c.value)}
              </p>
              <p className="text-xs text-muted-foreground">{c.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary bar */}
      <Card className="border-border/60">
        <CardContent className="flex flex-wrap items-center justify-around gap-4 p-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-600" />
            <div>
              <p className="text-lg font-bold">{formatNumber(summary.reportCount)}</p>
              <p className="text-xs text-muted-foreground">Total Laporan</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-amber-600" />
            <div>
              <p className="text-lg font-bold">{formatNumber(summary.sukuCount)}</p>
              <p className="text-xs text-muted-foreground">Total Suku</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-cyan-600" />
            <div>
              <p className="text-lg font-bold">{formatCurrency(summary.grandTotal / Math.max(summary.reportCount, 1))}</p>
              <p className="text-xs text-muted-foreground">Rata-rata per Laporan</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Monthly trend */}
        <Card className="border-border/60 lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Tendénsia Pemasukan Mensal</CardTitle>
            <CardDescription>12 uluk sira tuir kategoria</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="aspect-[16/9] w-full">
              <LineChart data={summary.monthlyData} margin={{ left: 4, right: 12, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(v) => formatNumber(v)}
                  width={50}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Line dataKey="persembahan" stroke="var(--color-persembahan)" strokeWidth={2} dot={false} />
                <Line dataKey="perpuluhan" stroke="var(--color-perpuluhan)" strokeWidth={2} dot={false} />
                <Line dataKey="kontribusi" stroke="var(--color-kontribusi)" strokeWidth={2} dot={false} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Category pie */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Kategoria Pemasukan</CardTitle>
            <CardDescription>Kompozisaun total</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="aspect-square w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                <Pie
                  data={summary.categoryBreakdown}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {summary.categoryBreakdown.map((entry) => {
                    const color =
                      entry.name === "Persembahan"
                        ? "var(--color-persembahan)"
                        : entry.name === "Perpuluhan"
                        ? "var(--color-perpuluhan)"
                        : "var(--color-kontribusi)";
                    return <Cell key={entry.name} fill={color} />;
                  })}
                </Pie>
                <ChartLegend content={<ChartLegendContent nameKey="name" />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Suku breakdown + Recent reports */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Suku breakdown */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Breakdown tuir Suku</CardTitle>
            <CardDescription>Suku ho pemasukan ki&apos;ik liu</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-card">
                  <TableRow>
                    <TableHead className="text-xs">Suku</TableHead>
                    <TableHead className="text-right text-xs">Laporan</TableHead>
                    <TableHead className="text-right text-xs">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.sukuBreakdown.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="py-6 text-center text-sm text-muted-foreground">
                        Sei la iha dadus.
                      </TableCell>
                    </TableRow>
                  ) : (
                    summary.sukuBreakdown.map((s) => (
                      <TableRow key={s.sukuName}>
                        <TableCell>
                          <p className="font-medium">{s.sukuName}</p>
                          <p className="text-xs text-muted-foreground">{s.municipalityName}</p>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{s.reportCount}</TableCell>
                        <TableCell className="text-right font-semibold tabular-nums text-emerald-600">
                          {formatCurrency(s.total)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Recent reports */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Laporan Recenti</CardTitle>
            <CardDescription>{reports.length} laporan sira uluk</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-card">
                  <TableRow>
                    <TableHead className="text-xs">Data</TableHead>
                    <TableHead className="text-xs">Suku</TableHead>
                    <TableHead className="text-right text-xs">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="py-6 text-center text-sm text-muted-foreground">
                        Sei la iha laporan.
                      </TableCell>
                    </TableRow>
                  ) : (
                    reports.slice(0, 50).map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="text-xs">{formatDate(r.date)}</TableCell>
                        <TableCell>
                          <p className="text-sm font-medium">{r.sukuName}</p>
                          <p className="text-xs text-muted-foreground">{r.municipalityName}</p>
                        </TableCell>
                        <TableCell className="text-right font-semibold tabular-nums text-emerald-600">
                          {formatCurrency(r.total)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
