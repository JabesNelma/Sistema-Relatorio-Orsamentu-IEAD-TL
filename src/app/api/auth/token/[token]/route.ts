import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/auth/token/[token]
// Validates a QR-code login token WITHOUT authenticating. Returns just enough
// info for the login screen to greet the admin (name, role, scope) so they know
// whose password to enter. Does NOT create a session.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const user = await db.user.findUnique({
    where: { loginToken: token },
    select: {
      id: true,
      name: true,
      role: true,
      active: true,
      tokenActive: true,
      region: { select: { name: true } },
      local: { select: { name: true } },
    },
  })

  if (!user) {
    return NextResponse.json({ valid: false, error: 'Link login tidak ditemukan' }, { status: 404 })
  }

  if (!user.tokenActive) {
    return NextResponse.json({ valid: false, error: 'Link login ini telah dinonaktifkan oleh super admin' }, { status: 403 })
  }

  if (!user.active) {
    return NextResponse.json({ valid: false, error: 'Akun ini dinonaktifkan' }, { status: 403 })
  }

  if (user.role === 'SUPER_ADMIN') {
    return NextResponse.json({ valid: false, error: 'Token login tidak berlaku untuk super admin' }, { status: 403 })
  }

  return NextResponse.json({
    valid: true,
    name: user.name,
    role: user.role,
    region: user.region?.name ?? null,
    local: user.local?.name ?? null,
  })
}
