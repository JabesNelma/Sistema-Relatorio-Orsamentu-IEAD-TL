import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { SESSION_COOKIE, clearSessionCookie, destroySession } from '@/lib/auth'

export async function POST() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE)?.value
    if (token) {
      await destroySession(token)
    }
    await clearSessionCookie()
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Logout error:', e)
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 })
  }
}
