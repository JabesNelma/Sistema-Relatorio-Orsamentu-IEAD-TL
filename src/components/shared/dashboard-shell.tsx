'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Church, LogOut, Home } from 'lucide-react'
import { useAuthStore } from '@/lib/auth-store'
import { ROLE_LABELS } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LoginDialog } from '@/components/auth/login-dialog'

type Props = {
  children: React.ReactNode
  accent?: 'gold' | 'emerald'
}

const roleBadgeClass: Record<string, string> = {
  SUPER_ADMIN: 'bg-primary/10 text-primary border-primary/20',
  REGIONAL_ADMIN: 'bg-gold/15 text-gold border-gold/30',
  LOCAL_ADMIN: 'bg-emerald-deep/10 text-primary border-emerald-deep/20',
}

export function DashboardShell({ children, accent = 'emerald' }: Props) {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const router = useRouter()
  const [loginOpen, setLoginOpen] = useState(false)

  async function handleLogout() {
    await logout()
    // Clear any ?token= query so the QR login screen doesn't immediately
    // reappear for regional/local admins who logged in via a QR link.
    router.push('/')
    setLoginOpen(true)
  }

  if (!user) return null

  return (
    <div className="min-h-screen flex flex-col bg-cream/40">
      <header className="sticky top-0 z-40 bg-emerald-deep text-cream shadow-elegant-lg">
        <div className="absolute inset-x-0 bottom-0 h-px divider-gold opacity-60" />
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-gold/15 border border-gold/40 flex items-center justify-center shrink-0">
              <Church className="w-4.5 h-4.5 text-gold" />
            </div>
            <div className="min-w-0">
              <p className="font-serif text-base sm:text-lg text-cream leading-none tracking-wide truncate">
                Gereja Emanuel
              </p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-cream/60 mt-0.5">
                Portal Laporan Keuangan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex flex-col items-end leading-none">
              <span className="text-sm font-medium text-cream truncate max-w-[180px]">{user.name}</span>
              <span className="text-[11px] text-cream/60 mt-0.5 truncate max-w-[180px]">
                {user.local?.name || user.region?.name || 'Administrator Pusat'}
              </span>
            </div>
            <Badge variant="outline" className={cn('border font-medium', roleBadgeClass[user.role])}>
              {ROLE_LABELS[user.role]}
            </Badge>
            <Button
              onClick={handleLogout}
              size="sm"
              variant="outline"
              className="h-9 bg-cream/5 border-cream/25 text-cream hover:bg-cream/15 hover:text-cream"
            >
              <LogOut className="w-4 h-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Keluar</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
        {children}
      </main>

      <footer className="mt-auto bg-emerald-deep text-cream/50 border-t border-cream/10">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          <p className="text-[11px]">
            © {new Date().getFullYear()} Gereja Emanuel · Sistem Laporan Keuangan
          </p>
          <button onClick={handleLogout} className="text-[11px] text-cream/60 hover:text-gold transition-colors flex items-center gap-1">
            <Home className="w-3 h-3" />
            Keluar ke Beranda
          </button>
        </div>
      </footer>

      <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
    </div>
  )
}
