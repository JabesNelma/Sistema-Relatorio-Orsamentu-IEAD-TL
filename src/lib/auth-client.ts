import { supabaseBrowser } from '@/lib/supabase-browser'

/**
 * Start Google OAuth via Supabase Auth. The browser navigates to Google; on
 * return, /auth/callback exchanges the authorization code and mints the app
 * session.
 *
 * Google Prompt / phone approval / 2FA are handled entirely by the user's
 * Google account and device. The application cannot (and must not) force,
 * store, or request any Google password.
 */
export async function signInWithGoogle() {
  const redirectTo = `${window.location.origin}/auth/callback`

  const { data, error } = await supabaseBrowser.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  })

  if (error) {
    throw error
  }

  return data
}

/** Clear the Supabase browser session (used after the app session is minted). */
export async function signOutSupabase() {
  await supabaseBrowser.auth.signOut()
}
