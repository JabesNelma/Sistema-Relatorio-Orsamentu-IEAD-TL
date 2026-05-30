'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { ChurchReport, calculateTotalExpense, formatUSD } from '@/lib/data'
import { TrendingDown } from 'lucide-react'

interface ExpenseChartProps {
  reports: ChurchReport[]
}

export function ExpenseChart({ reports }: ExpenseChartProps) {
  const data = reports.map((report) => ({
    name: report.churchName.replace('Igreja ', '').substring(0, 12),
    fullName: report.churchName,
    expense: calculateTotalExpense(report),
  }))

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-red-50">
            <TrendingDown className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <CardTitle className="text-lg text-gray-900">Gastu por Igreja</CardTitle>
            <CardDescription>Distribuisaun despesa husi igreja hotu-hotu</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={60}
                tick={{ fill: '#6b7280', fontSize: 10 }}
              />
              <YAxis
                tick={{ fill: '#6b7280', fontSize: 11 }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(value: number) => [formatUSD(value), 'Gastu']}
                labelFormatter={(label, payload) => {
                  const item = payload?.[0]?.payload
                  return item?.fullName || label
                }}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Bar
                dataKey="expense"
                fill="#dc2626"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
