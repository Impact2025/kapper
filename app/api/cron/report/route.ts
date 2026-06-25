import { NextResponse } from "next/server";
import { buildAndStoreReport, type ReportPeriod } from "@/lib/reports/generate";
import { adminReportEmail } from "@/lib/mail/templates";
import { sendEmail } from "@/lib/mail/resend";
import { formatEur } from "@/lib/utils";
import { env } from "@/lib/env";

export const runtime = "nodejs";
export const maxDuration = 60;

function authorized(req: Request): boolean {
  if (!env.CRON_SECRET) return false;
  return req.headers.get("authorization") === `Bearer ${env.CRON_SECRET}`;
}

async function run(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const periodParam = url.searchParams.get("period");
  const period: ReportPeriod = periodParam === "monthly" ? "monthly" : "daily";

  const { payload, summary } = await buildAndStoreReport(period);

  const html = adminReportEmail({
    period: payload.period,
    periodKey: payload.periodKey,
    summary,
    rows: [
      { label: "Nieuwe leads", value: String(payload.newLeads) },
      { label: "Scans", value: String(payload.scans) },
      { label: "Nieuwe salons", value: String(payload.newSalons) },
      { label: "Actieve MRR", value: formatEur(payload.activeMrr) },
      { label: "Open pipeline", value: formatEur(payload.pipelineValue) },
    ],
  });

  await sendEmail({
    to: env.REPORT_RECIPIENT,
    subject: `${period === "monthly" ? "Maandrapport" : "Dagrapport"} ${payload.periodKey} — KapperAssistent`,
    html,
  });

  return NextResponse.json({ ok: true, period: payload.period, periodKey: payload.periodKey });
}

export async function GET(req: Request) {
  return run(req);
}

export async function POST(req: Request) {
  return run(req);
}
