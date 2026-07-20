"use client";

import { supabase } from "@/lib/supabase";

/**
 * Initiate Google OAuth login flow
 * This should be called from client-side
 */
export async function signInWithGoogle() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
  const redirectTo = `${baseUrl}/auth/callback`;
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      }
    },
  });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Get current session from Supabase
 */
export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}

/**
 * Sign out from Supabase
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}