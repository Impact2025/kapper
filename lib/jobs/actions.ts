"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { customers, salons, staff, treatments } from "@/lib/db/schema";
import { customerAddresses, jobs } from "@/lib/db/schema-jobs";
import { requireJobOwner, UPGRADE_ASSETS, UPGRADE_CONTRACTS, UPGRADE_QUOTES } from "@/lib/jobs/access";
import {
  CUSTOMER_TYPES,
  JOB_PRIORITIES,
  LINE_KINDS,
  VAT_RATES,
  isJobStatus,
  addMonths,
  type CustomerType,
  type JobPriority,
} from "@/lib/jobs/model";
import { parseAmsterdamLocal, parseDateInput } from "@/lib/jobs/datetime";
import {
  addJobPhoto,
  changeJobStatus,
  createJob,
  logJobEvent,
  scheduleJob,
  toggleChecklistItem,
  unscheduleJob,
  categoryFor,
} from "@/lib/jobs/lifecycle";
import {
  createAddress,
  createAsset,
  createContract,
  deleteAddress,
  deleteAsset,
  setContractStatus,
  upsertJobCustomer,
} from "@/lib/jobs/crm";
import {
  convertQuoteToInvoice,
  createDraftDocument,
  deleteDraftDocument,
  finalizeAndSend,
  markInvoicePaid,
  saveDraftLines,
  voidDocument,
  type DocLineDraft,
} from "@/lib/jobs/documents";
import { notifyEnRoute } from "@/lib/jobs/customer-messages";
import { sanitizeDetails } from "@/lib/jobs/fields";
import { isValidIban, isValidKvk, isValidVatNumber, normalizeIban } from "@/lib/jobs/business";

export interface JobActionState {
  success?: boolean;
  error?: string;
  message?: string;
}

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();
const opt = (fd: FormData, key: string) => {
  const v = str(fd, key);
  return v ? v : null;
};
const uuid = z.string().uuid();

/** "12,50" / "12.50" / "€ 12,50" → euros. */
function parseEuros(input: unknown): number | null {
  const n = Number(String(input ?? "").replace(/[€\s]/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/** A staffId from the form only if that medewerker belongs to this salon —
 * otherwise a crafted POST could link (and then display) another salon's staff. */
async function ownedStaffId(salonId: string, raw: string): Promise<string | null> {
  if (!uuid.safeParse(raw).success) return null;
  const [s] = await db
    .select({ id: staff.id })
    .from(staff)
    .where(and(eq(staff.id, raw), eq(staff.salonId, salonId)))
    .limit(1);
  return s?.id ?? null;
}

function revalidateJob(jobId?: string) {
  revalidatePath("/dashboard/klussen");
  revalidatePath("/dashboard/planbord");
  revalidatePath("/dashboard");
  if (jobId) revalidatePath(`/dashboard/klussen/${jobId}`);
}

/* ============================ Klussen ============================ */
const createJobSchema = z.object({
  title: z.string().min(3, "Geef de klus een korte titel.").max(200),
  description: z.string().max(4000).optional(),
  category: z.string().max(60),
  priority: z.enum(JOB_PRIORITIES).optional(),
});

export async function createJobAction(_prev: JobActionState | undefined, fd: FormData): Promise<JobActionState> {
  const ctx = await requireJobOwner();

  const parsed = createJobSchema.safeParse({
    title: str(fd, "title"),
    description: str(fd, "description") || undefined,
    category: str(fd, "category") || "overig",
    priority: str(fd, "priority") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Controleer de velden." };

  // --- klant: bestaand of nieuw
  let customerId = str(fd, "customerId");
  if (!customerId) {
    const name = str(fd, "newName");
    const phone = str(fd, "newPhone");
    if (name.length < 2 || phone.replace(/\D/g, "").length < 8) {
      return { error: "Kies een bestaande klant of vul naam en telefoonnummer in." };
    }
    const typeRaw = str(fd, "newType");
    const { customer } = await upsertJobCustomer({
      salonId: ctx.salonId,
      name,
      phone,
      email: opt(fd, "newEmail"),
      companyName: opt(fd, "newCompany"),
      customerType: (CUSTOMER_TYPES as readonly string[]).includes(typeRaw) ? (typeRaw as CustomerType) : "private",
      source: "manual",
    });
    customerId = customer.id;
  } else if (!uuid.safeParse(customerId).success) {
    return { error: "Ongeldige klant." };
  } else {
    const [c] = await db
      .select({ id: customers.id })
      .from(customers)
      .where(and(eq(customers.id, customerId), eq(customers.salonId, ctx.salonId)))
      .limit(1);
    if (!c) return { error: "Klant niet gevonden." };
  }

  // --- adres: bestaand of nieuw
  let addressId: string | null = str(fd, "addressId") || null;
  if (addressId) {
    const [a] = await db
      .select({ id: customerAddresses.id })
      .from(customerAddresses)
      .where(
        and(
          eq(customerAddresses.id, addressId),
          eq(customerAddresses.customerId, customerId),
          eq(customerAddresses.salonId, ctx.salonId),
        ),
      )
      .limit(1);
    if (!a) addressId = null;
  }
  if (!addressId && str(fd, "street")) {
    const created = await createAddress({
      salonId: ctx.salonId,
      customerId,
      street: str(fd, "street"),
      houseNumber: str(fd, "houseNumber"),
      postalCode: str(fd, "postalCode"),
      city: str(fd, "city"),
      accessNotes: opt(fd, "accessNotes"),
    });
    if ("error" in created) return { error: created.error };
    addressId = created.address.id;
  }

  const start = parseAmsterdamLocal(str(fd, "scheduledStart"));
  const estimated = Number(str(fd, "estimatedMinutes"));
  const staffId = str(fd, "staffId");

  const job = await createJob({
    salonId: ctx.salonId,
    pack: ctx.pack,
    customerId,
    addressId,
    title: parsed.data.title,
    description: parsed.data.description,
    category: parsed.data.category,
    priority: parsed.data.priority as JobPriority | undefined,
    source: "manual",
    assignedStaffId: await ownedStaffId(ctx.salonId, staffId),
    scheduledStart: start,
    estimatedMinutes: Number.isFinite(estimated) && estimated > 0 ? Math.min(estimated, 60 * 24) : null,
    actorUserId: ctx.userId,
    createdMessage: "Klus handmatig aangemaakt",
  });

  revalidateJob();
  redirect(`/dashboard/klussen/${job.id}`);
}

const statusSchema = z.object({ jobId: uuid, to: z.string() });

export async function changeStatusAction(_prev: JobActionState | undefined, fd: FormData): Promise<JobActionState> {
  const ctx = await requireJobOwner();
  const parsed = statusSchema.safeParse({ jobId: str(fd, "jobId"), to: str(fd, "to") });
  if (!parsed.success || !isJobStatus(parsed.data.to)) return { error: "Ongeldige status." };
  const res = await changeJobStatus(ctx.salonId, parsed.data.jobId, parsed.data.to, {
    actorUserId: ctx.userId,
    reason: str(fd, "reason") || undefined,
  });
  if ("error" in res) return { error: res.error };
  if (parsed.data.to === "en_route" && res.job.status === "en_route") await notifyEnRoute(ctx.salonId, res.job.customerId);
  revalidateJob(parsed.data.jobId);
  return { success: true };
}

export async function scheduleJobAction(_prev: JobActionState | undefined, fd: FormData): Promise<JobActionState> {
  const ctx = await requireJobOwner();
  const jobId = str(fd, "jobId");
  if (!uuid.safeParse(jobId).success) return { error: "Ongeldige klus." };
  const start = parseAmsterdamLocal(str(fd, "scheduledStart"));
  if (!start) return { error: "Kies een geldige datum en tijd." };
  const staffRaw = str(fd, "staffId");
  const minutes = Number(str(fd, "estimatedMinutes"));

  const res = await scheduleJob(
    ctx.salonId,
    jobId,
    {
      start,
      staffId: await ownedStaffId(ctx.salonId, staffRaw),
      minutes: Number.isFinite(minutes) && minutes > 0 ? Math.min(minutes, 60 * 24) : null,
    },
    ctx.userId,
  );
  if ("error" in res) return { error: res.error };
  revalidateJob(jobId);
  return res.conflicts.length
    ? {
        success: true,
        message: `Ingepland, maar let op: overlapt met ${res.conflicts.map((c) => `${c.number} (${c.title})`).join(", ")}.`,
      }
    : { success: true };
}

export async function unscheduleJobAction(_prev: JobActionState | undefined, fd: FormData): Promise<JobActionState> {
  const ctx = await requireJobOwner();
  const jobId = str(fd, "jobId");
  if (!uuid.safeParse(jobId).success) return { error: "Ongeldige klus." };
  const res = await unscheduleJob(ctx.salonId, jobId, ctx.userId);
  if ("error" in res) return { error: res.error };
  revalidateJob(jobId);
  return { success: true };
}

export async function toggleChecklistAction(_prev: JobActionState | undefined, fd: FormData): Promise<JobActionState> {
  const ctx = await requireJobOwner();
  const jobId = str(fd, "jobId");
  const itemId = str(fd, "itemId");
  if (!uuid.safeParse(jobId).success || !itemId) return { error: "Ongeldige invoer." };
  const res = await toggleChecklistItem(ctx.salonId, jobId, itemId, ctx.userId);
  if ("error" in res) return { error: res.error };
  revalidatePath(`/dashboard/klussen/${jobId}`);
  return { success: true };
}

const detailsSchema = z.object({
  jobId: uuid,
  title: z.string().min(3).max(200),
  description: z.string().max(4000).optional(),
  category: z.string().max(60),
  priority: z.enum(JOB_PRIORITIES),
  workSummary: z.string().max(4000).optional(),
  internalNotes: z.string().max(4000).optional(),
});

export async function updateJobDetailsAction(_prev: JobActionState | undefined, fd: FormData): Promise<JobActionState> {
  const ctx = await requireJobOwner();
  const parsed = detailsSchema.safeParse({
    jobId: str(fd, "jobId"),
    title: str(fd, "title"),
    description: str(fd, "description") || undefined,
    category: str(fd, "category") || "overig",
    priority: str(fd, "priority") || "normal",
    workSummary: str(fd, "workSummary") || undefined,
    internalNotes: str(fd, "internalNotes") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Controleer de velden." };
  const d = parsed.data;
  const category = categoryFor(ctx.pack, d.category);
  const staffRaw = str(fd, "staffId");

  await db
    .update(jobs)
    .set({
      title: d.title,
      description: d.description ?? null,
      category: category?.key ?? "overig",
      priority: d.priority,
      workSummary: d.workSummary ?? null,
      internalNotes: d.internalNotes ?? null,
      assignedStaffId: await ownedStaffId(ctx.salonId, staffRaw),
      details: sanitizeDetails(ctx.pack, category?.key ?? "overig", (name) => (fd.get(name) as string | null) ?? null),
    })
    .where(and(eq(jobs.id, d.jobId), eq(jobs.salonId, ctx.salonId)));
  await logJobEvent({ salonId: ctx.salonId, jobId: d.jobId, kind: "note", message: "Klusgegevens bijgewerkt", actorUserId: ctx.userId });
  revalidateJob(d.jobId);
  return { success: true };
}

export async function addNoteAction(_prev: JobActionState | undefined, fd: FormData): Promise<JobActionState> {
  const ctx = await requireJobOwner();
  const jobId = str(fd, "jobId");
  const note = str(fd, "note");
  if (!uuid.safeParse(jobId).success || note.length < 2) return { error: "Schrijf een notitie." };
  const [job] = await db.select({ id: jobs.id }).from(jobs).where(and(eq(jobs.id, jobId), eq(jobs.salonId, ctx.salonId))).limit(1);
  if (!job) return { error: "Klus niet gevonden." };
  await logJobEvent({ salonId: ctx.salonId, jobId, kind: "note", message: note.slice(0, 2000), actorUserId: ctx.userId });
  revalidatePath(`/dashboard/klussen/${jobId}`);
  return { success: true };
}

const photoSchema = z.object({
  jobId: uuid,
  blobUrl: z.string().url().refine((u) => u.includes("public.blob.vercel-storage.com"), "Ongeldige foto-URL."),
  kind: z.enum(["before", "during", "after", "issue"]),
});

export async function addJobPhotoAction(_prev: JobActionState | undefined, fd: FormData): Promise<JobActionState> {
  const ctx = await requireJobOwner();
  const parsed = photoSchema.safeParse({ jobId: str(fd, "jobId"), blobUrl: str(fd, "blobUrl"), kind: str(fd, "kind") || "during" });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ongeldige foto." };
  const res = await addJobPhoto({
    salonId: ctx.salonId,
    jobId: parsed.data.jobId,
    blobUrl: parsed.data.blobUrl,
    kind: parsed.data.kind,
    caption: opt(fd, "caption"),
    actorUserId: ctx.userId,
  });
  if ("error" in res) return { error: res.error };
  revalidatePath(`/dashboard/klussen/${parsed.data.jobId}`);
  return { success: true };
}

/** Opleverhandtekening: de klant bevestigt met naam dat de klus is opgeleverd. */
export async function signOffAction(_prev: JobActionState | undefined, fd: FormData): Promise<JobActionState> {
  const ctx = await requireJobOwner();
  const jobId = str(fd, "jobId");
  const name = str(fd, "signedByName");
  if (!uuid.safeParse(jobId).success || name.length < 2) return { error: "Vul de naam van de ondertekenaar in." };
  const warrantyMonths = Number(str(fd, "warrantyMonths"));
  const now = new Date();
  await db
    .update(jobs)
    .set({
      signedByName: name.slice(0, 120),
      signedAt: now,
      ...(Number.isFinite(warrantyMonths) && warrantyMonths > 0 ? { warrantyUntil: addMonths(now, Math.min(warrantyMonths, 120)) } : {}),
    })
    .where(and(eq(jobs.id, jobId), eq(jobs.salonId, ctx.salonId)));
  await logJobEvent({ salonId: ctx.salonId, jobId, kind: "note", message: `Opgeleverd; akkoord van ${name}`, actorUserId: ctx.userId });
  revalidatePath(`/dashboard/klussen/${jobId}`);
  return { success: true };
}

/* ============================ Offertes & facturen ============================ */
export async function createDocumentAction(_prev: JobActionState | undefined, fd: FormData): Promise<JobActionState> {
  const ctx = await requireJobOwner();
  if (!ctx.can.quotes) return { error: UPGRADE_QUOTES };
  const jobId = str(fd, "jobId");
  const kind = str(fd, "kind");
  if (!uuid.safeParse(jobId).success || (kind !== "quote" && kind !== "invoice")) return { error: "Ongeldige invoer." };
  const res = await createDraftDocument({ salonId: ctx.salonId, kind, jobId });
  if ("error" in res) return { error: res.error };
  revalidatePath("/dashboard/facturatie");
  redirect(`/dashboard/facturatie/${res.document.id}`);
}

const lineSchema = z.object({
  kind: z.enum(LINE_KINDS),
  description: z.string().min(1).max(500),
  quantity: z.number().positive().max(100000),
  unit: z.string().min(1).max(20),
  unitPriceEuros: z.union([z.number(), z.string()]),
  vatRatePercent: z.number().refine((v) => (VAT_RATES as readonly number[]).includes(v), "Ongeldig btw-tarief."),
});

function parseLinesFromForm(fd: FormData): { lines: DocLineDraft[] } | { error: string } {
  let raw: unknown;
  try {
    raw = JSON.parse(str(fd, "lines") || "[]");
  } catch {
    return { error: "Ongeldige regels." };
  }
  const parsedLines = z.array(lineSchema).max(100).safeParse(raw);
  if (!parsedLines.success) return { error: parsedLines.error.issues[0]?.message ?? "Controleer de regels." };

  const lines: DocLineDraft[] = [];
  for (const l of parsedLines.data) {
    const euros = parseEuros(l.unitPriceEuros);
    if (euros === null || euros < -1_000_000 || euros > 1_000_000) return { error: `Ongeldige prijs bij "${l.description}".` };
    lines.push({
      kind: l.kind,
      description: l.description,
      quantity: l.quantity,
      unit: l.unit,
      unitPriceCents: Math.round(euros * 100),
      vatRatePercent: l.vatRatePercent,
    });
  }
  return { lines };
}

export async function saveDocumentAction(_prev: JobActionState | undefined, fd: FormData): Promise<JobActionState> {
  const ctx = await requireJobOwner();
  if (!ctx.can.quotes) return { error: UPGRADE_QUOTES };
  const documentId = str(fd, "documentId");
  if (!uuid.safeParse(documentId).success) return { error: "Ongeldig document." };

  const parsed = parseLinesFromForm(fd);
  if ("error" in parsed) return { error: parsed.error };

  const res = await saveDraftLines(ctx.salonId, documentId, parsed.lines, {
    title: opt(fd, "title"),
    introText: opt(fd, "introText"),
    footerText: opt(fd, "footerText"),
  });
  if ("error" in res) return { error: res.error };
  revalidatePath(`/dashboard/facturatie/${documentId}`);
  revalidatePath("/dashboard/facturatie");
  return { success: true, message: "Opgeslagen." };
}

export async function sendDocumentAction(_prev: JobActionState | undefined, fd: FormData): Promise<JobActionState> {
  const ctx = await requireJobOwner();
  if (!ctx.can.quotes) return { error: UPGRADE_QUOTES };
  const documentId = str(fd, "documentId");
  if (!uuid.safeParse(documentId).success) return { error: "Ongeldig document." };
  const send = str(fd, "send") !== "false";
  // Save what's on screen first, so "verstuur" never sends stale lines.
  if (fd.has("lines")) {
    const parsed = parseLinesFromForm(fd);
    if ("error" in parsed) return { error: parsed.error };
    const saved = await saveDraftLines(ctx.salonId, documentId, parsed.lines);
    if ("error" in saved) return { error: saved.error };
  }
  const res = await finalizeAndSend(ctx.salonId, documentId, { send, actorUserId: ctx.userId });
  if ("error" in res) return { error: res.error };
  revalidatePath(`/dashboard/facturatie/${documentId}`);
  revalidatePath("/dashboard/facturatie");
  revalidateJob(res.document.jobId ?? undefined);
  if (!send) return { success: true, message: `Definitief gemaakt als ${res.document.number}.` };
  const via = [res.sent.whatsapp ? "WhatsApp" : null, res.sent.email ? "e-mail" : null].filter(Boolean).join(" en ");
  return {
    success: true,
    message: via
      ? `${res.document.number} verstuurd via ${via}.`
      : `${res.document.number} is definitief, maar er kon niets worden verstuurd (geen bereikbaar telefoonnummer/e-mailadres of kanaal). Deel de link handmatig.`,
  };
}

export async function markPaidAction(_prev: JobActionState | undefined, fd: FormData): Promise<JobActionState> {
  const ctx = await requireJobOwner();
  const documentId = str(fd, "documentId");
  const method = str(fd, "method");
  if (!uuid.safeParse(documentId).success || !["bank", "cash", "pin", "other"].includes(method)) return { error: "Ongeldige invoer." };
  const res = await markInvoicePaid(ctx.salonId, documentId, method as "bank" | "cash" | "pin" | "other", ctx.userId);
  if ("error" in res) return { error: res.error };
  revalidatePath(`/dashboard/facturatie/${documentId}`);
  revalidatePath("/dashboard/facturatie");
  revalidatePath("/dashboard/klussen");
  return { success: true };
}

export async function voidDocumentAction(_prev: JobActionState | undefined, fd: FormData): Promise<JobActionState> {
  const ctx = await requireJobOwner();
  const documentId = str(fd, "documentId");
  if (!uuid.safeParse(documentId).success) return { error: "Ongeldig document." };
  const res = await voidDocument(ctx.salonId, documentId, ctx.userId);
  if ("error" in res) return { error: res.error };
  revalidatePath(`/dashboard/facturatie/${documentId}`);
  revalidatePath("/dashboard/facturatie");
  return { success: true };
}

export async function deleteDraftAction(_prev: JobActionState | undefined, fd: FormData): Promise<JobActionState> {
  const ctx = await requireJobOwner();
  const documentId = str(fd, "documentId");
  if (!uuid.safeParse(documentId).success) return { error: "Ongeldig document." };
  await deleteDraftDocument(ctx.salonId, documentId);
  revalidatePath("/dashboard/facturatie");
  redirect("/dashboard/facturatie");
}

export async function convertQuoteAction(_prev: JobActionState | undefined, fd: FormData): Promise<JobActionState> {
  const ctx = await requireJobOwner();
  if (!ctx.can.quotes) return { error: UPGRADE_QUOTES };
  const quoteId = str(fd, "documentId");
  if (!uuid.safeParse(quoteId).success) return { error: "Ongeldige offerte." };
  const res = await convertQuoteToInvoice(ctx.salonId, quoteId);
  if ("error" in res) return { error: res.error };
  revalidatePath("/dashboard/facturatie");
  redirect(`/dashboard/facturatie/${res.documentId}`);
}

/* ============================ Klanten, adressen, installaties, contracten ============================ */
export async function createCustomerAction(_prev: JobActionState | undefined, fd: FormData): Promise<JobActionState> {
  const ctx = await requireJobOwner();
  const name = str(fd, "name");
  const phone = str(fd, "phone");
  if (name.length < 2) return { error: "Vul een naam in." };
  if (phone.replace(/\D/g, "").length < 8) return { error: "Vul een geldig telefoonnummer in." };
  const typeRaw = str(fd, "customerType");
  const { customer } = await upsertJobCustomer({
    salonId: ctx.salonId,
    name,
    phone,
    email: opt(fd, "email"),
    companyName: opt(fd, "companyName"),
    customerType: (CUSTOMER_TYPES as readonly string[]).includes(typeRaw) ? (typeRaw as CustomerType) : "private",
    notes: opt(fd, "notes"),
    source: "manual",
  });
  revalidatePath("/dashboard/klanten");
  redirect(`/dashboard/klanten/${customer.id}`);
}

export async function updateCustomerAction(_prev: JobActionState | undefined, fd: FormData): Promise<JobActionState> {
  const ctx = await requireJobOwner();
  const customerId = str(fd, "customerId");
  if (!uuid.safeParse(customerId).success) return { error: "Ongeldige klant." };
  const typeRaw = str(fd, "customerType");
  await db
    .update(customers)
    .set({
      name: str(fd, "name") || undefined,
      email: opt(fd, "email"),
      companyName: opt(fd, "companyName"),
      notes: opt(fd, "notes"),
      customerType: (CUSTOMER_TYPES as readonly string[]).includes(typeRaw) ? typeRaw : undefined,
    })
    .where(and(eq(customers.id, customerId), eq(customers.salonId, ctx.salonId)));
  revalidatePath(`/dashboard/klanten/${customerId}`);
  return { success: true };
}

export async function addAddressAction(_prev: JobActionState | undefined, fd: FormData): Promise<JobActionState> {
  const ctx = await requireJobOwner();
  const customerId = str(fd, "customerId");
  if (!uuid.safeParse(customerId).success) return { error: "Ongeldige klant." };
  if (!str(fd, "street") || !str(fd, "houseNumber") || !str(fd, "city")) return { error: "Vul straat, huisnummer en plaats in." };
  const res = await createAddress({
    salonId: ctx.salonId,
    customerId,
    label: opt(fd, "label"),
    street: str(fd, "street"),
    houseNumber: str(fd, "houseNumber"),
    postalCode: str(fd, "postalCode"),
    city: str(fd, "city"),
    accessNotes: opt(fd, "accessNotes"),
    contactName: opt(fd, "contactName"),
    contactPhone: opt(fd, "contactPhone"),
    isBilling: str(fd, "isBilling") === "on",
  });
  if ("error" in res) return { error: res.error };
  revalidatePath(`/dashboard/klanten/${customerId}`);
  return { success: true };
}

export async function deleteAddressAction(_prev: JobActionState | undefined, fd: FormData): Promise<JobActionState> {
  const ctx = await requireJobOwner();
  const addressId = str(fd, "addressId");
  const customerId = str(fd, "customerId");
  if (!uuid.safeParse(addressId).success) return { error: "Ongeldig adres." };
  await deleteAddress(ctx.salonId, addressId);
  revalidatePath(`/dashboard/klanten/${customerId}`);
  return { success: true };
}

export async function addAssetAction(_prev: JobActionState | undefined, fd: FormData): Promise<JobActionState> {
  const ctx = await requireJobOwner();
  if (!ctx.can.assets) return { error: UPGRADE_ASSETS };
  const customerId = str(fd, "customerId");
  if (!uuid.safeParse(customerId).success) return { error: "Ongeldige klant." };
  const kind = str(fd, "kind") || "overig";
  const kindDef = ctx.pack.assetKinds.find((k) => k.key === kind);
  if (!kindDef) return { error: "Onbekend type installatie." };
  const addressId = str(fd, "addressId");
  const installedAt = parseDateInput(str(fd, "installedAt"));
  const lastServiceAt = parseDateInput(str(fd, "lastServiceAt"));
  const warrantyUntil = parseDateInput(str(fd, "warrantyUntil"));
  // Next service: explicit date wins; else last service (or install date) + the kind's interval.
  let nextServiceDue = parseDateInput(str(fd, "nextServiceDue"));
  const basis = lastServiceAt ?? installedAt;
  if (!nextServiceDue && basis && kindDef.serviceIntervalMonths) nextServiceDue = addMonths(basis, kindDef.serviceIntervalMonths);

  const created = await createAsset({
    salonId: ctx.salonId,
    customerId,
    addressId: uuid.safeParse(addressId).success ? addressId : null,
    kind,
    brand: opt(fd, "brand"),
    model: opt(fd, "model"),
    serialNumber: opt(fd, "serialNumber"),
    installedAt,
    lastServiceAt,
    warrantyUntil,
    nextServiceDue,
    notes: opt(fd, "notes"),
  });
  if ("error" in created) return { error: created.error };
  revalidatePath(`/dashboard/klanten/${customerId}`);
  revalidatePath("/dashboard/onderhoud");
  return { success: true };
}

export async function deleteAssetAction(_prev: JobActionState | undefined, fd: FormData): Promise<JobActionState> {
  const ctx = await requireJobOwner();
  const assetId = str(fd, "assetId");
  if (!uuid.safeParse(assetId).success) return { error: "Ongeldige installatie." };
  await deleteAsset(ctx.salonId, assetId);
  revalidatePath(`/dashboard/klanten/${str(fd, "customerId")}`);
  revalidatePath("/dashboard/onderhoud");
  return { success: true };
}

const contractSchema = z.object({
  customerId: uuid,
  name: z.string().min(3, "Geef het contract een naam.").max(120),
  jobCategory: z.string().max(60),
  intervalMonths: z.number().int().min(1).max(120),
  vatRatePercent: z.number().refine((v) => (VAT_RATES as readonly number[]).includes(v)),
});

export async function createContractAction(_prev: JobActionState | undefined, fd: FormData): Promise<JobActionState> {
  const ctx = await requireJobOwner();
  if (!ctx.can.contracts) return { error: UPGRADE_CONTRACTS };
  const parsed = contractSchema.safeParse({
    customerId: str(fd, "customerId"),
    name: str(fd, "name"),
    jobCategory: str(fd, "jobCategory") || "overig",
    intervalMonths: Number(str(fd, "intervalMonths") || 12),
    vatRatePercent: Number(str(fd, "vatRatePercent") || ctx.pack.vatRates.treatment),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Controleer de velden." };
  const firstDueAt = parseDateInput(str(fd, "firstDueAt"));
  if (!firstDueAt) return { error: "Kies de datum van de eerste beurt." };
  const euros = parseEuros(str(fd, "priceEuros") || "0");
  if (euros === null || euros < 0 || euros > 100000) return { error: "Ongeldige prijs." };
  const assetId = str(fd, "assetId");
  const addressId = str(fd, "addressId");

  const created = await createContract({
    salonId: ctx.salonId,
    customerId: parsed.data.customerId,
    name: parsed.data.name,
    jobCategory: categoryFor(ctx.pack, parsed.data.jobCategory)?.key ?? "overig",
    priceCents: Math.round(euros * 100),
    vatRatePercent: parsed.data.vatRatePercent,
    intervalMonths: parsed.data.intervalMonths,
    firstDueAt,
    assetId: uuid.safeParse(assetId).success ? assetId : null,
    addressId: uuid.safeParse(addressId).success ? addressId : null,
    notes: opt(fd, "notes"),
  });
  if ("error" in created) return { error: created.error };
  revalidatePath(`/dashboard/klanten/${parsed.data.customerId}`);
  revalidatePath("/dashboard/onderhoud");
  return { success: true };
}

export async function setContractStatusAction(_prev: JobActionState | undefined, fd: FormData): Promise<JobActionState> {
  const ctx = await requireJobOwner();
  const contractId = str(fd, "contractId");
  const status = str(fd, "status");
  if (!uuid.safeParse(contractId).success || !["active", "paused", "ended"].includes(status)) return { error: "Ongeldige invoer." };
  await setContractStatus(ctx.salonId, contractId, status as "active" | "paused" | "ended");
  revalidatePath("/dashboard/onderhoud");
  return { success: true };
}

/* ============================ Bedrijfsgegevens ============================ */
export async function saveBusinessProfileAction(_prev: JobActionState | undefined, fd: FormData): Promise<JobActionState> {
  const ctx = await requireJobOwner();
  const kvk = str(fd, "kvk").replace(/\s/g, "");
  const vat = str(fd, "vatNumber").replace(/[\s.]/g, "").toUpperCase();
  const iban = normalizeIban(str(fd, "iban"));
  if (kvk && !isValidKvk(kvk)) return { error: "Een KvK-nummer heeft 8 cijfers." };
  if (vat && !isValidVatNumber(vat)) return { error: "Een btw-nummer ziet eruit als NL123456789B01." };
  if (iban && !isValidIban(iban)) return { error: "Dit IBAN lijkt niet te kloppen — controleer het nummer." };

  const business = {
    companyName: str(fd, "companyName").slice(0, 120),
    kvk,
    vatNumber: vat,
    iban,
    street: str(fd, "street").slice(0, 120),
    postalCode: str(fd, "postalCode").slice(0, 12),
    city: str(fd, "city").slice(0, 80),
    email: str(fd, "email").slice(0, 200),
    phone: str(fd, "phone").slice(0, 40),
    paymentTermDays: Math.min(120, Math.max(0, Math.round(Number(str(fd, "paymentTermDays") || 14)))),
    quoteValidDays: Math.min(365, Math.max(1, Math.round(Number(str(fd, "quoteValidDays") || 30)))),
    quoteIntro: str(fd, "quoteIntro").slice(0, 1000),
    invoiceFooter: str(fd, "invoiceFooter").slice(0, 1000),
  };

  await db
    .update(salons)
    .set({ settings: sql`${salons.settings} || jsonb_build_object('business', ${JSON.stringify(business)}::jsonb)` })
    .where(eq(salons.id, ctx.salonId));
  revalidatePath("/dashboard/facturatie");
  return { success: true, message: "Bedrijfsgegevens opgeslagen." };
}

/** Starter dienstencatalogus from the vertical pack — only names the salon
 * doesn't have yet, so pressing it twice never duplicates. */
export async function seedServiceTemplatesAction(): Promise<JobActionState> {
  const ctx = await requireJobOwner();
  if (!ctx.pack.serviceTemplates.length) return { error: "Er is geen startcatalogus voor dit vak." };
  const existing = await db.select({ name: treatments.name }).from(treatments).where(eq(treatments.salonId, ctx.salonId));
  const have = new Set(existing.map((t) => t.name.toLowerCase()));
  const toAdd = ctx.pack.serviceTemplates.filter((t) => !have.has(t.name.toLowerCase()));
  if (!toAdd.length) return { success: true, message: "Je startcatalogus staat er al in." };
  await db.insert(treatments).values(
    toAdd.map((t) => ({
      salonId: ctx.salonId,
      name: t.name,
      category: t.category,
      durationMinutes: t.durationMinutes,
      priceCents: t.priceCents,
      vatRatePercent: t.vatRatePercent,
      description: t.description,
    })),
  );
  revalidatePath("/dashboard/praktijk");
  return { success: true, message: `${toAdd.length} diensten toegevoegd — pas de prijzen aan naar jouw tarieven.` };
}
