'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Church, Eye, EyeOff, KeyRound, Loader2, Lock, Mail, ShieldCheck, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/auth-store'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const demoAccounts = [
  { role: 'Super Admin', email: 'superadmin@gereja.id', password: 'superadmin123', desc: 'Mengelola admin wilayah', icon: ShieldCheck },
  { role: 'Admin Wilayah', email: 'regional@gereja.id', password: 'regional123', desc: 'Mengelola admin lokal & lihat laporan', icon: Sparkles },
  { role: 'Admin Lokal', email: 'lokal.pusat@gereja.id', password: 'lokal123', desc: 'Input arus kas & pendapatan', icon: Church },
]

export function LoginDialog({ open, onOpenChange }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const fetchUser = useAuthStore((s) => s.fetchUser)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Email dan password wajib diisi')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Gagal masuk')
        return
      }
      await fetchUser()
      toast.success(`Selamat datang, ${data.user.name}!`)
      onOpenChange(false)
      setEmail('')
      setPassword('')
    } catch {
      toast.error('Terjadi kesalahan jaringan')
    } finally {
      setLoading(false)
    }
  }

  function fillDemo(acc: { email: string; password: string }) {
    setEmail(acc.email)
    setPassword(acc.password)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md overflow-hidden p-0 gap-0">
        <div className="relative bg-emerald-deep text-cream px-6 pt-7 pb-6 overflow-hidden">
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-gold/20 blur-2xl" />
          <div className="absolute -left-6 -bottom-10 w-28 h-28 rounded-full bg-gold/10 blur-2xl" />
          <DialogHeader className="relative space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-gold/15 border border-gold/40 flex items-center justify-center">
                <KeyRound className="w-5 h-5 text-gold" />
              </div>
              <div>
                <DialogTitle className="font-serif text-2xl text-cream tracking-wide">Masuk ke Sistem</DialogTitle>
                <DialogDescription className="text-cream/70 text-xs">
                  Portal Laporan Keuangan Gereja
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-foreground/80">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@gereja.id"
                className="pl-9"
                autoComplete="email"
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-foreground/80">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-9 pr-9"
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

          <div className="relative pt-1">
            <Separator />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="bg-card px-3 text-[11px] uppercase tracking-widest text-muted-foreground">
                Akun Demo
              </span>
            </span>
          </div>

          <div className="space-y-2">
            {demoAccounts.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => fillDemo(acc)}
                className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-border bg-muted/40 hover:bg-accent/60 hover:border-gold/40 transition-all text-left group"
              >
                <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15">
                  <acc.icon className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{acc.role}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">{acc.desc}</p>
                </div>
                <span className="text-[10px] text-gold font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Isi
                </span>
              </button>
            ))}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
