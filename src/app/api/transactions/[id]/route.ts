import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (me.role !== 'LOCAL_ADMIN' || !me.localId) {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 })
  }

  const { id } = await params
  const tx = await db.transaction.findUnique({ where: { id } })
  if (!tx) return NextResponse.json({ error: 'Transaksi tidak ditemukan' }, { status: 404 })
  if (tx.localId !== me.localId) {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 })
  }

  await db.transaction.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
