import { db } from "@/lib/db";
import { errorResponse, requireRole } from "@/lib/auth";
import type { RegionInfo, MunicipalityInfo, SukuInfo } from "@/lib/types";

/**
 * GET /api/admin/regions — list all regions with their municipalities and sukus.
 * Used by the Super Admin form to populate region/municipality/suku dropdowns.
 */
export async function GET() {
  try {
    await requireRole("SUPER_ADMIN");
    const regions = await db.region.findMany({
      include: {
        municipalities: { include: { sukus: true }, orderBy: { name: "asc" } },
      },
      orderBy: { id: "asc" },
    });

    const result = regions.map((r) => ({
      id: r.id,
      name: r.name,
      code: r.code,
      description: r.description,
      municipalities: r.municipalities.map((m) => ({
        id: m.id,
        name: m.name,
        regionId: m.regionId,
        sukus: m.sukus.map((s) => ({
          id: s.id,
          name: s.name,
          municipalityId: s.municipalityId,
          regionId: s.regionId,
        })),
      })),
    }));

    return Response.json({ regions: result });
  } catch (err) {
    return errorResponse(err);
  }
}
