/**
 * Supabase Client
 * ---------------
 * Used for Google OAuth (Super Admin login).
 *
 * Create a Supabase project at https://supabase.com and set:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 *
 * In Supabase Dashboard → Authentication → Providers → enable Google.
 * Add your production URL to the redirect URLs.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

let client: SupabaseClient | null = null

/** Returns the Supabase client. Returns null if not configured. */
export function getSupabase(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null
  }
  if (!client) {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false, // We manage our own session via JWT cookie
      },
    })
  }
  return client
}

/** Check if Supabase is configured */
export function isSupabaseConfigured(): boolean {
  return !!supabaseUrl && !!supabaseAnonKey
}

/**
 * Generate the Google OAuth URL.
 * After Google auth, Supabase redirects to `${origin}/api/auth/callback`.
 */
export function getGoogleOAuthUrl(origin: string): string {
  const supabase = getSupabase()
  if (!supabase) {
    throw new Error('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.')
  }

  const { data, error } = supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/api/auth/callback`,
    },
  })

  if (error) {
    throw error
  }

  return data.url
}

/**
 * Exchange the OAuth code for a session and return the user.
 * This exchanges the code that Supabase sends to our callback.
 */
export async function exchangeCodeForUser(code: string) {
  const supabase = getSupabase()
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    throw error
  }

  return data
}
