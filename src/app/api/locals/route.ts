import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET locals.
// - REGIONAL_ADMIN: locals in their region (with admin + transaction counts)
// - LOCAL_ADMIN: their own local
// - SUPER_ADMIN: all locals
export async function GET() {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let locals
  if (me.role === 'SUPER_ADMIN') {
    locals = await db.local.findMany({
      include: {
        region: { select: { id: true, name: true } },
        _count: { select: { admins: true, transactions: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  } else if (me.role === 'REGIONAL_ADMIN') {
    locals = await db.local.findMany({
      where: { regionId: me.regionId! },
      include: {
        region: { select: { id: true, name: true } },
        _count: { select: { admins: true, transactions: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  } else {
    locals = await db.local.findMany({
      where: { id: me.localId ?? undefined },
      include: {
        region: { select: { id: true, name: true } },
        _count: { select: { admins: true, transactions: true } },
      },
    })
  }

  return NextResponse.json({ locals })
}
