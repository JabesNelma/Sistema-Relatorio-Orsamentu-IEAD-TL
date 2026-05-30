'use client'

import Link from 'next/link'
import { Church, Home } from 'lucide-react'

interface HeaderProps {
  title?: string
  showHome?: boolean
}

export function Header({ title, showHome = false }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
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

          {showHome && (
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <Home className="w-5 h-5" />
              <span className="text-sm font-medium">Fila Uma</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
