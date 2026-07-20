import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? ''
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

function ensureConfigured(value: string, name: string) {
  if (!value) {
    throw new Error(`Supabase environment variable missing: ${name}`)
  }
}

export function isSupabaseAuthEnabled() {
  return process.env.AUTH_PROVIDER === 'supabase' && Boolean(supabaseUrl && supabaseAnonKey && supabaseServiceRoleKey)
}

export function getSupabaseAnonClient() {
  ensureConfigured(supabaseUrl, 'NEXT_PUBLIC_SUPABASE_URL')
  ensureConfigured(supabaseAnonKey, 'NEXT_PUBLIC_SUPABASE_ANON_KEY')

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  })
}

export function getSupabaseAdminClient() {
  ensureConfigured(supabaseUrl, 'NEXT_PUBLIC_SUPABASE_URL')
  ensureConfigured(supabaseServiceRoleKey, 'SUPABASE_SERVICE_ROLE_KEY')

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  })
}