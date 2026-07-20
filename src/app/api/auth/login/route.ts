import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { SESSION_COOKIE, verifyPassword, createSession, setSessionCookie, clearSessionCookie, destroySession, toSafeUser } from '@/lib/auth'

// POST /api/auth/login
// Login for REGIONAL_ADMIN & LOCAL_ADMIN via their secret QR-code link + password.
//
// Super Admin login is GOOGLE ONLY and is handled by:
//   /auth/callback (client) -> /api/auth/google/session (server)
// Email/password login for Super Admin has been removed. Any email login
// attempt is rejected here so the endpoint cannot be used to bypass Google.
export async function POST(req: NextRequest) {
  try {
    const { email, token, password } = await req.json()
    if (!password) {
      return NextResponse.json({ error: 'Password wajib diisi' }, { status: 400 })
    }

    // Email/password login is no longer available for anyone. Super Admin must
    // use Google; regional/local admins must use their QR link (token).
    if (email) {
      return NextResponse.json(
        { error: 'Login email/password Super Admin telah dinonaktifkan. Gunakan Login dengan Google.' },
        { status: 403 }
      )
    }

    if (!token) {
      return NextResponse.json({ error: 'Token login wajib diisi' }, { status: 400 })
    }

    // --- Token-based login (regional & local admins via QR code) ---
    const user = await db.user.findUnique({
      where: { loginToken: token },
      include: {
        region: { select: { id: true, name: true } },
        local: { select: { id: true, name: true } },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Link login tidak valid' }, { status: 401 })
    }
    if (!user.tokenActive) {
      return NextResponse.json({ error: 'Link login ini telah dinonaktifkan. Hubungi super admin.' }, { status: 403 })
    }
    if (!user.active) {
      return NextResponse.json({ error: 'Akun Anda dinonaktifkan. Hubungi admin.' }, { status: 403 })
    }
    if (user.role === 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Super Admin harus login dengan Google' }, { status: 403 })
    }

    const valid = await verifyPassword(password, user.passwordHash, user.email)
    if (!valid) {
      return NextResponse.json({ error: 'Password salah' }, { status: 401 })
    }

    // Clean up any stale session cookie from a previous login/DB reset so it
    // doesn't shadow the fresh cookie we're about to set.
    const cookieStore = await cookies()
    const oldToken = cookieStore.get(SESSION_COOKIE)?.value
    if (oldToken && oldToken !== token) {
      await destroySession(oldToken).catch(() => {})
    }
    await clearSessionCookie()

    const sessionToken = await createSession(user.id)
    await setSessionCookie(sessionToken)

    // Return the session token in the body too. When the app runs inside a
    // cross-site iframe (preview panel), the browser blocks SameSite=Lax
    // cookies, so the client stores this token in localStorage and sends it
    // as an Authorization: Bearer header on subsequent requests.
    return NextResponse.json({ user: toSafeUser(user), sessionToken })
  } catch (e) {
    console.error('Login error:', e)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
