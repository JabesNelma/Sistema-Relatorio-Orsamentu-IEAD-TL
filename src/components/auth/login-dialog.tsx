'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { KeyRound, Loader2, QrCode } from 'lucide-react'
import { toast } from 'sonner'
import { signInWithGoogle } from '@/lib/auth-client'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LoginDialog({ open, onOpenChange }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleGoogle() {
    setLoading(true)
    try {
      // The browser navigates to Google here. /auth/callback finishes the
      // login and mints the app session after the user is verified.
      await signInWithGoogle()
    } catch (err) {
      setLoading(false)
      toast.error(err instanceof Error ? err.message : 'Login Google gagal')
    }
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
                <DialogTitle className="font-serif text-2xl text-cream tracking-wide">Masuk Super Admin</DialogTitle>
                <DialogDescription className="text-cream/70 text-xs">
                  Portal pusat laporan keuangan gereja
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-1.5 text-center">
            <p className="text-sm text-foreground/80">
              Super Admin login hanya melalui akun Google yang terdaftar.
            </p>
            <p className="text-[11px] text-muted-foreground">
              Verifikasi (Google Prompt / persetujuan ponsel / 2FA) ditangani
              langsung oleh akun Google Anda, bukan oleh aplikasi.
            </p>
          </div>

          <Button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className="w-full h-11 bg-white text-foreground hover:bg-white/90 border border-border font-medium flex items-center justify-center gap-2.5"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            Login dengan Google
          </Button>

          <div className="flex items-start gap-2 rounded-lg border border-gold/25 bg-gold/5 p-3 text-[11px] text-foreground/70">
            <QrCode className="w-4 h-4 text-gold shrink-0 mt-0.5" />
            <span>
              <b className="text-foreground/85">Admin Wilayah &amp; Lokal</b> tidak login di sini. Mereka memindai QR code rahasia yang diberikan oleh super admin/admin wilayah, lalu memasukkan password.
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function GoogleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  )
}
