/**
 * POST /api/auth/google
 * ----------------------
 * Initiates Google OAuth via Supabase. Returns the OAuth URL
 * that the frontend should redirect to.
 *
 * Only the designated SUPER_ADMIN_EMAIL can become SUPER_ADMIN.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getGoogleOAuthUrl, isSupabaseConfigured } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Supabase la konfigura ona. Hatama NEXT_PUBLIC_SUPABASE_URL no NEXT_PUBLIC_SUPABASE_ANON_KEY iha .env file.',
        },
        { status: 500 }
      )
    }

    const { origin } = new URL(request.url)
    const oauthUrl = getGoogleOAuthUrl(origin)

    return NextResponse.json({ success: true, url: oauthUrl })
  } catch (error) {
    console.error('Google OAuth error:', error)
    return NextResponse.json(
      { success: false, error: 'La bele inicia Google OAuth' },
      { status: 500 }
    )
  }
}
