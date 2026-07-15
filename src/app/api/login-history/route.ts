/**
 * GET /api/login-history
 * ----------------------
 * Returns recent login events (SUPER_ADMIN only).
 * Optional query param: ?userId=XXX to filter by user.
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth'
import { getLoginHistory } from '@/lib/auth-queries'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE)?.value
    const session = token ? await verifySessionToken(token) : null

    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'La iha permisaun' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || undefined

    const history = await getLoginHistory(50, userId)

    return NextResponse.json({
      success: true,
      data: history.map((h) => ({
        id: h.id,
        userId: h.userId,
        userName: h.user.name,
        userRole: h.user.role,
        method: h.method,
        deviceInfo: h.deviceInfo,
        ipAddress: h.ipAddress,
        createdAt: h.createdAt,
      })),
    })
  } catch (error) {
    console.error('Login history error:', error)
    return NextResponse.json(
      { success: false, error: 'La bele karrega login history' },
      { status: 500 }
    )
  }
}
