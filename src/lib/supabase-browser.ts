import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY'
  )
}

/**
 * Browser-side Supabase client, used ONLY to drive the Google OAuth sign-in
 * flow. After /auth/callback mints our own app session, the Supabase session
 * is signed out — the app never relies on the Supabase token for
 * authorization, and never stores or asks for a Google password.
 */
export const supabaseBrowser = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
})
