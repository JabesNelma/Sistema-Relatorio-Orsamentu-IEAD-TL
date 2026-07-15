import { NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/supabase-server'
import { getOrCreateSuperAdmin } from '@/lib/auth/session'
import { prisma } from '@/lib/db'

/**
 * GET /api/auth/callback
 *
 * Handles the Google OAuth callback from Supabase.
 * After Supabase authenticates the user, this route:
 * 1. Gets the user email from Supabase
 * 2. Checks if email matches SUPER_ADMIN_EMAIL env var
 * 3. Creates or updates the User in our database as SUPER_ADMIN
 * 4. Records login history
 * 5. Redirects to /admin/manage
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const redirectParam = requestUrl.searchParams.get('redirect') || '/admin/manage'

  try {
    const supabase = await createClient()

    // Exchange code for session (Supabase handles this)
    if (code) {
      await supabase.auth.exchangeCodeForSession(code)
    }

    // Get the authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user?.email) {
      return NextResponse.redirect(new URL('/login?error=no_email', requestUrl.origin))
    }

    // Try to create/get super admin
    const superAdmin = await getOrCreateSuperAdmin(
      user.email,
      user.user_metadata?.full_name || user.email
    )

    if (!superAdmin) {
      // Email doesn't match configured SUPER_ADMIN_EMAIL
      await supabase.auth.signOut()
      return NextResponse.redirect(
        new URL('/login?error=not_authorized', requestUrl.origin)
      )
    }

    // Record login history
    const userAgent = request.headers.get('user-agent') || 'Unknown'
    await prisma.loginHistory.create({
      data: {
        userId: superAdmin.id,
        loginMethod: 'google_oauth',
        deviceInfo: userAgent,
        ipAddress: request.headers.get('x-forwarded-for') || null,
        success: true,
      },
    })

    // Redirect to admin dashboard
    return NextResponse.redirect(new URL(redirectParam, requestUrl.origin))
  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(
      new URL('/login?error=callback_failed', requestUrl.origin)
    )
  }
}
