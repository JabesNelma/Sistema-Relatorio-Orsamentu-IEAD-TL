'use client'

import { create } from 'zustand'

export type Role = 'SUPER_ADMIN' | 'REGIONAL_ADMIN' | 'LOCAL_ADMIN'

export type SafeUser = {
  id: string
  email: string
  name: string
  role: Role
  phone: string | null
  active: boolean
  regionId: string | null
  localId: string | null
  loginToken: string | null
  tokenActive: boolean
  tokenCreatedAt: string | null
  region?: { id: string; name: string } | null
  local?: { id: string; name: string } | null
}

type AuthState = {
  user: SafeUser | null
  loading: boolean
  setUser: (user: SafeUser | null) => void
  setLoading: (loading: boolean) => void
  fetchUser: () => Promise<void>
  // Verifies that the session cookie was actually committed by the browser
  // before trusting the login response. Retries once after a short delay
  // because browsers process Set-Cookie headers asynchronously — an immediate
  // follow-up request can sometimes be sent before the cookie is stored.
  verifySession: () => Promise<SafeUser | null>
  logout: () => Promise<void>
}

async function fetchMe(): Promise<SafeUser | null> {
  try {
    const res = await fetch('/api/auth/me', { cache: 'no-store', credentials: 'same-origin' })
    const data = await res.json()
    return data.user ?? null
  } catch {
    return null
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user, loading: false }),
  setLoading: (loading) => set({ loading }),
  fetchUser: async () => {
    const user = await fetchMe()
    set({ user, loading: false })
  },
  verifySession: async () => {
    // First attempt — may fail if the browser hasn't committed the cookie yet.
    let user = await fetchMe()
    if (user) {
      set({ user, loading: false })
      return user
    }
    // Retry once after giving the browser time to commit the Set-Cookie.
    await new Promise((r) => setTimeout(r, 350))
    user = await fetchMe()
    set({ user, loading: false })
    return user
  },
  logout: async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' })
    set({ user: null })
  },
}))
