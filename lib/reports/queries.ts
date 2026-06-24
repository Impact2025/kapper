import "server-only";
import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { reports } from "@/lib/db/schema";
import { env } from "@/lib/env";
import type { ReportPayload } from "@/lib/reports/generate";

export interface ReportListItem {
  id: string;
  period: "daily" | "monthly";
  periodKey: string;
  summary: string | null;
  payload: ReportPayload;
  sentAt: Date;
}

export async function listReports(limit = 30): Promise<ReportListItem[]> {
  if (!env.DATABASE_URL) return [];
  const rows = await db
    .select()
    .from(reports)
    .orderBy(desc(reports.sentAt))
    .limit(limit);
  return rows.map((r) => ({
    id: r.id,
    period: r.period,
    periodKey: r.periodKey,
    summary: r.summary,
    payload: r.payload as unknown as ReportPayload,
    sentAt: r.sentAt,
  }));
}
