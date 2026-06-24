"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/dal";
import { buildAndStoreReport, type ReportPeriod } from "@/lib/reports/generate";

export interface GenerateReportState {
  ok?: boolean;
  error?: string;
  summary?: string;
}

export async function generateReportNow(
  _prev: GenerateReportState | undefined,
  formData: FormData,
): Promise<GenerateReportState> {
  await getCurrentUser();
  const period: ReportPeriod = formData.get("period") === "monthly" ? "monthly" : "daily";
  try {
    const { summary } = await buildAndStoreReport(period);
    revalidatePath("/admin/reports");
    return { ok: true, summary };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Rapport genereren mislukt." };
  }
}
