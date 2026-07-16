import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { errorResponse, requireAuth } from "@/lib/auth";
import type {
  MonthlyPoint,
  RegionalSummary,
  SukuBreakdown,
} from "@/lib/types";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

/**
 * GET /api/financial/regional-summary — aggregated financial data for a region.
 * - Admin Regional: automatically scoped to their region.
 * - Super Admin: ?regionId= required.
 *
 * Returns totals, monthly trend, per-suku breakdown, and category breakdown.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth("SUPER_ADMIN", "ADMIN_REGIONAL");

    let regionId: number | null;
    if (user.role === "ADMIN_REGIONAL") {
      regionId = user.regionId;
    } else {
      const param = req.nextUrl.searchParams.get("regionId");
      regionId = param ? Number(param) : null;
    }

    if (!regionId || Number.isNaN(regionId)) {
      return Response.json({ error: "regionId wajib diisi" }, { status: 400 });
    }

    const region = await db.region.findUnique({ where: { id: regionId } });
    if (!region) {
      return Response.json({ error: "Region tidak ditemukan" }, { status: 404 });
    }

    // Fetch all reports for the region.
    const reports = await db.financialReport.findMany({
      where: { suku: { regionId } },
      include: { suku: { include: { municipality: true } } },
      orderBy: { date: "asc" },
    });

    const totalPersembahan = reports.reduce((s, r) => s + r.persembahan, 0);
    const totalPerpuluhan = reports.reduce((s, r) => s + r.perpuluhan, 0);
    const totalKontribusi = reports.reduce((s, r) => s + r.kontribusi, 0);
    const grandTotal = totalPersembahan + totalPerpuluhan + totalKontribusi;

    // Monthly aggregation (last 12 months).
    const monthlyMap = new Map<string, MonthlyPoint>();
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthlyMap.set(key, {
        month: `${MONTH_NAMES[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`,
        persembahan: 0,
        perpuluhan: 0,
        kontribusi: 0,
        total: 0,
      });
    }

    for (const r of reports) {
      const d = new Date(r.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const entry = monthlyMap.get(key);
      if (entry) {
        entry.persembahan += r.persembahan;
        entry.perpuluhan += r.perpuluhan;
        entry.kontribusi += r.kontribusi;
        entry.total += r.persembahan + r.perpuluhan + r.kontribusi;
      }
    }

    // Per-suku breakdown.
    const sukuMap = new Map<number, SukuBreakdown>();
    for (const r of reports) {
      let entry = sukuMap.get(r.sukuId);
      if (!entry) {
        entry = {
          sukuName: r.suku.name,
          municipalityName: r.suku.municipality.name,
          total: 0,
          persembahan: 0,
          perpuluhan: 0,
          kontribusi: 0,
          reportCount: 0,
        };
        sukuMap.set(r.sukuId, entry);
      }
      entry.persembahan += r.persembahan;
      entry.perpuluhan += r.perpuluhan;
      entry.kontribusi += r.kontribusi;
      entry.total += r.persembahan + r.perpuluhan + r.kontribusi;
      entry.reportCount += 1;
    }

    const sukuBreakdown = Array.from(sukuMap.values()).sort((a, b) => b.total - a.total);

    // Count distinct sukus that have at least one report.
    const allSukusInRegion = await db.suku.count({ where: { regionId } });

    const summary: RegionalSummary = {
      totalPersembahan,
      totalPerpuluhan,
      totalKontribusi,
      grandTotal,
      reportCount: reports.length,
      sukuCount: allSukusInRegion,
      monthlyData: Array.from(monthlyMap.values()),
      sukuBreakdown,
      categoryBreakdown: [
        { name: "Persembahan", value: totalPersembahan },
        { name: "Perpuluhan", value: totalPerpuluhan },
        { name: "Kontribusi", value: totalKontribusi },
      ],
    };

    return Response.json({
      region: { id: region.id, name: region.name, code: region.code },
      summary,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
