/**
 * POST /api/auth/qr-login
 * -----------------------
 * Verifies a QR code token and creates a session for the
 * associated user (ADMIN_REGIONAL or ADMIN_LOKAL).
 *
 * Body: { token: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE, SessionPayload } from '@/lib/auth'
import { verifyQrToken, recordLogin } from '@/lib/auth-queries'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Token presizu' },
        { status: 400 }
      )
    }

    // Verify the QR token against the database
    const user = await verifyQrToken(token)

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'QR Code la validu ka seidauk aktibu' },
        { status: 401 }
      )
    }

    // Record login history
    const userAgent = request.headers.get('user-agent') || 'Unknown'
    const ip = request.headers.get('x-forwarded-for') || 'Unknown'
    await recordLogin({
      userId: user.id,
      method: 'QR_CODE',
      deviceInfo: userAgent,
      ipAddress: ip,
    })

    // Create session JWT
    const sessionPayload: SessionPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role as SessionPayload['role'],
      region: user.region,
      churchName: user.churchName,
    }
    const sessionToken = await createSessionToken(sessionPayload)

    // Set cookie
    const response = NextResponse.json({
      success: true,
      user: sessionPayload,
    })
    response.cookies.set(SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('QR login error:', error)
    return NextResponse.json(
      { success: false, error: 'La bele login ho QR Code' },
      { status: 500 }
    )
  }
}
