'use client'

import { useEffect, useState, useCallback } from 'react'
import { DashboardShell } from '@/components/shared/dashboard-shell'
import { StatCard } from '@/components/shared/stat-card'
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
  Loader2,
  MapPin,
  Plus,
  ShieldCheck,
  Trash2,
  UserCog,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/auth-store'
import { formatDateShort } from '@/lib/format'
import { cn } from '@/lib/utils'

type RegionalAdmin = {
  id: string
  name: string
  email: string
  phone: string | null
  active: boolean
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

export function SuperAdminDashboard() {
  const user = useAuthStore((s) => s.user)!
  const [admins, setAdmins] = useState<RegionalAdmin[]>([])
  const [regions, setRegions] = useState<Region[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [toggling, setToggling] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  // form state
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [regionMode, setRegionMode] = useState<'existing' | 'new'>('existing')
  const [regionId, setRegionId] = useState('')
  const [regionName, setRegionName] = useState('')
  const [regionDescription, setRegionDescription] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [adminsRes, regionsRes] = await Promise.all([
        fetch('/api/admins', { cache: 'no-store' }),
        fetch('/api/regions', { cache: 'no-store' }),
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
    if (!name || !email || !password) {
      toast.error('Nama, email, dan password wajib diisi')
      return
    }
    if (regionMode === 'existing' && !regionId) {
      toast.error('Pilih wilayah terlebih dahulu')
      return
    }
    if (regionMode === 'new' && !regionName) {
      toast.error('Masukkan nama wilayah baru')
      return
    }
    setSubmitting(true)
    try {
      const body: any = { name, email, password, phone }
      if (regionMode === 'existing') body.regionId = regionId
      else { body.regionName = regionName; body.regionDescription = regionDescription }
      const res = await fetch('/api/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Gagal membuat admin')
        return
      }
      toast.success('Admin wilayah berhasil dibuat')
      setName(''); setEmail(''); setPhone(''); setPassword('')
      setRegionName(''); setRegionDescription(''); setRegionId('')
      setRegionMode('existing')
      await fetchData()
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setSubmitting(false)
    }
  }

  async function toggleActive(admin: RegionalAdmin) {
    setToggling(admin.id)
    try {
      const res = await fetch(`/api/admins/${admin.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !admin.active }),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Gagal mengubah status')
        return
      }
      setAdmins((prev) => prev.map((a) => a.id === admin.id ? { ...a, active: !a.active } : a))
      toast.success(admin.active ? 'Admin dinonaktifkan' : 'Admin diaktifkan')
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
      const res = await fetch(`/api/admins/${id}`, { method: 'DELETE' })
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
          Kelola admin wilayah dan struktur organisasi gereja tingkat pusat.
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
        {/* Create form */}
        <Card className="lg:col-span-2 p-5 sm:p-6 border-border/70 h-fit">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <UserCog className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="font-serif text-lg text-foreground">Buat Admin Wilayah</h2>
              <p className="text-xs text-foreground/55">Hanya super admin yang dapat membuat admin wilayah</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="sa-name" className="text-foreground/80">Nama Lengkap</Label>
              <Input id="sa-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama admin wilayah" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sa-email" className="text-foreground/80">Email</Label>
              <Input id="sa-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@gereja.id" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="sa-phone" className="text-foreground/80">Telepon <span className="text-muted-foreground text-xs">(opsional)</span></Label>
                <Input id="sa-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+62..." />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sa-pass" className="text-foreground/80">Password</Label>
                <Input id="sa-pass" type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 6 karakter" />
              </div>
            </div>

            {/* Region mode toggle */}
            <div className="space-y-2">
              <Label className="text-foreground/80">Wilayah (Region)</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRegionMode('existing')}
                  className={cn(
                    'flex items-center justify-center gap-1.5 p-2.5 rounded-lg border text-sm transition-all',
                    regionMode === 'existing' ? 'border-gold/50 bg-accent/60 text-foreground' : 'border-border bg-muted/40 text-foreground/65 hover:bg-accent/40'
                  )}
                >
                  <CheckCircle2 className="w-4 h-4" /> Pilih
                </button>
                <button
                  type="button"
                  onClick={() => setRegionMode('new')}
                  className={cn(
                    'flex items-center justify-center gap-1.5 p-2.5 rounded-lg border text-sm transition-all',
                    regionMode === 'new' ? 'border-gold/50 bg-accent/60 text-foreground' : 'border-border bg-muted/40 text-foreground/65 hover:bg-accent/40'
                  )}
                >
                  <Plus className="w-4 h-4" /> Buat Baru
                </button>
              </div>
              {regionMode === 'existing' ? (
                <Select value={regionId} onValueChange={setRegionId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih wilayah" />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map((r) => (
                      <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="space-y-2">
                  <Input value={regionName} onChange={(e) => setRegionName(e.target.value)} placeholder="Nama wilayah baru (cth: Wilayah Bandung)" />
                  <Input value={regionDescription} onChange={(e) => setRegionDescription(e.target.value)} placeholder="Deskripsi singkat (opsional)" />
                </div>
              )}
            </div>

            <Button type="submit" disabled={submitting} className="w-full h-11 bg-primary text-cream hover:bg-primary/90">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Buat Admin Wilayah
            </Button>
          </form>
        </Card>

        {/* Lists */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="admins">
            <TabsList className="grid grid-cols-2 w-full mb-4 bg-muted/60">
              <TabsTrigger value="admins" className="data-[state=active]:bg-card data-[state=active]:shadow-sm">
                <UserCog className="w-4 h-4 mr-1.5" /> Admin Wilayah ({admins.length})
              </TabsTrigger>
              <TabsTrigger value="regions" className="data-[state=active]:bg-card data-[state=active]:shadow-sm">
                <MapPin className="w-4 h-4 mr-1.5" /> Wilayah ({regions.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="admins">
              <Card className="p-4 sm:p-5 border-border/70">
                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
                  </div>
                ) : admins.length === 0 ? (
                  <div className="text-center py-10">
                    <Users className="w-10 h-10 text-muted-foreground/50 mx-auto mb-2" />
                    <p className="text-sm text-foreground/60">Belum ada admin wilayah</p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[600px] overflow-y-auto scrollbar-elegant pr-1 -mr-1">
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
                            </div>
                            <p className="text-xs text-foreground/55 mt-0.5 truncate">{a.email}</p>
                            <div className="flex items-center gap-3 mt-1.5 text-[11px] text-foreground/50">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {a.region?.name || '—'}
                              </span>
                              {a.phone && <span>· {a.phone}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => toggleActive(a)}
                              disabled={toggling === a.id}
                              className={cn(
                                'w-8 h-8 rounded-md flex items-center justify-center transition-colors',
                                a.active ? 'text-muted-foreground hover:text-destructive hover:bg-destructive/10' : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
                              )}
                              title={a.active ? 'Nonaktifkan' : 'Aktifkan'}
                            >
                              {toggling === a.id ? <Loader2 className="w-4 h-4 animate-spin" /> : a.active ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => handleDelete(a.id)}
                              disabled={deleting === a.id}
                              className="w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                              title="Hapus"
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
            </TabsContent>

            <TabsContent value="regions">
              <Card className="p-4 sm:p-5 border-border/70">
                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
                  </div>
                ) : regions.length === 0 ? (
                  <div className="text-center py-10">
                    <MapPin className="w-10 h-10 text-muted-foreground/50 mx-auto mb-2" />
                    <p className="text-sm text-foreground/60">Belum ada wilayah</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {regions.map((r) => (
                      <div key={r.id} className="p-4 rounded-xl border border-border/70 bg-card hover:border-gold/30 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="w-11 h-11 rounded-lg bg-gold/15 flex items-center justify-center shrink-0">
                              <MapPin className="w-5 h-5 text-gold" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-foreground">{r.name}</p>
                              {r.description && <p className="text-xs text-foreground/55 mt-0.5">{r.description}</p>}
                              <div className="flex items-center gap-3 mt-2 text-[11px]">
                                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/15 text-[10px] h-5">
                                  {r._count.admins} admin
                                </Badge>
                                <Badge variant="outline" className="bg-gold/10 text-gold border-gold/20 text-[10px] h-5">
                                  {r._count.locals} lokal
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardShell>
  )
}
