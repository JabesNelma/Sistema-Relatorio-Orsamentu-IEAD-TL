import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET regions (super admin sees all; regional admin sees their own; local admin sees their region)
export async function GET() {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let regions
  if (me.role === 'SUPER_ADMIN') {
    regions = await db.region.findMany({
      include: {
        _count: { select: { admins: true, locals: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  } else {
    regions = await db.region.findMany({
      where: { id: me.regionId ?? undefined },
      include: {
        _count: { select: { admins: true, locals: true } },
      },
    })
  }

  return NextResponse.json({ regions })
}
