import { prisma } from '@/lib/db'
import { createClient } from './supabase-server'
import { cookies } from 'next/headers'
import { Role } from '@prisma/client'
import { randomBytes } from 'crypto'

// Session cookie name for QR-based auth
export const QR_SESSION_COOKIE = 'siadtl-qr-session'

// Session duration in seconds (7 days)
export const SESSION_DURATION = 60 * 60 * 24 * 7

/**
 * Get the current authenticated user from either:
 * 1. Supabase Auth (Google OAuth) → SUPER_ADMIN
 * 2. QR session cookie → ADMIN_REGIONAL or ADMIN_LOKAL
 */
export async function getCurrentUser() {
  // 1. Try Supabase Auth (Google OAuth) first
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user?.email) {
      const dbUser = await prisma.user.findUnique({
        where: { email: user.email },
      })

      if (dbUser && dbUser.isActive && dbUser.role === 'SUPER_ADMIN') {
        return dbUser
      }
    }
  } catch {
    // Supabase not configured yet, continue to QR check
  }

  // 2. Try QR session cookie
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(QR_SESSION_COOKIE)?.value

  if (sessionToken) {
    const qrCode = await prisma.qrCode.findUnique({
      where: { token: sessionToken },
      include: { user: true },
    })

    if (
      qrCode &&
      qrCode.status === 'ACTIVE' &&
      qrCode.user.isActive &&
      (!qrCode.expiresAt || qrCode.expiresAt > new Date())
    ) {
      return qrCode.user
    }
  }

  return null
}

/**
 * Require authentication. Throws redirect if not logged in.
 * Returns the user if authenticated.
 */
export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('UNAUTHORIZED')
  }
  return user
}

/**
 * Require a specific role. Throws if user doesn't have it.
 */
export async function requireRole(...roles: Role[]) {
  const user = await requireAuth()
  if (!roles.includes(user.role)) {
    throw new Error('FORBIDDEN')
  }
  return user
}

/**
 * Generate a secure random token for QR codes.
 * Returns a 64-character hex string (256 bits of entropy).
 */
export function generateSecureToken(): string {
  return randomBytes(32).toString('hex')
}

/**
 * Set QR session cookie.
 * Called from the QR login API route.
 */
export async function setQrSessionCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set(QR_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DURATION,
  })
}

/**
 * Clear QR session cookie.
 */
export async function clearQrSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(QR_SESSION_COOKIE)
}

/**
 * Check if a SUPER_ADMIN exists in the database.
 * Used to determine if first Google login should be promoted.
 */
export async function hasSuperAdmin(): Promise<boolean> {
  const count = await prisma.user.count({
    where: { role: 'SUPER_ADMIN' },
  })
  return count > 0
}

/**
 * Get or create SUPER_ADMIN user from Google OAuth email.
 * If no SUPER_ADMIN exists, the first Google login with the configured email becomes SUPER_ADMIN.
 */
export async function getOrCreateSuperAdmin(email: string, name: string) {
  // Check if this email matches the configured super admin email
  const configuredEmail = process.env.SUPER_ADMIN_EMAIL

  if (email !== configuredEmail) {
    return null // Not authorized as super admin
  }

  // Check if super admin already exists
  const existing = await prisma.user.findUnique({
    where: { email },
  })

  if (existing) {
    if (existing.role !== 'SUPER_ADMIN') {
      // Promote to super admin if needed
      return prisma.user.update({
        where: { id: existing.id },
        data: { role: 'SUPER_ADMIN', isActive: true },
      })
    }
    return existing
  }

  // Create new super admin
  return prisma.user.create({
    data: {
      email,
      name,
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  })
}
