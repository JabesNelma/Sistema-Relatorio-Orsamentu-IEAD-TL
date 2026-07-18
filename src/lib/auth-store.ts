'use client'

import { create } from 'zustand'
import { apiFetch, setSessionToken } from './api-fetch'

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
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user, loading: false }),
  setLoading: (loading) => set({ loading }),
  fetchUser: async () => {
    try {
      const res = await apiFetch('/api/auth/me', { cache: 'no-store' })
      const data = await res.json()
      set({ user: data.user ?? null, loading: false })
    } catch {
      set({ user: null, loading: false })
    }
  },
  logout: async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // ignore
    }
    setSessionToken(null)
    set({ user: null })
  },
}))
