/**
 * POST /api/qr/toggle
 * -------------------
 * Enables or disables a QR code.
 *
 * Body: { userId: string, isActive: boolean }
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth'
import { getActiveQrCode, toggleQrCode, deactivateAllQrCodes } from '@/lib/auth-queries'

export async function POST(request: NextRequest) {
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

    const { userId, isActive } = await request.json()

    if (!userId || typeof isActive !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'userId no isActive presizu' },
        { status: 400 }
      )
    }

    if (isActive) {
      // Re-enabling — find the most recent QR code and activate it
      const activeQr = await getActiveQrCode(userId)
      if (activeQr) {
        return NextResponse.json({ success: true, data: { alreadyActive: true } })
      }
      // No active QR code — would need to generate a new one
      return NextResponse.json(
        { success: false, error: 'La iha QR Code atu aktiva. Generate QR Code foun.' },
        { status: 400 }
      )
    } else {
      // Deactivate all QR codes for this user
      await deactivateAllQrCodes(userId)
      return NextResponse.json({ success: true, data: { deactivated: true } })
    }
  } catch (error) {
    console.error('Toggle QR error:', error)
    return NextResponse.json(
      { success: false, error: 'La bele troka QR Code status' },
      { status: 500 }
    )
  }
}
