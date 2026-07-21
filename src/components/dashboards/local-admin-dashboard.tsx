'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { DashboardShell } from '@/components/shared/dashboard-shell'
import { StatCard } from '@/components/shared/stat-card'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  CalendarDays,
  Loader2,
  MapPin,
  PieChart as PieIcon,
  Plus,
  Tag,
  TrendingUp,
  Trash2,
  Wallet,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/auth-store'
import { formatCompact, formatCurrency, formatDateShort, TRANSACTION_TYPE_LABELS } from '@/lib/format'
import { cn } from '@/lib/utils'
import { apiFetch } from '@/lib/api-fetch'

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

const TYPE_TONE: Record<Transaction['type'], string> = {
  CASH_IN: 'bg-primary/10 text-primary border-primary/20',
  CASH_OUT: 'bg-destructive/10 text-destructive border-destructive/20',
  REVENUE: 'bg-gold/15 text-gold border-gold/30',
}

export function LocalAdminDashboard() {
  const user = useAuthStore((s) => s.user)!
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  // form state
  const [type, setType] = useState<Transaction['type']>('CASH_IN')
  const [category, setCategory] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch('/api/transactions?limit=200', { cache: 'no-store' })
      const data = await res.json()
      setTransactions(data.transactions || [])
    } catch {
      toast.error('Gagal memuat data transaksi')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Compute summary locally (LOCAL_ADMIN cannot access /api/reports).
  const summary = useMemo(() => {
    const s = { CASH_IN: 0, CASH_OUT: 0, REVENUE: 0 }
    for (const t of transactions) s[t.type] += t.amount
    return { ...s, net: s.CASH_IN + s.REVENUE - s.CASH_OUT }
  }, [transactions])

  // Monthly trend (last 6 months), computed locally.
  const monthly = useMemo(() => {
    const now = new Date()
    const months: { label: string; key: string; CASH_IN: number; CASH_OUT: number; REVENUE: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' })
      months.push({ label, key, CASH_IN: 0, CASH_OUT: 0, REVENUE: 0 })
    }
    const monthIndex = new Map(months.map((m, i) => [m.key, i]))
    for (const t of transactions) {
      const d = new Date(t.date)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const idx = monthIndex.get(key)
      if (idx !== undefined) months[idx][t.type] += t.amount
    }
    return months
  }, [transactions])

  // Breakdown by category, computed locally.
  const byCategory = useMemo(() => {
    const catMap = new Map<string, { category: string; type: string; amount: number }>()
    for (const t of transactions) {
      const k = `${t.type}__${t.category}`
      const entry = catMap.get(k) ?? { category: t.category, type: t.type, amount: 0 }
      entry.amount += t.amount
      catMap.set(k, entry)
    }
    return Array.from(catMap.values()).sort((a, b) => b.amount - a.amount).slice(0, 7)
  }, [transactions])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!category.trim()) {
      toast.error('Kategori wajib diisi')
      return
    }
    const amt = parseFloat(amount)
    if (isNaN(amt) || amt <= 0) {
      toast.error('Jumlah harus angka positif')
      return
    }
    setSubmitting(true)
    try {
      const res = await apiFetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          category: category.trim(),
          amount: amt,
          description: description.trim() || undefined,
          date,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Gagal menambah transaksi')
        return
      }
      toast.success('Transaksi berhasil ditambahkan')
      setCategory(''); setAmount(''); setDescription('')
      setDate(new Date().toISOString().slice(0, 10))
      setType('CASH_IN')
      await fetchData()
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus transaksi ini?')) return
    setDeleting(id)
    try {
      const res = await apiFetch(`/api/transactions/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Gagal menghapus transaksi')
        return
      }
      setTransactions((prev) => prev.filter((t) => t.id !== id))
      toast.success('Transaksi dihapus')
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <DashboardShell>
      <div className="mb-6">
        <h1 className="font-serif text-2xl sm:text-3xl text-foreground">
          Panel <span className="text-gradient-gold">Admin Lokal</span>
        </h1>
        <p className="text-sm text-foreground/60 mt-1 flex items-center gap-1.5">
          <MapPin className="w-4 h-4" />
          Gereja Lokal: <span className="font-medium text-foreground/80">{user.local?.name || '—'}</span>
          {' '}· Input dan pantau transaksi keuangan.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard label="Uang Masuk" value={formatCurrency(summary.CASH_IN)} icon={ArrowDownCircle} tone="emerald" sublabel="Total penerimaan" />
        <StatCard label="Pendapatan" value={formatCurrency(summary.REVENUE)} icon={TrendingUp} tone="gold" sublabel="Pendapatan kegiatan" />
        <StatCard label="Uang Keluar" value={formatCurrency(summary.CASH_OUT)} icon={ArrowUpCircle} tone="rose" sublabel="Total pengeluaran" />
        <StatCard
          label="Saldo Bersih"
          value={formatCurrency(summary.net)}
          icon={Wallet}
          tone={summary.net >= 0 ? 'emerald' : 'rose'}
          sublabel={summary.net >= 0 ? 'Surplus' : 'Defisit'}
          trend={summary.net >= 0 ? 'up' : 'down'}
        />
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
          ) : monthly.every((m) => m.CASH_IN === 0 && m.CASH_OUT === 0 && m.REVENUE === 0) ? (
            <div className="h-[260px] flex items-center justify-center text-sm text-foreground/50">Belum ada data</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={monthly} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="laIn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="laOut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--destructive)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--destructive)" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="laRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => formatCompact(v).replace('$', '')} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={60} />
                <Tooltip
                  formatter={(v: number, n: string) => [formatCurrency(v), TRANSACTION_TYPE_LABELS[n] || n]}
                  contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12, boxShadow: '0 8px 24px -8px rgba(0,0,0,0.12)' }}
                />
                <Legend formatter={(v) => <span style={{ fontSize: 12, color: 'var(--foreground)' }}>{TRANSACTION_TYPE_LABELS[v] || v}</span>} />
                <Area type="monotone" dataKey="CASH_IN" stroke="var(--chart-1)" strokeWidth={2} fill="url(#laIn)" />
                <Area type="monotone" dataKey="CASH_OUT" stroke="var(--destructive)" strokeWidth={2} fill="url(#laOut)" />
                <Area type="monotone" dataKey="REVENUE" stroke="var(--chart-2)" strokeWidth={2} fill="url(#laRev)" />
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
              <p className="text-xs text-foreground/55">Distribusi transaksi terbesar</p>
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

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Create form */}
        <Card className="lg:col-span-2 p-5 sm:p-6 border-border/70 h-fit">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Plus className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="font-serif text-lg text-foreground">Tambah Transaksi</h2>
              <p className="text-xs text-foreground/55">Catat penerimaan, pendapatan, atau pengeluaran</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="la-type" className="text-foreground/80">Tipe Transaksi</Label>
              <Select value={type} onValueChange={(v) => setType(v as Transaction['type'])}>
                <SelectTrigger id="la-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH_IN">Uang Masuk</SelectItem>
                  <SelectItem value="REVENUE">Pendapatan</SelectItem>
                  <SelectItem value="CASH_OUT">Uang Keluar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="la-category" className="text-foreground/80">Kategori</Label>
              <Input
                id="la-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Contoh: Persembahan, Donasi, Gaji, Operasional"
                disabled={submitting}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="la-amount" className="text-foreground/80">Jumlah ($)</Label>
              <Input
                id="la-amount"
                type="number"
                min="0"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                disabled={submitting}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="la-date" className="text-foreground/80">Tanggal</Label>
              <Input
                id="la-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={submitting}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="la-desc" className="text-foreground/80">Keterangan (opsional)</Label>
              <Textarea
                id="la-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Catatan tambahan tentang transaksi ini"
                rows={2}
                disabled={submitting}
              />
            </div>

            <Button type="submit" disabled={submitting} className="w-full h-11 bg-primary text-cream hover:bg-primary/90">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Simpan Transaksi
            </Button>
          </form>
        </Card>

        {/* Recent transactions */}
        <div className="lg:col-span-3">
          <Card className="p-4 sm:p-5 border-border/70">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Banknote className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h2 className="font-serif text-lg text-foreground">Riwayat Transaksi</h2>
                <p className="text-xs text-foreground/55">Transaksi terbaru di gereja lokal Anda</p>
              </div>
            </div>

            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-10">
                <Banknote className="w-10 h-10 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-sm text-foreground/60">Belum ada transaksi</p>
                <p className="text-xs text-foreground/45 mt-1">Mulai catat transaksi pertama Anda menggunakan formulir di samping.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[560px] overflow-y-auto scrollbar-elegant pr-1 -mr-1">
                {transactions.map((t) => {
                  const isOut = t.type === 'CASH_OUT'
                  return (
                    <div key={t.id} className="group p-3.5 rounded-xl border border-border/70 bg-card hover:border-gold/30 hover:shadow-elegant transition-all">
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
                          isOut ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
                        )}>
                          {isOut ? <ArrowUpCircle className="w-5 h-5" /> : <ArrowDownCircle className="w-5 h-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className={cn('text-[10px] h-5', TYPE_TONE[t.type])}>
                              {TRANSACTION_TYPE_LABELS[t.type]}
                            </Badge>
                            <span className="font-medium text-foreground text-sm truncate flex items-center gap-1">
                              <Tag className="w-3 h-3 text-muted-foreground" /> {t.category}
                            </span>
                          </div>
                          {t.description && (
                            <p className="text-xs text-foreground/60 mt-1 line-clamp-2">{t.description}</p>
                          )}
                          <p className="text-[11px] text-foreground/50 mt-1 flex items-center gap-1 flex-wrap">
                            <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" /> {formatDateShort(t.date)}</span>
                            <span className="mx-1">·</span>
                            <span>oleh {t.createdBy?.name || '—'}</span>
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <span className={cn('font-serif text-sm font-semibold whitespace-nowrap', isOut ? 'text-destructive' : 'text-primary')}>
                            {isOut ? '−' : '+'}{formatCurrency(t.amount)}
                          </span>
                          <button
                            onClick={() => handleDelete(t.id)}
                            disabled={deleting === t.id}
                            title="Hapus transaksi"
                            className="w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            {deleting === t.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </DashboardShell>
  )
}
