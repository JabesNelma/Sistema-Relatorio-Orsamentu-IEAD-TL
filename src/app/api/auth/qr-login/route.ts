import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { setQrSessionCookie } from '@/lib/auth/session'

// Note: setQrSessionCookie is async in Next.js 16 (cookies() returns a Promise)

/**
 * POST /api/auth/qr-login
 *
 * Verifies a QR code token and logs in the associated user.
 * Sets an HTTP-only session cookie with the QR token.
 *
 * Body:
 *   { token: string }  — The token from the scanned QR code
 *
 * Flow:
 * 1. Find QrCode by token in database
 * 2. Validate: status is ACTIVE, user is active, not expired
 * 3. Set session cookie
 * 4. Record login history
 * 5. Return user info + redirect URL based on role
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Token_required' },
        { status: 400 }
      )
    }

    // Find the QR code with its associated user
    const qrCode = await prisma.qrCode.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!qrCode) {
      return NextResponse.json(
        { success: false, error: 'Token_invalid' },
        { status: 404 }
      )
    }

    // Validate QR status
    if (qrCode.status !== 'ACTIVE') {
      return NextResponse.json(
        {
          success: false,
          error: `QR_${qrCode.status.toLowerCase()}`,
        },
        { status: 403 }
      )
    }

    // Validate user is active
    if (!qrCode.user.isActive) {
      return NextResponse.json(
        { success: false, error: 'User_inactive' },
        { status: 403 }
      )
    }

    // Validate expiry
    if (qrCode.expiresAt && qrCode.expiresAt < new Date()) {
      await prisma.qrCode.update({
        where: { id: qrCode.id },
        data: { status: 'EXPIRED' },
      })
      return NextResponse.json(
        { success: false, error: 'QR_expired' },
        { status: 403 }
      )
    }

    // Set the session cookie
    await setQrSessionCookie(token)

    // Update QR code: mark as used
    await prisma.qrCode.update({
      where: { id: qrCode.id },
      data: { usedAt: new Date() },
    })

    // Record login history
    const userAgent = request.headers.get('user-agent') || 'Unknown'
    await prisma.loginHistory.create({
      data: {
        userId: qrCode.user.id,
        loginMethod: 'qr_code',
        deviceInfo: userAgent,
        ipAddress: request.headers.get('x-forwarded-for') || null,
        success: true,
      },
    })

    // Determine redirect URL based on role
    const redirectUrl =
      qrCode.user.role === 'ADMIN_REGIONAL'
        ? '/regional'
        : qrCode.user.role === 'ADMIN_LOKAL'
        ? '/lokal'
        : '/admin/manage'

    return NextResponse.json({
      success: true,
      user: {
        id: qrCode.user.id,
        name: qrCode.user.name,
        role: qrCode.user.role,
        region: qrCode.user.region,
        churchName: qrCode.user.churchName,
      },
      redirect: redirectUrl,
    })
  } catch (error) {
    console.error('QR login error:', error)
    return NextResponse.json(
      { success: false, error: 'Login_failed' },
      { status: 500 }
    )
  }
}
