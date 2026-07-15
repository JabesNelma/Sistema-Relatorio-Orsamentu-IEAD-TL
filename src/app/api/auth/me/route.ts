import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'

/**
 * GET /api/auth/me
 *
 * Returns the currently authenticated user.
 * Used by client components to check auth state.
 */
export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, user: null },
        { status: 200 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        region: user.region,
        churchName: user.churchName,
        isActive: user.isActive,
      },
    })
  } catch (error) {
    console.error('Get current user error:', error)
    return NextResponse.json(
      { success: false, user: null },
      { status: 200 }
    )
  }
}
