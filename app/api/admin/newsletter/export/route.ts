import { requireRole } from "@/lib/auth/dal";
import { auditAdmin } from "@/lib/admin/audit";
import { listSubscribers } from "@/lib/newsletter/subscribers";

export const runtime = "nodejs";

/** Quote a CSV cell and neutralise spreadsheet formula injection (=, +, -, @). */
function cell(v: unknown): string {
  let s = v == null ? "" : v instanceof Date ? v.toISOString() : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET() {
  const admin = await requireRole("admin");
  const rows = await listSubscribers({ limit: 100_000 });
  const header = ["email", "naam", "status", "bron", "vak", "tags", "toestemming_op", "toestemming_bron", "afgemeld_op", "aangemaakt"];
  const lines = rows.map((r) =>
    [r.email, r.name, r.status, r.source, r.vertical, r.tags.join("|"), r.consentAt, r.consentSource, r.unsubscribedAt, r.createdAt].map(cell).join(","),
  );
  await auditAdmin(admin, "newsletter.export", null, { rows: rows.length });
  return new Response([header.join(","), ...lines].join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="abonnees-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
