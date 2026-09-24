import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { jobDocuments, jobEvents, jobs } from "@/lib/db/schema-jobs";

const ANONYMIZED = "Verwijderd op verzoek (AVG)";

export interface JobPurgeSummary {
  jobsAnonymized: number;
  documentsAnonymized: number;
}

/**
 * Klus-CRM part of the Artikel 17 AVG erasure. Must run BEFORE the customer
 * row is deleted (jobs/documents reference it with ON DELETE SET NULL, after
 * which they could no longer be found by customerId).
 *
 * What goes: klusadres, opleverhandtekening-naam, free-text notes/work
 * summaries and the whole event timeline (all of which can carry names and
 * addresses). What stays: the klus row itself (nummer, categorie, status,
 * datums) and every quote/invoice with its amounts — Dutch fiscal retention
 * (7 jaar) can require those to survive; only the recipient snapshot is
 * anonymized. Photos, addresses, installaties and contracts are removed by
 * the customer_id FK cascade when the customer row is deleted.
 * Idempotent, so a re-run after a partial failure is safe.
 */
export async function purgeJobData(salonId: string, customerId: string): Promise<JobPurgeSummary> {
  const customerJobs = await db
    .update(jobs)
    .set({
      addressLine: null,
      description: null,
      workSummary: null,
      internalNotes: null,
      signedByName: null,
    })
    .where(and(eq(jobs.salonId, salonId), eq(jobs.customerId, customerId)))
    .returning({ id: jobs.id });

  if (customerJobs.length) {
    await db.delete(jobEvents).where(inArray(jobEvents.jobId, customerJobs.map((j) => j.id)));
  }

  const docs = await db
    .update(jobDocuments)
    .set({
      billTo: { name: ANONYMIZED },
      jobAddress: null,
      acceptedByName: null,
      declineReason: null,
    })
    .where(and(eq(jobDocuments.salonId, salonId), eq(jobDocuments.customerId, customerId)))
    .returning({ id: jobDocuments.id });

  return { jobsAnonymized: customerJobs.length, documentsAnonymized: docs.length };
}
