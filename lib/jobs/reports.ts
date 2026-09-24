import "server-only";
import { and, eq, gte, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { staff } from "@/lib/db/schema";
import { jobDocuments, jobs } from "@/lib/db/schema-jobs";
import { amsterdamDateKey } from "@/lib/salon/timezone";
import { buildJobReport, type JobReport } from "@/lib/jobs/report-model";

export async function getJobReport(salonId: string, days = 30): Promise<{ report: JobReport; staffNames: Map<string, string> }> {
  const since = new Date(Date.now() - days * 86_400_000);
  const [jobRows, docRows, staffRows] = await Promise.all([
    db
      .select({
        id: jobs.id,
        category: jobs.category,
        source: jobs.source,
        priority: jobs.priority,
        status: jobs.status,
        staffId: jobs.assignedStaffId,
        createdAt: jobs.createdAt,
        completedAt: jobs.completedAt,
      })
      .from(jobs)
      .where(and(eq(jobs.salonId, salonId), or(gte(jobs.createdAt, since), gte(jobs.completedAt, since)))),
    db
      .select({
        kind: jobDocuments.kind,
        status: jobDocuments.status,
        totalCents: jobDocuments.totalCents,
        vatCents: jobDocuments.vatCents,
        jobId: jobDocuments.jobId,
        issuedAt: jobDocuments.issuedAt,
        paidAt: jobDocuments.paidAt,
      })
      .from(jobDocuments)
      .where(and(eq(jobDocuments.salonId, salonId), or(gte(jobDocuments.issuedAt, since), gte(jobDocuments.paidAt, since)))),
    db.select({ id: staff.id, name: staff.name }).from(staff).where(eq(staff.salonId, salonId)),
  ]);

  return {
    report: buildJobReport({ jobs: jobRows, docs: docRows, since, dateKey: amsterdamDateKey, days }),
    staffNames: new Map(staffRows.map((s) => [s.id, s.name])),
  };
}
