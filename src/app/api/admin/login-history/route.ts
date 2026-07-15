import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireRole } from '@/lib/auth/session'
import { Role } from '@prisma/client'

/**
 * GET /api/admin/login-history
 *
 * Returns login history records.
 * Only SUPER_ADMIN can access this.
 *
 * Query params:
 *   limit  — Max records to return (default 50, max 200)
 *   userId — Filter by user ID (optional)
 *
 * Returns: List of login events with user info
 */
export async function GET(request: NextRequest) {
  try {
    await requireRole(Role.SUPER_ADMIN)

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200)
    const userId = searchParams.get('userId')

    const where = userId ? { userId } : {}

    const history = await prisma.loginHistory.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    const result = history.map((record) => ({
      id: record.id,
      userId: record.userId,
      userName: record.user.name,
      userRole: record.user.role,
      loginMethod: record.loginMethod,
      deviceInfo: record.deviceInfo,
      ipAddress: record.ipAddress,
      success: record.success,
      createdAt: record.createdAt,
    }))

    return NextResponse.json({ success: true, data: result })
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
    console.error('Get login history error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch login history' },
      { status: 500 }
    )
  }
}
