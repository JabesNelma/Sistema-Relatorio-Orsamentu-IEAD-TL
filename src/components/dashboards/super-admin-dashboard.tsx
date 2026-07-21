'use client'

import { useEffect, useState, useCallback } from 'react'
import { DashboardShell } from '@/components/shared/dashboard-shell'
import { StatCard } from '@/components/shared/stat-card'
import { QrCodeDialog } from '@/components/shared/qr-code-dialog'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  Loader2,
  MapPin,
  Plus,
  QrCode,
  RefreshCw,
  ShieldCheck,
  ShieldOff,
  Trash2,
  UserCog,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/auth-store'
import { ROLE_LABELS } from '@/lib/format'
import { cn } from '@/lib/utils'
import { apiFetch } from '@/lib/api-fetch'

type RegionalAdmin = {
  id: string
  name: string
  email: string
  phone: string | null
  active: boolean
  loginToken: string | null
  tokenActive: boolean
  tokenCreatedAt: string | null
  region: { id: string; name: string } | null
  createdBy: string | null
}

type LocalAdmin = {
  id: string
  name: string
  email: string
  phone: string | null
  active: boolean
  loginToken: string | null
  tokenActive: boolean
  tokenCreatedAt: string | null
  region: { id: string; name: string } | null
  local: { id: string; name: string } | null
  createdBy: string | null
}

type Region = {
  id: string
  name: string
  description: string | null
  address: string | null
  _count: { admins: number; locals: number }
}

type Local = {
  id: string
  name: string
  address: string | null
  regionId: string
  _count: { admins: number; transactions: number }
}

const WILAYAH_OPTIONS = [1, 2, 3, 4]

type AnyAdmin = RegionalAdmin | LocalAdmin

function isLocalAdmin(a: AnyAdmin): a is LocalAdmin {
  return 'local' in a && a.local !== undefined
}

export function SuperAdminDashboard() {
  const user = useAuthStore((s) => s.user)!
  const [admins, setAdmins] = useState<RegionalAdmin[]>([])
  const [localAdmins, setLocalAdmins] = useState<LocalAdmin[]>([])
  const [regions, setRegions] = useState<Region[]>([])
  const [locals, setLocals] = useState<Local[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [toggling, setToggling] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [regenerating, setRegenerating] = useState<string | null>(null)

  // form state — regional admin
  const [name, setName] = useState('')
  const [wilayah, setWilayah] = useState<number | ''>('')
  const [password, setPassword] = useState('')

  // form state — local admin
  const [laName, setLaName] = useState('')
  const [laPassword, setLaPassword] = useState('')
  const [laRegionId, setLaRegionId] = useState('')
  const [laLocalMode, setLaLocalMode] = useState<'existing' | 'new'>('existing')
  const [laLocalId, setLaLocalId] = useState('')
  const [laLocalName, setLaLocalName] = useState('')
  const [laLocalAddress, setLaLocalAddress] = useState('')

  // QR dialog state
  const [qrOpen, setQrOpen] = useState(false)
  const [qrToken, setQrToken] = useState<string | null>(null)
  const [qrName, setQrName] = useState('')
  const [qrRoleLabel, setQrRoleLabel] = useState(ROLE_LABELS.REGIONAL_ADMIN)
  const [qrScopeLabel, setQrScopeLabel] = useState<string | null>(null)
  const [qrIsNew, setQrIsNew] = useState(false)
  const [qrPassword, setQrPassword] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [adminsRes, localAdminsRes, regionsRes, localsRes] = await Promise.all([
        apiFetch('/api/admins', { cache: 'no-store' }),
        apiFetch('/api/admins?role=LOCAL_ADMIN', { cache: 'no-store' }),
        apiFetch('/api/regions', { cache: 'no-store' }),
        apiFetch('/api/locals', { cache: 'no-store' }),
      ])
      const adminsData = await adminsRes.json()
      const localAdminsData = await localAdminsRes.json()
      const regionsData = await regionsRes.json()
      const localsData = await localsRes.json()
      setAdmins(adminsData.users || [])
      setLocalAdmins(localAdminsData.users || [])
      setRegions(regionsData.regions || [])
      setLocals(localsData.locals || [])
    } catch {
      toast.error('Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Reset local form region-dependent fields when region changes.
  useEffect(() => {
    setLaLocalId('')
  }, [laRegionId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !password) {
      toast.error('Nama lengkap dan password wajib diisi')
      return
    }
    if (wilayah === '' || ![1, 2, 3, 4].includes(Number(wilayah))) {
      toast.error('Pilih wilayah (1-4) terlebih dahulu')
      return
    }
    setSubmitting(true)
    try {
      const res = await apiFetch('/api/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, wilayah: Number(wilayah), password }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Gagal membuat admin')
        return
      }
      setQrToken(data.loginToken)
      setQrName(data.user.name)
      setQrRoleLabel(ROLE_LABELS.REGIONAL_ADMIN)
      setQrScopeLabel(data.user.region?.name ?? null)
      setQrIsNew(true)
      setQrPassword(password)
      setQrOpen(true)
      toast.success('Admin wilayah berhasil dibuat')
      setName(''); setPassword('')
      await fetchData()
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleLocalSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!laName || !laPassword) {
      toast.error('Nama lengkap dan password wajib diisi')
      return
    }
    if (!laRegionId) {
      toast.error('Pilih wilayah terlebih dahulu')
      return
    }
    if (laLocalMode === 'existing' && !laLocalId) {
      toast.error('Pilih gereja lokal terlebih dahulu')
      return
    }
    if (laLocalMode === 'new' && !laLocalName) {
      toast.error('Masukkan nama gereja lokal baru')
      return
    }
    setSubmitting(true)
    try {
      const body: any = { name: laName, password: laPassword, type: 'local', regionId: laRegionId }
      if (laLocalMode === 'existing') {
        body.localId = laLocalId
      } else {
        body.localName = laLocalName
        body.localAddress = laLocalAddress
      }
      const res = await apiFetch('/api/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Gagal membuat admin')
        return
      }
      setQrToken(data.loginToken)
      setQrName(data.user.name)
      setQrRoleLabel(ROLE_LABELS.LOCAL_ADMIN)
      setQrScopeLabel(
        [data.user.region?.name, data.user.local?.name].filter(Boolean).join(' · ') || null
      )
      setQrIsNew(true)
      setQrPassword(laPassword)
      setQrOpen(true)
      toast.success('Admin lokal berhasil dibuat')
      setLaName(''); setLaPassword('')
      setLaLocalName(''); setLaLocalAddress(''); setLaLocalId('')
      setLaLocalMode('existing')
      await fetchData()
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setSubmitting(false)
    }
  }

  function showQr(admin: AnyAdmin) {
    const scope = admin.region?.name
      ? isLocalAdmin(admin) && admin.local?.name
        ? `${admin.region.name} · ${admin.local.name}`
        : admin.region.name
      : null
    setQrToken(admin.loginToken)
    setQrName(admin.name)
    setQrRoleLabel(isLocalAdmin(admin) ? ROLE_LABELS.LOCAL_ADMIN : ROLE_LABELS.REGIONAL_ADMIN)
    setQrScopeLabel(scope)
    setQrIsNew(false)
    setQrPassword(null)
    setQrOpen(true)
  }

  async function toggleToken(admin: AnyAdmin) {
    setToggling(admin.id)
    try {
      const res = await apiFetch(`/api/admins/${admin.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenActive: !admin.tokenActive }),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Gagal mengubah status QR')
        return
      }
      const patch = (a: AnyAdmin): AnyAdmin =>
        a.id === admin.id ? { ...a, tokenActive: !admin.tokenActive } : a
      setAdmins((prev) => prev.map(patch) as RegionalAdmin[])
      setLocalAdmins((prev) => prev.map(patch) as LocalAdmin[])
      toast.success(admin.tokenActive ? 'QR dinonaktifkan' : 'QR diaktifkan')
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setToggling(null)
    }
  }

  async function regenerateToken(admin: AnyAdmin) {
    setRegenerating(admin.id)
    try {
      const res = await apiFetch(`/api/admins/${admin.id}/token`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Gagal membuat ulang link')
        return
      }
      const patch = (a: AnyAdmin): AnyAdmin =>
        a.id === admin.id ? { ...a, loginToken: data.loginToken, tokenActive: true } : a
      setAdmins((prev) => prev.map(patch) as RegionalAdmin[])
      setLocalAdmins((prev) => prev.map(patch) as LocalAdmin[])
      setQrToken(data.loginToken)
      setQrName(admin.name)
      setQrRoleLabel(isLocalAdmin(admin) ? ROLE_LABELS.LOCAL_ADMIN : ROLE_LABELS.REGIONAL_ADMIN)
      setQrScopeLabel(
        admin.region?.name
          ? isLocalAdmin(admin) && admin.local?.name
            ? `${admin.region.name} · ${admin.local.name}`
            : admin.region.name
          : null
      )
      setQrIsNew(true)
      setQrPassword(null)
      setQrOpen(true)
      toast.success('Link login baru dibuat')
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setRegenerating(null)
    }
  }

  async function toggleActive(admin: AnyAdmin) {
    setToggling(admin.id)
    try {
      const res = await apiFetch(`/api/admins/${admin.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !admin.active }),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Gagal mengubah status')
        return
      }
      const patch = (a: AnyAdmin): AnyAdmin =>
        a.id === admin.id ? { ...a, active: !admin.active } : a
      setAdmins((prev) => prev.map(patch) as RegionalAdmin[])
      setLocalAdmins((prev) => prev.map(patch) as LocalAdmin[])
      toast.success(admin.active ? 'Akun dinonaktifkan' : 'Akun diaktifkan')
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setToggling(null)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus admin ini secara permanen?')) return
    setDeleting(id)
    try {
      const res = await apiFetch(`/api/admins/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Gagal menghapus')
        return
      }
      setAdmins((prev) => prev.filter((a) => a.id !== id))
      setLocalAdmins((prev) => prev.filter((a) => a.id !== id))
      toast.success('Admin dihapus')
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setDeleting(null)
    }
  }

  const totalLocals = regions.reduce((sum, r) => sum + r._count.locals, 0)
  const filteredLocals = laRegionId ? locals.filter((l) => l.regionId === laRegionId) : []
  const activeCount = admins.filter((a) => a.active).length + localAdmins.filter((a) => a.active).length

  return (
    <DashboardShell>
      <div className="mb-6">
        <h1 className="font-serif text-2xl sm:text-3xl text-foreground">
          Panel <span className="text-gradient-gold">Super Admin</span>
        </h1>
        <p className="text-sm text-foreground/60 mt-1">
          Buat admin wilayah & admin lokal. Setiap admin mendapat QR code rahasia untuk login.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard label="Total Wilayah" value={String(regions.length)} icon={MapPin} tone="emerald" sublabel="Region terdaftar" />
        <StatCard label="Admin Wilayah" value={String(admins.length)} icon={UserCog} tone="gold" sublabel="Admin regional" />
        <StatCard label="Admin Lokal" value={String(localAdmins.length)} icon={Building2} tone="neutral" sublabel="Admin gereja lokal" />
        <StatCard label="Admin Aktif" value={String(activeCount)} icon={ShieldCheck} tone="emerald" sublabel="Status aktif" />
      </div>

      <Tabs defaultValue="regional" className="w-full">
        <TabsList className="grid grid-cols-2 w-full mb-6 bg-muted/60">
          <TabsTrigger value="regional" className="data-[state=active]:bg-card data-[state=active]:shadow-sm text-xs sm:text-sm">
            <UserCog className="w-4 h-4 mr-1.5" /> Admin Wilayah ({admins.length})
          </TabsTrigger>
          <TabsTrigger value="local" className="data-[state=active]:bg-card data-[state=active]:shadow-sm text-xs sm:text-sm">
            <Building2 className="w-4 h-4 mr-1.5" /> Admin Lokal ({localAdmins.length})
          </TabsTrigger>
        </TabsList>

        {/* ===================== Tab: Admin Wilayah ===================== */}
        <TabsContent value="regional">
          <div className="grid lg:grid-cols-5 gap-6">
            <Card className="lg:col-span-2 p-5 sm:p-6 border-border/70 h-fit">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <UserCog className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h2 className="font-serif text-lg text-foreground">Buat Admin Wilayah</h2>
                  <p className="text-xs text-foreground/55">Cukup nama, wilayah, dan password</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="sa-name" className="text-foreground/80">Nama Lengkap</Label>
                  <Input id="sa-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama admin wilayah" disabled={submitting} />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-foreground/80">Wilayah</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {WILAYAH_OPTIONS.map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setWilayah(n)}
                        disabled={submitting}
                        className={cn(
                          'h-11 rounded-lg border text-sm font-medium transition-all flex flex-col items-center justify-center gap-0.5',
                          wilayah === n
                            ? 'border-gold/60 bg-accent text-foreground shadow-elegant'
                            : 'border-border bg-muted/40 text-foreground/65 hover:bg-accent/50 hover:border-gold/30'
                        )}
                      >
                        <span className="font-serif text-base leading-none">{n}</span>
                        <span className="text-[9px] uppercase tracking-wider opacity-70">Wilayah</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="sa-pass" className="text-foreground/80">Password</Label>
                  <Input
                    id="sa-pass"
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 karakter"
                    disabled={submitting}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Password ini akan dipakai admin saat login via QR code.
                  </p>
                </div>

                <Button type="submit" disabled={submitting} className="w-full h-11 bg-primary text-cream hover:bg-primary/90">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                  Buat Admin Wilayah
                </Button>
              </form>
            </Card>

            <div className="lg:col-span-3">
              <Card className="p-4 sm:p-5 border-border/70">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-serif text-lg text-foreground flex items-center gap-2">
                    <UserCog className="w-4 h-4 text-primary" /> Admin Wilayah ({admins.length})
                  </h2>
                </div>

                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
                  </div>
                ) : admins.length === 0 ? (
                  <div className="text-center py-10">
                    <Users className="w-10 h-10 text-muted-foreground/50 mx-auto mb-2" />
                    <p className="text-sm text-foreground/60">Belum ada admin wilayah</p>
                    <p className="text-xs text-muted-foreground mt-1">Buat admin pertama menggunakan form di samping.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[640px] overflow-y-auto scrollbar-elegant pr-1 -mr-1">
                    {admins.map((a) => (
                      <AdminCard
                        key={a.id}
                        admin={a}
                        scopeLabel={a.region?.name ?? null}
                        busy={toggling === a.id || deleting === a.id || regenerating === a.id}
                        onOpenQr={showQr}
                        onRegenerate={regenerateToken}
                        onToggleToken={toggleToken}
                        onToggleActive={toggleActive}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ===================== Tab: Admin Lokal ===================== */}
        <TabsContent value="local">
          <div className="grid lg:grid-cols-5 gap-6">
            <Card className="lg:col-span-2 p-5 sm:p-6 border-border/70 h-fit">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h2 className="font-serif text-lg text-foreground">Buat Admin Lokal</h2>
                  <p className="text-xs text-foreground/55">Untuk gereja lokal di suatu wilayah</p>
                </div>
              </div>

              <form onSubmit={handleLocalSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="la-name" className="text-foreground/80">Nama Lengkap</Label>
                  <Input id="la-name" value={laName} onChange={(e) => setLaName(e.target.value)} placeholder="Nama admin lokal" disabled={submitting} />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-foreground/80">Wilayah</Label>
                  <Select value={laRegionId} onValueChange={setLaRegionId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih wilayah" />
                    </SelectTrigger>
                    <SelectContent>
                      {regions.map((r) => (
                        <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground/80">Gereja Lokal</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setLaLocalMode('existing')}
                      className={cn(
                        'flex items-center justify-center gap-1.5 p-2.5 rounded-lg border text-sm transition-all',
                        laLocalMode === 'existing' ? 'border-gold/50 bg-accent/60 text-foreground' : 'border-border bg-muted/40 text-foreground/65 hover:bg-accent/40'
                      )}
                    >
                      <CheckCircle2 className="w-4 h-4" /> Pilih
                    </button>
                    <button
                      type="button"
                      onClick={() => setLaLocalMode('new')}
                      className={cn(
                        'flex items-center justify-center gap-1.5 p-2.5 rounded-lg border text-sm transition-all',
                        laLocalMode === 'new' ? 'border-gold/50 bg-accent/60 text-foreground' : 'border-border bg-muted/40 text-foreground/65 hover:bg-accent/40'
                      )}
                    >
                      <Plus className="w-4 h-4" /> Buat Baru
                    </button>
                  </div>
                  {laLocalMode === 'existing' ? (
                    laRegionId ? (
                      <Select value={laLocalId} onValueChange={setLaLocalId}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Pilih gereja lokal" />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredLocals.map((l) => (
                            <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-[11px] text-muted-foreground">Pilih wilayah dulu untuk melihat gereja lokal.</p>
                    )
                  ) : (
                    <div className="space-y-2">
                      <Input value={laLocalName} onChange={(e) => setLaLocalName(e.target.value)} placeholder="Nama gereja lokal baru" disabled={submitting} />
                      <Input value={laLocalAddress} onChange={(e) => setLaLocalAddress(e.target.value)} placeholder="Alamat (opsional)" disabled={submitting} />
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="la-pass" className="text-foreground/80">Password</Label>
                  <Input
                    id="la-pass"
                    type="text"
                    value={laPassword}
                    onChange={(e) => setLaPassword(e.target.value)}
                    placeholder="Min. 6 karakter"
                    disabled={submitting}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Password ini akan dipakai admin saat login via QR code.
                  </p>
                </div>

                <Button type="submit" disabled={submitting} className="w-full h-11 bg-primary text-cream hover:bg-primary/90">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                  Buat Admin Lokal
                </Button>
              </form>
            </Card>

            <div className="lg:col-span-3">
              <Card className="p-4 sm:p-5 border-border/70">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-serif text-lg text-foreground flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-primary" /> Admin Lokal ({localAdmins.length})
                  </h2>
                </div>

                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
                  </div>
                ) : localAdmins.length === 0 ? (
                  <div className="text-center py-10">
                    <Users className="w-10 h-10 text-muted-foreground/50 mx-auto mb-2" />
                    <p className="text-sm text-foreground/60">Belum ada admin lokal</p>
                    <p className="text-xs text-muted-foreground mt-1">Buat admin pertama menggunakan form di samping.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[640px] overflow-y-auto scrollbar-elegant pr-1 -mr-1">
                    {localAdmins.map((a) => (
                      <AdminCard
                        key={a.id}
                        admin={a}
                        scopeLabel={
                          a.region?.name
                            ? a.local?.name
                              ? `${a.region.name} · ${a.local.name}`
                              : a.region.name
                            : null
                        }
                        busy={toggling === a.id || deleting === a.id || regenerating === a.id}
                        onOpenQr={showQr}
                        onRegenerate={regenerateToken}
                        onToggleToken={toggleToken}
                        onToggleActive={toggleActive}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <QrCodeDialog
        open={qrOpen}
        onOpenChange={setQrOpen}
        token={qrToken}
        name={qrName}
        roleLabel={qrRoleLabel}
        scopeLabel={qrScopeLabel}
        password={qrPassword}
        isNew={qrIsNew}
      />
    </DashboardShell>
  )
}

// ---- Shared admin card (used by both regional & local lists) ----

type AdminCardProps = {
  admin: AnyAdmin
  scopeLabel: string | null
  busy: boolean
  onOpenQr: (a: AnyAdmin) => void
  onRegenerate: (a: AnyAdmin) => void
  onToggleToken: (a: AnyAdmin) => void
  onToggleActive: (a: AnyAdmin) => void
  onDelete: (id: string) => void
}

function AdminCard({
  admin,
  scopeLabel,
  busy,
  onOpenQr,
  onRegenerate,
  onToggleToken,
  onToggleActive,
  onDelete,
}: AdminCardProps) {
  return (
    <div className="group p-4 rounded-xl border border-border/70 bg-card hover:border-gold/30 hover:shadow-elegant transition-all">
      <div className="flex items-start gap-3">
        <div className={cn(
          'w-11 h-11 rounded-full flex items-center justify-center shrink-0 font-serif text-base font-semibold',
          admin.active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
        )}>
          {admin.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-foreground truncate">{admin.name}</span>
            <Badge variant={admin.active ? 'default' : 'secondary'} className={cn('text-[10px] h-5', admin.active ? 'bg-primary/10 text-primary border-primary/20' : '')}>
              {admin.active ? 'Aktif' : 'Nonaktif'}
            </Badge>
            <Badge variant={admin.tokenActive ? 'outline' : 'secondary'} className={cn('text-[10px] h-5', admin.tokenActive ? 'bg-gold/10 text-gold border-gold/20' : 'bg-destructive/10 text-destructive border-destructive/20')}>
              {admin.tokenActive ? 'QR Aktif' : 'QR Mati'}
            </Badge>
          </div>
          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-foreground/50">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {scopeLabel || '—'}
            </span>
            {admin.loginToken && (
              <span className="flex items-center gap-1 truncate" title={admin.loginToken}>
                <Copy className="w-3 h-3" /> {admin.loginToken.slice(0, 10)}…
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-border/60">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onOpenQr(admin)}
          className="h-8 text-xs border-gold/30 text-gold hover:bg-gold/10 hover:text-gold"
        >
          <QrCode className="w-3.5 h-3.5 mr-1.5" /> Hare Qr kode
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onRegenerate(admin)}
          disabled={busy}
          className="h-8 text-xs"
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <RefreshCw className="w-3.5 h-3.5 mr-1.5" />}
          Buat Ulang Link
        </Button>
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={() => onToggleToken(admin)}
            disabled={busy}
            title={admin.tokenActive ? 'Matikan QR (cabut akses)' : 'Aktifkan QR'}
            className={cn(
              'h-8 px-2.5 rounded-md flex items-center gap-1 text-xs transition-colors',
              admin.tokenActive
                ? 'text-foreground/60 hover:text-destructive hover:bg-destructive/10'
                : 'text-foreground/60 hover:text-gold hover:bg-gold/10'
            )}
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : admin.tokenActive ? <ShieldOff className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
            {admin.tokenActive ? 'Matikan QR' : 'Nyalakan QR'}
          </button>
          <button
            onClick={() => onToggleActive(admin)}
            disabled={busy}
            title={admin.active ? 'Nonaktifkan akun' : 'Aktifkan akun'}
            className="w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            {admin.active ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
          <button
            onClick={() => onDelete(admin.id)}
            disabled={busy}
            title="Hapus"
            className="w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}
