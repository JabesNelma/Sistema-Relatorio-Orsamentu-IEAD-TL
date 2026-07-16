import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { errorResponse, requireAuth } from "@/lib/auth";

/** DELETE /api/financial/reports/[id] — delete a financial report (Admin Lokal, own only). */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth("ADMIN_LOKAL", "SUPER_ADMIN");
    const { id } = await params;
    const reportId = Number(id);
    if (Number.isNaN(reportId)) {
      return Response.json({ error: "ID tidak valid" }, { status: 400 });
    }

    const report = await db.financialReport.findUnique({ where: { id: reportId } });
    if (!report) {
      return Response.json({ error: "Laporan tidak ditemukan" }, { status: 404 });
    }

    // Admin Lokal can only delete their own suku's reports.
    if (user.role === "ADMIN_LOKAL" && report.sukuId !== user.sukuId) {
      return Response.json({ error: "Tidak dapat menghapus laporan suku lain" }, { status: 403 });
    }

    await db.financialReport.delete({ where: { id: reportId } });
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
