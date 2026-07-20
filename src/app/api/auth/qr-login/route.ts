import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { createSession, errorResponse } from "@/lib/auth";

/**
 * QR-code login for Admin Regional / Admin Lokal.
 *
 * Body: { token: string }
 * The token is looked up in QrToken. If it's active and maps to a profile,
 * we create a session and update lastUsedAt.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const token = typeof body?.token === "string" ? body.token.trim() : "";
    if (!token) {
      return Response.json({ error: "Token QR tidak boleh kosong" }, { status: 400 });
    }

    const qrToken = await db.qrToken.findUnique({
      where: { token },
      include: { profile: true },
    });

    if (!qrToken) {
      return Response.json({ error: "Token QR tidak valid" }, { status: 404 });
    }
    if (!qrToken.active) {
      return Response.json({ error: "Token QR sudah dinonaktifkan oleh Super Admin" }, { status: 403 });
    }
    if (!qrToken.profile.active) {
      return Response.json({ error: "Akun pengguna tidak aktif" }, { status: 403 });
    }
    if (qrToken.expiresAt && qrToken.expiresAt < new Date()) {
      return Response.json({ error: "Token QR sudah kedaluwarsa" }, { status: 403 });
    }

    await db.qrToken.update({
      where: { id: qrToken.id },
      data: { lastUsedAt: new Date() },
    });

    await createSession(qrToken.profileId);
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
