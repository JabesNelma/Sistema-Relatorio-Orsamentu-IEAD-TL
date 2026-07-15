'use client'

import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Church, Loader2, AlertCircle, QrCode, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'

function QrLoginContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  // Initialize token state from URL param (no effect needed)
  const [token, setToken] = useState(() => searchParams.get('token') || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const errorMessages: Record<string, string> = {
    Token_required: 'Token presiza',
    Token_invalid: 'QR Code la validu ka la existente',
    QR_disabled: 'QR Code nee disable ona',
    QR_expired: 'QR Code nee kadalu ona',
    QR_used: 'QR Code nee uza ona',
    User_inactive: 'User nee la aktivo ona',
    Login_failed: 'Login konaba. Tenta fali.',
  }

  const doLogin = useCallback(
    async (t: string) => {
      if (!t) {
        setError('Token presiza')
        return
      }

      setLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/auth/qr-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: t }),
        })

        const data = await response.json()

        if (data.success) {
          // Redirect to role-appropriate page
          router.push(data.redirect || '/')
        } else {
          setError(errorMessages[data.error as string] || data.error || 'Login konaba')
          setLoading(false)
        }
      } catch {
        setError('Erro koneksaun. Tenta fali.')
        setLoading(false)
      }
    },
    [router]
  )

  // Auto-login on mount if token came from URL.
  // This is a one-time side effect (guarded by ref) that triggers an async
  // network call. The setState calls happen asynchronously after fetch,
  // not synchronously in the effect body.
  const autoLoginRef = useRef(false)
  useEffect(() => {
    if (token && !autoLoginRef.current) {
      autoLoginRef.current = true
      // eslint-disable-next-line react-hooks/set-state-in-effect
      doLogin(token)
    }
  }, [token, doLogin])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    doLogin(token)
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Logo & Title */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <Church className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Login QR Code</h1>
          <p className="text-sm text-gray-600 mt-1">
            Hatama token husi QR Code nee ita boot nian
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* QR Token Input Card */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl text-center flex items-center justify-center gap-2">
              <QrCode className="w-5 h-5 text-blue-600" />
              Hatama Token QR
            </CardTitle>
            <CardDescription className="text-center">
              Token nee hetan husi Super Admin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="token">QR Token</Label>
                <Input
                  id="token"
                  type="text"
                  placeholder="Hatama token..."
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  disabled={loading}
                  className="font-mono text-sm"
                />
              </div>

              <Button
                type="submit"
                disabled={loading || !token}
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <LogIn className="w-5 h-5 mr-2" />
                )}
                {loading ? 'Login...' : 'Tama'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Back to Login */}
        <div className="text-center">
          <Link
            href="/login"
            className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
          >
            ← Fila ba Login
          </Link>
        </div>
      </div>
    </main>
  )
}

export default function QrLoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </main>
      }
    >
      <QrLoginContent />
    </Suspense>
  )
}
