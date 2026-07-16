import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { errorResponse, requireRole } from "@/lib/auth";
import type { AdminUser, Role } from "@/lib/types";

/**
 * GET /api/admin/users — list all non-super-admin users (for Super Admin).
 * Optional ?role=ADMIN_REGIONAL|ADMIN_LOKAL filter.
 */
export async function GET(req: NextRequest) {
  try {
    await requireRole("SUPER_ADMIN");
    const roleParam = req.nextUrl.searchParams.get("role") as Role | null;

    const profiles = await db.profile.findMany({
      where: {
        role: { not: "SUPER_ADMIN" },
        ...(roleParam ? { role: roleParam } : {}),
      },
      include: {
        region: true,
        suku: true,
        tokens: { orderBy: { createdAt: "desc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    const users: AdminUser[] = profiles.map((p) => ({
      id: p.id,
      name: p.name,
      email: p.email,
      role: p.role as Role,
      active: p.active,
      regionId: p.regionId,
      regionName: p.region?.name ?? null,
      sukuId: p.sukuId,
      sukuName: p.suku?.name ?? null,
      createdAt: p.createdAt.toISOString(),
      qrTokens: p.tokens.map((t) => ({
        id: t.id,
        token: t.token,
        label: t.label,
        active: t.active,
        createdAt: t.createdAt.toISOString(),
        lastUsedAt: t.lastUsedAt ? t.lastUsedAt.toISOString() : null,
      })),
    }));

    return Response.json({ users });
  } catch (err) {
    return errorResponse(err);
  }
}

/**
 * POST /api/admin/users — create a new Admin Regional or Admin Lokal.
 * Body: { name, role, regionId, sukuId?, active? }
 * Also generates an initial QR token for the new user.
 */
export async function POST(req: NextRequest) {
  try {
    await requireRole("SUPER_ADMIN");
    const body = await req.json().catch(() => ({}));
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const role = body?.role as Role | undefined;
    const regionId = Number(body?.regionId);
    const sukuId = body?.sukuId ? Number(body.sukuId) : null;

    if (!name) {
      return Response.json({ error: "Nama wajib diisi" }, { status: 400 });
    }
    if (role !== "ADMIN_REGIONAL" && role !== "ADMIN_LOKAL") {
      return Response.json({ error: "Role tidak valid" }, { status: 400 });
    }
    if (!regionId || Number.isNaN(regionId)) {
      return Response.json({ error: "Region wajib dipilih" }, { status: 400 });
    }
    if (role === "ADMIN_LOKAL" && (!sukuId || Number.isNaN(sukuId))) {
      return Response.json({ error: "Suku wajib dipilih untuk Admin Lokal" }, { status: 400 });
    }

    // Validate region/suku exist and match.
    const region = await db.region.findUnique({ where: { id: regionId } });
    if (!region) {
      return Response.json({ error: "Region tidak ditemukan" }, { status: 400 });
    }
    if (sukuId) {
      const suku = await db.suku.findUnique({ where: { id: sukuId } });
      if (!suku || suku.regionId !== regionId) {
        return Response.json({ error: "Suku tidak cocok dengan region" }, { status: 400 });
      }
    }

    const profile = await db.profile.create({
      data: {
        name,
        role,
        regionId,
        sukuId: role === "ADMIN_LOKAL" ? sukuId : null,
        active: body?.active !== false,
      },
    });

    // Generate an initial QR token.
    const { randomBytes } = await import("crypto");
    const token = await db.qrToken.create({
      data: {
        token: randomBytes(24).toString("hex"),
        profileId: profile.id,
        label: `QR ${name}`,
        active: true,
      },
    });

    return Response.json({ profileId: profile.id, tokenId: token.id }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
