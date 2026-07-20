'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { supabaseBrowser } from '@/lib/supabase-browser'
import { setSessionToken } from '@/lib/api-fetch'
import { useAuthStore } from '@/lib/auth-store'

// Mirrors the server-side allow-list (src/app/api/auth/google/session/route.ts
// re-checks this authoritatively using SUPER_ADMIN_EMAIL). Kept on the client
// only so unauthorized users see a clear message without a round-trip.
const ALLOWED_EMAIL = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL

function redirectWithError(router: ReturnType<typeof useRouter>, message: string, delay = 1800) {
  setTimeout(() => {
    router.replace(`/?error=${encodeURIComponent(message)}`)
  }, delay)
}

export default function AuthCallbackPage() {
  const router = useRouter()
  const setUser = useAuthStore((s) => s.setUser)
  const [message, setMessage] = useState('Menyelesaikan login Google...')

  useEffect(() => {
    let cancelled = false

    const fail = (msg: string, delay?: number) => {
      setMessage(msg)
      supabaseBrowser.auth.signOut().catch(() => {})
      redirectWithError(router, msg, delay)
    }

    const run = async () => {
      const params = new URLSearchParams(window.location.search)
      const errorParam = params.get('error')
      const errorDescription = params.get('error_description')

      if (errorParam) {
        fail(errorDescription || errorParam)
        return
      }

      const code = params.get('code')
      if (!code) {
        fail('Kode otorisasi Google tidak ditemukan.')
        return
      }

      // PKCE exchange — the code_verifier lives in this browser's storage.
      const { error } = await supabaseBrowser.auth.exchangeCodeForSession(code)
      if (error) {
        fail(`Login Google gagal: ${error.message}`)
        return
      }

      const { data: userData, error: userError } = await supabaseBrowser.auth.getUser()
      if (userError || !userData.user?.email) {
        fail('Tidak dapat mengambil akun Google.')
        return
      }

      const email = userData.user.email.toLowerCase().trim()
      if (ALLOWED_EMAIL && email !== ALLOWED_EMAIL.toLowerCase().trim()) {
        fail('Email Google ini tidak diizinkan. Hanya akun Super Admin yang terdaftar dapat login.', 2200)
        return
      }

      const { data: sessionData } = await supabaseBrowser.auth.getSession()
      try {
        const res = await fetch('/api/auth/google/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ accessToken: sessionData.session?.access_token }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          fail(data.error || 'Login gagal.')
          return
        }
        if (cancelled) return
        setSessionToken(data.sessionToken)
        setUser(data.user)
        // App session is minted; drop the Supabase OAuth session so no token
        // lingers in the browser.
        await supabaseBrowser.auth.signOut().catch(() => {})
        router.replace('/')
      } catch {
        fail('Terjadi kesalahan jaringan saat login.')
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [router, setUser])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-cream">
      <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      <p className="max-w-xs px-4 text-center text-sm text-foreground/70">{message}</p>
    </div>
  )
}
