'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { ChurchReport, getRevenueByRegion, formatUSD } from '@/lib/data'
import { PieChartIcon } from 'lucide-react'

interface RegionPieChartProps {
  reports: ChurchReport[]
}

const COLORS = [
  '#2563eb', // blue
  '#16a34a', // green
  '#dc2626', // red
  '#ea580c', // orange
  '#7c3aed', // purple
  '#0891b2', // cyan
  '#ca8a04', // yellow
  '#be185d', // pink
  '#4f46e5', // indigo
  '#059669', // emerald
]

export function RegionPieChart({ reports }: RegionPieChartProps) {
  const data = getRevenueByRegion(reports)

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-blue-50">
            <PieChartIcon className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <CardTitle className="text-lg text-gray-900">Distribuisaun Receita por Região</CardTitle>
            <CardDescription>Persentajen osan tama husi região</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [formatUSD(value), 'Receita']}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Legend
                layout="horizontal"
                align="center"
                verticalAlign="bottom"
                formatter={(value) => <span className="text-sm text-gray-600">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
