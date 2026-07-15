'use client'

/**
 * useAuth — Authentication state hook
 * ------------------------------------
 * Fetches the current session from /api/auth/session and provides
 * login/logout helpers.
 */

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { SessionPayload } from '@/lib/auth'

interface UseAuthReturn {
  user: SessionPayload | null
  loading: boolean
  loginWithGoogle: () => Promise<void>
  loginWithQr: (token: string) => Promise<boolean>
  logout: () => Promise<void>
  refetch: () => Promise<void>
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<SessionPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/session')
      const data = await res.json()
      setUser(data.user || null)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSession()
  }, [fetchSession])

  const loginWithGoogle = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/google', { method: 'POST' })
      const data = await res.json()
      if (data.success && data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Google login error:', error)
    }
  }, [])

  const loginWithQr = useCallback(
    async (token: string): Promise<boolean> => {
      try {
        const res = await fetch('/api/auth/qr-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })
        const data = await res.json()
        if (data.success && data.user) {
          setUser(data.user)
          return true
        }
        return false
      } catch {
        return false
      }
    },
    []
  )

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    router.push('/login')
  }, [router])

  return {
    user,
    loading,
    loginWithGoogle,
    loginWithQr,
    logout,
    refetch: fetchSession,
  }
}
