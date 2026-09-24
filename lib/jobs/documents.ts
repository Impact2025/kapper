import "server-only";
import { randomBytes } from "node:crypto";
import { and, asc, desc, eq, inArray, isNotNull, lt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { customers, salons, treatments, users } from "@/lib/db/schema";
import {
  customerAddresses,
  jobDocumentLines,
  jobDocuments,
  jobs,
  serviceContracts,
  type DocumentParty,
} from "@/lib/db/schema-jobs";
import { nextNumber } from "@/lib/jobs/numbering";
import { logJobEvent, changeJobStatus } from "@/lib/jobs/lifecycle";
import { notifyCustomer } from "@/lib/jobs/notify";
import {
  addDays,
  computeDocumentTotals,
  formatMoney,
  reminderDue,
  type DocumentKind,
  type DocLineInput,
  type LineKind,
} from "@/lib/jobs/model";
import { formatIban, missingInvoiceFields, parseBusinessProfile } from "@/lib/jobs/business";
import { getVerticalConfig } from "@/lib/verticals";
import { siteUrlFor } from "@/lib/verticals/site-url";
import { brandFor, button, shell } from "@/lib/mail/templates";
import { sendEmail } from "@/lib/mail/resend";
import { captureError } from "@/lib/observability";

type DocRow = typeof jobDocuments.$inferSelect;
type LineRow = typeof jobDocumentLines.$inferSelect;

export interface DocLineDraft {
  kind: LineKind;
  description: string;
  quantity: number;
  unit: string;
  unitPriceCents: number;
  vatRatePercent: number;
}

const newToken = () => randomBytes(24).toString("base64url");
const draftNumber = () => `CONCEPT-${randomBytes(3).toString("hex").toUpperCase()}`;

function toInputs(lines: DocLineDraft[]): DocLineInput[] {
  return lines.map((l) => ({
    quantity: l.quantity,
    unitPriceCents: l.unitPriceCents,
    vatRatePercent: l.vatRatePercent,
  }));
}

/* ------------------------------ create ------------------------------ */
export async function createDraftDocument(input: {
  salonId: string;
  kind: DocumentKind;
  jobId: string;
  lines?: DocLineDraft[];
  sourceQuoteId?: string | null;
  title?: string | null;
}): Promise<{ ok: true; document: DocRow } | { error: string }> {
  const [job] = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.id, input.jobId), eq(jobs.salonId, input.salonId)))
    .limit(1);
  if (!job) return { error: "Klus niet gevonden." };
  if (!job.customerId) return { error: "Koppel eerst een klant aan deze klus." };

  const [customer] = await db.select().from(customers).where(eq(customers.id, job.customerId)).limit(1);
  if (!customer) return { error: "Klant niet gevonden." };

  // Bill-to: the customer's billing address if flagged, else the klusadres.
  const addresses = await db.select().from(customerAddresses).where(eq(customerAddresses.customerId, customer.id));
  const billing = addresses.find((a) => a.isBilling) ?? addresses.find((a) => a.id === job.addressId) ?? addresses[0];
  const billTo: DocumentParty = {
    name: customer.name,
    companyName: customer.companyName,
    street: billing ? `${billing.street} ${billing.houseNumber}` : null,
    postalCode: billing?.postalCode ?? null,
    city: billing?.city ?? null,
    email: customer.email,
    phone: customer.phone,
  };

  let lines = input.lines ?? [];
  // An invoice for a contract-driven klus starts with the contract's price.
  if (!lines.length && input.kind === "invoice" && job.contractId) {
    const [contract] = await db.select().from(serviceContracts).where(eq(serviceContracts.id, job.contractId)).limit(1);
    if (contract) {
      lines = [
        {
          kind: "labor",
          description: contract.name,
          quantity: 1,
          unit: "post",
          unitPriceCents: contract.priceCents,
          vatRatePercent: contract.vatRatePercent,
        },
      ];
    }
  }
  // Otherwise start from the owner's own catalogue: the dienst(en) matching
  // this klus' category, plus voorrijkosten when they have such an item — so a
  // quote is mostly filled in before the plumber types anything.
  if (!lines.length) {
    const catalog = await db
      .select()
      .from(treatments)
      .where(and(eq(treatments.salonId, input.salonId), eq(treatments.active, true)));
    const isTravel = (name: string) => /voorrij/i.test(name);
    const matching = catalog.filter((t) => t.category === job.category && !isTravel(t.name)).slice(0, 2);
    const travel = catalog.find((t) => isTravel(t.name));
    lines = [...matching, ...(travel && matching.length ? [travel] : [])].map((t) => ({
      kind: isTravel(t.name) ? ("travel" as const) : ("labor" as const),
      description: t.name,
      quantity: 1,
      unit: "post",
      unitPriceCents: t.priceCents,
      vatRatePercent: t.vatRatePercent,
    }));
  }
  const totals = computeDocumentTotals(toInputs(lines));

  const [doc] = await db
    .insert(jobDocuments)
    .values({
      salonId: input.salonId,
      jobId: job.id,
      customerId: customer.id,
      kind: input.kind,
      number: draftNumber(),
      status: "draft",
      publicToken: newToken(),
      billTo,
      jobAddress: job.addressLine,
      title: input.title ?? job.title,
      sourceQuoteId: input.sourceQuoteId ?? null,
      subtotalCents: totals.subtotalCents,
      vatCents: totals.vatCents,
      totalCents: totals.totalCents,
      vatBreakdown: totals.breakdown,
    })
    .returning();

  if (lines.length) await insertLines(doc!.id, input.salonId, lines);
  await logJobEvent({
    salonId: input.salonId,
    jobId: job.id,
    kind: "document",
    message: `${input.kind === "quote" ? "Offerte" : "Factuur"}-concept aangemaakt`,
    meta: { documentId: doc!.id },
  });
  return { ok: true, document: doc! };
}

async function insertLines(documentId: string, salonId: string, lines: DocLineDraft[]) {
  if (!lines.length) return;
  await db.insert(jobDocumentLines).values(
    lines.map((l, i) => ({
      documentId,
      salonId,
      position: i,
      kind: l.kind,
      description: l.description.trim().slice(0, 500),
      quantity: String(l.quantity),
      unit: l.unit,
      unitPriceCents: l.unitPriceCents,
      vatRatePercent: l.vatRatePercent,
    })),
  );
}

/** Replace all lines of a *draft* document and refresh its totals. */
export async function saveDraftLines(
  salonId: string,
  documentId: string,
  lines: DocLineDraft[],
  meta: { title?: string | null; introText?: string | null; footerText?: string | null } = {},
): Promise<{ ok: true } | { error: string }> {
  const [doc] = await db
    .select()
    .from(jobDocuments)
    .where(and(eq(jobDocuments.id, documentId), eq(jobDocuments.salonId, salonId)))
    .limit(1);
  if (!doc) return { error: "Document niet gevonden." };
  if (doc.status !== "draft") {
    return { error: "Een verstuurd document kan niet meer worden aangepast. Maak een nieuw document of boek het vervallen." };
  }
  const totals = computeDocumentTotals(toInputs(lines));
  await db.delete(jobDocumentLines).where(eq(jobDocumentLines.documentId, documentId));
  await insertLines(documentId, salonId, lines);
  await db
    .update(jobDocuments)
    .set({
      subtotalCents: totals.subtotalCents,
      vatCents: totals.vatCents,
      totalCents: totals.totalCents,
      vatBreakdown: totals.breakdown,
      ...(meta.title !== undefined ? { title: meta.title } : {}),
      ...(meta.introText !== undefined ? { introText: meta.introText } : {}),
      ...(meta.footerText !== undefined ? { footerText: meta.footerText } : {}),
    })
    .where(eq(jobDocuments.id, documentId));
  return { ok: true };
}

export function lineRowsToDrafts(rows: LineRow[]): DocLineDraft[] {
  return rows.map((r) => ({
    kind: r.kind as LineKind,
    description: r.description,
    quantity: Number(r.quantity),
    unit: r.unit,
    unitPriceCents: r.unitPriceCents,
    vatRatePercent: r.vatRatePercent,
  }));
}

/* ------------------------------ finalize + send ------------------------------ */
function documentUrl(vertical: string, kind: DocumentKind, token: string): string {
  return `${siteUrlFor(vertical)}/${kind === "quote" ? "offerte" : "factuur"}/${token}`;
}

export async function finalizeAndSend(
  salonId: string,
  documentId: string,
  opts: { send: boolean; actorUserId?: string | null },
): Promise<{ ok: true; document: DocRow; sent: { whatsapp: boolean; email: boolean } } | { error: string }> {
  const [doc] = await db
    .select()
    .from(jobDocuments)
    .where(and(eq(jobDocuments.id, documentId), eq(jobDocuments.salonId, salonId)))
    .limit(1);
  if (!doc) return { error: "Document niet gevonden." };
  if (doc.status !== "draft" && doc.status !== "sent") return { error: "Dit document kan niet meer worden verstuurd." };

  const [salon] = await db.select().from(salons).where(eq(salons.id, salonId)).limit(1);
  if (!salon) return { error: "Bedrijf niet gevonden." };
  const business = parseBusinessProfile(salon.settings, salon.name);
  const kind = doc.kind as DocumentKind;

  const lineRows = await db
    .select()
    .from(jobDocumentLines)
    .where(eq(jobDocumentLines.documentId, documentId))
    .orderBy(asc(jobDocumentLines.position));
  if (!lineRows.length) return { error: "Voeg eerst minstens één regel toe." };
  if (kind === "invoice") {
    const missing = missingInvoiceFields(business);
    if (missing.length) {
      return { error: `Vul eerst je bedrijfsgegevens aan onder Facturatie → Instellingen (${missing.join(", ")}) — die zijn wettelijk verplicht op een factuur.` };
    }
  }

  const now = new Date();
  let number = doc.number;
  if (doc.status === "draft") number = await nextNumber(salonId, kind, now);

  const [updated] = await db
    .update(jobDocuments)
    .set({
      number,
      status: "sent",
      issuedAt: doc.issuedAt ?? now,
      sentAt: now,
      ...(kind === "quote"
        ? { validUntil: doc.validUntil ?? addDays(now, business.quoteValidDays) }
        : { dueAt: doc.dueAt ?? addDays(now, business.paymentTermDays) }),
      footerText: doc.footerText ?? (kind === "invoice" ? business.invoiceFooter || null : null),
      introText: doc.introText ?? (kind === "quote" ? business.quoteIntro || null : null),
    })
    .where(eq(jobDocuments.id, documentId))
    .returning();

  if (doc.jobId) {
    if (kind === "quote") {
      const [job] = await db.select({ status: jobs.status }).from(jobs).where(eq(jobs.id, doc.jobId)).limit(1);
      if (job?.status === "new") await changeJobStatus(salonId, doc.jobId, "quoted", { actorUserId: opts.actorUserId });
    } else {
      const [job] = await db.select({ status: jobs.status }).from(jobs).where(eq(jobs.id, doc.jobId)).limit(1);
      if (job?.status === "completed") await changeJobStatus(salonId, doc.jobId, "invoiced", { actorUserId: opts.actorUserId });
    }
    await logJobEvent({
      salonId,
      jobId: doc.jobId,
      kind: "document",
      message: `${kind === "quote" ? "Offerte" : "Factuur"} ${number} ${opts.send ? "verstuurd" : "definitief gemaakt"} (${formatMoney(updated!.totalCents)})`,
      meta: { documentId },
      actorUserId: opts.actorUserId,
    });
  }

  let sent = { whatsapp: false, email: false };
  if (opts.send) sent = await sendDocumentToCustomer(salon, updated!, business.companyName);
  return { ok: true, document: updated!, sent };
}

async function sendDocumentToCustomer(
  salon: typeof salons.$inferSelect,
  doc: DocRow,
  companyName: string,
): Promise<{ whatsapp: boolean; email: boolean }> {
  const kind = doc.kind as DocumentKind;
  const url = documentUrl(salon.vertical, kind, doc.publicToken);
  const brand = brandFor(salon.vertical);
  const first = (doc.billTo.name || "").split(" ")[0] || "";
  const label = kind === "quote" ? "offerte" : "factuur";
  const text =
    kind === "quote"
      ? `Hoi ${first}! Hierbij de offerte ${doc.number} van ${companyName} (${formatMoney(doc.totalCents)}). Bekijk en accepteer hem hier: ${url}`
      : `Hoi ${first}! Hierbij de factuur ${doc.number} van ${companyName} (${formatMoney(doc.totalCents)}). Bekijk hem hier: ${url}`;
  const html = shell(
    `${kind === "quote" ? "Offerte" : "Factuur"} ${doc.number}`,
    `<p style="font-size:16px;line-height:1.6;margin:0 0 16px;">Hoi ${first},</p>
     <p style="font-size:16px;line-height:1.6;margin:0 0 24px;">Hierbij de ${label} van <strong>${companyName}</strong> voor <strong>${formatMoney(doc.totalCents)}</strong>.</p>
     <div style="margin-bottom:24px;">${button(url, kind === "quote" ? "Offerte bekijken en accepteren →" : "Factuur bekijken →")}</div>`,
    brand,
  );
  return notifyCustomer({
    salon,
    phone: doc.billTo.phone,
    email: doc.billTo.email,
    text,
    emailSubject: `${kind === "quote" ? "Offerte" : "Factuur"} ${doc.number} — ${companyName}`,
    emailHtml: html,
  });
}

/* ------------------------------ quote → invoice ------------------------------ */
export async function convertQuoteToInvoice(salonId: string, quoteId: string) {
  const [quote] = await db
    .select()
    .from(jobDocuments)
    .where(and(eq(jobDocuments.id, quoteId), eq(jobDocuments.salonId, salonId), eq(jobDocuments.kind, "quote")))
    .limit(1);
  if (!quote) return { error: "Offerte niet gevonden." as const };
  if (!quote.jobId) return { error: "Deze offerte hoort bij geen klus." as const };
  if (quote.status !== "accepted") return { error: "Alleen een geaccepteerde offerte kan worden omgezet in een factuur." as const };

  const [existing] = await db
    .select({ id: jobDocuments.id })
    .from(jobDocuments)
    .where(and(eq(jobDocuments.sourceQuoteId, quoteId), eq(jobDocuments.kind, "invoice")))
    .limit(1);
  if (existing) return { ok: true as const, documentId: existing.id, reused: true };

  const lines = lineRowsToDrafts(
    await db.select().from(jobDocumentLines).where(eq(jobDocumentLines.documentId, quoteId)).orderBy(asc(jobDocumentLines.position)),
  );
  const res = await createDraftDocument({
    salonId,
    kind: "invoice",
    jobId: quote.jobId,
    lines,
    sourceQuoteId: quoteId,
    title: quote.title,
  });
  if ("error" in res) return res;
  return { ok: true as const, documentId: res.document.id, reused: false };
}

/* ------------------------------ public quote response ------------------------------ */
export async function getDocumentByToken(token: string) {
  const [doc] = await db.select().from(jobDocuments).where(eq(jobDocuments.publicToken, token)).limit(1);
  if (!doc || doc.status === "draft") return null;
  const [lines, salonRows] = await Promise.all([
    db.select().from(jobDocumentLines).where(eq(jobDocumentLines.documentId, doc.id)).orderBy(asc(jobDocumentLines.position)),
    db.select().from(salons).where(eq(salons.id, doc.salonId)).limit(1),
  ]);
  const salon = salonRows[0];
  if (!salon) return null;
  const pack = getVerticalConfig(salon.vertical);
  return { doc, lines, salon, pack, business: parseBusinessProfile(salon.settings, salon.name) };
}

async function notifyOwner(salonId: string, subject: string, body: string) {
  try {
    const [salon] = await db.select().from(salons).where(eq(salons.id, salonId)).limit(1);
    const owners = await db.select({ email: users.email }).from(users).where(and(eq(users.salonId, salonId), eq(users.role, "owner")));
    if (!owners.length) return;
    const brand = brandFor(salon?.vertical);
    await sendEmail({
      to: owners.map((o) => o.email),
      subject,
      html: shell(subject, `<p style="font-size:16px;line-height:1.6;margin:0 0 16px;">${body}</p>`, brand),
    });
  } catch (err) {
    captureError("jobs/notify-owner", err);
  }
}

export async function acceptQuoteByToken(token: string, name: string): Promise<{ ok: true } | { error: string }> {
  const trimmed = name.trim();
  if (trimmed.length < 2) return { error: "Vul je naam in om te accepteren." };
  const now = new Date();
  const [doc] = await db
    .update(jobDocuments)
    .set({ status: "accepted", acceptedAt: now, acceptedByName: trimmed.slice(0, 120) })
    .where(
      and(
        eq(jobDocuments.publicToken, token),
        eq(jobDocuments.kind, "quote"),
        eq(jobDocuments.status, "sent"),
        sql`(${jobDocuments.validUntil} is null or ${jobDocuments.validUntil} >= ${now})`,
      ),
    )
    .returning();
  if (!doc) return { error: "Deze offerte kan niet meer worden geaccepteerd (al beantwoord of verlopen)." };
  if (doc.jobId) {
    await logJobEvent({
      salonId: doc.salonId,
      jobId: doc.jobId,
      kind: "document",
      message: `Offerte ${doc.number} geaccepteerd door ${trimmed}`,
      meta: { documentId: doc.id },
    });
  }
  await notifyOwner(doc.salonId, `Offerte ${doc.number} geaccepteerd`, `${trimmed} heeft offerte ${doc.number} (${formatMoney(doc.totalCents)}) geaccepteerd. Je kunt de klus nu inplannen.`);
  return { ok: true };
}

export async function declineQuoteByToken(token: string, reason: string): Promise<{ ok: true } | { error: string }> {
  const [doc] = await db
    .update(jobDocuments)
    .set({ status: "declined", declinedAt: new Date(), declineReason: reason.trim().slice(0, 500) || null })
    .where(and(eq(jobDocuments.publicToken, token), eq(jobDocuments.kind, "quote"), eq(jobDocuments.status, "sent")))
    .returning();
  if (!doc) return { error: "Deze offerte kan niet meer worden afgewezen." };
  if (doc.jobId) {
    await logJobEvent({
      salonId: doc.salonId,
      jobId: doc.jobId,
      kind: "document",
      message: `Offerte ${doc.number} afgewezen${reason ? `: ${reason.trim()}` : ""}`,
      meta: { documentId: doc.id },
    });
  }
  await notifyOwner(doc.salonId, `Offerte ${doc.number} afgewezen`, `De klant heeft offerte ${doc.number} afgewezen.${reason ? ` Reden: ${reason.trim()}` : ""}`);
  return { ok: true };
}

/* ------------------------------ payment ------------------------------ */
export async function markInvoicePaid(
  salonId: string,
  invoiceId: string,
  method: "bank" | "cash" | "pin" | "other",
  actorUserId?: string | null,
) {
  const [doc] = await db
    .update(jobDocuments)
    .set({ status: "paid", paidAt: new Date(), paymentMethod: method })
    .where(
      and(
        eq(jobDocuments.id, invoiceId),
        eq(jobDocuments.salonId, salonId),
        eq(jobDocuments.kind, "invoice"),
        eq(jobDocuments.status, "sent"),
      ),
    )
    .returning();
  if (!doc) return { error: "Alleen een openstaande factuur kan als betaald worden geboekt." as const };
  if (doc.jobId) {
    const [job] = await db.select({ status: jobs.status }).from(jobs).where(eq(jobs.id, doc.jobId)).limit(1);
    if (job && ["completed", "invoiced"].includes(job.status)) {
      await changeJobStatus(salonId, doc.jobId, "paid", { actorUserId });
    }
    await logJobEvent({
      salonId,
      jobId: doc.jobId,
      kind: "payment",
      message: `Factuur ${doc.number} betaald (${method}) — ${formatMoney(doc.totalCents)}`,
      meta: { documentId: doc.id, method },
      actorUserId,
    });
  }
  return { ok: true as const };
}

export async function voidDocument(salonId: string, documentId: string, actorUserId?: string | null) {
  const [doc] = await db
    .update(jobDocuments)
    .set({ status: "void" })
    .where(
      and(
        eq(jobDocuments.id, documentId),
        eq(jobDocuments.salonId, salonId),
        inArray(jobDocuments.status, ["draft", "sent"]),
      ),
    )
    .returning();
  if (!doc) return { error: "Dit document kan niet worden vervallen verklaard." as const };
  if (doc.jobId) {
    await logJobEvent({
      salonId,
      jobId: doc.jobId,
      kind: "document",
      message: `${doc.kind === "quote" ? "Offerte" : "Factuur"} ${doc.number} vervallen`,
      meta: { documentId },
      actorUserId,
    });
  }
  return { ok: true as const };
}

/** Concepten mogen echt weg — ze hebben nog geen nummer. */
export async function deleteDraftDocument(salonId: string, documentId: string) {
  await db
    .delete(jobDocuments)
    .where(and(eq(jobDocuments.id, documentId), eq(jobDocuments.salonId, salonId), eq(jobDocuments.status, "draft")));
}

/* ------------------------------ lists ------------------------------ */
export async function listDocuments(salonId: string, kind: DocumentKind) {
  return db
    .select({
      id: jobDocuments.id,
      number: jobDocuments.number,
      status: jobDocuments.status,
      totalCents: jobDocuments.totalCents,
      issuedAt: jobDocuments.issuedAt,
      dueAt: jobDocuments.dueAt,
      validUntil: jobDocuments.validUntil,
      billTo: jobDocuments.billTo,
      jobId: jobDocuments.jobId,
      title: jobDocuments.title,
      createdAt: jobDocuments.createdAt,
      reminderCount: jobDocuments.reminderCount,
    })
    .from(jobDocuments)
    .where(and(eq(jobDocuments.salonId, salonId), eq(jobDocuments.kind, kind)))
    .orderBy(desc(jobDocuments.createdAt))
    .limit(300);
}

export async function getDocumentForOwner(salonId: string, documentId: string) {
  const [doc] = await db
    .select()
    .from(jobDocuments)
    .where(and(eq(jobDocuments.id, documentId), eq(jobDocuments.salonId, salonId)))
    .limit(1);
  if (!doc) return null;
  const lines = await db
    .select()
    .from(jobDocumentLines)
    .where(eq(jobDocumentLines.documentId, documentId))
    .orderBy(asc(jobDocumentLines.position));
  return { doc, lines };
}

/* ------------------------------ payment reminders ------------------------------ */
/** Cron entry: send friendly payment reminders for overdue invoices. */
export async function sendDueInvoiceReminders(now: Date = new Date()): Promise<{ sent: number; skipped: number }> {
  const overdue = await db
    .select()
    .from(jobDocuments)
    .where(and(eq(jobDocuments.kind, "invoice"), eq(jobDocuments.status, "sent"), isNotNull(jobDocuments.dueAt), lt(jobDocuments.dueAt, now)))
    .limit(200);

  let sent = 0;
  let skipped = 0;
  for (const doc of overdue) {
    if (!reminderDue(doc, now)) {
      skipped++;
      continue;
    }
    const [salon] = await db.select().from(salons).where(eq(salons.id, doc.salonId)).limit(1);
    if (!salon) {
      skipped++;
      continue;
    }
    const business = parseBusinessProfile(salon.settings, salon.name);
    const url = documentUrl(salon.vertical, "invoice", doc.publicToken);
    const first = (doc.billTo.name || "").split(" ")[0] || "";
    const pay = business.iban ? ` Betalen kan naar ${formatIban(business.iban)} o.v.v. ${doc.number}.` : "";
    const text = `Hoi ${first}, een vriendelijke herinnering: factuur ${doc.number} van ${business.companyName} (${formatMoney(doc.totalCents)}) staat nog open.${pay} Bekijk de factuur: ${url}`;
    const html = shell(
      `Herinnering factuur ${doc.number}`,
      `<p style="font-size:16px;line-height:1.6;margin:0 0 16px;">Hoi ${first},</p>
       <p style="font-size:16px;line-height:1.6;margin:0 0 24px;">Een vriendelijke herinnering: factuur <strong>${doc.number}</strong> van ${business.companyName} (${formatMoney(doc.totalCents)}) staat nog open.${pay}</p>
       <div style="margin-bottom:24px;">${button(url, "Factuur bekijken →")}</div>`,
      brandFor(salon.vertical),
    );
    const res = await notifyCustomer({
      salon,
      phone: doc.billTo.phone,
      email: doc.billTo.email,
      text,
      emailSubject: `Herinnering factuur ${doc.number} — ${business.companyName}`,
      emailHtml: html,
    });
    if (!res.whatsapp && !res.email) {
      skipped++;
      continue;
    }
    await db
      .update(jobDocuments)
      .set({ reminderCount: doc.reminderCount + 1, lastReminderAt: now })
      .where(eq(jobDocuments.id, doc.id));
    if (doc.jobId) {
      await logJobEvent({
        salonId: doc.salonId,
        jobId: doc.jobId,
        kind: "payment",
        message: `Betalingsherinnering ${doc.reminderCount + 1} verstuurd voor ${doc.number}`,
        meta: { documentId: doc.id },
      });
    }
    sent++;
  }
  return { sent, skipped };
}

