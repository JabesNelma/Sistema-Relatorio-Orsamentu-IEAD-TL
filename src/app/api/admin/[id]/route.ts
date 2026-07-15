/**
 * /api/admin/[id]
 * ---------------
 * PATCH  — Update a user (SUPER_ADMIN only)
 * DELETE — Delete a user (SUPER_ADMIN only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { SESSION_COOKIE, verifySessionToken, isValidRole } from '@/lib/auth'
import { updateUser, deleteUser } from '@/lib/auth-queries'

// PATCH — Update user
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const body = await request.json()
    const { name, role, region, churchName, status } = body

    // Build update data
    const updateData: Parameters<typeof updateUser>[1] = {}
    if (name !== undefined) updateData.name = name
    if (role !== undefined) {
      if (!isValidRole(role) || role === 'SUPER_ADMIN') {
        return NextResponse.json(
          { success: false, error: 'Role la validu' },
          { status: 400 }
        )
      }
      updateData.role = role
    }
    if (region !== undefined) updateData.region = region
    if (churchName !== undefined) updateData.churchName = churchName
    if (status !== undefined) {
      if (status !== 'ACTIVE' && status !== 'INACTIVE') {
        return NextResponse.json(
          { success: false, error: 'Status la validu' },
          { status: 400 }
        )
      }
      updateData.status = status
    }

    const user = await updateUser(id, updateData)

    return NextResponse.json({ success: true, data: user })
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json(
      { success: false, error: 'La bele atualiza admin' },
      { status: 500 }
    )
  }
}

// DELETE — Delete user
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    // Prevent self-deletion
    if (id === session.userId) {
      return NextResponse.json(
        { success: false, error: 'La bele hapus ita boot nian konta' },
        { status: 400 }
      )
    }

    await deleteUser(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json(
      { success: false, error: 'La bele hapus admin' },
      { status: 500 }
    )
  }
}
