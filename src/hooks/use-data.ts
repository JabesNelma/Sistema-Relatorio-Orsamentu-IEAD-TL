'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChurchReport, Comment } from '@/lib/data'

// Hook for fetching reports
export function useReports() {
  const [reports, setReports] = useState<ChurchReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/reports')
      const data = await response.json()
      
      if (data.success) {
        setReports(data.data)
        setError(null)
      } else {
        setError(data.error || 'Failed to fetch reports')
      }
    } catch (err) {
      setError('Failed to fetch reports')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  return { reports, loading, error, refetch: fetchReports }
}

// Hook for creating a report
export function useCreateReport() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createReport = useCallback(async (data: {
    churchName: string
    region: string
    month: string
    year: number
    osanTama: { deskrisaun: string; montante: number }[]
    gastu: { gastuBaSaida: string; montante: number }[]
  }) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      const result = await response.json()
      
      if (result.success) {
        return result.data
      } else {
        setError(result.error || 'Failed to create report')
        return null
      }
    } catch (err) {
      setError('Failed to create report')
      console.error(err)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { createReport, loading, error }
}

// Hook for fetching comments
export function useComments(page: 'landing' | 'regional' | 'nasional') {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/comments?page=${page}`)
      const data = await response.json()
      
      if (data.success) {
        setComments(data.data)
        setError(null)
      } else {
        setError(data.error || 'Failed to fetch comments')
      }
    } catch (err) {
      setError('Failed to fetch comments')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  return { comments, loading, error, refetch: fetchComments }
}

// Hook for adding a comment
export function useAddComment() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addComment = useCallback(async (page: string, author: string, content: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ page, author, content }),
      })
      
      const result = await response.json()
      
      if (result.success) {
        return result.data
      } else {
        setError(result.error || 'Failed to add comment')
        return null
      }
    } catch (err) {
      setError('Failed to add comment')
      console.error(err)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { addComment, loading, error }
}
