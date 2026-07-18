import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET /api/reports
// Aggregated financial report for the regional admin (and super admin overview).
// Returns:
//  - summary: totals per type
//  - perLocal: totals per local church in the region
//  - monthly: last 6 months grouped by month and type
//  - byCategory: breakdown by category
export async function GET(req: NextRequest) {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (me.role === 'LOCAL_ADMIN') {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const localIdFilter = searchParams.get('localId')

  // Scope locals based on role
  let locals
  if (me.role === 'SUPER_ADMIN') {
    locals = await db.local.findMany({
      include: { region: { select: { name: true } } },
    })
  } else {
    locals = await db.local.findMany({
      where: { regionId: me.regionId! },
      include: { region: { select: { name: true } } },
    })
  }

  const localIds = locals.map((l) => l.id)
  if (localIds.length === 0) {
    return NextResponse.json({
      summary: { CASH_IN: 0, CASH_OUT: 0, REVENUE: 0, net: 0 },
      perLocal: [],
      monthly: [],
      byCategory: [],
      locals: [],
    })
  }

  const txWhere: any = { localId: { in: localIds } }
  if (localIdFilter) txWhere.localId = localIdFilter

  const transactions = await db.transaction.findMany({
    where: txWhere,
    select: { id: true, localId: true, type: true, category: true, amount: true, date: true },
  })

  // Summary by type
  const summary = { CASH_IN: 0, CASH_OUT: 0, REVENUE: 0 }
  for (const t of transactions) {
    summary[t.type as keyof typeof summary] += t.amount
  }
  const net = summary.CASH_IN + summary.REVENUE - summary.CASH_OUT

  // Per local
  const localMap = new Map<string, { id: string; name: string; region: string; CASH_IN: number; CASH_OUT: number; REVENUE: number }>()
  for (const l of locals) {
    localMap.set(l.id, {
      id: l.id,
      name: l.name,
      region: l.region?.name ?? '-',
      CASH_IN: 0,
      CASH_OUT: 0,
      REVENUE: 0,
    })
  }
  for (const t of transactions) {
    const entry = localMap.get(t.localId)
    if (entry) {
      entry[t.type as 'CASH_IN' | 'CASH_OUT' | 'REVENUE'] += t.amount
    }
  }
  const perLocal = Array.from(localMap.values())

  // Monthly (last 6 months)
  const now = new Date()
  const months: { label: string; key: string; CASH_IN: number; CASH_OUT: number; REVENUE: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' })
    months.push({ label, key, CASH_IN: 0, CASH_OUT: 0, REVENUE: 0 })
  }
  const monthIndex = new Map(months.map((m, i) => [m.key, i]))
  for (const t of transactions) {
    const d = new Date(t.date)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const idx = monthIndex.get(key)
    if (idx !== undefined) {
      months[idx][t.type as 'CASH_IN' | 'CASH_OUT' | 'REVENUE'] += t.amount
    }
  }

  // By category
  const catMap = new Map<string, { category: string; type: string; amount: number }>()
  for (const t of transactions) {
    const k = `${t.type}__${t.category}`
    const entry = catMap.get(k) ?? { category: t.category, type: t.type, amount: 0 }
    entry.amount += t.amount
    catMap.set(k, entry)
  }
  const byCategory = Array.from(catMap.values()).sort((a, b) => b.amount - a.amount)

  return NextResponse.json({
    summary: { ...summary, net },
    perLocal,
    monthly: months,
    byCategory,
    locals: locals.map((l) => ({ id: l.id, name: l.name, region: l.region?.name ?? '-' })),
  })
}
