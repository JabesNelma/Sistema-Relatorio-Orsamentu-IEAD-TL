import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET transactions
// - LOCAL_ADMIN: their local's transactions
// - REGIONAL_ADMIN: all transactions in their region's locals (with optional localId filter)
// - SUPER_ADMIN: all transactions
export async function GET(req: NextRequest) {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const localId = searchParams.get('localId')
  const type = searchParams.get('type')
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const limit = parseInt(searchParams.get('limit') || '200', 10)

  const where: any = {}
  if (type && ['CASH_IN', 'CASH_OUT', 'REVENUE'].includes(type)) {
    where.type = type
  }
  if (from || to) {
    where.date = {}
    if (from) where.date.gte = new Date(from)
    if (to) where.date.lte = new Date(to)
  }

  if (me.role === 'LOCAL_ADMIN') {
    where.localId = me.localId!
  } else if (me.role === 'REGIONAL_ADMIN') {
    where.local = { regionId: me.regionId! }
    if (localId) where.localId = localId
  } else if (me.role === 'SUPER_ADMIN') {
    if (localId) where.localId = localId
  }

  const transactions = await db.transaction.findMany({
    where,
    include: {
      local: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
    },
    orderBy: { date: 'desc' },
    take: limit,
  })

  return NextResponse.json({ transactions })
}

// POST a new transaction (LOCAL_ADMIN only, for their own local)
export async function POST(req: NextRequest) {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (me.role !== 'LOCAL_ADMIN' || !me.localId) {
    return NextResponse.json({ error: 'Hanya admin lokal yang dapat input transaksi' }, { status: 403 })
  }

  const body = await req.json()
  const { type, category, amount, description, date } = body

  if (!type || !['CASH_IN', 'CASH_OUT', 'REVENUE'].includes(type)) {
    return NextResponse.json({ error: 'Tipe transaksi tidak valid' }, { status: 400 })
  }
  if (!category || !category.trim()) {
    return NextResponse.json({ error: 'Kategori wajib diisi' }, { status: 400 })
  }
  const amt = parseFloat(amount)
  if (isNaN(amt) || amt <= 0) {
    return NextResponse.json({ error: 'Jumlah harus angka positif' }, { status: 400 })
  }

  const tx = await db.transaction.create({
    data: {
      localId: me.localId,
      type,
      category: category.trim(),
      amount: amt,
      description: description?.trim() || null,
      date: date ? new Date(date) : new Date(),
      createdById: me.id,
    },
    include: {
      local: { select: { id: true, name: true } },
    },
  })

  return NextResponse.json({ transaction: tx })
}
