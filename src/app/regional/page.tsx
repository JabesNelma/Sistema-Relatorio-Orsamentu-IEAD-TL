'use client'

import { Header } from '@/components/Header'
import { SummaryCard, StatCard } from '@/components/SummaryCard'
import { ReportTable } from '@/components/ReportTable'
import { RevenueChart } from '@/components/RevenueChart'
import { ExpenseChart } from '@/components/ExpenseChart'
import { RegionPieChart } from '@/components/RegionPieChart'
import { CommentSection } from '@/components/CommentSection'
import { useReports } from '@/hooks/use-data'
import { calculateNationalSummary } from '@/lib/data'
import { Church, TrendingUp, TrendingDown, Wallet, Loader2 } from 'lucide-react'

export default function RegionalPage() {
  const { reports, loading, error } = useReports()
  const summary = calculateNationalSummary(reports)

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col">
        <Header title="Admin Regional" showHome />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-2">Erro atu karrega dadus</p>
            <p className="text-gray-500 text-sm">{error}</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <Header title="Admin Regional" showHome />

      <div className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Page Header */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Dashboard Regional</h2>
            <p className="text-gray-600 mt-1">
              Monitoriza relatóriu finanseiru husi igreja hotu-hotu iha nível regional.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <>
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
                  title="Saldo Regional"
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
            </>
          )}

          {/* Comment Section */}
          <CommentSection page="nasional" />
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
