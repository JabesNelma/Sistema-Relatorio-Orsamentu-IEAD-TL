import { db } from "@/lib/db";
import { errorResponse, requireAuth } from "@/lib/auth";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

/**
 * GET /api/financial/lokal-summary — aggregated data for the Admin Lokal dashboard.
 * Scoped to the logged-in admin's suku. Returns totals, last-30-days daily
 * trend, and monthly trend for per-category performance charts.
 */
export async function GET() {
  try {
    const user = await requireAuth("ADMIN_LOKAL");
    if (!user.sukuId) {
      return Response.json({ error: "Akun tidak terkait ke suku" }, { status: 400 });
    }

    const reports = await db.financialReport.findMany({
      where: { sukuId: user.sukuId },
      orderBy: { date: "asc" },
    });

    const totalPersembahan = reports.reduce((s, r) => s + r.persembahan, 0);
    const totalPerpuluhan = reports.reduce((s, r) => s + r.perpuluhan, 0);
    const totalKontribusi = reports.reduce((s, r) => s + r.kontribusi, 0);
    const grandTotal = totalPersembahan + totalPerpuluhan + totalKontribusi;

    // Daily trend for the last 30 days.
    const dailyMap = new Map<string, { date: string; persembahan: number; perpuluhan: number; kontribusi: number; total: number }>();
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      dailyMap.set(key, {
        date: `${String(d.getDate()).padStart(2, "0")} ${MONTH_NAMES[d.getMonth()]}`,
        persembahan: 0,
        perpuluhan: 0,
        kontribusi: 0,
        total: 0,
      });
    }
    for (const r of reports) {
      const key = r.date.toISOString().slice(0, 10);
      const entry = dailyMap.get(key);
      if (entry) {
        entry.persembahan += r.persembahan;
        entry.perpuluhan += r.perpuluhan;
        entry.kontribusi += r.kontribusi;
        entry.total += r.persembahan + r.perpuluhan + r.kontribusi;
      }
    }

    // Monthly trend (last 6 months).
    const monthlyMap = new Map<string, { month: string; persembahan: number; perpuluhan: number; kontribusi: number; total: number }>();
    for (let i = 5; i >= 0; i--) {
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

    return Response.json({
      suku: { id: user.sukuId, name: user.sukuName },
      summary: {
        totalPersembahan,
        totalPerpuluhan,
        totalKontribusi,
        grandTotal,
        reportCount: reports.length,
      },
      dailyData: Array.from(dailyMap.values()),
      monthlyData: Array.from(monthlyMap.values()),
      categoryBreakdown: [
        { name: "Persembahan", value: totalPersembahan },
        { name: "Perpuluhan", value: totalPerpuluhan },
        { name: "Kontribusi", value: totalKontribusi },
      ],
    });
  } catch (err) {
    return errorResponse(err);
  }
}
