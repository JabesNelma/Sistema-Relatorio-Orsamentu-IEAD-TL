'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Header } from '@/components/Header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Church, QrCode, LogIn, Loader2, AlertCircle, ScanLine } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'

function LoginForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { loginWithGoogle, loginWithQr, user } = useAuth()
  const [qrToken, setQrToken] = useState('')
  const [loadingGoogle, setLoadingGoogle] = useState(false)
  const [loadingQr, setLoadingQr] = useState(false)

  const tokenFromUrl = searchParams.get('token')
  const errorFromUrl = searchParams.get('error')
  const fromPath = searchParams.get('from') || '/'

  const handleGoogleLogin = async () => {
    setLoadingGoogle(true)
    await loginWithGoogle()
    // The page will redirect, so we don't need to setLoadingGoogle(false)
  }

  const handleQrLogin = async (token?: string) => {
    const tokenToUse = token || qrToken
    if (!tokenToUse.trim()) {
      toast.error('Hatama token', {
        description: 'Favor hatama QR Code token',
      })
      return
    }

    setLoadingQr(true)
    const success = await loginWithQr(tokenToUse.trim())
    setLoadingQr(false)

    if (success) {
      toast.success('Login diak ona!')
      // The useEffect above will handle redirect
    } else {
      toast.error('Login monu', {
        description: 'QR Code la validu ka seidauk aktibu',
      })
    }
  }

  // If already logged in, redirect
  useEffect(() => {
    if (user) {
      if (user.role === 'SUPER_ADMIN') router.push('/admin/manage')
      else if (user.role === 'ADMIN_REGIONAL') router.push('/regional')
      else if (user.role === 'ADMIN_LOKAL') router.push('/lokal')
    }
  }, [user, router])

  // Auto-login with token from URL (scanned QR)
  const autoLoginAttempted = useRef(false)
  useEffect(() => {
    if (tokenFromUrl && !autoLoginAttempted.current) {
      autoLoginAttempted.current = true
      // Defer to avoid synchronous setState in effect
      const timer = setTimeout(() => handleQrLogin(tokenFromUrl), 0)
      return () => clearTimeout(timer)
    }
  }, [tokenFromUrl])

  // Show error from OAuth callback
  useEffect(() => {
    if (errorFromUrl) {
      const messages: Record<string, string> = {
        no_code: 'Kódigo OAuth la hetan',
        no_user: "La bele verifica uza-na'in",
        not_authorized: 'Email la autorizadu. Se Super Admin deit bele login ho Google.',
        callback_failed: 'Google OAuth monu. Tenta fali.',
      }
      toast.error('Login monu', {
        description: messages[errorFromUrl] || 'Erro descoñecidu',
      })
    }
  }, [errorFromUrl])

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <div className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md space-y-6">
          {/* Title */}
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <Church className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Tama iha SIADTL</h1>
            <p className="text-gray-600 mt-2">Hili metodu login</p>
          </div>

          {/* Google Login (Super Admin) */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">
                  SUPER ADMIN
                </Badge>
              </div>
              <CardTitle className="text-lg">Login ho Google</CardTitle>
              <CardDescription>
                Super Admin deit bele login ho Google OAuth. Email presiza autorizadu antes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleGoogleLogin}
                disabled={loadingGoogle}
                className="w-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                {loadingGoogle ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                )}
                Login ho Google
              </Button>
            </CardContent>
          </Card>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <Separator className="flex-1" />
            <span className="text-sm text-gray-400">ka</span>
            <Separator className="flex-1" />
          </div>

          {/* QR Login (Regional & Lokal Admin) */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                  ADMIN REGIONAL & LOKAL
                </Badge>
              </div>
              <CardTitle className="text-lg flex items-center gap-2">
                <QrCode className="w-5 h-5" />
                Login ho QR Code
              </CardTitle>
              <CardDescription>
                Hatama QR Code token ne'ebe Super Admin generate ona ba ita boot.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="qrToken">QR Token</Label>
                <div className="flex gap-2">
                  <Input
                    id="qrToken"
                    placeholder="Hatama token ne'e..."
                    value={qrToken}
                    onChange={(e) => setQrToken(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleQrLogin()}
                    className="font-mono text-sm"
                  />
                  <Button
                    onClick={() => handleQrLogin()}
                    disabled={loadingQr}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {loadingQr ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <LogIn className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {tokenFromUrl && (
                <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <ScanLine className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-700">
                    QR Code detekta husi URL. Tama...
                  </p>
                </div>
              )}

              <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-amber-700">
                  Token ne'ebe Super Admin hatama ona ba ita boot. La fahe ho seluk!
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Back to home */}
          <div className="text-center">
            <Button
              variant="link"
              onClick={() => router.push('/')}
              className="text-gray-500"
            >
              ← Fila ba Dashboard
            </Button>
          </div>
        </div>
      </div>

      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-gray-500">
            SIADTL — Sistema Informasaun Orsamentu Igreja Evangelika Asembleia de Deus Timor-Leste
          </p>
        </div>
      </footer>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>}>
      <LoginForm />
    </Suspense>
  )
}
