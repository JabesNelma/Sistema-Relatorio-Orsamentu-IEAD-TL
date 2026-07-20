'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { KeyRound, Loader2, QrCode, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthContext as useAuth } from '@/components/auth/auth-provider'
import { signInWithGoogle } from '@/lib/auth-client'
import { toast } from 'sonner'

export function LoginScreen() {
  const { loginWithQr, loading, error, clearError } = useAuth()
  const [token, setToken] = useState('')
  const [submittingGoogle, setSubmittingGoogle] = useState(false)
  const [submittingQr, setSubmittingQr] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const success = searchParams.get('success')
    const err = searchParams.get('error')

    if (success) {
      toast.success(success)
      window.history.replaceState({}, '', '/')
      router.refresh()
    } else if (err) {
      toast.error(decodeURIComponent(err))
      window.history.replaceState({}, '', '/')
    }
  }, [searchParams, router])

  const handleGoogle = async () => {
    setSubmittingGoogle(true)
    try {
      await signInWithGoogle()
    } catch (err) {
      setSubmittingGoogle(false)
      toast.error(err instanceof Error ? err.message : 'Login Google gagal')
    }
  }

  const handleQr = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()

    if (!token.trim()) {
      toast.error('Tama token QR uluk')
      return
    }

    setSubmittingQr(true)
    try {
      const ok = await loginWithQr(token.trim())
      if (ok) {
        toast.success('Login QR ho suksessu!')
        setToken('')
        router.refresh()
      } else {
        toast.error('Token QR la validu')
      }
    } finally {
      setSubmittingQr(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-emerald-50 via-background to-amber-50/40">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center gap-8 px-4 py-10 lg:flex-row lg:gap-16">
        <div className="flex max-w-md flex-col items-start gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Sistema Finansa</h1>
              <p className="text-sm text-muted-foreground">Timor-Leste</p>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
              Manejamentu Finansa{' '}
              <span className="bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">
                Rejional &amp; Lokal
              </span>
            </h2>
            <p className="text-muted-foreground">
              Sistema integradu ba Kontrola Pemasukan Keuangan husi Admin Lokal
              (suku), rekapitulasaun husi Admin Regional, ho jeransa totál husi
              Super Admin.
            </p>
          </div>

          <div className="grid w-full gap-3 sm:grid-cols-3">
            {[
              { label: 'Super Admin', desc: 'Google Login', icon: ShieldCheck },
              { label: 'Admin Regional', desc: 'QR Login', icon: QrCode },
              { label: 'Admin Lokal', desc: 'QR Login', icon: KeyRound },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-lg border border-border bg-card p-3 shadow-sm"
              >
                <item.icon className="mb-1.5 h-5 w-5 text-emerald-600" />
                <p className="text-xs font-semibold">{item.label}</p>
                <p className="text-[11px] text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <Card className="w-full max-w-md border-border/60 shadow-xl shadow-emerald-900/5">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Tama Sistema</CardTitle>
            <CardDescription>
              Super Admin login uza Google. Admin Regional no Lokal uza QR Token.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Super Admin Login
              </div>
              <p className="text-xs text-muted-foreground">
                Super Admin login ho Google. Verifikasaun (Google Prompt /
                telefon / 2FA) hetan direta husi konta Google ita-nian.
              </p>
              <Button
                type="button"
                onClick={handleGoogle}
                disabled={submittingGoogle || submittingQr || loading}
                className="h-11 w-full gap-2.5 bg-white text-foreground hover:bg-white/90 border border-border"
                size="lg"
              >
                {submittingGoogle ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <GoogleIcon />
                )}
                Login ho Google
              </Button>
            </div>

            <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
              <form onSubmit={handleQr} className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <QrCode className="h-4 w-4 text-emerald-600" />
                    QR Login Admin
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Admin Regional no Admin Lokal login uza token QR.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="qr-token">Token QR</Label>
                  <Input
                    id="qr-token"
                    placeholder="Tama token QR iha ne'e..."
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    autoComplete="off"
                    className="font-mono text-sm"
                    disabled={submittingGoogle || submittingQr || loading}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={submittingGoogle || submittingQr || loading || !token.trim()}
                  className="h-11 w-full gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
                  size="lg"
                >
                  {submittingQr ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <QrCode className="h-4 w-4" />
                  )}
                  Login Token QR
                </Button>
              </form>
            </div>

            {error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">
                {error}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  )
}
