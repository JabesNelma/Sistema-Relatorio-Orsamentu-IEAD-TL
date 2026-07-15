/**
 * GET /api/auth/callback?code=XXX
 * -------------------------------
 * Supabase redirects here after Google OAuth.
 * We exchange the code for user data, verify the email is the
 * designated SUPER_ADMIN, then create our own JWT session cookie.
 */

import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForUser } from '@/lib/supabase'
import { createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE, SessionPayload } from '@/lib/auth'
import { findOrCreateSuperAdmin, recordLogin } from '@/lib/auth-queries'

export async function GET(request: NextRequest) {
  try {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.redirect(new URL('/login?error=no_code', origin))
    }

    // Exchange code for Supabase session
    const data = await exchangeCodeForUser(code)
    const supabaseUser = data.user

    if (!supabaseUser || !supabaseUser.email) {
      return NextResponse.redirect(new URL('/login?error=no_user', origin))
    }

    // Check if this email is the designated super admin
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL
    if (supabaseUser.email !== superAdminEmail) {
      return NextResponse.redirect(
        new URL('/login?error=not_authorized', origin)
      )
    }

    // Find or create the SUPER_ADMIN user in our DB
    const name =
      supabaseUser.user_metadata?.full_name ||
      supabaseUser.user_metadata?.name ||
      supabaseUser.email
    const user = await findOrCreateSuperAdmin(supabaseUser.email, name)

    if (!user) {
      return NextResponse.redirect(
        new URL('/login?error=not_authorized', origin)
      )
    }

    // Record login history
    const userAgent = request.headers.get('user-agent') || 'Unknown'
    const ip = request.headers.get('x-forwarded-for') || 'Unknown'
    await recordLogin({
      userId: user.id,
      method: 'GOOGLE',
      deviceInfo: userAgent,
      ipAddress: ip,
    })

    // Create session JWT
    const sessionPayload: SessionPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role as SessionPayload['role'],
      region: user.region,
      churchName: user.churchName,
    }
    const token = await createSessionToken(sessionPayload)

    // Set cookie and redirect to admin dashboard
    const response = NextResponse.redirect(new URL('/admin/manage', origin))
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Auth callback error:', error)
    const { origin } = new URL(request.url)
    return NextResponse.redirect(new URL('/login?error=callback_failed', origin))
  }
}
