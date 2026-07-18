import { NextResponse } from 'next/server'
import { cookies, headers } from 'next/headers'
import { SESSION_COOKIE, clearSessionCookie, destroySession } from '@/lib/auth'

export async function POST() {
  try {
    // Destroy the session identified by the cookie (same-origin) and/or the
    // Authorization header (iframe/cross-site context).
    const cookieStore = await cookies()
    const cookieToken = cookieStore.get(SESSION_COOKIE)?.value

    let headerToken: string | null = null
    try {
      const headerStore = await headers()
      const auth = headerStore.get('authorization') || headerStore.get('Authorization')
      if (auth && auth.toLowerCase().startsWith('bearer ')) {
        headerToken = auth.slice(7).trim()
      }
    } catch {
      // ignore
    }

    // Destroy whichever token(s) we found (they may be the same or different).
    const tokensToDestroy = new Set<string>()
    if (cookieToken) tokensToDestroy.add(cookieToken)
    if (headerToken) tokensToDestroy.add(headerToken)
    for (const t of tokensToDestroy) {
      await destroySession(t).catch(() => {})
    }

    await clearSessionCookie()
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Logout error:', e)
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 })
  }
}
