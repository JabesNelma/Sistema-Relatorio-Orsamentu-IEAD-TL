import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// PATCH /api/admins/[id] -> toggle active
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { active } = body

  const target = await db.user.findUnique({ where: { id } })
  if (!target) return NextResponse.json({ error: 'Admin tidak ditemukan' }, { status: 404 })

  if (me.role === 'SUPER_ADMIN') {
    if (target.role !== 'REGIONAL_ADMIN') {
      return NextResponse.json({ error: 'Hanya dapat mengelola admin wilayah' }, { status: 403 })
    }
  } else if (me.role === 'REGIONAL_ADMIN') {
    if (target.role !== 'LOCAL_ADMIN' || target.regionId !== me.regionId) {
      return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 })
    }
  } else {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 })
  }

  const updated = await db.user.update({
    where: { id },
    data: { active: typeof active === 'boolean' ? active : target.active },
  })
  return NextResponse.json({ user: { id: updated.id, active: updated.active } })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const target = await db.user.findUnique({ where: { id } })
  if (!target) return NextResponse.json({ error: 'Admin tidak ditemukan' }, { status: 404 })

  if (me.role === 'SUPER_ADMIN') {
    if (target.role !== 'REGIONAL_ADMIN') {
      return NextResponse.json({ error: 'Hanya dapat mengelola admin wilayah' }, { status: 403 })
    }
  } else if (me.role === 'REGIONAL_ADMIN') {
    if (target.role !== 'LOCAL_ADMIN' || target.regionId !== me.regionId) {
      return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 })
    }
  } else {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 })
  }

  await db.user.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
