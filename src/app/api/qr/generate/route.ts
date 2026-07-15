/**
 * POST /api/qr/generate
 * ---------------------
 * Generates a new QR code token for a user.
 * Deactivates any previously active QR codes for that user.
 *
 * Body: { userId: string }
 * Returns: { token, qrDataUrl }
 *
 * The qrDataUrl is a base64 PNG image of the QR code.
 * The QR encodes a URL: `${origin}/login?token=XXX`
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth'
import { createQrCodeForUser } from '@/lib/auth-queries'
import QRCode from 'qrcode'

export async function POST(request: NextRequest) {
  try {
    // Verify session
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE)?.value
    const session = token ? await verifySessionToken(token) : null

    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'La iha permisaun' },
        { status: 403 }
      )
    }

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId presizu' },
        { status: 400 }
      )
    }

    // Create new QR code
    const qrCode = await createQrCodeForUser(userId)

    // Generate QR code image as data URL
    // The QR encodes a URL that the admin can scan with their phone
    const { origin } = new URL(request.url)
    const loginUrl = `${origin}/login?token=${qrCode.token}`
    const qrDataUrl = await QRCode.toDataURL(loginUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#1e293b',
        light: '#ffffff',
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: qrCode.id,
        token: qrCode.token,
        qrDataUrl,
        loginUrl,
        isActive: qrCode.isActive,
        createdAt: qrCode.createdAt,
      },
    })
  } catch (error) {
    console.error('Generate QR error:', error)
    return NextResponse.json(
      { success: false, error: 'La bele generate QR Code' },
      { status: 500 }
    )
  }
}
