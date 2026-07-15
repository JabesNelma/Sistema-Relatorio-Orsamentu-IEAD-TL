'use client'

import { Church, Building2, Shield, LogOut, User as UserIcon } from 'lucide-react'
import { RoleCard } from '@/components/RoleCard'
import { CommentSection } from '@/components/CommentSection'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/auth/types'
import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const { user, loading, logout } = useAuth()
  const router = useRouter()

  // If authenticated, redirect to appropriate dashboard
  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'SUPER_ADMIN') {
        router.push('/admin/manage')
      } else if (user.role === 'ADMIN_REGIONAL') {
        router.push('/regional')
      } else if (user.role === 'ADMIN_LOKAL') {
        router.push('/lokal')
      }
    }
  }, [user, loading, router])

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="text-center">
            {/* Logo */}
            <div className="mx-auto w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
              <Church className="w-10 h-10 text-white" />
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 leading-tight">
              Sistema Informasaun Orsamentu
              <br />
              <span className="text-blue-600">Igreja Evangelika Asembleia de Deus</span>
              <br />
              Timor-Leste
            </h1>

            {/* Subtitle */}
            <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              Sistema ida ne'e ajuda igreja sira atu hatama relatóriu finanseiru no monitoriza osan tama no gastu iha nível nasional.
            </p>

            {/* Badge */}
            <div className="mt-6 inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
              Versão 1.0 - Live Demo
            </div>
          </div>
        </div>
      </div>

      {/* Role Selection Section */}
      <div className="flex-1 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center mb-8">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
              Hili Aksesu
            </h2>
            <p className="text-gray-500">
              Hili rota ida atu tama iha sistema
            </p>
          </div>

          {/* Auth status display */}
          {!loading && user ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <p className="text-sm text-blue-700 mb-3">
                Ita boot tama ona. Fila ba dashboard:
              </p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <Badge className={ROLE_COLORS[user.role]}>
                  <UserIcon className="w-3 h-3 mr-1" />
                  {user.name} - {ROLE_LABELS[user.role]}
                </Badge>
                <Button size="sm" variant="outline" onClick={logout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sai
                </Button>
              </div>
            </div>
          ) : !loading ? (
            <div className="text-center">
              <Link href="/login">
                <Button variant="outline" className="mb-4">
                  <Shield className="w-4 h-4 mr-2" />
                  Tama Sistema (Login)
                </Button>
              </Link>
            </div>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <RoleCard
              icon={Building2}
              title="Admin Regional"
              description="Haree no monitoriza relatóriu finanseiru husi igreja hotu-hotu iha nível regional."
              href="/regional"
            />
            <RoleCard
              icon={Church}
              title="Admin Lokal"
              description="Hatama relatóriu finanseiru ba igreja ida ho detalla osan tama no gastu."
              href="/lokal"
            />
          </div>

          {/* Comment Section */}
          <div className="mt-8">
            <CommentSection page="landing" />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-gray-500">
            © 2024 Igreja Evangelika Asembleia de Deus Timor-Leste. Direitu Hotu-hotu.
          </p>
        </div>
      </footer>
    </main>
  )
}
