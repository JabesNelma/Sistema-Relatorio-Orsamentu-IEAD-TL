'use client'

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'

type Props = {
  label: string
  value: string
  sublabel?: string
  icon: React.ComponentType<{ className?: string }>
  tone?: 'gold' | 'emerald' | 'rose' | 'neutral'
  trend?: 'up' | 'down'
}

const toneClasses: Record<string, { bg: string; text: string }> = {
  gold: { bg: 'bg-gold/15', text: 'text-gold' },
  emerald: { bg: 'bg-primary/12', text: 'text-primary' },
  rose: { bg: 'bg-destructive/10', text: 'text-destructive' },
  neutral: { bg: 'bg-muted', text: 'text-foreground/70' },
}

export function StatCard({ label, value, sublabel, icon: Icon, tone = 'neutral', trend }: Props) {
  const t = toneClasses[tone]
  return (
    <Card className="relative p-5 border-border/70 hover:shadow-elegant transition-shadow overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-40 blur-2xl pointer-events-none" style={{ background: 'var(--gold)', opacity: 0.04 }} />
      <div className="flex items-start justify-between gap-3 relative">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
          <p className="mt-2 font-serif text-2xl sm:text-3xl text-foreground leading-none truncate">{value}</p>
          {sublabel && (
            <p className="mt-1.5 text-xs text-foreground/55 flex items-center gap-1">
              {trend === 'up' && <ArrowUpRight className="w-3 h-3 text-primary" />}
              {trend === 'down' && <ArrowDownRight className="w-3 h-3 text-destructive" />}
              {sublabel}
            </p>
          )}
        </div>
        <div className={cn('w-11 h-11 rounded-lg flex items-center justify-center shrink-0', t.bg)}>
          <Icon className={cn('w-5 h-5', t.text)} />
        </div>
      </div>
    </Card>
  )
}
