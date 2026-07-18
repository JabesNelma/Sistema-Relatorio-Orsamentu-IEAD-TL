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
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Banknote,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  Loader2,
  MapPin,
  PieChart as PieIcon,
  Plus,
  QrCode,
  RefreshCw,
  ShieldCheck,
  ShieldOff,
  Trash2,
  TrendingUp,
  UserCog,
  Wallet,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/auth-store'
import { formatCompact, formatCurrency, formatDateShort, ROLE_LABELS, TRANSACTION_TYPE_LABELS } from '@/lib/format'
import { cn } from '@/lib/utils'
import { apiFetch } from '@/lib/api-fetch'

type LocalAdmin = {
  id: string
  name: string
  email: string
  phone: string | null
  active: boolean
  loginToken: string | null
  tokenActive: boolean
  tokenCreatedAt: string | null
  local: { id: string; name: string } | null
  createdBy: string | null
}

type Local = {
  id: string
  name: string
  address: string | null
  _count: { admins: number; transactions: number }
}

type Report = {
  summary: { CASH_IN: number; CASH_OUT: number; REVENUE: number; net: number }
  perLocal: { id: string; name: string; region: string; CASH_IN: number; CASH_OUT: number; REVENUE: number }[]
  monthly: { label: string; key: string; CASH_IN: number; CASH_OUT: number; REVENUE: number }[]
  byCategory: { category: string; type: string; amount: number }[]
  locals: { id: string; name: string; region: string }[]
}

type Transaction = {
  id: string
  type: 'CASH_IN' | 'CASH_OUT' | 'REVENUE'
  category: string
  amount: number
  description: string | null
  date: string
  local: { id: string; name: string }
  createdBy: { id: string; name: string }
}

const PIE_COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)', '#9c6b3d', '#7a8c5a']

export function RegionalAdminDashboard() {
  const user = useAuthStore((s) => s.user)!
  const [admins, setAdmins] = useState<LocalAdmin[]>([])
  const [locals, setLocals] = useState<Local[]>([])
  const [report, setReport] = useState<Report | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [toggling, setToggling] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [regenerating, setRegenerating] = useState<string | null>(null)
  const [localFilter, setLocalFilter] = useState<string>('all')

  // form state (simplified — no email/phone)
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [localMode, setLocalMode] = useState<'existing' | 'new'>('existing')
  const [localId, setLocalId] = useState('')
  const [localName, setLocalName] = useState('')
  const [localAddress, setLocalAddress] = useState('')

  // QR dialog state
  const [qrOpen, setQrOpen] = useState(false)
  const [qrToken, setQrToken] = useState<string | null>(null)
  const [qrName, setQrName] = useState('')
  const [qrIsNew, setQrIsNew] = useState(false)
  const [qrPassword, setQrPassword] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [adminsRes, localsRes, reportRes, txRes] = await Promise.all([
        apiFetch('/api/admins', { cache: 'no-store' }),
        apiFetch('/api/locals', { cache: 'no-store' }),
        apiFetch('/api/reports', { cache: 'no-store' }),
        apiFetch('/api/transactions?limit=10', { cache: 'no-store' }),
      ])
      const [adminsData, localsData, reportData, txData] = await Promise.all([
        adminsRes.json(), localsRes.json(), reportRes.json(), txRes.json(),
      ])
      setAdmins(adminsData.users || [])
      setLocals(localsData.locals || [])
      setReport(reportData)
      setTransactions(txData.transactions || [])
    } catch {
      toast.error('Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // refetch transactions when filter changes
  useEffect(() => {
    async function fetchTx() {
      const url = localFilter === 'all' ? '/api/transactions?limit=10' : `/api/transactions?localId=${localFilter}&limit=10`
      const res = await apiFetch(url, { cache: 'no-store' })
      const data = await res.json()
      setTransactions(data.transactions || [])
    }
    if (!loading) fetchTx()
  }, [localFilter, loading])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !password) {
      toast.error('Nama lengkap dan password wajib diisi')
      return
    }
    if (localMode === 'existing' && !localId) {
      toast.error('Pilih gereja lokal terlebih dahulu')
      return
    }
    if (localMode === 'new' && !localName) {
      toast.error('Masukkan nama gereja lokal baru')
      return
    }
    setSubmitting(true)
    try {
      const body: any = { name, password }
      if (localMode === 'existing') body.localId = localId
      else { body.localName = localName; body.localAddress = localAddress }
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
      // Show the freshly generated QR code so the regional admin can save/share it.
      setQrToken(data.loginToken)
      setQrName(data.user.name)
      setQrIsNew(true)
      setQrPassword(password)
      setQrOpen(true)
      toast.success('Admin lokal berhasil dibuat')
      setName(''); setPassword('')
      setLocalName(''); setLocalAddress(''); setLocalId('')
      setLocalMode('existing')
      await fetchData()
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setSubmitting(false)
    }
  }

  function openQr(admin: LocalAdmin) {
    setQrToken(admin.loginToken)
    setQrName(admin.name)
    setQrIsNew(false)
    setQrPassword(null)
    setQrOpen(true)
  }

  async function toggleToken(admin: LocalAdmin) {
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

  async function regenerateToken(admin: LocalAdmin) {
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

  async function toggleActive(admin: LocalAdmin) {
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

  async function handleDelete(id: string) {
    if (!confirm('Hapus admin lokal ini secara permanen?')) return
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

  const summary = report?.summary ?? { CASH_IN: 0, CASH_OUT: 0, REVENUE: 0, net: 0 }
  const perLocal = report?.perLocal ?? []
  const monthly = report?.monthly ?? []
  const byCategory = (report?.byCategory ?? []).slice(0, 7)

  return (
    <DashboardShell>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-foreground">
            Panel <span className="text-gradient-gold">Admin Wilayah</span>
          </h1>
          <p className="text-sm text-foreground/60 mt-1">
            Wilayah: <span className="font-medium text-foreground/80">{user.region?.name}</span> ·
            {' '}Pantau laporan keuangan dari gereja lokal.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={localFilter} onValueChange={setLocalFilter}>
            <SelectTrigger className="w-[200px] bg-card">
              <Building2 className="w-4 h-4 mr-1.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Gereja Lokal</SelectItem>
              {locals.map((l) => (
                <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard label="Uang Masuk" value={formatCurrency(summary.CASH_IN)} icon={ArrowDownCircle} tone="emerald" sublabel="Total penerimaan" />
        <StatCard label="Pendapatan" value={formatCurrency(summary.REVENUE)} icon={TrendingUp} tone="gold" sublabel="Pendapatan kegiatan" />
        <StatCard label="Uang Keluar" value={formatCurrency(summary.CASH_OUT)} icon={ArrowUpCircle} tone="rose" sublabel="Total pengeluaran" />
        <StatCard label="Saldo Bersih" value={formatCurrency(summary.net)} icon={Wallet} tone={summary.net >= 0 ? 'emerald' : 'rose'} sublabel={summary.net >= 0 ? 'Surplus' : 'Defisit'} trend={summary.net >= 0 ? 'up' : 'down'} />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
        {/* Monthly trend - takes 2 cols */}
        <Card className="lg:col-span-2 p-5 sm:p-6 border-border/70">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="font-serif text-lg text-foreground">Tren Arus Kas 6 Bulan</h2>
              <p className="text-xs text-foreground/55">Perbandingan uang masuk, keluar, dan pendapatan</p>
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-[260px] w-full rounded-lg" />
          ) : monthly.length === 0 ? (
            <div className="h-[260px] flex items-center justify-center text-sm text-foreground/50">Belum ada data</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={monthly} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="gIn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gOut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--destructive)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--destructive)" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => formatCompact(v).replace('Rp ', '')} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={60} />
                <Tooltip
                  formatter={(v: number, n: string) => [formatCurrency(v), TRANSACTION_TYPE_LABELS[n] || n]}
                  contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12, boxShadow: '0 8px 24px -8px rgba(0,0,0,0.12)' }}
                />
                <Legend formatter={(v) => <span style={{ fontSize: 12, color: 'var(--foreground)' }}>{TRANSACTION_TYPE_LABELS[v] || v}</span>} />
                <Area type="monotone" dataKey="CASH_IN" stroke="var(--chart-1)" strokeWidth={2} fill="url(#gIn)" />
                <Area type="monotone" dataKey="CASH_OUT" stroke="var(--destructive)" strokeWidth={2} fill="url(#gOut)" />
                <Area type="monotone" dataKey="REVENUE" stroke="var(--chart-2)" strokeWidth={2} fill="url(#gRev)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Category pie */}
        <Card className="p-5 sm:p-6 border-border/70">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-lg bg-gold/15 flex items-center justify-center">
              <PieIcon className="w-4 h-4 text-gold" />
            </div>
            <div>
              <h2 className="font-serif text-lg text-foreground">Per Kategori</h2>
              <p className="text-xs text-foreground/55">Distribusi pengeluaran terbesar</p>
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-[260px] w-full rounded-lg" />
          ) : byCategory.length === 0 ? (
            <div className="h-[260px] flex items-center justify-center text-sm text-foreground/50">Belum ada data</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={byCategory}
                  dataKey="amount"
                  nameKey="category"
                  cx="50%"
                  cy="45%"
                  innerRadius={45}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {byCategory.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number) => formatCurrency(v)}
                  contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }}
                />
                <Legend
                  formatter={(v) => <span style={{ fontSize: 10.5, color: 'var(--foreground)' }} className="truncate">{v}</span>}
                  layout="horizontal"
                  align="center"
                  verticalAlign="bottom"
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Per local bar chart */}
      <Card className="p-5 sm:p-6 border-border/70 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Building2 className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="font-serif text-lg text-foreground">Perbandingan per Gereja Lokal</h2>
            <p className="text-xs text-foreground/55">Total uang masuk, keluar, dan pendapatan tiap lokal</p>
          </div>
        </div>
        {loading ? (
          <Skeleton className="h-[260px] w-full rounded-lg" />
        ) : perLocal.length === 0 ? (
          <div className="h-[260px] flex items-center justify-center text-sm text-foreground/50">Belum ada data</div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={perLocal} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} interval={0} />
              <YAxis tickFormatter={(v) => formatCompact(v).replace('Rp ', '')} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={60} />
              <Tooltip
                formatter={(v: number, n: string) => [formatCurrency(v), TRANSACTION_TYPE_LABELS[n] || n]}
                contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }}
              />
              <Legend formatter={(v) => <span style={{ fontSize: 12, color: 'var(--foreground)' }}>{TRANSACTION_TYPE_LABELS[v] || v}</span>} />
              <Bar dataKey="CASH_IN" fill="var(--chart-1)" radius={[4, 4, 0, 0]} maxBarSize={48} />
              <Bar dataKey="CASH_OUT" fill="var(--destructive)" radius={[4, 4, 0, 0]} maxBarSize={48} />
              <Bar dataKey="REVENUE" fill="var(--chart-2)" radius={[4, 4, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Create form */}
        <Card className="lg:col-span-2 p-5 sm:p-6 border-border/70 h-fit">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <UserCog className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="font-serif text-lg text-foreground">Buat Admin Lokal</h2>
              <p className="text-xs text-foreground/55">Admin wilayah membuat admin gereja lokal</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="ra-name" className="text-foreground/80">Nama Lengkap</Label>
              <Input id="ra-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama admin lokal" disabled={submitting} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ra-pass" className="text-foreground/80">Password</Label>
              <Input id="ra-pass" type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 6 karakter" disabled={submitting} />
              <p className="text-[11px] text-muted-foreground">Password ini dipakai admin saat login via QR code.</p>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground/80">Gereja Lokal</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setLocalMode('existing')}
                  className={cn(
                    'flex items-center justify-center gap-1.5 p-2.5 rounded-lg border text-sm transition-all',
                    localMode === 'existing' ? 'border-gold/50 bg-accent/60 text-foreground' : 'border-border bg-muted/40 text-foreground/65 hover:bg-accent/40'
                  )}
                >
                  <CheckCircle2 className="w-4 h-4" /> Pilih
                </button>
                <button
                  type="button"
                  onClick={() => setLocalMode('new')}
                  className={cn(
                    'flex items-center justify-center gap-1.5 p-2.5 rounded-lg border text-sm transition-all',
                    localMode === 'new' ? 'border-gold/50 bg-accent/60 text-foreground' : 'border-border bg-muted/40 text-foreground/65 hover:bg-accent/40'
                  )}
                >
                  <Plus className="w-4 h-4" /> Buat Baru
                </button>
              </div>
              {localMode === 'existing' ? (
                <Select value={localId} onValueChange={setLocalId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih gereja lokal" />
                  </SelectTrigger>
                  <SelectContent>
                    {locals.map((l) => (
                      <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="space-y-2">
                  <Input value={localName} onChange={(e) => setLocalName(e.target.value)} placeholder="Nama gereja lokal baru" />
                  <Input value={localAddress} onChange={(e) => setLocalAddress(e.target.value)} placeholder="Alamat (opsional)" />
                </div>
              )}
            </div>

            <Button type="submit" disabled={submitting} className="w-full h-11 bg-primary text-cream hover:bg-primary/90">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Buat Admin Lokal
            </Button>
          </form>
        </Card>

        {/* Tabs: admins + locals + recent tx */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="admins">
            <TabsList className="grid grid-cols-3 w-full mb-4 bg-muted/60">
              <TabsTrigger value="admins" className="data-[state=active]:bg-card data-[state=active]:shadow-sm text-xs sm:text-sm">
                <UserCog className="w-4 h-4 mr-1.5" /> Admin Lokal
              </TabsTrigger>
              <TabsTrigger value="locals" className="data-[state=active]:bg-card data-[state=active]:shadow-sm text-xs sm:text-sm">
                <Building2 className="w-4 h-4 mr-1.5" /> Gereja
              </TabsTrigger>
              <TabsTrigger value="recent" className="data-[state=active]:bg-card data-[state=active]:shadow-sm text-xs sm:text-sm">
                <Banknote className="w-4 h-4 mr-1.5" /> Transaksi
              </TabsTrigger>
            </TabsList>

            <TabsContent value="admins">
              <Card className="p-4 sm:p-5 border-border/70">
                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
                  </div>
                ) : admins.length === 0 ? (
                  <div className="text-center py-10">
                    <UserCog className="w-10 h-10 text-muted-foreground/50 mx-auto mb-2" />
                    <p className="text-sm text-foreground/60">Belum ada admin lokal</p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[460px] overflow-y-auto scrollbar-elegant pr-1 -mr-1">
                    {admins.map((a) => (
                      <div key={a.id} className="group p-3.5 rounded-xl border border-border/70 bg-card hover:border-gold/30 hover:shadow-elegant transition-all">
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-serif text-sm font-semibold',
                            a.active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                          )}>
                            {a.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-foreground text-sm truncate">{a.name}</span>
                              <Badge variant={a.active ? 'default' : 'secondary'} className={cn('text-[10px] h-5', a.active ? 'bg-primary/10 text-primary border-primary/20' : '')}>
                                {a.active ? 'Aktif' : 'Nonaktif'}
                              </Badge>
                              <Badge variant={a.tokenActive ? 'outline' : 'secondary'} className={cn('text-[10px] h-5', a.tokenActive ? 'bg-gold/10 text-gold border-gold/20' : 'bg-destructive/10 text-destructive border-destructive/20')}>
                                {a.tokenActive ? 'QR Aktif' : 'QR Mati'}
                              </Badge>
                            </div>
                            <p className="text-[11px] text-foreground/50 mt-0.5 flex items-center gap-1 flex-wrap">
                              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {a.local?.name || '—'}</span>
                              {a.loginToken && <><span className="mx-1">·</span><span className="flex items-center gap-1" title={a.loginToken}><Copy className="w-3 h-3" /> {a.loginToken.slice(0, 8)}…</span></>}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pt-2.5 border-t border-border/60">
                          <Button size="sm" variant="outline" onClick={() => openQr(a)} className="h-8 text-xs border-gold/30 text-gold hover:bg-gold/10 hover:text-gold">
                            <QrCode className="w-3.5 h-3.5 mr-1.5" /> Lihat QR
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => regenerateToken(a)} disabled={regenerating === a.id} className="h-8 text-xs">
                            {regenerating === a.id ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <RefreshCw className="w-3.5 h-3.5 mr-1.5" />}
                            Buat Ulang
                          </Button>
                          <div className="ml-auto flex items-center gap-1">
                            <button
                              onClick={() => toggleToken(a)}
                              disabled={toggling === a.id}
                              title={a.tokenActive ? 'Matikan QR' : 'Nyalakan QR'}
                              className={cn(
                                'h-8 px-2.5 rounded-md flex items-center gap-1 text-xs transition-colors',
                                a.tokenActive ? 'text-foreground/60 hover:text-destructive hover:bg-destructive/10' : 'text-foreground/60 hover:text-gold hover:bg-gold/10'
                              )}
                            >
                              {toggling === a.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : a.tokenActive ? <ShieldOff className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                              {a.tokenActive ? 'Matikan' : 'Nyalakan'}
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
            </TabsContent>

            <TabsContent value="locals">
              <Card className="p-4 sm:p-5 border-border/70">
                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
                  </div>
                ) : locals.length === 0 ? (
                  <div className="text-center py-10">
                    <Building2 className="w-10 h-10 text-muted-foreground/50 mx-auto mb-2" />
                    <p className="text-sm text-foreground/60">Belum ada gereja lokal</p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {locals.map((l) => {
                      const pl = perLocal.find((p) => p.id === l.id)
                      const net = pl ? pl.CASH_IN + pl.REVENUE - pl.CASH_OUT : 0
                      return (
                        <div key={l.id} className="p-4 rounded-xl border border-border/70 bg-card hover:border-gold/30 transition-colors">
                          <div className="flex items-start gap-2.5">
                            <div className="w-10 h-10 rounded-lg bg-gold/15 flex items-center justify-center shrink-0">
                              <Building2 className="w-5 h-5 text-gold" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-foreground text-sm truncate">{l.name}</p>
                              {l.address && <p className="text-[11px] text-foreground/55 mt-0.5 truncate">{l.address}</p>}
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/15 text-[10px] h-5">
                                  {l._count.admins} admin
                                </Badge>
                                <Badge variant="outline" className="bg-muted text-foreground/60 border-border text-[10px] h-5">
                                  {l._count.transactions} transaksi
                                </Badge>
                              </div>
                              {pl && (
                                <p className={cn('text-xs font-medium mt-2', net >= 0 ? 'text-primary' : 'text-destructive')}>
                                  Saldo: {formatCurrency(net)}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="recent">
              <Card className="p-4 sm:p-5 border-border/70">
                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-10">
                    <Banknote className="w-10 h-10 text-muted-foreground/50 mx-auto mb-2" />
                    <p className="text-sm text-foreground/60">Belum ada transaksi</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[460px] overflow-y-auto scrollbar-elegant pr-1 -mr-1">
                    {transactions.map((t) => (
                      <div key={t.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/70 bg-card hover:border-gold/30 transition-colors">
                        <div className={cn(
                          'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                          t.type === 'CASH_IN' ? 'bg-primary/10' : t.type === 'CASH_OUT' ? 'bg-destructive/10' : 'bg-gold/15'
                        )}>
                          {t.type === 'CASH_IN' && <ArrowDownCircle className="w-4 h-4 text-primary" />}
                          {t.type === 'CASH_OUT' && <ArrowUpCircle className="w-4 h-4 text-destructive" />}
                          {t.type === 'REVENUE' && <TrendingUp className="w-4 h-4 text-gold" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{t.category}</p>
                          <p className="text-[11px] text-foreground/55 truncate">
                            {t.local.name} · {formatDateShort(t.date)} · oleh {t.createdBy.name}
                          </p>
                        </div>
                        <p className={cn(
                          'font-serif text-sm font-semibold shrink-0',
                          t.type === 'CASH_OUT' ? 'text-destructive' : 'text-primary'
                        )}>
                          {t.type === 'CASH_OUT' ? '-' : '+'}{formatCurrency(t.amount)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <QrCodeDialog
        open={qrOpen}
        onOpenChange={setQrOpen}
        token={qrToken}
        name={qrName}
        roleLabel={ROLE_LABELS.LOCAL_ADMIN}
        scopeLabel={user.region?.name ?? null}
        password={qrPassword}
        isNew={qrIsNew}
      />
    </DashboardShell>
  )
}
