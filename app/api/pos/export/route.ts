import { NextResponse } from "next/server";
import { requireSalonOwner } from "@/lib/auth/dal";
import { exportOrdersCsv } from "@/lib/pos/accounting-export";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const user = await requireSalonOwner();

  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  if (!from || !to || !/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
    return NextResponse.json({ error: "Geef een geldige from- en to-datum (YYYY-MM-DD) op." }, { status: 400 });
  }

  const csv = await exportOrdersCsv(user.salonId, from, to);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="omzet_${from}_${to}.csv"`,
    },
  });
}
