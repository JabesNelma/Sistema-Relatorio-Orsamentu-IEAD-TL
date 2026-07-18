import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { SESSION_COOKIE, verifyPassword, createSession, setSessionCookie, clearSessionCookie, destroySession, toSafeUser } from '@/lib/auth'

// POST /api/auth/login
// Two login modes:
//  1. Email + password  -> ONLY for SUPER_ADMIN (regional/local admins must use QR link)
//  2. Token + password  -> for REGIONAL_ADMIN & LOCAL_ADMIN (token comes from the QR-code link)
export async function POST(req: NextRequest) {
  try {
    const { email, token, password } = await req.json()
    if (!password) {
      return NextResponse.json({ error: 'Password wajib diisi' }, { status: 400 })
    }

    // --- Token-based login (regional & local admins via QR code) ---
    if (token) {
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
        return NextResponse.json({ error: 'Super admin harus login dengan email' }, { status: 403 })
      }

      const valid = await verifyPassword(password, user.passwordHash)
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
    }

    // --- Email-based login (super admin only) ---
    if (!email) {
      return NextResponse.json({ error: 'Email atau token login wajib diisi' }, { status: 400 })
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

    // Regional & local admins must use their QR-code link, not email.
    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Admin wilayah/lokal harus login melalui QR code. Hubungi super admin.' },
        { status: 403 }
      )
    }

    const valid = await verifyPassword(password, user.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: 'Email atau password salah' }, { status: 401 })
    }

    // Clean up any stale session cookie from a previous login/DB reset so it
    // doesn't shadow the fresh cookie we're about to set.
    const cookieStore = await cookies()
    const oldToken = cookieStore.get(SESSION_COOKIE)?.value
    if (oldToken) {
      await destroySession(oldToken).catch(() => {})
    }
    await clearSessionCookie()

    const sessionToken = await createSession(user.id)
    await setSessionCookie(sessionToken)

    // Return the session token in the body too (see note above about iframes).
    return NextResponse.json({ user: toSafeUser(user), sessionToken })
  } catch (e) {
    console.error('Login error:', e)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
