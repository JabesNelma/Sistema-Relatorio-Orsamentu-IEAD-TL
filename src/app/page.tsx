'use client'

import { Church, Building2, Shield, LogIn, LogOut } from 'lucide-react'
import { RoleCard } from '@/components/RoleCard'
import { CommentSection } from '@/components/CommentSection'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const { user, loading, logout } = useAuth()
  const router = useRouter()

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

            {/* User Status */}
            {!loading && user && (
              <div className="mt-4 inline-flex items-center gap-3 bg-white border border-gray-200 px-4 py-2 rounded-lg shadow-sm">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-700">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">
                    {user.role === 'SUPER_ADMIN' ? 'Super Admin' : user.role === 'ADMIN_REGIONAL' ? 'Admin Regional' : 'Admin Lokal'}
                  </p>
                </div>
                {user.role === 'SUPER_ADMIN' && (
                  <Button
                    size="sm"
                    onClick={() => router.push('/admin/manage')}
                    className="bg-purple-600 hover:bg-purple-700 ml-2"
                  >
                    <Shield className="w-4 h-4 mr-1" />
                    Maneja Admin
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => logout()}
                  className="text-red-500 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            )}

            {!loading && !user && (
              <div className="mt-4">
                <Button
                  onClick={() => router.push('/login')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Login
                </Button>
              </div>
            )}
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

          {/* Super Admin Access */}
          {!loading && user?.role === 'SUPER_ADMIN' && (
            <div className="mt-6">
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 text-center">
                <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                  <Shield className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-purple-900 mb-1">Super Admin Panel</h3>
                <p className="text-sm text-purple-600 mb-4">
                  Maneja admin hotu-hotu, generate QR Code, no haree login history.
                </p>
                <Button
                  onClick={() => router.push('/admin/manage')}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Tama iha Maneja Admin
                </Button>
              </div>
            </div>
          )}

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
