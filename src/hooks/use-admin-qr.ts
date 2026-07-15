'use client'

import { useState, useCallback } from 'react'

interface QrGenerateResult {
  id: string
  token: string
  qrCodeDataUrl: string
  status: string
  createdAt: string
  userName: string
  userRole: string
}

/**
 * useAdminQr — Hook for QR code generation and toggling.
 */
export function useAdminQr() {
  const [generating, setGenerating] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateQr = useCallback(async (userId: string): Promise<QrGenerateResult | null> => {
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/qr/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      const data = await res.json()
      if (data.success) {
        return data.data
      }
      setError(data.error || 'Failed to generate QR')
      return null
    } catch {
      setError('Network error')
      return null
    } finally {
      setGenerating(false)
    }
  }, [])

  const toggleQr = useCallback(
    async (qrId: string, action: 'enable' | 'disable'): Promise<boolean> => {
      setToggling(true)
      setError(null)
      try {
        const res = await fetch('/api/admin/qr/toggle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ qrId, action }),
        })
        const data = await res.json()
        if (data.success) {
          return true
        }
        setError(data.error || 'Failed to toggle QR')
        return false
      } catch {
        setError('Network error')
        return false
      } finally {
        setToggling(false)
      }
    },
    []
  )

  return { generateQr, toggleQr, generating, toggling, error }
}
