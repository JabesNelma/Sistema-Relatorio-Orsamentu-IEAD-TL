'use client'

// Client-side fetch wrapper that:
// 1. Attaches the session token (stored in localStorage) as an
//    `Authorization: Bearer <token>` header. This is the PRIMARY auth
//    mechanism when the app is embedded in a cross-site iframe (preview
//    panel), because browsers block SameSite=Lax cookies in that context.
// 2. Transparently retries on 401 with increasing delays. This handles the
//    async Set-Cookie race condition for same-origin (cookie) contexts.

const RETRY_DELAYS_MS = [300, 600, 1200]

const SESSION_TOKEN_KEY = 'gereja_session_token'

export function getSessionToken(): string | null {
  try {
    return localStorage.getItem(SESSION_TOKEN_KEY)
  } catch {
    return null
  }
}

export function setSessionToken(token: string | null) {
  try {
    if (token) {
      localStorage.setItem(SESSION_TOKEN_KEY, token)
    } else {
      localStorage.removeItem(SESSION_TOKEN_KEY)
    }
  } catch {
    // localStorage may be unavailable in some contexts; ignore.
  }
}

export async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  const token = getSessionToken()

  const baseInit: RequestInit = {
    ...init,
    credentials: 'same-origin',
    headers: {
      ...(init?.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  }

  let lastRes: Response | null = null

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    try {
      const res = await fetch(input, baseInit)
      lastRes = res

      // If authenticated (or a non-auth error), return immediately.
      if (res.status !== 401) return res

      // 401 — maybe the session cookie hasn't been committed yet (same-origin)
      // or the token in localStorage is stale. Retry after a delay.
      if (attempt < RETRY_DELAYS_MS.length) {
        await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt]))
        continue
      }
    } catch (err) {
      // Network error — retry if attempts remain.
      if (attempt < RETRY_DELAYS_MS.length) {
        await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt]))
        continue
      }
      throw err
    }
  }

  // Exhausted retries — return the last 401 response.
  return lastRes!
}

// Convenience wrapper that parses JSON and throws on non-ok (after retries).
export async function apiFetchJson<T = any>(input: string, init?: RequestInit): Promise<T> {
  const res = await apiFetch(input, init)
  const data = await res.json().catch(() => ({}))
  return data as T
}
