/**
 * Authentication & Session Management
 * ------------------------------------
 * Uses `jose` for JWT signing/verification so it works in both
 * Node.js (API routes) and Edge Runtime (middleware).
 *
 * Session is stored in an httpOnly cookie called "siadtl-session".
 */

import { SignJWT, jwtVerify } from 'jose'

// ============================================
// TYPES
// ============================================

export type UserRole = 'SUPER_ADMIN' | 'ADMIN_REGIONAL' | 'ADMIN_LOKAL'

export interface SessionPayload {
  userId: string
  email: string | null
  name: string
  role: UserRole
  region: string | null
  churchName: string | null
}

// ============================================
// CONSTANTS
// ============================================

export const SESSION_COOKIE = 'siadtl-session'
export const SESSION_MAX_AGE = 7 * 24 * 60 * 60 // 7 days in seconds

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dev-secret-change-in-production-min-32-chars-long'
)

// ============================================
// SESSION TOKEN (JWT)
// ============================================

/** Create a signed JWT containing the user's session data */
export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .setSubject(payload.userId)
    .sign(secret)
}

/** Verify a JWT and return the payload, or null if invalid/expired */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    return {
      userId: payload.userId as string,
      email: (payload.email as string) || null,
      name: payload.name as string,
      role: payload.role as UserRole,
      region: (payload.region as string) || null,
      churchName: (payload.churchName as string) || null,
    }
  } catch {
    return null
  }
}

// ============================================
// ROLE HIERARCHY & HELPERS
// ============================================

/**
 * Returns true if `userRole` is allowed to access a route that requires `requiredRole`.
 * SUPER_ADMIN can access everything.
 */
export function hasRoleAccess(userRole: UserRole, requiredRole: UserRole): boolean {
  if (userRole === 'SUPER_ADMIN') return true
  return userRole === requiredRole
}

/** Check if a role string is valid */
export function isValidRole(role: string): role is UserRole {
  return role === 'SUPER_ADMIN' || role === 'ADMIN_REGIONAL' || role === 'ADMIN_LOKAL'
}
