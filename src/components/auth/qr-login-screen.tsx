'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  AlertTriangle,
  ArrowLeft,
  Church,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  MapPin,
  ShieldCheck,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/auth-store'
import { ROLE_LABELS } from '@/lib/format'

type Props = {
  token: string
  onBack: () => void
}

type TokenInfo = {
  valid: boolean
  name?: string
  role?: string
  region?: string | null
  local?: string | null
  error?: string
}

export function QrLoginScreen({ token, onBack }: Props) {
  const setUser = useAuthStore((s) => s.setUser)
  const [info, setInfo] = useState<TokenInfo | null>(null)
  const [checking, setChecking] = useState(true)
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function check() {
      setChecking(true)
      try {
        const res = await fetch(`/api/auth/token/${token}`, { cache: 'no-store' })
        const data = await res.json()
        if (!cancelled) setInfo(data)
      } catch {
        if (!cancelled) setInfo({ valid: false, error: 'Gagal memverifikasi link' })
      } finally {
        if (!cancelled) setChecking(false)
      }
    }
    check()
    return () => { cancelled = true }
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!password) {
      toast.error('Password wajib diisi')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Gagal masuk')
        return
      }
      setUser(data.user)
      toast.success(`Selamat datang, ${data.user.name}!`)
    } catch {
      toast.error('Terjadi kesalahan jaringan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      {/* Decorative top band */}
      <div className="relative h-40 sm:h-48 bg-emerald-deep overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, var(--gold) 0, transparent 45%), radial-gradient(circle at 80% 70%, var(--gold) 0, transparent 40%)' }} />
        <div className="relative flex flex-col items-center gap-2 text-cream">
          <div className="w-14 h-14 rounded-full bg-gold/15 border border-gold/40 flex items-center justify-center">
            <Church className="w-7 h-7 text-gold" />
          </div>
          <h1 className="font-serif text-xl sm:text-2xl tracking-wide">Portal Keuangan Gereja</h1>
          <p className="text-cream/70 text-xs">Login Aman via QR Code</p>
        </div>
      </div>

      <main className="flex-1 flex items-start sm:items-center justify-center px-4 -mt-10 sm:-mt-12">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-2xl border border-border shadow-elegant p-6 sm:p-8">
            {checking ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <Loader2 className="w-7 h-7 text-primary animate-spin" />
                <p className="text-sm text-foreground/60">Memverifikasi link login…</p>
              </div>
            ) : !info?.valid ? (
              <div className="flex flex-col items-center text-center py-6 gap-4">
                <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="w-7 h-7 text-destructive" />
                </div>
                <div>
                  <h2 className="font-serif text-lg text-foreground">Link Tidak Valid</h2>
                  <p className="text-sm text-foreground/60 mt-1 max-w-xs">
                    {info?.error || 'Link login ini tidak dapat dipakai.'}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Hubungi super admin untuk mendapatkan QR code login yang baru.
                </p>
                <Button variant="outline" onClick={onBack} className="mt-2">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Beranda
                </Button>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-gold/15 border border-gold/40 flex items-center justify-center">
                    <KeyRound className="w-7 h-7 text-gold" />
                  </div>
                  <div>
                    <h2 className="font-serif text-xl text-foreground">Masuk ke Akun Anda</h2>
                    <p className="text-xs text-foreground/55 mt-0.5">Masukkan password untuk melanjutkan</p>
                  </div>
                </div>

                {/* Identity card */}
                <div className="rounded-xl border border-gold/25 bg-gold/5 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] uppercase tracking-wider text-foreground/50">Nama</span>
                    <span className="font-medium text-foreground text-sm">{info.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] uppercase tracking-wider text-foreground/50">Peran</span>
                    <span className="text-sm text-foreground/80">{info.role ? ROLE_LABELS[info.role] ?? info.role : '—'}</span>
                  </div>
                  {info.region && (
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] uppercase tracking-wider text-foreground/50">Wilayah</span>
                      <span className="text-sm text-foreground/80 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {info.region}
                      </span>
                    </div>
                  )}
                  {info.local && (
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] uppercase tracking-wider text-foreground/50">Gereja Lokal</span>
                      <span className="text-sm text-foreground/80">{info.local}</span>
                    </div>
                  )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="qr-pass" className="text-foreground/80">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="qr-pass"
                        type={showPass ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pl-9 pr-9"
                        autoFocus
                        autoComplete="current-password"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                      >
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                    Masuk
                  </Button>
                </form>

                <button
                  onClick={onBack}
                  className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Bukan Anda? Kembali ke beranda
                </button>
              </div>
            )}
          </div>

          <p className="text-center text-[11px] text-muted-foreground mt-4 px-6">
            Link ini bersifat rahasia. Jangan bagikan kepada orang yang tidak berwenang.
          </p>
        </div>
      </main>
    </div>
  )
}
