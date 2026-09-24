import "server-only";
import { and, asc, desc, eq, gte, ilike, inArray, lt, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { customers, staff } from "@/lib/db/schema";
import {
  assets,
  customerAddresses,
  jobDocumentLines,
  jobDocuments,
  jobEvents,
  jobPhotos,
  jobs,
  serviceContracts,
} from "@/lib/db/schema-jobs";
import { amsterdamDateKey, amsterdamWallTimeToUtc } from "@/lib/salon/timezone";
import {
  OPEN_JOB_STATUSES,
  compareJobsForBoard,
  type JobPriority,
  type JobStatus,
} from "@/lib/jobs/model";

/* ------------------------------ list ------------------------------ */
export interface JobListItem {
  id: string;
  number: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  source: string;
  addressLine: string | null;
  scheduledStart: Date | null;
  estimatedMinutes: number;
  createdAt: Date;
  customerId: string | null;
  customerName: string | null;
  customerCompany: string | null;
  customerPhone: string | null;
  staffId: string | null;
  staffName: string | null;
}

export interface ListJobsOptions {
  statuses?: JobStatus[];
  priority?: JobPriority;
  staffId?: string;
  customerId?: string;
  q?: string;
  from?: Date;
  to?: Date;
  limit?: number;
}

export async function listJobs(salonId: string, opts: ListJobsOptions = {}): Promise<JobListItem[]> {
  const conds = [eq(jobs.salonId, salonId)];
  if (opts.statuses?.length) conds.push(inArray(jobs.status, opts.statuses));
  if (opts.priority) conds.push(eq(jobs.priority, opts.priority));
  if (opts.staffId) conds.push(eq(jobs.assignedStaffId, opts.staffId));
  if (opts.customerId) conds.push(eq(jobs.customerId, opts.customerId));
  if (opts.from) conds.push(gte(jobs.scheduledStart, opts.from));
  if (opts.to) conds.push(lt(jobs.scheduledStart, opts.to));
  const q = opts.q?.trim();
  if (q) {
    const like = `%${q}%`;
    conds.push(
      or(
        ilike(jobs.title, like),
        ilike(jobs.number, like),
        ilike(jobs.addressLine, like),
        ilike(customers.name, like),
        ilike(customers.companyName, like),
        ilike(customers.phone, like),
      )!,
    );
  }

  return db
    .select({
      id: jobs.id,
      number: jobs.number,
      title: jobs.title,
      category: jobs.category,
      priority: jobs.priority,
      status: jobs.status,
      source: jobs.source,
      addressLine: jobs.addressLine,
      scheduledStart: jobs.scheduledStart,
      estimatedMinutes: jobs.estimatedMinutes,
      createdAt: jobs.createdAt,
      customerId: jobs.customerId,
      customerName: customers.name,
      customerCompany: customers.companyName,
      customerPhone: customers.phone,
      staffId: jobs.assignedStaffId,
      staffName: staff.name,
    })
    .from(jobs)
    .leftJoin(customers, eq(jobs.customerId, customers.id))
    .leftJoin(staff, eq(jobs.assignedStaffId, staff.id))
    .where(and(...conds))
    .orderBy(desc(jobs.createdAt))
    .limit(opts.limit ?? 300);
}

/** Open klussen, spoed first — the working list of a dispatcher. */
export async function listOpenJobsForBoard(salonId: string): Promise<JobListItem[]> {
  const rows = await listJobs(salonId, { statuses: OPEN_JOB_STATUSES });
  return rows.sort(compareJobsForBoard);
}

/* ------------------------------ detail ------------------------------ */
export async function getJobRow(salonId: string, jobId: string) {
  const [row] = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.id, jobId), eq(jobs.salonId, salonId)))
    .limit(1);
  return row ?? null;
}

export async function getJobDetail(salonId: string, jobId: string) {
  const job = await getJobRow(salonId, jobId);
  if (!job) return null;

  const [customerRows, addressRows, assetRows, staffRows, contractRows, events, photos, docs] = await Promise.all([
    job.customerId
      ? db.select().from(customers).where(eq(customers.id, job.customerId)).limit(1)
      : Promise.resolve([]),
    job.addressId
      ? db.select().from(customerAddresses).where(eq(customerAddresses.id, job.addressId)).limit(1)
      : Promise.resolve([]),
    job.assetId ? db.select().from(assets).where(eq(assets.id, job.assetId)).limit(1) : Promise.resolve([]),
    job.assignedStaffId
      ? db.select({ id: staff.id, name: staff.name }).from(staff).where(eq(staff.id, job.assignedStaffId)).limit(1)
      : Promise.resolve([]),
    job.contractId
      ? db.select().from(serviceContracts).where(eq(serviceContracts.id, job.contractId)).limit(1)
      : Promise.resolve([]),
    db.select().from(jobEvents).where(eq(jobEvents.jobId, jobId)).orderBy(desc(jobEvents.createdAt)).limit(100),
    db.select().from(jobPhotos).where(eq(jobPhotos.jobId, jobId)).orderBy(asc(jobPhotos.createdAt)),
    db.select().from(jobDocuments).where(eq(jobDocuments.jobId, jobId)).orderBy(desc(jobDocuments.createdAt)),
  ]);

  return {
    job,
    customer: customerRows[0] ?? null,
    address: addressRows[0] ?? null,
    asset: assetRows[0] ?? null,
    staff: staffRows[0] ?? null,
    contract: contractRows[0] ?? null,
    events,
    photos,
    documents: docs,
  };
}

export async function getDocumentLines(documentId: string) {
  return db
    .select()
    .from(jobDocumentLines)
    .where(eq(jobDocumentLines.documentId, documentId))
    .orderBy(asc(jobDocumentLines.position));
}

/* ------------------------------ planner ------------------------------ */
/** Klussen with a planned start inside [from, to) — one week of the planbord. */
export async function listScheduledJobs(salonId: string, from: Date, to: Date): Promise<JobListItem[]> {
  const rows = await listJobs(salonId, { from, to, limit: 500 });
  return rows
    .filter((r) => r.status !== "cancelled")
    .sort((a, b) => (a.scheduledStart?.getTime() ?? 0) - (b.scheduledStart?.getTime() ?? 0));
}

/** Open klussen with no planned start yet ("te plannen"). */
export async function listUnscheduledJobs(salonId: string): Promise<JobListItem[]> {
  const rows = await listJobs(salonId, { statuses: ["new", "quoted", "on_hold"] });
  return rows.filter((r) => !r.scheduledStart).sort(compareJobsForBoard);
}

/* ------------------------------ stats ------------------------------ */
export interface JobStats {
  urgentOpen: number;
  toSchedule: number;
  scheduledToday: number;
  inProgress: number;
  quotesAwaiting: number;
  quotesAwaitingCents: number;
  invoicesOpenCents: number;
  invoicesOpenCount: number;
  invoicesOverdueCents: number;
  invoicesOverdueCount: number;
  completedThisMonth: number;
  paidThisMonthCents: number;
  maintenanceDueSoon: number;
}

export async function getJobStats(salonId: string, now: Date = new Date()): Promise<JobStats> {
  const dayStart = amsterdamWallTimeToUtc(now, 0, 0);
  const dayEnd = amsterdamWallTimeToUtc(now, 1, 0);
  const [y, m] = amsterdamDateKey(now).split("-");
  const monthStart = amsterdamWallTimeToUtc(new Date(`${y}-${m}-01T12:00:00Z`), 0, 0);
  const soon = new Date(now.getTime() + 30 * 24 * 3600_000);

  const openStatuses = OPEN_JOB_STATUSES;
  const [
    urgentRow,
    toScheduleRow,
    todayRow,
    inProgressRow,
    quoteRow,
    invoiceOpenRow,
    invoiceOverdueRow,
    completedRow,
    paidRow,
    maintenanceRow,
  ] = await Promise.all([
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(jobs)
      .where(and(eq(jobs.salonId, salonId), eq(jobs.priority, "urgent"), inArray(jobs.status, openStatuses))),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(jobs)
      .where(and(eq(jobs.salonId, salonId), inArray(jobs.status, ["new", "quoted"]), sql`${jobs.scheduledStart} is null`)),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(jobs)
      .where(
        and(
          eq(jobs.salonId, salonId),
          gte(jobs.scheduledStart, dayStart),
          lt(jobs.scheduledStart, dayEnd),
          inArray(jobs.status, ["scheduled", "en_route", "in_progress"]),
        ),
      ),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(jobs)
      .where(and(eq(jobs.salonId, salonId), inArray(jobs.status, ["en_route", "in_progress"]))),
    db
      .select({ n: sql<number>`count(*)::int`, cents: sql<number>`coalesce(sum(${jobDocuments.totalCents}),0)::int` })
      .from(jobDocuments)
      .where(and(eq(jobDocuments.salonId, salonId), eq(jobDocuments.kind, "quote"), eq(jobDocuments.status, "sent"))),
    db
      .select({ n: sql<number>`count(*)::int`, cents: sql<number>`coalesce(sum(${jobDocuments.totalCents}),0)::int` })
      .from(jobDocuments)
      .where(and(eq(jobDocuments.salonId, salonId), eq(jobDocuments.kind, "invoice"), eq(jobDocuments.status, "sent"))),
    db
      .select({ n: sql<number>`count(*)::int`, cents: sql<number>`coalesce(sum(${jobDocuments.totalCents}),0)::int` })
      .from(jobDocuments)
      .where(
        and(
          eq(jobDocuments.salonId, salonId),
          eq(jobDocuments.kind, "invoice"),
          eq(jobDocuments.status, "sent"),
          lt(jobDocuments.dueAt, now),
        ),
      ),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(jobs)
      .where(
        and(
          eq(jobs.salonId, salonId),
          inArray(jobs.status, ["completed", "invoiced", "paid"]),
          gte(jobs.completedAt, monthStart),
        ),
      ),
    db
      .select({ cents: sql<number>`coalesce(sum(${jobDocuments.totalCents}),0)::int` })
      .from(jobDocuments)
      .where(
        and(
          eq(jobDocuments.salonId, salonId),
          eq(jobDocuments.kind, "invoice"),
          eq(jobDocuments.status, "paid"),
          gte(jobDocuments.paidAt, monthStart),
        ),
      ),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(serviceContracts)
      .where(
        and(
          eq(serviceContracts.salonId, salonId),
          eq(serviceContracts.status, "active"),
          lt(serviceContracts.nextDueAt, soon),
        ),
      ),
  ]);

  return {
    urgentOpen: urgentRow[0]?.n ?? 0,
    toSchedule: toScheduleRow[0]?.n ?? 0,
    scheduledToday: todayRow[0]?.n ?? 0,
    inProgress: inProgressRow[0]?.n ?? 0,
    quotesAwaiting: quoteRow[0]?.n ?? 0,
    quotesAwaitingCents: quoteRow[0]?.cents ?? 0,
    invoicesOpenCents: invoiceOpenRow[0]?.cents ?? 0,
    invoicesOpenCount: invoiceOpenRow[0]?.n ?? 0,
    invoicesOverdueCents: invoiceOverdueRow[0]?.cents ?? 0,
    invoicesOverdueCount: invoiceOverdueRow[0]?.n ?? 0,
    completedThisMonth: completedRow[0]?.n ?? 0,
    paidThisMonthCents: paidRow[0]?.cents ?? 0,
    maintenanceDueSoon: maintenanceRow[0]?.n ?? 0,
  };
}

/** Staff for the assignment dropdown. */
export async function listActiveStaff(salonId: string) {
  return db
    .select({ id: staff.id, name: staff.name, role: staff.role })
    .from(staff)
    .where(and(eq(staff.salonId, salonId), eq(staff.active, true)))
    .orderBy(asc(staff.name));
}
