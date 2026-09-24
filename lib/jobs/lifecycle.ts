import "server-only";
import { and, eq, gte, lt, ne, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { appointments, customers } from "@/lib/db/schema";
import { assets, customerAddresses, jobEvents, jobPhotos, jobs, serviceContracts } from "@/lib/db/schema-jobs";
import type { VerticalPack } from "@/lib/verticals";
import { nextNumber } from "@/lib/jobs/numbering";
import {
  addMonths,
  advanceDue,
  blocksOverlap,
  buildChecklist,
  canTransition,
  detectUrgency,
  formatAddressLine,
  JOB_STATUS_LABEL,
  type ChecklistItem,
  type JobPriority,
  type JobSource,
  type JobStatus,
} from "@/lib/jobs/model";

type JobRow = typeof jobs.$inferSelect;

export async function logJobEvent(input: {
  salonId: string;
  jobId: string;
  kind: string;
  message: string;
  meta?: Record<string, unknown>;
  actorUserId?: string | null;
}) {
  await db.insert(jobEvents).values({
    salonId: input.salonId,
    jobId: input.jobId,
    kind: input.kind,
    message: input.message,
    meta: input.meta ?? {},
    actorUserId: input.actorUserId ?? null,
  });
}

export function categoryFor(pack: VerticalPack, key: string | null | undefined) {
  return pack.jobCategories.find((c) => c.key === key) ?? pack.jobCategories.find((c) => c.key === "overig") ?? null;
}

/* ------------------------------ create ------------------------------ */
export interface CreateJobInput {
  salonId: string;
  pack: VerticalPack;
  customerId?: string | null;
  addressId?: string | null;
  /** Free-text location for a klus whose address isn't a saved row. */
  addressLine?: string | null;
  title: string;
  description?: string | null;
  category?: string | null;
  priority?: JobPriority;
  source: JobSource;
  conversationId?: string | null;
  appointmentId?: string | null;
  assetId?: string | null;
  contractId?: string | null;
  assignedStaffId?: string | null;
  scheduledStart?: Date | null;
  estimatedMinutes?: number | null;
  actorUserId?: string | null;
  createdMessage?: string;
}

export async function createJob(input: CreateJobInput): Promise<JobRow> {
  const category = categoryFor(input.pack, input.category);
  const categoryKey = category?.key ?? "overig";

  let addressLine = input.addressLine ?? null;
  if (input.addressId) {
    const [a] = await db
      .select()
      .from(customerAddresses)
      .where(and(eq(customerAddresses.id, input.addressId), eq(customerAddresses.salonId, input.salonId)))
      .limit(1);
    if (a) addressLine = formatAddressLine(a);
  }

  const priority =
    input.priority ?? detectUrgency(`${input.title} ${input.description ?? ""}`, category?.urgent ?? false);
  const number = await nextNumber(input.salonId, "job");

  const [job] = await db
    .insert(jobs)
    .values({
      salonId: input.salonId,
      number,
      customerId: input.customerId ?? null,
      addressId: input.addressId ?? null,
      assetId: input.assetId ?? null,
      contractId: input.contractId ?? null,
      appointmentId: input.appointmentId ?? null,
      conversationId: input.conversationId ?? null,
      addressLine,
      title: input.title.trim().slice(0, 200),
      description: input.description?.trim() || null,
      category: categoryKey,
      priority,
      status: input.scheduledStart ? "scheduled" : "new",
      source: input.source,
      assignedStaffId: input.assignedStaffId ?? null,
      scheduledStart: input.scheduledStart ?? null,
      estimatedMinutes: input.estimatedMinutes ?? category?.estimatedMinutes ?? 60,
      checklist: buildChecklist(category?.checklist ?? []),
    })
    .returning();

  await logJobEvent({
    salonId: input.salonId,
    jobId: job!.id,
    kind: "created",
    message: input.createdMessage ?? `Klus aangemaakt (${input.source})`,
    meta: { source: input.source, priority },
    actorUserId: input.actorUserId,
  });

  // A klus that already comes with an appointment (AI booked a slot) keeps
  // that appointment's own status (pending_confirmation / pending_deposit) —
  // only a klus scheduled by hand mirrors a fresh confirmed appointment.
  if (input.scheduledStart && !input.appointmentId) await syncAppointmentForJob(job!);
  return job!;
}

/* ------------------------------ status ------------------------------ */
export type StatusResult = { ok: true; job: JobRow } | { error: string };

export async function changeJobStatus(
  salonId: string,
  jobId: string,
  to: JobStatus,
  opts: { actorUserId?: string | null; reason?: string } = {},
): Promise<StatusResult> {
  const [job] = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.id, jobId), eq(jobs.salonId, salonId)))
    .limit(1);
  if (!job) return { error: "Klus niet gevonden." };

  const from = job.status as JobStatus;
  if (from === to) return { ok: true, job };
  if (!canTransition(from, to)) {
    return { error: `Een klus met status "${JOB_STATUS_LABEL[from]}" kan niet naar "${JOB_STATUS_LABEL[to]}".` };
  }
  if (to === "scheduled" && !job.scheduledStart) {
    return { error: "Plan eerst een datum en tijd in voordat je de klus op ingepland zet." };
  }

  const now = new Date();
  const patch: Partial<typeof jobs.$inferInsert> = { status: to };
  if (to === "in_progress" && !job.startedAt) patch.startedAt = now;
  if (to === "completed") {
    patch.completedAt = now;
    if (!job.startedAt) patch.startedAt = now;
  }
  if (from === "completed" && to === "in_progress") patch.completedAt = null;
  if (to === "cancelled") patch.cancelledReason = opts.reason?.trim() || null;
  if (from === "cancelled") patch.cancelledReason = null;

  const [updated] = await db.update(jobs).set(patch).where(eq(jobs.id, jobId)).returning();

  await logJobEvent({
    salonId,
    jobId,
    kind: "status",
    message: `Status: ${JOB_STATUS_LABEL[from]} → ${JOB_STATUS_LABEL[to]}${opts.reason ? ` (${opts.reason})` : ""}`,
    meta: { from, to },
    actorUserId: opts.actorUserId,
  });

  if (to === "completed") await onJobCompleted(updated!, now);
  await syncAppointmentStatus(updated!);
  return { ok: true, job: updated! };
}

/**
 * Completing a klus keeps the installatiepaspoort and the onderhoudscontract
 * truthful: the asset's last-service date moves, and a contract-driven klus
 * advances the contract to its next beurt.
 */
async function onJobCompleted(job: JobRow, now: Date) {
  if (job.contractId) {
    const [contract] = await db.select().from(serviceContracts).where(eq(serviceContracts.id, job.contractId)).limit(1);
    if (contract) {
      const nextDueAt = advanceDue(contract.nextDueAt, contract.intervalMonths, now);
      await db.update(serviceContracts).set({ nextDueAt }).where(eq(serviceContracts.id, contract.id));
      if (contract.assetId) {
        await db
          .update(assets)
          .set({ lastServiceAt: now, nextServiceDue: nextDueAt })
          .where(eq(assets.id, contract.assetId));
      }
      return;
    }
  }
  if (job.assetId && (job.category.endsWith("onderhoud") || job.category === "onderhoud")) {
    const [asset] = await db.select().from(assets).where(eq(assets.id, job.assetId)).limit(1);
    if (asset) {
      // Without a contract, fall back to a yearly reminder — the owner can
      // edit the date on the installatie.
      await db.update(assets).set({ lastServiceAt: now, nextServiceDue: addMonths(now, 12) }).where(eq(assets.id, asset.id));
    }
  }
}

/* ------------------------------ scheduling ------------------------------ */
export interface ScheduleConflict {
  jobId: string;
  number: string;
  title: string;
}

export async function findScheduleConflicts(
  salonId: string,
  staffId: string,
  start: Date,
  minutes: number,
  excludeJobId?: string,
): Promise<ScheduleConflict[]> {
  const dayBefore = new Date(start.getTime() - 24 * 3600_000);
  const dayAfter = new Date(start.getTime() + 24 * 3600_000);
  const rows = await db
    .select({
      id: jobs.id,
      number: jobs.number,
      title: jobs.title,
      scheduledStart: jobs.scheduledStart,
      estimatedMinutes: jobs.estimatedMinutes,
    })
    .from(jobs)
    .where(
      and(
        eq(jobs.salonId, salonId),
        eq(jobs.assignedStaffId, staffId),
        gte(jobs.scheduledStart, dayBefore),
        lt(jobs.scheduledStart, dayAfter),
        inArray(jobs.status, ["scheduled", "en_route", "in_progress"]),
        excludeJobId ? ne(jobs.id, excludeJobId) : undefined,
      ),
    );
  return rows
    .filter((r) => r.scheduledStart && blocksOverlap({ start, minutes }, { start: r.scheduledStart, minutes: r.estimatedMinutes }))
    .map((r) => ({ jobId: r.id, number: r.number, title: r.title }));
}

export async function scheduleJob(
  salonId: string,
  jobId: string,
  input: { start: Date; staffId: string | null; minutes?: number | null },
  actorUserId?: string | null,
): Promise<{ ok: true; job: JobRow; conflicts: ScheduleConflict[] } | { error: string }> {
  const [job] = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.id, jobId), eq(jobs.salonId, salonId)))
    .limit(1);
  if (!job) return { error: "Klus niet gevonden." };
  if (["paid", "cancelled", "invoiced"].includes(job.status)) {
    return { error: "Een afgesloten klus kan niet meer worden ingepland." };
  }

  const minutes = input.minutes ?? job.estimatedMinutes;
  const conflicts = input.staffId ? await findScheduleConflicts(salonId, input.staffId, input.start, minutes, jobId) : [];

  const nextStatus: JobStatus = ["new", "quoted", "on_hold"].includes(job.status) ? "scheduled" : (job.status as JobStatus);
  const [updated] = await db
    .update(jobs)
    .set({ scheduledStart: input.start, assignedStaffId: input.staffId, estimatedMinutes: minutes, status: nextStatus })
    .where(eq(jobs.id, jobId))
    .returning();

  await logJobEvent({
    salonId,
    jobId,
    kind: "scheduled",
    message: `Ingepland op ${input.start.toLocaleString("nl-NL", { timeZone: "Europe/Amsterdam", dateStyle: "medium", timeStyle: "short" })}`,
    meta: { start: input.start.toISOString(), staffId: input.staffId, minutes },
    actorUserId,
  });
  await syncAppointmentForJob(updated!);
  return { ok: true, job: updated!, conflicts };
}

export async function unscheduleJob(salonId: string, jobId: string, actorUserId?: string | null) {
  const [job] = await db
    .update(jobs)
    .set({ scheduledStart: null, status: "new" })
    .where(and(eq(jobs.id, jobId), eq(jobs.salonId, salonId), inArray(jobs.status, ["scheduled", "on_hold", "en_route"])))
    .returning();
  if (!job) return { error: "Alleen een ingeplande klus kan uit de planning." as const };
  await logJobEvent({ salonId, jobId, kind: "scheduled", message: "Uit de planning gehaald", actorUserId });
  if (job.appointmentId) {
    await db.update(appointments).set({ status: "cancelled" }).where(eq(appointments.id, job.appointmentId));
  }
  return { ok: true as const, job };
}

/**
 * A planned klus is mirrored as an `appointments` row (agendaProvider
 * "manual"), which is what plugs klussen into the existing WhatsApp
 * reminder cron, the review-request cron and the three-strikes/no-show
 * tooling — without a second scheduling engine.
 */
export async function syncAppointmentForJob(job: JobRow) {
  if (!job.scheduledStart || !job.customerId) return;
  const [customer] = await db.select().from(customers).where(eq(customers.id, job.customerId)).limit(1);
  if (!customer) return;

  const values = {
    staffId: job.assignedStaffId,
    customerName: customer.name,
    customerPhone: customer.phone,
    serviceType: job.title,
    appointmentTime: job.scheduledStart,
    durationMinutes: job.estimatedMinutes,
    status: "confirmed" as const,
  };

  if (job.appointmentId) {
    await db.update(appointments).set({ ...values, reminderSentAt: null }).where(eq(appointments.id, job.appointmentId));
    return;
  }
  const [apt] = await db
    .insert(appointments)
    .values({
      salonId: job.salonId,
      customerId: customer.id,
      conversationId: job.conversationId,
      agendaProvider: "manual",
      source: job.source === "ai_phone" ? "ai_phone" : job.source === "ai_whatsapp" ? "ai_whatsapp" : "manual",
      policyAcceptedAt: new Date(),
      confirmationChannel: "klus",
      ...values,
    })
    .returning({ id: appointments.id });
  await db.update(jobs).set({ appointmentId: apt!.id }).where(eq(jobs.id, job.id));
}

async function syncAppointmentStatus(job: JobRow) {
  if (!job.appointmentId) return;
  if (job.status === "cancelled") {
    await db.update(appointments).set({ status: "cancelled" }).where(eq(appointments.id, job.appointmentId));
  } else if (["completed", "invoiced", "paid"].includes(job.status)) {
    // The reviews cron asks for a review 2–48h after a *completed* visit.
    await db.update(appointments).set({ status: "completed" }).where(eq(appointments.id, job.appointmentId));
  }
}

/* ------------------------------ details ------------------------------ */
export async function toggleChecklistItem(salonId: string, jobId: string, itemId: string, actorUserId?: string | null) {
  const [job] = await db
    .select({ checklist: jobs.checklist })
    .from(jobs)
    .where(and(eq(jobs.id, jobId), eq(jobs.salonId, salonId)))
    .limit(1);
  if (!job) return { error: "Klus niet gevonden." as const };
  const checklist: ChecklistItem[] = job.checklist.map((c) => (c.id === itemId ? { ...c, done: !c.done } : c));
  await db.update(jobs).set({ checklist }).where(eq(jobs.id, jobId));
  const item = checklist.find((c) => c.id === itemId);
  if (item) {
    await logJobEvent({
      salonId,
      jobId,
      kind: "checklist",
      message: `${item.done ? "Afgevinkt" : "Heropend"}: ${item.label}`,
      actorUserId,
    });
  }
  return { ok: true as const };
}

export async function addJobPhoto(input: {
  salonId: string;
  jobId: string;
  blobUrl: string;
  kind: "before" | "during" | "after" | "issue";
  caption?: string | null;
  actorUserId?: string | null;
}) {
  const [job] = await db
    .select({ customerId: jobs.customerId })
    .from(jobs)
    .where(and(eq(jobs.id, input.jobId), eq(jobs.salonId, input.salonId)))
    .limit(1);
  if (!job) return { error: "Klus niet gevonden." as const };
  await db.insert(jobPhotos).values({
    salonId: input.salonId,
    jobId: input.jobId,
    customerId: job.customerId,
    blobUrl: input.blobUrl,
    kind: input.kind,
    caption: input.caption?.trim() || null,
  });
  await logJobEvent({
    salonId: input.salonId,
    jobId: input.jobId,
    kind: "photo",
    message: `Foto toegevoegd (${input.kind})`,
    actorUserId: input.actorUserId,
  });
  return { ok: true as const };
}

/**
 * Reverse sync: when an appointment is cancelled or moved through the
 * appointment flow (AI reschedule/cancel, no-show tooling), the linked klus
 * follows — one source of truth for "when is this klus".
 */
export async function syncJobFromAppointment(appointmentId: string): Promise<void> {
  const [job] = await db.select().from(jobs).where(eq(jobs.appointmentId, appointmentId)).limit(1);
  if (!job) return;
  const [apt] = await db.select().from(appointments).where(eq(appointments.id, appointmentId)).limit(1);
  if (!apt) return;

  if (apt.status === "cancelled") {
    if (!["cancelled", "paid", "invoiced", "completed"].includes(job.status)) {
      await db.update(jobs).set({ status: "new", scheduledStart: null }).where(eq(jobs.id, job.id));
      await logJobEvent({
        salonId: job.salonId,
        jobId: job.id,
        kind: "scheduled",
        message: "Afspraak geannuleerd — klus staat weer te plannen",
      });
    }
    return;
  }
  if (job.scheduledStart?.getTime() !== apt.appointmentTime.getTime()) {
    await db.update(jobs).set({ scheduledStart: apt.appointmentTime }).where(eq(jobs.id, job.id));
    await logJobEvent({
      salonId: job.salonId,
      jobId: job.id,
      kind: "scheduled",
      message: `Afspraak verzet naar ${apt.appointmentTime.toLocaleString("nl-NL", { timeZone: "Europe/Amsterdam", dateStyle: "medium", timeStyle: "short" })}`,
    });
  }
}
