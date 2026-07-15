/**
 * Proxy (Middleware) — Route Protection
 * -------------------------------------
 * In Next.js 16, middleware is called "proxy".
 *
 * Verifies the JWT session cookie and redirects unauthenticated
 * users to /login. Protected routes require specific roles.
 *
 * Public routes:  /, /login
 * All /api/ routes pass through (they handle their own auth).
 * Page routes are protected based on role.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE, verifySessionToken, UserRole } from '@/lib/auth'

// ============================================
// ROUTE CONFIGURATION
// ============================================

const PUBLIC_ROUTES = ['/', '/login']

interface RouteRule {
  pattern: RegExp
  roles: UserRole[]
}

const PROTECTED_ROUTES: RouteRule[] = [
  { pattern: /^\/admin\/manage/, roles: ['SUPER_ADMIN'] },
  { pattern: /^\/regional/, roles: ['SUPER_ADMIN', 'ADMIN_REGIONAL'] },
  { pattern: /^\/lokal/, roles: ['SUPER_ADMIN', 'ADMIN_LOKAL'] },
  { pattern: /^\/nasional/, roles: ['SUPER_ADMIN', 'ADMIN_REGIONAL'] },
]

// ============================================
// PROXY MAIN
// ============================================

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes
  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next()
  }

  // Allow all API routes — they handle their own auth checks
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Check if route requires auth
  const requiredRoles = getRequiredRoles(pathname)
  if (!requiredRoles) {
    // No auth required for this route
    return NextResponse.next()
  }

  // Get session cookie
  const sessionCookie = request.cookies.get(SESSION_COOKIE)?.value
  if (!sessionCookie) {
    return redirectToLogin(request, pathname)
  }

  // Verify JWT
  const session = await verifySessionToken(sessionCookie)
  if (!session) {
    return redirectToLogin(request, pathname)
  }

  // Check role
  if (!requiredRoles.includes(session.role)) {
    // User doesn't have permission — redirect to their appropriate dashboard
    return redirectToDashboard(request, session.role)
  }

  return NextResponse.next()
}

// ============================================
// HELPERS
// ============================================

function getRequiredRoles(pathname: string): UserRole[] | null {
  for (const rule of PROTECTED_ROUTES) {
    if (rule.pattern.test(pathname)) return rule.roles
  }
  return null
}

function redirectToLogin(request: NextRequest, pathname: string) {
  const loginUrl = new URL('/login', request.url)
  loginUrl.searchParams.set('from', pathname)
  return NextResponse.redirect(loginUrl)
}

function redirectToDashboard(request: NextRequest, role: UserRole) {
  let dashboard = '/'
  if (role === 'SUPER_ADMIN') dashboard = '/admin/manage'
  else if (role === 'ADMIN_REGIONAL') dashboard = '/regional'
  else if (role === 'ADMIN_LOKAL') dashboard = '/lokal'
  return NextResponse.redirect(new URL(dashboard, request.url))
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, logo.svg, robots.txt
     */
    '/((?!_next/static|_next/image|favicon.ico|logo.svg|robots.txt).*)',
  ],
}
