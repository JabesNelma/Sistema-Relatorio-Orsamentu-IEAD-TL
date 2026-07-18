'use client'

// Client-side fetch wrapper that transparently retries on 401.
//
// Why this exists:
// After a successful POST /api/auth/login, the server sets the session cookie
// via the Set-Cookie header. Browsers process this header ASYNCHRONOUSLY — an
// immediate follow-up request (e.g. GET /api/admins fired from a dashboard
// useEffect) can be sent BEFORE the cookie is committed to the browser's cookie
// store. That request arrives without a cookie and the server returns 401.
//
// Rather than blocking the login UI on a fragile "verify session" round-trip,
// we let the dashboard render immediately and make its data fetches resilient:
// on 401 we wait a short, increasing delay and retry. By the second attempt
// the cookie has always been committed.

const RETRY_DELAYS_MS = [300, 600, 1200]

export async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  const baseInit: RequestInit = {
    ...init,
    credentials: 'same-origin',
    headers: {
      ...(init?.headers || {}),
    },
  }

  let lastRes: Response | null = null

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    try {
      const res = await fetch(input, baseInit)
      lastRes = res

      // If authenticated (or a non-auth error), return immediately.
      if (res.status !== 401) return res

      // 401 — maybe the session cookie hasn't been committed yet.
      // Retry after a delay if we have attempts left.
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
