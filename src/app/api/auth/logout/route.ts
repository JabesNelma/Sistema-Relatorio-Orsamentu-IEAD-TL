import { NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/supabase-server'
import { clearQrSessionCookie } from '@/lib/auth/session'

/**
 * POST /api/auth/logout
 *
 * Logs out the current user by:
 * 1. Signing out of Supabase (Google OAuth session)
 * 2. Clearing the QR session cookie
 */
export async function POST() {
  try {
    // Sign out of Supabase (clears Google OAuth session)
    const supabase = await createClient()
    await supabase.auth.signOut()

    // Clear QR session cookie
    await clearQrSessionCookie()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { success: false, error: 'Logout_failed' },
      { status: 500 }
    )
  }
}
