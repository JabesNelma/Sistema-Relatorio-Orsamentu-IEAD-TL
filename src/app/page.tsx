'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/lib/auth-store'
import { PublicHome } from '@/components/public/public-home'
import { SuperAdminDashboard } from '@/components/dashboards/super-admin-dashboard'
import { RegionalAdminDashboard } from '@/components/dashboards/regional-admin-dashboard'
import { LocalAdminDashboard } from '@/components/dashboards/local-admin-dashboard'
import { Church, Loader2 } from 'lucide-react'

export default function Home() {
  const user = useAuthStore((s) => s.user)
  const loading = useAuthStore((s) => s.loading)
  const fetchUser = useAuthStore((s) => s.fetchUser)

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

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
