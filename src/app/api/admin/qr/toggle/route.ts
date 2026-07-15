import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireRole } from '@/lib/auth/session'
import { Role, QrStatus } from '@prisma/client'
import { z } from 'zod'

// Validation schema for toggling QR status
const toggleSchema = z.object({
  qrId: z.string().min(1),
  action: z.enum(['enable', 'disable']),
})

/**
 * POST /api/admin/qr/toggle
 *
 * Enables or disables a QR code.
 * - "enable" sets status to ACTIVE
 * - "disable" sets status to DISABLED
 *
 * Only SUPER_ADMIN can toggle QR status.
 *
 * Body:
 *   { qrId: string, action: 'enable' | 'disable' }
 */
export async function POST(request: NextRequest) {
  try {
    await requireRole(Role.SUPER_ADMIN)

    const body = await request.json()
    const validationResult = toggleSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationResult.error.flatten(),
        },
        { status: 400 }
      )
    }

    const { qrId, action } = validationResult.data

    // Find the QR code
    const qrCode = await prisma.qrCode.findUnique({
      where: { id: qrId },
      include: { user: true },
    })

    if (!qrCode) {
      return NextResponse.json(
        { success: false, error: 'QR code not found' },
        { status: 404 }
      )
    }

    // Determine new status
    const newStatus: QrStatus = action === 'enable' ? 'ACTIVE' : 'DISABLED'

    // Update the QR code
    const updated = await prisma.qrCode.update({
      where: { id: qrId },
      data: { status: newStatus },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        status: updated.status,
        userName: qrCode.user.name,
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
    console.error('Toggle QR error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to toggle QR code' },
      { status: 500 }
    )
  }
}
