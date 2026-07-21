import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, generateLoginToken, toSafeUser } from '@/lib/auth'

// POST /api/admins/[id]/token
// Regenerate the secret login token (invalidates the old QR code / link).
// Useful when a printed QR is lost or suspected compromised: super/regional
// admin issues a new token and the old link stops working immediately.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  const loginToken = generateLoginToken()
  const updated = await db.user.update({
    where: { id },
    data: { loginToken, tokenActive: true, tokenCreatedAt: new Date() },
    include: {
      region: { select: { id: true, name: true } },
      local: { select: { id: true, name: true } },
    },
  })

  return NextResponse.json({
    user: toSafeUser(updated),
    loginToken,
    loginUrl: `/?token=${loginToken}`,
  })
}
