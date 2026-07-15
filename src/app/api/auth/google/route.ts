import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/supabase-browser'

/**
 * POST /api/auth/google
 *
 * Initiates Google OAuth sign-in flow via Supabase.
 * Returns the OAuth URL that the frontend redirects to.
 *
 * Body:
 *   { redirect?: string }  — Where to redirect after successful login
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const redirectTo = body.redirect || '/admin/manage'

    const supabase = createClient()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${appUrl}/api/auth/callback?redirect=${encodeURIComponent(redirectTo)}`,
      },
    })

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, url: data.url })
  } catch (error) {
    console.error('Google OAuth start error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to start OAuth' },
      { status: 500 }
    )
  }
}
