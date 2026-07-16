import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { errorResponse, requireRole } from "@/lib/auth";
import QRCode from "qrcode";

/**
 * GET /api/admin/qr-codes?profileId=... — list QR tokens (optionally for a profile).
 * When ?profileId is provided, returns tokens for that user.
 */
export async function GET(req: NextRequest) {
  try {
    await requireRole("SUPER_ADMIN");
    const profileId = req.nextUrl.searchParams.get("profileId");

    const tokens = await db.qrToken.findMany({
      where: profileId ? { profileId } : undefined,
      include: { profile: { include: { region: true, suku: true } } },
      orderBy: { createdAt: "desc" },
    });

    const result = await Promise.all(
      tokens.map(async (t) => ({
        id: t.id,
        token: t.token,
        label: t.label,
        active: t.active,
        createdAt: t.createdAt.toISOString(),
        lastUsedAt: t.lastUsedAt ? t.lastUsedAt.toISOString() : null,
        profile: {
          id: t.profile.id,
          name: t.profile.name,
          role: t.profile.role,
          regionName: t.profile.region?.name ?? null,
          sukuName: t.profile.suku?.name ?? null,
        },
        // Generate a QR PNG data URL embedding the token (the login URL).
        qrDataUrl: await QRCode.toDataURL(t.token, {
          width: 240,
          margin: 1,
          color: { dark: "#0f172a", light: "#ffffff" },
        }),
      }))
    );

    return Response.json({ tokens: result });
  } catch (err) {
    return errorResponse(err);
  }
}

/**
 * POST /api/admin/qr-codes — generate a new QR token for a user.
 * Optionally deactivates previous tokens for that user (regenerate).
 * Body: { profileId, label?, deactivateOld? }
 */
export async function POST(req: NextRequest) {
  try {
    await requireRole("SUPER_ADMIN");
    const body = await req.json().catch(() => ({}));
    const profileId = typeof body?.profileId === "string" ? body.profileId : "";
    if (!profileId) {
      return Response.json({ error: "profileId wajib diisi" }, { status: 400 });
    }

    const profile = await db.profile.findUnique({ where: { id: profileId } });
    if (!profile) {
      return Response.json({ error: "Pengguna tidak ditemukan" }, { status: 404 });
    }
    if (profile.role === "SUPER_ADMIN") {
      return Response.json({ error: "Super Admin tidak menggunakan QR login" }, { status: 400 });
    }

    // Optionally deactivate existing tokens (regenerate).
    if (body?.deactivateOld) {
      await db.qrToken.updateMany({
        where: { profileId, active: true },
        data: { active: false },
      });
    }

    const { randomBytes } = await import("crypto");
    const token = await db.qrToken.create({
      data: {
        token: randomBytes(24).toString("hex"),
        profileId,
        label: typeof body?.label === "string" && body.label.trim()
          ? body.label.trim()
          : `QR ${profile.name}`,
        active: true,
      },
    });

    const qrDataUrl = await QRCode.toDataURL(token.token, {
      width: 240,
      margin: 1,
      color: { dark: "#0f172a", light: "#ffffff" },
    });

    return Response.json({
      token: {
        id: token.id,
        token: token.token,
        label: token.label,
        active: token.active,
        createdAt: token.createdAt.toISOString(),
        lastUsedAt: null,
        qrDataUrl,
      },
    }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
