'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'
import { formatUSD } from '@/lib/data'

interface SummaryCardProps {
  title: string
  amount: number
  icon: LucideIcon
  variant?: 'default' | 'success' | 'warning' | 'danger'
}

const variantStyles = {
  default: {
    bg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    textColor: 'text-gray-900',
  },
  success: {
    bg: 'bg-green-50',
    iconColor: 'text-green-600',
    textColor: 'text-green-600',
  },
  warning: {
    bg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    textColor: 'text-amber-600',
  },
  danger: {
    bg: 'bg-red-50',
    iconColor: 'text-red-600',
    textColor: 'text-red-600',
  },
}

export function SummaryCard({ title, amount, icon: Icon, variant = 'default' }: SummaryCardProps) {
  const styles = variantStyles[variant]

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        <div className={`p-2 rounded-lg ${styles.bg}`}>
          <Icon className={`w-4 h-4 ${styles.iconColor}`} />
        </div>
      </CardHeader>
      <CardContent>
        <p className={`text-2xl font-bold ${styles.textColor}`}>
          {formatUSD(amount)}
        </p>
      </CardContent>
    </Card>
  )
}

// Simple stat card for count values
interface StatCardProps {
  title: string
  value: number | string
  icon: LucideIcon
  subtitle?: string
}

export function StatCard({ title, value, icon: Icon, subtitle }: StatCardProps) {
  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        <div className="p-2 rounded-lg bg-blue-50">
          <Icon className="w-4 h-4 text-blue-600" />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  )
}
