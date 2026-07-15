import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireRole } from '@/lib/auth/session'
import { Role } from '@prisma/client'
import { z } from 'zod'

// Validation schema for creating a new admin
const createAdminSchema = z.object({
  name: z.string().min(2, 'Naran tenke bele iha letra 2 ka liu'),
  role: z.enum(['ADMIN_REGIONAL', 'ADMIN_LOKAL']),
  region: z.string().optional(),
  churchName: z.string().optional(),
}).refine(
  (data) => {
    // ADMIN_REGIONAL requires region
    if (data.role === 'ADMIN_REGIONAL' && !data.region) return false
    // ADMIN_LOKAL requires churchName
    if (data.role === 'ADMIN_LOKAL' && !data.churchName) return false
    return true
  },
  {
    message: 'Region ka Naran Igreja presiza depende ba role',
  }
)

/**
 * GET /api/admin/users
 *
 * Returns all admin users (excluding SUPER_ADMIN who is managed separately).
 * Only SUPER_ADMIN can access this endpoint.
 *
 * Returns: List of admins with their QR code status
 */
export async function GET() {
  try {
    await requireRole(Role.SUPER_ADMIN)

    const users = await prisma.user.findMany({
      where: {
        role: { in: ['ADMIN_REGIONAL', 'ADMIN_LOKAL'] },
      },
      include: {
        qrCodes: {
          orderBy: { createdAt: 'desc' },
          take: 1, // Get the most recent QR code
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const result = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      region: user.region,
      churchName: user.churchName,
      isActive: user.isActive,
      createdAt: user.createdAt,
      qrCode: user.qrCodes[0]
        ? {
            id: user.qrCodes[0].id,
            status: user.qrCodes[0].status,
            createdAt: user.qrCodes[0].createdAt,
          }
        : null,
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
    console.error('Get users error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/users
 *
 * Creates a new admin user (ADMIN_REGIONAL or ADMIN_LOKAL).
 * Only SUPER_ADMIN can create new admins.
 *
 * Body:
 *   { name, role, region?, churchName? }
 */
export async function POST(request: NextRequest) {
  try {
    const superAdmin = await requireRole(Role.SUPER_ADMIN)

    const body = await request.json()

    // Validate input with Zod
    const validationResult = createAdminSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation_failed',
          details: validationResult.error.flatten(),
        },
        { status: 400 }
      )
    }

    const { name, role, region, churchName } = validationResult.data

    // Create the user
    const newUser = await prisma.user.create({
      data: {
        name,
        role,
        region: role === 'ADMIN_REGIONAL' ? region : null,
        churchName: role === 'ADMIN_LOKAL' ? churchName : null,
        isActive: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: newUser.id,
        name: newUser.name,
        role: newUser.role,
        region: newUser.region,
        churchName: newUser.churchName,
        isActive: newUser.isActive,
        createdAt: newUser.createdAt,
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
    console.error('Create user error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create user' },
      { status: 500 }
    )
  }
}
