'use client'

import Link from 'next/link'
import { Church, Home, LogOut, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'

interface HeaderProps {
  title?: string
  showHome?: boolean
}

export function Header({ title, showHome = false }: HeaderProps) {
  const { user, loading, logout } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo + Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Church className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                {title || 'SIADTL'}
              </h1>
              {title && (
                <p className="text-xs text-gray-500">
                  Sistema Informasaun Orsamentu
                </p>
              )}
            </div>
          </div>

          {/* Right: Home + User Info */}
          <div className="flex items-center gap-3">
            {showHome && (
              <Link
                href="/"
                className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
              >
                <Home className="w-5 h-5" />
                <span className="text-sm font-medium hidden sm:inline">Fila Uma</span>
              </Link>
            )}

            {/* User Menu */}
            {!loading && user && (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-700">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <div className="flex items-center gap-1">
                      {user.role === 'SUPER_ADMIN' && (
                        <Badge className="bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0">
                          <Shield className="w-2.5 h-2.5 mr-0.5" />
                          Super Admin
                        </Badge>
                      )}
                      {user.role === 'ADMIN_REGIONAL' && (
                        <Badge className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0">
                          Regional
                        </Badge>
                      )}
                      {user.role === 'ADMIN_LOKAL' && (
                        <Badge className="bg-green-100 text-green-700 text-[10px] px-1.5 py-0">
                          Lokal
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className="text-red-500 hover:bg-red-50 hover:text-red-600"
                  title="Sai (Logout)"
                >
                  <LogOut className="w-5 h-5" />
                </Button>
              </div>
            )}

            {/* Login button for unauthenticated users */}
            {!loading && !user && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/login')}
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                Login
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
