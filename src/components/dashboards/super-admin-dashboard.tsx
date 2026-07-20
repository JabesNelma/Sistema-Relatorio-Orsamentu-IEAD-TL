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
import {
  Building2,
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

type Region = {
  id: string
  name: string
  description: string | null
  address: string | null
  _count: { admins: number; locals: number }
}

const WILAYAH_OPTIONS = [1, 2, 3, 4]

export function SuperAdminDashboard() {
  const user = useAuthStore((s) => s.user)!
  const [admins, setAdmins] = useState<RegionalAdmin[]>([])
  const [regions, setRegions] = useState<Region[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [toggling, setToggling] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [regenerating, setRegenerating] = useState<string | null>(null)

  // form state (simplified)
  const [name, setName] = useState('')
  const [wilayah, setWilayah] = useState<number | ''>('')
  const [password, setPassword] = useState('')

  // QR dialog state
  const [qrOpen, setQrOpen] = useState(false)
  const [qrToken, setQrToken] = useState<string | null>(null)
  const [qrName, setQrName] = useState('')
  const [qrIsNew, setQrIsNew] = useState(false)
  const [qrPassword, setQrPassword] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [adminsRes, regionsRes] = await Promise.all([
        apiFetch('/api/admins', { cache: 'no-store' }),
        apiFetch('/api/regions', { cache: 'no-store' }),
      ])
      const adminsData = await adminsRes.json()
      const regionsData = await regionsRes.json()
      setAdmins(adminsData.users || [])
      setRegions(regionsData.regions || [])
    } catch {
      toast.error('Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

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
      // Show the freshly generated QR code so the super admin can save/print it.
      setQrToken(data.loginToken)
      setQrName(data.user.name)
      setQrIsNew(true)
      setQrPassword(password)
      setQrOpen(true)
      toast.success('Admin wilayah berhasil dibuat')
      setName(''); setPassword(''); setWilayah('')
      await fetchData()
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setSubmitting(false)
    }
  }

  function openQr(admin: RegionalAdmin) {
    setQrToken(admin.loginToken)
    setQrName(admin.name)
    setQrIsNew(false)
    setQrPassword(null)
    setQrOpen(true)
  }

  async function toggleActive(admin: RegionalAdmin) {
    setToggling(admin.id)
    try {
      const res = await apiFetch(`/api/admins/${admin.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !admin.active }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Gagal mengubah status')
        return
      }
      setAdmins((prev) => prev.map((a) => a.id === admin.id ? { ...a, active: data.user.active } : a))
      toast.success(data.user.active ? 'Admin diaktifkan' : 'Admin dinonaktifkan')
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setToggling(null)
    }
  }

  async function toggleToken(admin: RegionalAdmin) {
    setToggling(admin.id)
    try {
      const res = await apiFetch(`/api/admins/${admin.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenActive: !admin.tokenActive }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Gagal mengubah status QR')
        return
      }
      setAdmins((prev) => prev.map((a) => a.id === admin.id ? { ...a, tokenActive: data.user.tokenActive } : a))
      toast.success(data.user.tokenActive ? 'QR login diaktifkan' : 'QR login dimatikan — link lama tidak bisa dipakai')
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setToggling(null)
    }
  }

  async function regenerateToken(admin: RegionalAdmin) {
    if (!confirm('Buat ulang link QR? Link lama akan langsung tidak berlaku.')) return
    setRegenerating(admin.id)
    try {
      const res = await apiFetch(`/api/admins/${admin.id}/token`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Gagal membuat ulang QR')
        return
      }
      setAdmins((prev) => prev.map((a) => a.id === admin.id ? { ...a, loginToken: data.loginToken, tokenActive: true } : a))
      // Show the new QR immediately.
      setQrToken(data.loginToken)
      setQrName(data.user.name)
      setQrIsNew(true)
      setQrPassword(null)
      setQrOpen(true)
      toast.success('Link QR baru dibuat')
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setRegenerating(null)
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
      toast.success('Admin dihapus')
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setDeleting(null)
    }
  }

  const totalLocals = regions.reduce((sum, r) => sum + r._count.locals, 0)

  return (
    <DashboardShell>
      <div className="mb-6">
        <h1 className="font-serif text-2xl sm:text-3xl text-foreground">
          Panel <span className="text-gradient-gold">Super Admin</span>
        </h1>
        <p className="text-sm text-foreground/60 mt-1">
          Buat admin wilayah. Setiap admin mendapat QR code rahasia untuk login.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard label="Total Wilayah" value={String(regions.length)} icon={MapPin} tone="emerald" sublabel="Region terdaftar" />
        <StatCard label="Admin Wilayah" value={String(admins.length)} icon={UserCog} tone="gold" sublabel="Admin regional" />
        <StatCard label="Gereja Lokal" value={String(totalLocals)} icon={Building2} tone="neutral" sublabel="Total cabang lokal" />
        <StatCard label="Admin Aktif" value={String(admins.filter((a) => a.active).length)} icon={ShieldCheck} tone="emerald" sublabel="Status aktif" />
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Create form (simplified) */}
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

        {/* Admin list */}
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
                  <div key={a.id} className="group p-4 rounded-xl border border-border/70 bg-card hover:border-gold/30 hover:shadow-elegant transition-all">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'w-11 h-11 rounded-full flex items-center justify-center shrink-0 font-serif text-base font-semibold',
                        a.active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                      )}>
                        {a.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-foreground truncate">{a.name}</span>
                          <Badge variant={a.active ? 'default' : 'secondary'} className={cn('text-[10px] h-5', a.active ? 'bg-primary/10 text-primary border-primary/20' : '')}>
                            {a.active ? 'Aktif' : 'Nonaktif'}
                          </Badge>
                          <Badge variant={a.tokenActive ? 'outline' : 'secondary'} className={cn('text-[10px] h-5', a.tokenActive ? 'bg-gold/10 text-gold border-gold/20' : 'bg-destructive/10 text-destructive border-destructive/20')}>
                            {a.tokenActive ? 'QR Aktif' : 'QR Mati'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-foreground/50">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {a.region?.name || '—'}
                          </span>
                          {a.loginToken && (
                            <span className="flex items-center gap-1 truncate" title={a.loginToken}>
                              <Copy className="w-3 h-3" /> {a.loginToken.slice(0, 10)}…
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action row */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-border/60">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openQr(a)}
                        className="h-8 text-xs border-gold/30 text-gold hover:bg-gold/10 hover:text-gold"
                      >
                        <QrCode className="w-3.5 h-3.5 mr-1.5" /> Hare Qr kode
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => regenerateToken(a)}
                        disabled={regenerating === a.id}
                        className="h-8 text-xs"
                      >
                        {regenerating === a.id ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <RefreshCw className="w-3.5 h-3.5 mr-1.5" />}
                        Buat Ulang Link
                      </Button>
                      <div className="ml-auto flex items-center gap-1">
                        <button
                          onClick={() => toggleToken(a)}
                          disabled={toggling === a.id}
                          title={a.tokenActive ? 'Matikan QR (cabut akses)' : 'Aktifkan QR'}
                          className={cn(
                            'h-8 px-2.5 rounded-md flex items-center gap-1 text-xs transition-colors',
                            a.tokenActive
                              ? 'text-foreground/60 hover:text-destructive hover:bg-destructive/10'
                              : 'text-foreground/60 hover:text-gold hover:bg-gold/10'
                          )}
                        >
                          {toggling === a.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : a.tokenActive ? <ShieldOff className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                          {a.tokenActive ? 'Matikan QR' : 'Nyalakan QR'}
                        </button>
                        <button
                          onClick={() => toggleActive(a)}
                          disabled={toggling === a.id}
                          title={a.active ? 'Nonaktifkan akun' : 'Aktifkan akun'}
                          className="w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                        >
                          {a.active ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleDelete(a.id)}
                          disabled={deleting === a.id}
                          title="Hapus"
                          className="w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          {deleting === a.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      <QrCodeDialog
        open={qrOpen}
        onOpenChange={setQrOpen}
        token={qrToken}
        name={qrName}
        roleLabel={ROLE_LABELS.REGIONAL_ADMIN}
        scopeLabel={admins.find((a) => a.name === qrName)?.region?.name ?? null}
        password={qrPassword}
        isNew={qrIsNew}
      />
    </DashboardShell>
  )
}
