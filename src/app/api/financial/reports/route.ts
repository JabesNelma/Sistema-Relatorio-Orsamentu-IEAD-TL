import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { errorResponse, requireAuth } from "@/lib/auth";
import type { FinancialReportRow } from "@/lib/types";

function asNumber(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

/**
 * GET /api/financial/reports — list financial reports.
 * - Admin Lokal: only their own suku's reports.
 * - Admin Regional: all reports in their region.
 * - Super Admin: all reports.
 * Query params: ?sukuId=, ?from=, ?to=, ?limit=
 */
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth("SUPER_ADMIN", "ADMIN_REGIONAL", "ADMIN_LOKAL");
    const sp = req.nextUrl.searchParams;
    const sukuIdParam = sp.get("sukuId");
    const from = sp.get("from");
    const to = sp.get("to");
    const limitParam = sp.get("limit");
    const limit = limitParam ? Math.min(Number(limitParam) || 500, 1000) : 500;

    const where: Record<string, unknown> = {};
    if (from || to) {
      where.date = {};
      if (from) (where.date as Record<string, unknown>).gte = new Date(from);
      if (to) (where.date as Record<string, unknown>).lte = new Date(to);
    }

    if (user.role === "ADMIN_LOKAL") {
      // Lokal admin can only see their own suku.
      if (!user.sukuId) {
        return Response.json({ reports: [] });
      }
      where.sukuId = user.sukuId;
    } else if (user.role === "ADMIN_REGIONAL") {
      // Regional admin sees all sukus in their region.
      if (!user.regionId) {
        return Response.json({ reports: [] });
      }
      where.suku = { regionId: user.regionId };
      if (sukuIdParam) {
        where.sukuId = Number(sukuIdParam);
      }
    } else {
      // Super Admin: optional sukuId filter.
      if (sukuIdParam) where.sukuId = Number(sukuIdParam);
    }

    const reports = await db.financialReport.findMany({
      where,
      include: {
        suku: { include: { municipality: true } },
        createdBy: true,
      },
      orderBy: { date: "desc" },
      take: limit,
    });

    const rows: FinancialReportRow[] = reports.map((r) => ({
      id: r.id,
      date: r.date.toISOString(),
      persembahan: r.persembahan,
      perpuluhan: r.perpuluhan,
      kontribusi: r.kontribusi,
      total: r.persembahan + r.perpuluhan + r.kontribusi,
      catatan: r.catatan,
      sukuId: r.sukuId,
      sukuName: r.suku.name,
      municipalityName: r.suku.municipality.name,
      createdByName: r.createdBy.name,
      createdAt: r.createdAt.toISOString(),
    }));

    return Response.json({ reports: rows });
  } catch (err) {
    return errorResponse(err);
  }
}

/**
 * POST /api/financial/reports — create a financial report (Admin Lokal only).
 * Body: { date, persembahan, perpuluhan, kontribusi, catatan? }
 * The suku is automatically the logged-in admin's suku.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth("ADMIN_LOKAL");
    if (!user.sukuId) {
      return Response.json({ error: "Akun tidak terkait ke suku manapun" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const dateStr = typeof body?.date === "string" ? body.date : "";
    if (!dateStr) {
      return Response.json({ error: "Tanggal wajib diisi" }, { status: 400 });
    }
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) {
      return Response.json({ error: "Tanggal tidak valid" }, { status: 400 });
    }

    const persembahan = asNumber(body?.persembahan);
    const perpuluhan = asNumber(body?.perpuluhan);
    const kontribusi = asNumber(body?.kontribusi);
    const catatan = typeof body?.catatan === "string" && body.catatan.trim()
      ? body.catatan.trim().slice(0, 500)
      : null;

    if (persembahan === 0 && perpuluhan === 0 && kontribusi === 0) {
      return Response.json({ error: "Minimal salah satu nilai pemasukan harus diisi" }, { status: 400 });
    }

    const report = await db.financialReport.create({
      data: {
        date,
        persembahan,
        perpuluhan,
        kontribusi,
        catatan,
        sukuId: user.sukuId,
        createdById: user.id,
      },
      include: { suku: { include: { municipality: true } }, createdBy: true },
    });

    const row: FinancialReportRow = {
      id: report.id,
      date: report.date.toISOString(),
      persembahan: report.persembahan,
      perpuluhan: report.perpuluhan,
      kontribusi: report.kontribusi,
      total: report.persembahan + report.perpuluhan + report.kontribusi,
      catatan: report.catatan,
      sukuId: report.sukuId,
      sukuName: report.suku.name,
      municipalityName: report.suku.municipality.name,
      createdByName: report.createdBy.name,
      createdAt: report.createdAt.toISOString(),
    };

    return Response.json({ report: row }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
