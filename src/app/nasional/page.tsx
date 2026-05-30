'use client'

import { Header } from '@/components/Header'
import { SummaryCard, StatCard } from '@/components/SummaryCard'
import { ReportTable } from '@/components/ReportTable'
import { RevenueChart } from '@/components/RevenueChart'
import { ExpenseChart } from '@/components/ExpenseChart'
import { RegionPieChart } from '@/components/RegionPieChart'
import { dummyReports, calculateNationalSummary, calculateTotalRevenue, calculateTotalExpense, calculateBalance } from '@/lib/data'
import { Church, TrendingUp, TrendingDown, Wallet } from 'lucide-react'

export default function NasionalPage() {
  const reports = dummyReports
  const summary = calculateNationalSummary(reports)

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <Header title="Admin Nasional" showHome />

      <div className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Page Header */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Dashboard Nasional</h2>
            <p className="text-gray-600 mt-1">
              Monitoriza relatóriu finanseiru husi igreja hotu-hotu iha nível nasional.
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Igreja"
              value={summary.totalChurches}
              icon={Church}
              subtitle="Igreja ho relatóriu"
            />
            <SummaryCard
              title="Total Osan Tama"
              amount={summary.totalRevenue}
              icon={TrendingUp}
              variant="success"
            />
            <SummaryCard
              title="Total Gastu"
              amount={summary.totalExpense}
              icon={TrendingDown}
              variant="danger"
            />
            <SummaryCard
              title="Saldo Nasional"
              amount={summary.balance}
              icon={Wallet}
              variant={summary.balance >= 0 ? 'success' : 'danger'}
            />
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RevenueChart reports={reports} />
            <ExpenseChart reports={reports} />
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 gap-6">
            <RegionPieChart reports={reports} />
          </div>

          {/* Report Table */}
          <ReportTable reports={reports} />
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-gray-500">
            SIADTL - Sistema Informasaun Orsamentu Igreja Evangelika Asembleia de Deus Timor-Leste
          </p>
        </div>
      </footer>
    </main>
  )
}
