/**
 * Auth Database Operations
 * ------------------------
 * All Prisma queries related to authentication, users, QR codes,
 * and login history.
 */

import { prisma } from './db'
import { UserRole } from './auth'
import { randomBytes } from 'crypto'

// ============================================
// USER OPERATIONS
// ============================================

/** Find or create a SUPER_ADMIN user from a Google OAuth email */
export async function findOrCreateSuperAdmin(email: string, name: string) {
  // Check if a user with this email already exists
  let user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user) {
    // Verify this email is the designated super admin
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL
    if (email !== superAdminEmail) {
      return null
    }
    user = await prisma.user.create({
      data: {
        email,
        name,
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
      },
    })
  } else if (user.role !== 'SUPER_ADMIN') {
    // Upgrade to SUPER_ADMIN if they match the designated email
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL
    if (email === superAdminEmail) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { role: 'SUPER_ADMIN' },
      })
    }
  }

  return user
}

/** Get user by ID */
export async function getUserById(id: string) {
  return prisma.user.findUnique({ where: { id } })
}

/** Get all users (for Super Admin management) */
export async function getAllUsers() {
  return prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      qrCodes: {
        where: { isActive: true },
        take: 1,
      },
    },
  })
}

/** Create a new admin user (ADMIN_REGIONAL or ADMIN_LOKAL) */
export async function createUser(data: {
  name: string
  role: UserRole
  region?: string
  churchName?: string
}) {
  return prisma.user.create({
    data: {
      name: data.name,
      role: data.role,
      region: data.region || null,
      churchName: data.churchName || null,
      status: 'ACTIVE',
    },
  })
}

/** Update a user */
export async function updateUser(id: string, data: {
  name?: string
  role?: UserRole
  region?: string | null
  churchName?: string | null
  status?: string
}) {
  return prisma.user.update({
    where: { id },
    data,
  })
}

/** Delete a user */
export async function deleteUser(id: string) {
  return prisma.user.delete({ where: { id } })
}

// ============================================
// QR CODE OPERATIONS
// ============================================

/** Generate a cryptographically secure random token */
export function generateQrToken(): string {
  return randomBytes(32).toString('hex')
}

/** Create a new QR code for a user (deactivates old ones first) */
export async function createQrCodeForUser(userId: string) {
  // Deactivate all existing active QR codes for this user
  await prisma.qrCode.updateMany({
    where: { userId, isActive: true },
    data: { isActive: false },
  })

  // Create new active QR code
  return prisma.qrCode.create({
    data: {
      token: generateQrToken(),
      userId,
      isActive: true,
    },
  })
}

/** Get the active QR code for a user */
export async function getActiveQrCode(userId: string) {
  return prisma.qrCode.findFirst({
    where: { userId, isActive: true },
    orderBy: { createdAt: 'desc' },
  })
}

/** Get all QR codes for a user */
export async function getQrCodesForUser(userId: string) {
  return prisma.qrCode.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })
}

/** Verify a QR token and return the associated user */
export async function verifyQrToken(token: string) {
  const qrCode = await prisma.qrCode.findUnique({
    where: { token },
    include: { user: true },
  })

  if (!qrCode) return null
  if (!qrCode.isActive) return null
  if (qrCode.expiresAt && qrCode.expiresAt < new Date()) return null
  if (qrCode.user.status !== 'ACTIVE') return null

  // Update last used time
  await prisma.qrCode.update({
    where: { id: qrCode.id },
    data: { lastUsedAt: new Date() },
  })

  return qrCode.user
}

/** Toggle QR code active status */
export async function toggleQrCode(qrCodeId: string, isActive: boolean) {
  return prisma.qrCode.update({
    where: { id: qrCodeId },
    data: { isActive },
  })
}

/** Deactivate all QR codes for a user */
export async function deactivateAllQrCodes(userId: string) {
  await prisma.qrCode.updateMany({
    where: { userId },
    data: { isActive: false },
  })
}

// ============================================
// LOGIN HISTORY OPERATIONS
// ============================================

/** Record a login event */
export async function recordLogin(data: {
  userId: string
  method: 'GOOGLE' | 'QR_CODE'
  deviceInfo?: string
  ipAddress?: string
}) {
  return prisma.loginHistory.create({
    data,
  })
}

/** Get login history (optionally filtered by user) */
export async function getLoginHistory(limit = 50, userId?: string) {
  return prisma.loginHistory.findMany({
    where: userId ? { userId } : undefined,
    include: { user: true },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}
