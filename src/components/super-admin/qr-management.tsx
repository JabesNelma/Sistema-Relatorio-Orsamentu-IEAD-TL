"use client";

import { useEffect, useState, useCallback } from "react";
import {
  QrCode,
  Loader2,
  Download,
  Copy,
  Power,
  Trash2,
  RefreshCw,
  Plus,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { apiFetch, formatDate } from "@/lib/api";
import { toast } from "sonner";
import type { AdminUser } from "@/lib/types";

type QrTokenWithQr = {
  id: string;
  token: string;
  label: string;
  active: boolean;
  createdAt: string;
  lastUsedAt: string | null;
  profile: {
    id: string;
    name: string;
    role: string;
    regionName: string | null;
    sukuName: string | null;
  };
  qrDataUrl: string;
};

export function QrManagement() {
  const [tokens, setTokens] = useState<QrTokenWithQr[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterUserId, setFilterUserId] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewToken, setPreviewToken] = useState<QrTokenWithQr | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const url = filterUserId !== "all"
        ? `/api/admin/qr-codes?profileId=${filterUserId}`
        : "/api/admin/qr-codes";
      const data = await apiFetch<{ tokens: QrTokenWithQr[] }>(url);
      setTokens(data.tokens);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Monu karga QR");
    } finally {
      setLoading(false);
    }
  }, [filterUserId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    apiFetch<{ users: AdminUser[] }>("/api/admin/users")
      .then((d) => setUsers(d.users))
      .catch(() => {});
  }, []);

  const handleGenerate = async () => {
    if (!selectedUserId) {
      toast.error("Hili utilizadór uluk");
      return;
    }
    try {
      await apiFetch("/api/admin/qr-codes", {
        method: "POST",
        body: JSON.stringify({ profileId: selectedUserId, deactivateOld: true }),
      });
      toast.success("QR token foun nakria ho suksessu! Token sira uluk sei nonaktif.");
      setDialogOpen(false);
      setSelectedUserId("");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Monu nakria QR");
    }
  };

  const handleToggle = async (t: QrTokenWithQr) => {
    try {
      await apiFetch(`/api/admin/qr-codes/${t.id}`, {
        method: "PATCH",
        body: JSON.stringify({ active: !t.active }),
      });
      toast.success(t.active ? "QR token nonaktif" : "QR token aktif");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Monu atualiza");
    }
  };

  const handleDelete = async (t: QrTokenWithQr) => {
    try {
      await apiFetch(`/api/admin/qr-codes/${t.id}`, { method: "DELETE" });
      toast.success("QR token hafoin deleta");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Monu deleta");
    }
  };

  const handleCopy = async (t: QrTokenWithQr) => {
    try {
      await navigator.clipboard.writeText(t.token);
      setCopiedId(t.id);
      toast.success("Token nakopia ba clipboard");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("La bele nakopia token");
    }
  };

  const handleDownload = (t: QrTokenWithQr) => {
    const a = document.createElement("a");
    a.href = t.qrDataUrl;
    a.download = `QR_${t.profile.name.replace(/\s+/g, "_")}.png`;
    a.click();
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Select value={filterUserId} onValueChange={setFilterUserId}>
            <SelectTrigger className="w-full sm:w-[260px]">
              <SelectValue placeholder="Filter utilizadór..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Hotu-hotu Utilizadór</SelectItem>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name} ({u.role === "ADMIN_REGIONAL" ? "Regional" : "Lokal"})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700">
              <Plus className="h-4 w-4" />
              Nakria QR Token Foun
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nakria QR Token Foun</DialogTitle>
              <DialogDescription>
                Hili utilizadór. Token sira uluk ba utilizadór ne&apos;e sei nonaktif 
                automatically (regenerate) ba seguransa.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-2">
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Hili utilizadór..." />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} — {u.role === "ADMIN_REGIONAL" ? "Regional" : "Lokal"} 
                      {u.sukuName ? ` (${u.sukuName})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Kansela</Button>
              <Button onClick={handleGenerate} className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700">
                <RefreshCw className="h-4 w-4" />
                Nakria Token
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* QR grid */}
      {loading ? (
        <div className="flex h-40 items-center justify-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : tokens.length === 0 ? (
        <Card className="border-border/60">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            <QrCode className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
            Sei la iha QR token. Nakria uluk.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tokens.map((t) => (
            <Card
              key={t.id}
              className={`overflow-hidden border-border/60 transition-opacity ${
                !t.active ? "opacity-60" : ""
              }`}
            >
              <CardContent className="p-4">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{t.profile.name}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                      <Badge variant="outline" className="text-xs">
                        {t.profile.role === "ADMIN_REGIONAL" ? "Regional" : "Lokal"}
                      </Badge>
                      <Badge
                        variant={t.active ? "default" : "destructive"}
                        className="gap-1 text-xs"
                      >
                        {t.active ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <XCircle className="h-3 w-3" />
                        )}
                        {t.active ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <img
                    src={t.qrDataUrl}
                    alt={`QR token ba ${t.profile.name}`}
                    className="h-40 w-40 rounded-lg border bg-white p-2"
                  />
                  {t.profile.regionName && (
                    <p className="text-center text-xs text-muted-foreground">
                      {t.profile.regionName}
                      {t.profile.sukuName ? ` • ${t.profile.sukuName}` : ""}
                    </p>
                  )}
                </div>

                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-1.5 rounded-md bg-muted/50 px-2 py-1.5">
                    <code className="flex-1 truncate font-mono text-[11px] text-muted-foreground">
                      {t.token}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleCopy(t)}
                      title="Kopia token"
                    >
                      {copiedId === t.id ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>

                  <p className="text-[11px] text-muted-foreground">
                    Nakria: {formatDate(t.createdAt)}
                    {t.lastUsedAt && ` • Uza dala: ${formatDate(t.lastUsedAt)}`}
                  </p>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1"
                      onClick={() => handleDownload(t)}
                    >
                      <Download className="h-3.5 w-3.5" />
                      PNG
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1"
                      onClick={() => setPreviewToken(t)}
                    >
                      <QrCode className="h-3.5 w-3.5" />
                      Hare
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleToggle(t)}
                      title={t.active ? "Nonaktif" : "Aktif"}
                    >
                      <Power className="h-3.5 w-3.5" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Hakarak deleta QR token?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Token ne&apos;e sei deleta permanently. Utilizadór la bele login 
                            ho token ne&apos;e tan.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Kansela</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(t)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Deleta
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* QR preview dialog */}
      <Dialog open={!!previewToken} onOpenChange={(o) => !o && setPreviewToken(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>QR Login — {previewToken?.profile.name}</DialogTitle>
            <DialogDescription>
              Scan QR code ne&apos;e ka kopia token login ba Admin Regional/Lokal.
            </DialogDescription>
          </DialogHeader>
          {previewToken && (
            <div className="flex flex-col items-center gap-3 py-2">
              <img
                src={previewToken.qrDataUrl}
                alt="QR code"
                className="h-56 w-56 rounded-lg border bg-white p-3"
              />
              <div className="w-full rounded-md bg-muted/50 p-2">
                <p className="break-all font-mono text-xs text-muted-foreground">
                  {previewToken.token}
                </p>
              </div>
              <Button
                className="w-full gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
                onClick={() => handleCopy(previewToken)}
              >
                <Copy className="h-4 w-4" />
                Kopia Token
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
