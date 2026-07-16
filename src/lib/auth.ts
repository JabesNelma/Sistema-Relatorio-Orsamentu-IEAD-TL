import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";

export const SESSION_COOKIE = "financa_session";
const SESSION_DURATION_DAYS = 7;

export type Role = "SUPER_ADMIN" | "ADMIN_REGIONAL" | "ADMIN_LOKAL";

export type SessionUser = {
  id: string;
  name: string;
  email: string | null;
  role: Role;
  regionId: number | null;
  sukuId: number | null;
  regionName?: string | null;
  sukuName?: string | null;
};

/**
 * Create a new session for a profile and set the cookie.
 * Returns the session token.
 */
export async function createSession(profileId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

  await db.session.create({
    data: { token, profileId, expiresAt },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });

  return token;
}

/**
 * Destroy the current session (cookie + DB record).
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.session.deleteMany({ where: { token } }).catch(() => {});
  }
  cookieStore.delete(SESSION_COOKIE);
}

/**
 * Get the current authenticated user from the session cookie.
 * Returns null if not authenticated or session expired.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { token },
    include: {
      profile: {
        include: { region: true, suku: true },
      },
    },
  });

  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await db.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  if (!session.profile.active) return null;

  return {
    id: session.profile.id,
    name: session.profile.name,
    email: session.profile.email,
    role: session.profile.role as Role,
    regionId: session.profile.regionId,
    sukuId: session.profile.sukuId,
    regionName: session.profile.region?.name ?? null,
    sukuName: session.profile.suku?.name ?? null,
  };
}

/**
 * Require authentication. Throws a 401-shaped error if not logged in.
 */
export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new UnauthorizedError("Not authenticated");
  }
  return user;
}

/**
 * Require a specific role (or one of several roles).
 */
export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const user = await requireAuth();
  if (!roles.includes(user.role)) {
    throw new ForbiddenError("Insufficient permissions");
  }
  return user;
}

export class UnauthorizedError extends Error {
  status = 401;
}
export class ForbiddenError extends Error {
  status = 403;
}

/**
 * Convert an thrown error into a Next.js Response with the right status.
 */
export function errorResponse(err: unknown): Response {
  if (err instanceof UnauthorizedError) {
    return Response.json({ error: err.message }, { status: 401 });
  }
  if (err instanceof ForbiddenError) {
    return Response.json({ error: err.message }, { status: 403 });
  }
  console.error("API error:", err);
  return Response.json(
    { error: err instanceof Error ? err.message : "Internal server error" },
    { status: 500 }
  );
}
