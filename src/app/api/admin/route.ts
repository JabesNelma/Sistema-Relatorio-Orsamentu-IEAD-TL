/**
 * /api/admin
 * ----------
 * GET  — List all users (SUPER_ADMIN only)
 * POST — Create a new admin user (SUPER_ADMIN only)
 *
 * Role checking is enforced by middleware, but we double-check here
 * for defense in depth.
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { SESSION_COOKIE, verifySessionToken, isValidRole } from '@/lib/auth'
import { getAllUsers, createUser } from '@/lib/auth-queries'

// GET — List all admins
export async function GET() {
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

    const users = await getAllUsers()

    // Transform for the frontend (don't expose sensitive data)
    const safeUsers = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      region: u.region,
      churchName: u.churchName,
      status: u.status,
      hasActiveQr: u.qrCodes.length > 0,
      createdAt: u.createdAt,
    }))

    return NextResponse.json({ success: true, data: safeUsers })
  } catch (error) {
    console.error('List users error:', error)
    return NextResponse.json(
      { success: false, error: 'La bele karrega lista admin' },
      { status: 500 }
    )
  }
}

// POST — Create a new admin
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

    const body = await request.json()
    const { name, role, region, churchName } = body

    // Validate
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Naran presizu (minimu 2 letra)' },
        { status: 400 }
      )
    }

    if (!isValidRole(role) || role === 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Role la validu. Uza ADMIN_REGIONAL ka ADMIN_LOKAL' },
        { status: 400 }
      )
    }

    if (role === 'ADMIN_REGIONAL' && !region) {
      return NextResponse.json(
        { success: false, error: 'Região presizu ba ADMIN_REGIONAL' },
        { status: 400 }
      )
    }

    if (role === 'ADMIN_LOKAL' && !churchName) {
      return NextResponse.json(
        { success: false, error: 'Naran Igreja presizu ba ADMIN_LOKAL' },
        { status: 400 }
      )
    }

    const user = await createUser({
      name: name.trim(),
      role,
      region: region || undefined,
      churchName: churchName || undefined,
    })

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        role: user.role,
        region: user.region,
        churchName: user.churchName,
        status: user.status,
        createdAt: user.createdAt,
      },
    })
  } catch (error) {
    console.error('Create user error:', error)
    return NextResponse.json(
      { success: false, error: 'La bele kria admin foun' },
      { status: 500 }
    )
  }
}
