import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { randomBytes } from 'crypto'
import { supabaseServer } from '@/lib/supabase-server'
import { db } from '@/lib/db'
import {
  SESSION_COOKIE,
  createSession,
  setSessionCookie,
  clearSessionCookie,
  destroySession,
  toSafeUser,
} from '@/lib/auth'

// POST /api/auth/google/session
// Mints the application session after a successful Google OAuth callback.
//
// The client (/auth/callback) sends the Supabase access token it just
// obtained. The server verifies it authoritatively with Supabase and only
// accepts the single configured Super Admin email. No Google password is ever
// seen or stored by the application.
export async function POST(req: NextRequest) {
  try {
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL
    if (!superAdminEmail) {
      return NextResponse.json(
        { error: 'SUPER_ADMIN_EMAIL belum dikonfigurasi di server.' },
        { status: 500 }
      )
    }

    const { accessToken } = await req.json()
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Token otorisasi tidak ditemukan.' },
        { status: 400 }
      )
    }

    // Verify the Supabase / Google access token on the server. This is the
    // authoritative identity check — the client's claim alone is not trusted.
    const { data, error } = await supabaseServer.auth.getUser(accessToken)
    if (error || !data.user?.email) {
      return NextResponse.json(
        { error: 'Token Google tidak valid atau kedaluwarsa.' },
        { status: 401 }
      )
    }

    const email = data.user.email.toLowerCase().trim()
    if (email !== superAdminEmail.toLowerCase().trim()) {
      return NextResponse.json(
        { error: 'Email tidak diizinkan. Hanya akun Super Admin yang terdaftar dapat login.' },
        { status: 403 }
      )
    }

    const include = {
      region: { select: { id: true, name: true } },
      local: { select: { id: true, name: true } },
    }

    // Find or create the Super Admin row by the verified Google email.
    let user = await db.user.findUnique({ where: { email }, include })
    if (!user) {
      user = await db.user.create({
        data: {
          email,
          name: (data.user.user_metadata?.name as string) || 'Super Admin',
          role: 'SUPER_ADMIN',
          // No password login is possible for this account — Google is the
          // only entry point. Store an unguessable sentinel hash.
          passwordHash: `google-oauth:${randomBytes(24).toString('hex')}`,
          active: true,
        },
        include,
      })
    } else if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Akun ini tidak memiliki peran Super Admin.' },
        { status: 403 }
      )
    } else if (!user.active) {
      return NextResponse.json(
        { error: 'Akun Super Admin dinonaktifkan.' },
        { status: 403 }
      )
    }

    // Clear any stale session from a previous login/DB reset.
    const cookieStore = await cookies()
    const oldToken = cookieStore.get(SESSION_COOKIE)?.value
    if (oldToken) await destroySession(oldToken).catch(() => {})
    await clearSessionCookie()

    const sessionToken = await createSession(user.id)
    await setSessionCookie(sessionToken)

    return NextResponse.json({ user: toSafeUser(user), sessionToken })
  } catch (e) {
    console.error('Google session error:', e)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server.' },
      { status: 500 }
    )
  }
}
