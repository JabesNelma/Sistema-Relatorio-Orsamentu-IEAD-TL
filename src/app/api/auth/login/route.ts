import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword, createSession, setSessionCookie, toSafeUser } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ error: 'Email dan password wajib diisi' }, { status: 400 })
    }

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        region: { select: { id: true, name: true } },
        local: { select: { id: true, name: true } },
      },
    })

    if (!user || !user.active) {
      return NextResponse.json({ error: 'Email atau password salah' }, { status: 401 })
    }

    const valid = await verifyPassword(password, user.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: 'Email atau password salah' }, { status: 401 })
    }

    const token = await createSession(user.id)
    await setSessionCookie(token)

    return NextResponse.json({ user: toSafeUser(user) })
  } catch (e) {
    console.error('Login error:', e)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
