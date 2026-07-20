import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { errorResponse, requireAuth } from "@/lib/auth";

/**
 * GET /api/admin/sukus?regionId=... — list sukus for a region.
 * Available to Super Admin and Admin Regional (for their own region).
 */
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth("SUPER_ADMIN", "ADMIN_REGIONAL");
    const regionIdParam = req.nextUrl.searchParams.get("regionId");
    const regionId = regionIdParam ? Number(regionIdParam) : user.regionId;

    if (!regionId || Number.isNaN(regionId)) {
      return Response.json({ error: "regionId wajib diisi" }, { status: 400 });
    }
    // Admin Regional can only see their own region.
    if (user.role === "ADMIN_REGIONAL" && user.regionId !== regionId) {
      return Response.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const sukus = await db.suku.findMany({
      where: { regionId },
      include: { municipality: true },
      orderBy: [{ municipality: { name: "asc" } }, { name: "asc" }],
    });

    return Response.json({
      sukus: sukus.map((s) => ({
        id: s.id,
        name: s.name,
        municipalityId: s.municipalityId,
        municipalityName: s.municipality.name,
        regionId: s.regionId,
      })),
    });
  } catch (err) {
    return errorResponse(err);
  }
}
