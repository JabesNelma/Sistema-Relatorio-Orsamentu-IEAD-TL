import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { errorResponse, requireRole } from "@/lib/auth";

/**
 * PATCH /api/admin/qr-codes/[id] — toggle active state of a QR token.
 * Body: { active: boolean }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("SUPER_ADMIN");
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const active = typeof body?.active === "boolean" ? body.active : undefined;
    if (active === undefined) {
      return Response.json({ error: "Field 'active' wajib diisi" }, { status: 400 });
    }

    const existing = await db.qrToken.findUnique({ where: { id } });
    if (!existing) {
      return Response.json({ error: "Token tidak ditemukan" }, { status: 404 });
    }

    await db.qrToken.update({ where: { id }, data: { active } });
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}

/** DELETE /api/admin/qr-codes/[id] — delete a QR token. */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("SUPER_ADMIN");
    const { id } = await params;

    const existing = await db.qrToken.findUnique({ where: { id } });
    if (!existing) {
      return Response.json({ error: "Token tidak ditemukan" }, { status: 404 });
    }

    await db.qrToken.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
