'use client'

import { Suspense, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/auth-store'
import { PublicHome } from '@/components/public/public-home'
import { SuperAdminDashboard } from '@/components/dashboards/super-admin-dashboard'
import { RegionalAdminDashboard } from '@/components/dashboards/regional-admin-dashboard'
import { LocalAdminDashboard } from '@/components/dashboards/local-admin-dashboard'
import { QrLoginScreen } from '@/components/auth/qr-login-screen'
import { Church, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

function HomeContent() {
  const user = useAuthStore((s) => s.user)
  const loading = useAuthStore((s) => s.loading)
  const fetchUser = useAuthStore((s) => s.fetchUser)
  const searchParams = useSearchParams()
  const router = useRouter()

  const token = searchParams.get('token')

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  // Surface OAuth callback results (set by /auth/callback).
  useEffect(() => {
    const err = searchParams.get('error')
    const ok = searchParams.get('success')
    if (err) {
      toast.error(decodeURIComponent(err))
      window.history.replaceState({}, '', '/')
    } else if (ok) {
      toast.success(decodeURIComponent(ok))
      window.history.replaceState({}, '', '/')
    }
  }, [searchParams])

  // If a QR login token is present in the URL and the visitor is not yet logged
  // in, show the dedicated QR login screen (regional/local admins).
  if (token && !user && !loading) {
    return <QrLoginScreen token={token} onBack={() => router.push('/')} />
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-cream gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-emerald-deep flex items-center justify-center">
            <Church className="w-7 h-7 text-gold" />
          </div>
          <div className="absolute -inset-2 rounded-full border-2 border-gold/30 animate-ping" />
        </div>
        <div className="flex items-center gap-2 text-foreground/60">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Memuat portal...</span>
        </div>
      </div>
    )
  }

  if (!user) {
    return <PublicHome />
  }

  if (user.role === 'SUPER_ADMIN') return <SuperAdminDashboard />
  if (user.role === 'REGIONAL_ADMIN') return <RegionalAdminDashboard />
  if (user.role === 'LOCAL_ADMIN') return <LocalAdminDashboard />

  return <PublicHome />
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center bg-cream gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-emerald-deep flex items-center justify-center">
              <Church className="w-7 h-7 text-gold" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-foreground/60">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Memuat portal...</span>
          </div>
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  )
}
