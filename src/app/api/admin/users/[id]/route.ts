import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { errorResponse, requireRole } from "@/lib/auth";

/** PATCH /api/admin/users/[id] — update a user (name, active, regionId, sukuId). */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("SUPER_ADMIN");
    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    const existing = await db.profile.findUnique({ where: { id } });
    if (!existing) {
      return Response.json({ error: "Pengguna tidak ditemukan" }, { status: 404 });
    }
    if (existing.role === "SUPER_ADMIN") {
      return Response.json({ error: "Tidak dapat mengubah Super Admin" }, { status: 403 });
    }

    const data: Record<string, unknown> = {};
    if (typeof body?.name === "string" && body.name.trim()) data.name = body.name.trim();
    if (typeof body?.active === "boolean") data.active = body.active;
    if (body?.regionId !== undefined) {
      const regionId = Number(body.regionId);
      if (!Number.isNaN(regionId)) data.regionId = regionId;
    }
    if (body?.sukuId !== undefined) {
      data.sukuId = body.sukuId ? Number(body.sukuId) : null;
    }

    await db.profile.update({ where: { id }, data });
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}

/** DELETE /api/admin/users/[id] — delete a user and their QR tokens. */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("SUPER_ADMIN");
    const { id } = await params;

    const existing = await db.profile.findUnique({ where: { id } });
    if (!existing) {
      return Response.json({ error: "Pengguna tidak ditemukan" }, { status: 404 });
    }
    if (existing.role === "SUPER_ADMIN") {
      return Response.json({ error: "Tidak dapat menghapus Super Admin" }, { status: 403 });
    }

    await db.profile.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
