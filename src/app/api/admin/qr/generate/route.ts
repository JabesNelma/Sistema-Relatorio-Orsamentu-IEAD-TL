import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireRole, generateSecureToken } from '@/lib/auth/session'
import { Role } from '@prisma/client'
import QRCode from 'qrcode'

/**
 * POST /api/admin/qr/generate
 *
 * Generates a new QR code for a specific admin user.
 * The QR code contains a secure random token that is stored in the database.
 * When scanned, the token is verified and a session is created.
 *
 * Only SUPER_ADMIN can generate QR codes.
 *
 * Body:
 *   { userId: string }
 *
 * Returns:
 *   { token, qrCodeDataUrl, status }
 *
 * The qrCodeDataUrl is a base64-encoded PNG image that can be displayed
 * directly in an <img> tag.
 */
export async function POST(request: NextRequest) {
  try {
    const superAdmin = await requireRole(Role.SUPER_ADMIN)

    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID required' },
        { status: 400 }
      )
    }

    // Verify the target user exists and is not a super admin
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    if (targetUser.role === 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Cannot generate QR for Super Admin' },
        { status: 400 }
      )
    }

    // Generate a secure token
    const token = generateSecureToken()

    // Create the QR code record in database
    const qrCodeRecord = await prisma.qrCode.create({
      data: {
        token,
        userId: targetUser.id,
        status: 'ACTIVE',
        generatedBy: superAdmin.id,
        // No expiry by default — admin can disable anytime
        expiresAt: null,
      },
    })

    // Generate QR code image as data URL
    // The QR contains the token which will be sent to /api/auth/qr-login
    const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/qr-login?token=${token}`
    const qrCodeDataUrl = await QRCode.toDataURL(loginUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    })

    return NextResponse.json({
      success: true,
      data: {
        id: qrCodeRecord.id,
        token,
        qrCodeDataUrl,
        status: qrCodeRecord.status,
        createdAt: qrCodeRecord.createdAt,
        userName: targetUser.name,
        userRole: targetUser.role,
      },
    })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'UNAUTHORIZED') {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        )
      }
      if (error.message === 'FORBIDDEN') {
        return NextResponse.json(
          { success: false, error: 'Forbidden - Super Admin only' },
          { status: 403 }
        )
      }
    }
    console.error('Generate QR error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate QR code' },
      { status: 500 }
    )
  }
}
