'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Role } from '@prisma/client'

export interface AdminUser {
  id: string
  name: string
  email: string | null
  role: Role
  region: string | null
  churchName: string | null
  isActive: boolean
  createdAt: string
  qrCode: {
    id: string
    status: string
    createdAt: string
  } | null
}

export interface LoginHistoryEntry {
  id: string
  userId: string
  userName: string
  userRole: Role
  loginMethod: string
  deviceInfo: string | null
  ipAddress: string | null
  success: boolean
  createdAt: string
}

/**
 * useAdminUsers — Hook for fetching and managing admin users.
 */
export function useAdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      if (data.success) {
        setUsers(data.data)
        setError(null)
      } else {
        setError(data.error || 'Failed to fetch users')
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const createUser = useCallback(
    async (data: {
      name: string
      role: 'ADMIN_REGIONAL' | 'ADMIN_LOKAL'
      region?: string
      churchName?: string
    }): Promise<boolean> => {
      try {
        const res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        const result = await res.json()
        if (result.success) {
          await fetchUsers()
          return true
        }
        setError(result.error || 'Failed to create user')
        return false
      } catch {
        setError('Network error')
        return false
      }
    },
    [fetchUsers]
  )

  const toggleUserActive = useCallback(
    async (userId: string, isActive: boolean): Promise<boolean> => {
      try {
        const res = await fetch(`/api/admin/users/${userId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive }),
        })
        const result = await res.json()
        if (result.success) {
          await fetchUsers()
          return true
        }
        return false
      } catch {
        return false
      }
    },
    [fetchUsers]
  )

  const deleteUser = useCallback(
    async (userId: string): Promise<boolean> => {
      try {
        const res = await fetch(`/api/admin/users/${userId}`, {
          method: 'DELETE',
        })
        const result = await res.json()
        if (result.success) {
          await fetchUsers()
          return true
        }
        return false
      } catch {
        return false
      }
    },
    [fetchUsers]
  )

  return {
    users,
    loading,
    error,
    refetch: fetchUsers,
    createUser,
    toggleUserActive,
    deleteUser,
  }
}

/**
 * useLoginHistory — Hook for fetching login history.
 */
export function useLoginHistory(limit = 50) {
  const [history, setHistory] = useState<LoginHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/login-history?limit=${limit}`)
      const data = await res.json()
      if (data.success) {
        setHistory(data.data)
        setError(null)
      } else {
        setError(data.error || 'Failed to fetch history')
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }, [limit])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  return { history, loading, error, refetch: fetchHistory }
}
