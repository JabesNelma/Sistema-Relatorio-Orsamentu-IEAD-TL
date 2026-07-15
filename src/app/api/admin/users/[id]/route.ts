import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireRole } from '@/lib/auth/session'
import { Role } from '@prisma/client'
import { z } from 'zod'

// Validation schema for updating a user
const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  region: z.string().nullable().optional(),
  churchName: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
})

/**
 * PATCH /api/admin/users/[id]
 *
 * Updates a user (rename, change region/church, activate/deactivate).
 * Only SUPER_ADMIN can update users.
 *
 * Body (any subset):
 *   { name?, region?, churchName?, isActive? }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(Role.SUPER_ADMIN)

    const body = await request.json()
    const validationResult = updateUserSchema.safeParse(body)

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

    // Verify user exists and is not a super admin
    const existing = await prisma.user.findUnique({
      where: { id: params.id },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    if (existing.role === 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Cannot modify Super Admin' },
        { status: 400 }
      )
    }

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: validationResult.data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        region: true,
        churchName: true,
        isActive: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ success: true, data: updated })
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
          { success: false, error: 'Forbidden' },
          { status: 403 }
        )
      }
    }
    console.error('Update user error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/users/[id]
 *
 * Deletes a user and all associated QR codes and login history.
 * Only SUPER_ADMIN can delete users.
 * Cannot delete SUPER_ADMIN accounts.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(Role.SUPER_ADMIN)

    const existing = await prisma.user.findUnique({
      where: { id: params.id },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    if (existing.role === 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Cannot delete Super Admin' },
        { status: 400 }
      )
    }

    // Cascade delete will remove QR codes and login history
    await prisma.user.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
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
          { success: false, error: 'Forbidden' },
          { status: 403 }
        )
      }
    }
    console.error('Delete user error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}
