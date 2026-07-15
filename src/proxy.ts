import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * Middleware for route protection and Supabase session refresh.
 *
 * Protected routes:
 * - /admin/*          → SUPER_ADMIN only
 * - /regional         → ADMIN_REGIONAL or SUPER_ADMIN
 * - /lokal            → ADMIN_LOKAL or SUPER_ADMIN
 * - /nasional         → ADMIN_REGIONAL or SUPER_ADMIN
 *
 * Public routes:
 * - /                 → Landing page
 * - /login            → Login page
 * - /qr-login         → QR login page
 * - /api/auth/*       → Auth API routes
 * - /api/public/*     → Public API routes
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes without any check
  const publicRoutes = ['/', '/login', '/qr-login']
  const isPublicRoute =
    publicRoutes.includes(pathname) ||
    pathname.startsWith('/api/') // All API routes handle their own auth

  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Refresh Supabase session (Google OAuth)
  let response = NextResponse.next()
  let googleEmail: string | null = null

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value, options)
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    googleEmail = user?.email || null
  } catch {
    // Supabase not configured — continue with QR session check
  }

  // Check QR session cookie
  const qrToken = request.cookies.get('siadtl-qr-session')?.value

  // Determine user role for this request
  // Note: Full role check happens in API routes / Server Components via getCurrentUser()
  // Middleware does a lightweight check based on path prefix

  // For protected routes, we need either a Google email or a QR token
  const hasAnyAuth = googleEmail || qrToken

  // If accessing protected route without any auth, redirect to login
  const protectedRoutes = ['/admin', '/regional', '/lokal', '/nasional']
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  )

  if (isProtectedRoute && !hasAnyAuth) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
