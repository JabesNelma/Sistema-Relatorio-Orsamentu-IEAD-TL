import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, generateLoginToken, toSafeUser, deleteSupabaseAuthUser } from '@/lib/auth'

// PATCH /api/admins/[id]
// Body can include: { active?, tokenActive? }
// - active: enable/disable the whole admin account
// - tokenActive: enable/disable the QR-code login link (so a lost QR can be revoked)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { active, tokenActive } = body

  const target = await db.user.findUnique({ where: { id } })
  if (!target) return NextResponse.json({ error: 'Admin tidak ditemukan' }, { status: 404 })

  if (me.role === 'SUPER_ADMIN') {
    if (target.role !== 'REGIONAL_ADMIN' && target.role !== 'LOCAL_ADMIN') {
      return NextResponse.json({ error: 'Hanya dapat mengelola admin wilayah/lokal' }, { status: 403 })
    }
  } else {
    // Regional/local admins no longer manage sub-admins; only the super admin can.
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 })
  }

  const data: any = {}
  if (typeof active === 'boolean') data.active = active
  if (typeof tokenActive === 'boolean') data.tokenActive = tokenActive

  const updated = await db.user.update({
    where: { id },
    data,
    include: {
      region: { select: { id: true, name: true } },
      local: { select: { id: true, name: true } },
    },
  })
  return NextResponse.json({ user: toSafeUser(updated) })
}

// DELETE /api/admins/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const target = await db.user.findUnique({ where: { id } })
  if (!target) return NextResponse.json({ error: 'Admin tidak ditemukan' }, { status: 404 })

  if (me.role === 'SUPER_ADMIN') {
    if (target.role !== 'REGIONAL_ADMIN' && target.role !== 'LOCAL_ADMIN') {
      return NextResponse.json({ error: 'Hanya dapat mengelola admin wilayah/lokal' }, { status: 403 })
    }
  } else {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 })
  }

  await deleteSupabaseAuthUser(target.authUserId).catch(() => {})
  await db.user.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
