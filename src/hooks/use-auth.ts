'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Role } from '@prisma/client'

export interface AuthUser {
  id: string
  email: string | null
  name: string
  role: Role
  region: string | null
  churchName: string | null
  isActive: boolean
}

/**
 * useAuth — Client-side hook for authentication state.
 *
 * Fetches the current user from /api/auth/me on mount.
 * Provides login/logout functions.
 */
export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me')
      const data = await res.json()
      if (data.success) {
        setUser(data.user)
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    window.location.href = '/login'
  }, [])

  return {
    user,
    loading,
    logout,
    refetch: fetchUser,
    isAuthenticated: !!user,
  }
}
