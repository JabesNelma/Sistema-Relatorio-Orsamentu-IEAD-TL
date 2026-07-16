import { db } from "@/lib/db";
import { errorResponse, requireRole } from "@/lib/auth";

/**
 * GET /api/dashboard — Super Admin overview stats.
 * Returns counts of users by role, regions, reports, and recent activity.
 */
export async function GET() {
  try {
    await requireRole("SUPER_ADMIN");

    const [
      totalRegional,
      totalLokal,
      totalSukus,
      totalRegions,
      totalReports,
      totalQrTokens,
      activeQrTokens,
      recentReports,
      regionStats,
    ] = await Promise.all([
      db.profile.count({ where: { role: "ADMIN_REGIONAL" } }),
      db.profile.count({ where: { role: "ADMIN_LOKAL" } }),
      db.suku.count(),
      db.region.count(),
      db.financialReport.count(),
      db.qrToken.count(),
      db.qrToken.count({ where: { active: true } }),
      db.financialReport.findMany({
        take: 8,
        orderBy: { createdAt: "desc" },
        include: {
          suku: { include: { municipality: true } },
          createdBy: true,
        },
      }),
      db.region.findMany({
        include: {
          _count: { select: { sukus: true, profiles: true } },
          sukus: {
            select: {
              _count: { select: { reports: true } },
            },
          },
        },
        orderBy: { id: "asc" },
      }),
    ]);

    const grandTotal = await db.financialReport.aggregate({
      _sum: { persembahan: true, perpuluhan: true, kontribusi: true },
    });

    const regions = regionStats.map((r) => {
      const reportCount = r.sukus.reduce((s, suku) => s + suku._count.reports, 0);
      return {
        id: r.id,
        name: r.name,
        code: r.code,
        description: r.description,
        sukuCount: r._count.sukus,
        adminCount: r._count.profiles,
        reportCount,
      };
    });

    return Response.json({
      stats: {
        totalRegional,
        totalLokal,
        totalSukus,
        totalRegions,
        totalReports,
        totalQrTokens,
        activeQrTokens,
        grandTotalPersembahan: grandTotal._sum.persembahan ?? 0,
        grandTotalPerpuluhan: grandTotal._sum.perpuluhan ?? 0,
        grandTotalKontribusi: grandTotal._sum.kontribusi ?? 0,
        grandTotal:
          (grandTotal._sum.persembahan ?? 0) +
          (grandTotal._sum.perpuluhan ?? 0) +
          (grandTotal._sum.kontribusi ?? 0),
      },
      regions,
      recentReports: recentReports.map((r) => ({
        id: r.id,
        date: r.date.toISOString(),
        sukuName: r.suku.name,
        municipalityName: r.suku.municipality.name,
        total: r.persembahan + r.perpuluhan + r.kontribusi,
        createdByName: r.createdBy.name,
        createdAt: r.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    return errorResponse(err);
  }
}
