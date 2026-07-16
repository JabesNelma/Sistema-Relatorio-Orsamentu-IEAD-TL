"use client";

import { useEffect, useState, useCallback } from "react";
import {
  UserPlus,
  Loader2,
  Trash2,
  Power,
  MapPin,
  Users as UsersIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import type { AdminUser, Role } from "@/lib/types";

type RegionTree = {
  id: number;
  name: string;
  code: string;
  description: string | null;
  municipalities: {
    id: number;
    name: string;
    regionId: number;
    sukus: { id: number; name: string; municipalityId: number; regionId: number }[];
  }[];
};

export function UsersManagement({ onChange }: { onChange?: () => void }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [regions, setRegions] = useState<RegionTree[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // form state
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("ADMIN_LOKAL");
  const [regionId, setRegionId] = useState<string>("");
  const [municipalityId, setMunicipalityId] = useState<string>("");
  const [sukuId, setSukuId] = useState<string>("");

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<{ users: AdminUser[] }>("/api/admin/users");
      setUsers(data.users);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Monu karga utilizadór");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRegions = useCallback(async () => {
    try {
      const data = await apiFetch<{ regions: RegionTree[] }>("/api/admin/regions");
      setRegions(data.regions);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Monu karga rejiaun");
    }
  }, []);

  useEffect(() => {
    loadUsers();
    loadRegions();
  }, [loadUsers, loadRegions]);

  // Reset downstream selects when parent changes.
  useEffect(() => {
    setMunicipalityId("");
    setSukuId("");
  }, [regionId]);
  useEffect(() => {
    setSukuId("");
  }, [municipalityId]);

  const selectedRegion = regions.find((r) => String(r.id) === regionId);
  const selectedMunicipality = selectedRegion?.municipalities.find(
    (m) => String(m.id) === municipalityId
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Tama naran uluk");
      return;
    }
    if (!regionId) {
      toast.error("Hili rejiaun uluk");
      return;
    }
    if (role === "ADMIN_LOKAL" && !sukuId) {
      toast.error("Hili suku ba Admin Lokal");
      return;
    }

    setSubmitting(true);
    try {
      await apiFetch("/api/admin/users", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          role,
          regionId: Number(regionId),
          sukuId: sukuId ? Number(sukuId) : undefined,
        }),
      });
      toast.success(`Utilizadór ${name} kria ho suksessu (QR token mos nakria!)`);
      setName("");
      setRole("ADMIN_LOKAL");
      setRegionId("");
      setMunicipalityId("");
      setSukuId("");
      await loadUsers();
      onChange?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Monu kria utilizadór");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (user: AdminUser) => {
    try {
      await apiFetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({ active: !user.active }),
      });
      toast.success(user.active ? "Utilizadór nonaktifu" : "Utilizadór aktifu");
      await loadUsers();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Monu atualiza");
    }
  };

  const handleDelete = async (user: AdminUser) => {
    try {
      await apiFetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
      toast.success(`Utilizadór ${user.name} hafoin deleta`);
      await loadUsers();
      onChange?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Monu deleta");
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Create form */}
      <Card className="border-border/60 lg:col-span-1">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <UserPlus className="h-4 w-4 text-emerald-600" />
            Kria Utilizadór Foun
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Naran Lolon</Label>
              <Input
                id="name"
                placeholder="ex: João Amaral"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN_REGIONAL">Admin Regional</SelectItem>
                  <SelectItem value="ADMIN_LOKAL">Admin Lokal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Rejiaun</Label>
              <Select value={regionId} onValueChange={setRegionId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Hili rejiaun..." />
                </SelectTrigger>
                <SelectContent>
                  {regions.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      {r.name} ({r.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {role === "ADMIN_LOKAL" && selectedRegion && (
              <>
                <div className="space-y-2">
                  <Label>Munisipalidade</Label>
                  <Select value={municipalityId} onValueChange={setMunicipalityId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Hili munisipalidade..." />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedRegion.municipalities.map((m) => (
                        <SelectItem key={m.id} value={String(m.id)}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedMunicipality && (
                  <div className="space-y-2">
                    <Label>Suku</Label>
                    <Select value={sukuId} onValueChange={setSukuId}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Hili suku..." />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedMunicipality.sukus.map((s) => (
                          <SelectItem key={s.id} value={String(s.id)}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            )}

            <Button
              type="submit"
              disabled={submitting}
              className="w-full gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              Kria &amp; Nakria QR Token
            </Button>

            <p className="text-xs text-muted-foreground">
              QR token autómatiku nakria bainaka utilizadór foun, bele hare iha tab QR Code.
            </p>
          </form>
        </CardContent>
      </Card>

      {/* User list */}
      <Card className="border-border/60 lg:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <UsersIcon className="h-4 w-4 text-emerald-600" />
            Lista Utilizadór ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-40 items-center justify-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Sei la iha utilizadór. Kria uluk iha form sokus lado.
            </p>
          ) : (
            <div className="max-h-[32rem] space-y-2 overflow-y-auto pr-1">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="flex flex-col gap-3 rounded-lg border border-border/50 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{u.name}</p>
                      <Badge
                        variant={u.role === "ADMIN_REGIONAL" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {u.role === "ADMIN_REGIONAL" ? "Regional" : "Lokal"}
                      </Badge>
                      {!u.active && (
                        <Badge variant="destructive" className="text-xs">Nonaktif</Badge>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {u.regionName ?? "—"}
                      </span>
                      {u.sukuName && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {u.sukuName}
                        </span>
                      )}
                      <span>QR: {u.qrTokens.length}</span>
                      <span>Kria: {formatDate(u.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <Switch
                        checked={u.active}
                        onCheckedChange={() => handleToggleActive(u)}
                        aria-label="Toggle active"
                      />
                      <Power className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Hakarak deleta utilizadór?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Utilizadór <strong>{u.name}</strong> no QR token hotu-hotu sei deleta. 
                            Aksaun ne&apos;e la bele halimak.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Kansela</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(u)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Deleta
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
