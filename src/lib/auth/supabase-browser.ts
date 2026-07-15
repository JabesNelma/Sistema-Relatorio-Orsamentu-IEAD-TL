import { createBrowserClient } from '@supabase/ssr'

/**
 * Supabase browser client (singleton).
 * Used in client components for Google OAuth sign-in.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
