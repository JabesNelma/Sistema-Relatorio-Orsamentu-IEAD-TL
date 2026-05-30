'use client'

import { Church, Building2 } from 'lucide-react'
import { RoleCard } from '@/components/RoleCard'

export default function HomePage() {
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
              title="Admin Nasional"
              description="Haree no monitoriza relatóriu finanseiru husi igreja hotu-hotu iha nível nasional."
              href="/nasional"
            />
            <RoleCard
              icon={Church}
              title="Admin Regional"
              description="Hatama relatóriu finanseiru ba igreja ida ho detalla osan tama no gastu."
              href="/regional"
            />
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
