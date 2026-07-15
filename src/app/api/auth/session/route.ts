/**
 * GET /api/auth/session
 * ---------------------
 * Returns the current session user (from JWT cookie).
 * Used by the frontend to check if user is logged in.
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth'

export async function GET(_request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get(SESSION_COOKIE)?.value

    if (!sessionCookie) {
      return NextResponse.json({ success: true, user: null })
    }

    const session = await verifySessionToken(sessionCookie)

    if (!session) {
      return NextResponse.json({ success: true, user: null })
    }

    return NextResponse.json({ success: true, user: session })
  } catch (error) {
    console.error('Session error:', error)
    return NextResponse.json({ success: true, user: null })
  }
}
