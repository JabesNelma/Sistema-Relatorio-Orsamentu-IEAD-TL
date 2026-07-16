"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  Plus,
  Loader2,
  Trash2,
  DollarSign,
  TrendingUp,
  FileText,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { apiFetch, formatCurrency, formatNumber, formatDate } from "@/lib/api";
import type { FinancialReportRow } from "@/lib/types";
import { toast } from "sonner";

type LokalData = {
  suku: { id: number; name: string };
  summary: {
    totalPersembahan: number;
    totalPerpuluhan: number;
    totalKontribusi: number;
    grandTotal: number;
    reportCount: number;
  };
  dailyData: { date: string; persembahan: number; perpuluhan: number; kontribusi: number; total: number }[];
  monthlyData: { month: string; persembahan: number; perpuluhan: number; kontribusi: number; total: number }[];
  categoryBreakdown: { name: string; value: number }[];
};

const chartConfig = {
  persembahan: { label: "Persembahan", color: "oklch(0.646 0.222 41.116)" },
  perpuluhan: { label: "Perpuluhan", color: "oklch(0.6 0.118 184.704)" },
  kontribusi: { label: "Kontribusi", color: "oklch(0.769 0.188 70.08)" },
} satisfies ChartConfig;

export function LokalDashboard() {
  const [data, setData] = useState<LokalData | null>(null);
  const [reports, setReports] = useState<FinancialReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // form
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [persembahan, setPersembahan] = useState("");
  const [perpuluhan, setPerpuluhan] = useState("");
  const [kontribusi, setKontribusi] = useState("");
  const [catatan, setCatatan] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [d, r] = await Promise.all([
        apiFetch<LokalData>("/api/financial/lokal-summary"),
        apiFetch<{ reports: FinancialReportRow[] }>("/api/financial/reports?limit=200"),
      ]);
      setData(d);
      setReports(r.reports);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Monu karga dadus");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = Number(persembahan) || 0;
    const pl = Number(perpuluhan) || 0;
    const k = Number(kontribusi) || 0;
    if (p === 0 && pl === 0 && k === 0) {
      toast.error("Tama valor ida pelo menos");
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch("/api/financial/reports", {
        method: "POST",
        body: JSON.stringify({
          date,
          persembahan: p,
          perpuluhan: pl,
          kontribusi: k,
          catatan: catatan.trim() || undefined,
        }),
      });
      toast.success("Laporan finansa gravado ho suksessu!");
      setPersembahan("");
      setPerpuluhan("");
      setKontribusi("");
      setCatatan("");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Monu gravar laporan");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiFetch(`/api/financial/reports/${id}`, { method: "DELETE" });
      toast.success("Laporan hafoin deleta");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Monu deleta");
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

  const { summary } = data;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {data.suku.name}
          </Badge>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard Admin Lokal</h2>
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Input pemasukan finansa harian ba suku {data.suku.name}.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Total Persembahan", value: summary.totalPersembahan, color: "text-emerald-600 bg-emerald-50" },
          { label: "Total Perpuluhan", value: summary.totalPerpuluhan, color: "text-cyan-600 bg-cyan-50" },
          { label: "Total Kontribusi", value: summary.totalKontribusi, color: "text-amber-600 bg-amber-50" },
          { label: "Grand Total", value: summary.grandTotal, color: "text-emerald-600 bg-emerald-50" },
        ].map((c) => (
          <Card key={c.label} className="border-border/60">
            <CardContent className="p-4">
              <div className={`mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg ${c.color}`}>
                <DollarSign className="h-5 w-5" />
              </div>
              <p className="text-xl font-bold tracking-tight sm:text-2xl">
                {formatCurrency(c.value)}
              </p>
              <p className="text-xs text-muted-foreground">{c.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Input form + Category pie */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Input form */}
        <Card className="border-border/60 lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Plus className="h-4 w-4 text-emerald-600" />
              Input Pemasukan Harian
            </CardTitle>
            <CardDescription>
              Tama detal pemasukan ba data sira hili. Valor iha USD.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="date">Data</Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    max={today}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="catatan">Catatan (opsional)</Label>
                  <Input
                    id="catatan"
                    placeholder="ex: Misa Domingo"
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    maxLength={200}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="persembahan">Persembahan (USD)</Label>
                  <Input
                    id="persembahan"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    placeholder="0"
                    value={persembahan}
                    onChange={(e) => setPersembahan(e.target.value)}
                    className="text-right"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="perpuluhan">Perpuluhan (USD)</Label>
                  <Input
                    id="perpuluhan"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    placeholder="0"
                    value={perpuluhan}
                    onChange={(e) => setPerpuluhan(e.target.value)}
                    className="text-right"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kontribusi">Kontribusi (USD)</Label>
                  <Input
                    id="kontribusi"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    placeholder="0"
                    value={kontribusi}
                    onChange={(e) => setKontribusi(e.target.value)}
                    className="text-right"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 rounded-lg bg-muted/40 p-3">
                <span className="text-sm font-medium text-muted-foreground">Total:</span>
                <span className="text-lg font-bold text-emerald-600">
                  {formatCurrency(
                    (Number(persembahan) || 0) +
                      (Number(perpuluhan) || 0) +
                      (Number(kontribusi) || 0)
                  )}
                </span>
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Gravar Laporan
              </Button>
            </form>
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
                  data={data.categoryBreakdown}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={45}
                  outerRadius={85}
                  paddingAngle={2}
                >
                  {data.categoryBreakdown.map((entry) => {
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

      {/* Daily trend chart */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
            Grafik Kinerja Penerimaan (30 Hari Uluk)
          </CardTitle>
          <CardDescription>Pemasukan harian tuir kategoria</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="aspect-[16/7] w-full">
            <BarChart data={data.dailyData} margin={{ left: 4, right: 12, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} interval={3} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(v) => formatNumber(v)}
                width={50}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="persembahan" stackId="a" fill="var(--color-persembahan)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="perpuluhan" stackId="a" fill="var(--color-perpuluhan)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="kontribusi" stackId="a" fill="var(--color-kontribusi)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Reports history */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-emerald-600" />
            Histori Laporan ({reports.length})
          </CardTitle>
          <CardDescription>Laporan finansa uluk ne&apos;ebé nakgravar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-card">
                <TableRow>
                  <TableHead className="text-xs">Data</TableHead>
                  <TableHead className="text-right text-xs">Persemb.</TableHead>
                  <TableHead className="text-right text-xs">Perpulu.</TableHead>
                  <TableHead className="text-right text-xs">Kontrib.</TableHead>
                  <TableHead className="text-right text-xs">Total</TableHead>
                  <TableHead className="text-xs">Catatan</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-6 text-center text-sm text-muted-foreground">
                      Sei la iha laporan. Input uluk iha form iha leten.
                    </TableCell>
                  </TableRow>
                ) : (
                  reports.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap text-xs font-medium">
                        {formatDate(r.date)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-xs">{formatNumber(r.persembahan)}</TableCell>
                      <TableCell className="text-right tabular-nums text-xs">{formatNumber(r.perpuluhan)}</TableCell>
                      <TableCell className="text-right tabular-nums text-xs">{formatNumber(r.kontribusi)}</TableCell>
                      <TableCell className="text-right font-semibold tabular-nums text-emerald-600">
                        {formatCurrency(r.total)}
                      </TableCell>
                      <TableCell className="max-w-[120px] truncate text-xs text-muted-foreground">
                        {r.catatan || "—"}
                      </TableCell>
                      <TableCell>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Hakarak deleta laporan?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Laporan data {formatDate(r.date)} sei deleta permanently.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Kansela</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(r.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Deleta
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
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
  );
}
