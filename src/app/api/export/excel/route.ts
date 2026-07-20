import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { errorResponse, requireAuth } from "@/lib/auth";
import * as XLSX from "xlsx";

/**
 * GET /api/export/excel — export regional financial reports to .xlsx.
 * - Admin Regional: exports their region's data.
 * - Super Admin: ?regionId= required (or exports all).
 *
 * Produces a workbook with two sheets:
 *  1. "Ringkasan" — totals per category and per suku.
 *  2. "Rincian" — every individual report row.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth("SUPER_ADMIN", "ADMIN_REGIONAL");

    let regionId: number | null;
    let regionName = "Semua Region";
    if (user.role === "ADMIN_REGIONAL") {
      regionId = user.regionId;
      regionName = user.regionName ?? "Region";
    } else {
      const param = req.nextUrl.searchParams.get("regionId");
      regionId = param ? Number(param) : null;
      if (regionId) {
        const r = await db.region.findUnique({ where: { id: regionId } });
        regionName = r?.name ?? "Region";
      }
    }

    const where = regionId ? { suku: { regionId } } : {};
    const reports = await db.financialReport.findMany({
      where,
      include: {
        suku: { include: { municipality: true } },
        createdBy: true,
      },
      orderBy: { date: "asc" },
    });

    // --- Sheet 1: Ringkasan (per-suku summary) ---
    const sukuMap = new Map<
      number,
      {
        Munisipalidade: string;
        Suku: string;
        Persembahan: number;
        Perpuluhan: number;
        Kontribusi: number;
        Total: number;
        JumlahLaporan: number;
      }
    >();

    for (const r of reports) {
      let e = sukuMap.get(r.sukuId);
      if (!e) {
        e = {
          Munisipalidade: r.suku.municipality.name,
          Suku: r.suku.name,
          Persembahan: 0,
          Perpuluhan: 0,
          Kontribusi: 0,
          Total: 0,
          JumlahLaporan: 0,
        };
        sukuMap.set(r.sukuId, e);
      }
      e.Persembahan += r.persembahan;
      e.Perpuluhan += r.perpuluhan;
      e.Kontribusi += r.kontribusi;
      e.Total += r.persembahan + r.perpuluhan + r.kontribusi;
      e.JumlahLaporan += 1;
    }

    const summaryRows = Array.from(sukuMap.values()).sort((a, b) => b.Total - a.Total);
    const grandTotal = summaryRows.reduce((s, r) => s + r.Total, 0);
    // Append a grand total row.
    summaryRows.push({
      Munisipalidade: "TOTAL",
      Suku: "",
      Persembahan: summaryRows.reduce((s, r) => s + r.Persembahan, 0),
      Perpuluhan: summaryRows.reduce((s, r) => s + r.Perpuluhan, 0),
      Kontribusi: summaryRows.reduce((s, r) => s + r.Kontribusi, 0),
      Total: grandTotal,
      JumlahLaporan: summaryRows.reduce((s, r) => s + r.JumlahLaporan, 0),
    });

    // --- Sheet 2: Rincian (every report) ---
    const detailRows = reports.map((r) => ({
      Tanggal: r.date.toISOString().slice(0, 10),
      Munisipalidade: r.suku.municipality.name,
      Suku: r.suku.name,
      Persembahan: r.persembahan,
      Perpuluhan: r.perpuluhan,
      Kontribusi: r.kontribusi,
      Total: r.persembahan + r.perpuluhan + r.kontribusi,
      Catatan: r.catatan ?? "",
      DiinputOleh: r.createdBy.name,
    }));

    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.json_to_sheet(summaryRows);
    const ws2 = XLSX.utils.json_to_sheet(detailRows);

    // Set column widths for readability.
    (ws1 as XLSX.WorkSheet)["!cols"] = [
      { wch: 18 }, { wch: 20 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 },
    ];
    (ws2 as XLSX.WorkSheet)["!cols"] = [
      { wch: 12 }, { wch: 18 }, { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 24 }, { wch: 18 },
    ];

    XLSX.utils.book_append_sheet(wb, ws1, "Ringkasan");
    XLSX.utils.book_append_sheet(wb, ws2, "Rincian");

    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
    const filename = `Laporan_Keuangan_${regionName.replace(/\s+/g, "_")}.xlsx`;

    return new Response(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
