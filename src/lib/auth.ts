import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { db } from './db'
import { randomBytes } from 'crypto'

export const SESSION_COOKIE = 'gereja_session'
const SESSION_DAYS = 7

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateToken(): string {
  return randomBytes(32).toString('hex')
}

export type SafeUser = {
  id: string
  email: string
  name: string
  role: 'SUPER_ADMIN' | 'REGIONAL_ADMIN' | 'LOCAL_ADMIN'
  phone: string | null
  active: boolean
  regionId: string | null
  localId: string | null
  loginToken: string | null
  tokenActive: boolean
  tokenCreatedAt: string | null
  region?: { id: string; name: string } | null
  local?: { id: string; name: string } | null
}

export function toSafeUser(user: any): SafeUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    phone: user.phone,
    active: user.active,
    regionId: user.regionId,
    localId: user.localId,
    loginToken: user.loginToken ?? null,
    tokenActive: user.tokenActive ?? true,
    tokenCreatedAt: user.tokenCreatedAt ? user.tokenCreatedAt.toISOString() : null,
    region: user.region ? { id: user.region.id, name: user.region.name } : null,
    local: user.local ? { id: user.local.id, name: user.local.name } : null,
  }
}

// Generate a long, unguessable secret token for QR-code login links.
export function generateLoginToken(): string {
  return randomBytes(24).toString('hex')
}

export async function createSession(userId: string): Promise<string> {
  const token = generateToken()
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000)
  await db.session.create({
    data: { token, userId, expiresAt },
  })
  return token
}

export async function setSessionCookie(token: string) {
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000)
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires,
  })
}

export async function clearSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}

export async function getCurrentUser(): Promise<SafeUser | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE)?.value
    if (!token) return null

    const session = await db.session.findUnique({
      where: { token },
      include: {
        user: {
          include: {
            region: { select: { id: true, name: true } },
            local: { select: { id: true, name: true } },
          },
        },
      },
    })

    if (!session) return null
    if (session.expiresAt < new Date()) {
      await db.session.delete({ where: { id: session.id } }).catch(() => {})
      return null
    }
    if (!session.user.active) return null

    return toSafeUser(session.user)
  } catch {
    return null
  }
}

export async function destroySession(token: string) {
  await db.session.deleteMany({ where: { token } }).catch(() => {})
}
