import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  numeric,
  primaryKey,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { salons, customers, staff, appointments, conversations } from "./schema";

/*
 * Klus-CRM (job archetype) — loodgieter, schilder, elektricien, ...
 *
 * Lives in its own schema file (registered in drizzle.config.ts) so the
 * sector-neutral core schema stays untouched. Status/kind/priority columns are
 * plain text with TS unions in lib/jobs/model.ts (no pgEnum): new statuses or
 * kinds must not need an ALTER TYPE migration on a live database.
 *
 * Retention: quotes/invoices are fiscal records (7 jaar). Their customer link
 * is SET NULL and they carry an immutable `billTo` snapshot, so a customer
 * erasure (AVG art. 17) can anonymize the snapshot without deleting the
 * invoice — same pattern as appointments/orders in lib/compliance/purge.ts.
 */

/* ---------------------------- Adressen ---------------------------- */
// A customer has 1..n adressen: the klusadres is not the customer's home.
// Verhuurder/VvE/huurder are modelled by a contact on the address.
export const customerAddresses = pgTable(
  "customer_addresses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    salonId: uuid("salon_id")
      .notNull()
      .references(() => salons.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    label: text("label"), // "Thuis", "Verhuurpand Zeestraat", "Kantoor"
    street: text("street").notNull(),
    houseNumber: text("house_number").notNull(), // incl. toevoeging: "12 B"
    postalCode: text("postal_code").notNull(), // normalized "1234 AB"
    city: text("city").notNull(),
    // Toegang/parkeren/sleutelkluis — wat de monteur moet weten vóór aankomst.
    accessNotes: text("access_notes"),
    // Ter plaatse aanwezige contactpersoon (huurder, portier, beheerder).
    contactName: text("contact_name"),
    contactPhone: text("contact_phone"),
    isBilling: boolean("is_billing").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
  },
  (t) => [
    index("customer_addresses_customer_idx").on(t.customerId),
    index("customer_addresses_salon_postal_idx").on(t.salonId, t.postalCode),
  ],
);

/* ---------------------------- Installaties ---------------------------- */
// Installatiepaspoort: wat staat er bij deze klant, wanneer geplaatst, wanneer
// weer onderhoud. `kind` keys into the vertical pack's assetKinds.
export const assets = pgTable(
  "assets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    salonId: uuid("salon_id")
      .notNull()
      .references(() => salons.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    addressId: uuid("address_id").references(() => customerAddresses.id, { onDelete: "cascade" }),
    kind: text("kind").notNull().default("overig"),
    brand: text("brand"),
    model: text("model"),
    serialNumber: text("serial_number"),
    installedAt: timestamp("installed_at", { withTimezone: true }),
    warrantyUntil: timestamp("warranty_until", { withTimezone: true }),
    lastServiceAt: timestamp("last_service_at", { withTimezone: true }),
    // Manually set, or maintained from a service contract / kind interval.
    nextServiceDue: timestamp("next_service_due", { withTimezone: true }),
    notes: text("notes"),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
  },
  (t) => [
    index("assets_customer_idx").on(t.customerId),
    index("assets_salon_service_idx").on(t.salonId, t.nextServiceDue),
  ],
);

/* ---------------------------- Onderhoudscontracten ---------------------------- */
export const serviceContracts = pgTable(
  "service_contracts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    salonId: uuid("salon_id")
      .notNull()
      .references(() => salons.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    addressId: uuid("address_id").references(() => customerAddresses.id, { onDelete: "set null" }),
    assetId: uuid("asset_id").references(() => assets.id, { onDelete: "set null" }),
    name: text("name").notNull(), // "Jaarlijks cv-onderhoud"
    jobCategory: text("job_category").notNull().default("overig"),
    priceCents: integer("price_cents").notNull().default(0), // per beurt, excl. btw
    vatRatePercent: integer("vat_rate_percent").notNull().default(21),
    intervalMonths: integer("interval_months").notNull().default(12),
    startsOn: timestamp("starts_on", { withTimezone: true }).notNull(),
    nextDueAt: timestamp("next_due_at", { withTimezone: true }).notNull(),
    // active | paused | ended
    status: text("status").notNull().default("active"),
    // Days before nextDueAt that the klus is created + the klant is notified.
    leadDays: integer("lead_days").notNull().default(30),
    // Set when the klus for the current nextDueAt has been created (dedupe).
    lastGeneratedForDue: timestamp("last_generated_for_due", { withTimezone: true }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
  },
  (t) => [
    index("service_contracts_customer_idx").on(t.customerId),
    index("service_contracts_salon_due_idx").on(t.salonId, t.status, t.nextDueAt),
  ],
);

/* ---------------------------- Klussen (werkbonnen) ---------------------------- */
export const jobs = pgTable(
  "jobs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    salonId: uuid("salon_id")
      .notNull()
      .references(() => salons.id, { onDelete: "cascade" }),
    // K-2026-0001 — per salon, per jaar (see salon_counters).
    number: text("number").notNull(),
    customerId: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
    addressId: uuid("address_id").references(() => customerAddresses.id, { onDelete: "set null" }),
    assetId: uuid("asset_id").references(() => assets.id, { onDelete: "set null" }),
    contractId: uuid("contract_id").references(() => serviceContracts.id, { onDelete: "set null" }),
    appointmentId: uuid("appointment_id").references(() => appointments.id, { onDelete: "set null" }),
    conversationId: uuid("conversation_id").references(() => conversations.id, { onDelete: "set null" }),
    // Snapshot of where the klus is, for jobs whose address row was purged
    // and for fast list rendering.
    addressLine: text("address_line"),
    title: text("title").notNull(),
    description: text("description"),
    category: text("category").notNull().default("overig"),
    // urgent | high | normal | low
    priority: text("priority").notNull().default("normal"),
    // new | quoted | scheduled | en_route | in_progress | on_hold | completed | invoiced | paid | cancelled
    status: text("status").notNull().default("new"),
    // ai_whatsapp | ai_phone | manual | contract | web
    source: text("source").notNull().default("manual"),
    assignedStaffId: uuid("assigned_staff_id").references(() => staff.id, { onDelete: "set null" }),
    scheduledStart: timestamp("scheduled_start", { withTimezone: true }),
    estimatedMinutes: integer("estimated_minutes").notNull().default(60),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    // [{ id, label, done }] — seeded from the vertical pack's category checklist.
    checklist: jsonb("checklist").$type<{ id: string; label: string; done: boolean }[]>().default([]).notNull(),
    workSummary: text("work_summary"),
    internalNotes: text("internal_notes"),
    // Vak-specific fields (VerticalPack.jobFields): oppervlak/kleur for a
    // schilder, "woning ouder dan 2 jaar" for a loodgieter. Keyed by field key.
    details: jsonb("details").$type<Record<string, string>>().default({}).notNull(),
    // Opleverhandtekening: naam-bevestiging op de werkbon.
    signedByName: text("signed_by_name"),
    signedAt: timestamp("signed_at", { withTimezone: true }),
    warrantyUntil: timestamp("warranty_until", { withTimezone: true }),
    cancelledReason: text("cancelled_reason"),
    reviewRequestedAt: timestamp("review_requested_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("jobs_salon_number_idx").on(t.salonId, t.number),
    index("jobs_salon_status_idx").on(t.salonId, t.status),
    index("jobs_salon_scheduled_idx").on(t.salonId, t.scheduledStart),
    index("jobs_customer_idx").on(t.customerId),
  ],
);

export const jobEvents = pgTable(
  "job_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    salonId: uuid("salon_id")
      .notNull()
      .references(() => salons.id, { onDelete: "cascade" }),
    jobId: uuid("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    // created | status | note | scheduled | assigned | checklist | photo | document | payment | ai
    kind: text("kind").notNull(),
    message: text("message").notNull(),
    meta: jsonb("meta").$type<Record<string, unknown>>().default({}).notNull(),
    actorUserId: uuid("actor_user_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("job_events_job_idx").on(t.jobId, t.createdAt)],
);

export const jobPhotos = pgTable(
  "job_photos",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    salonId: uuid("salon_id")
      .notNull()
      .references(() => salons.id, { onDelete: "cascade" }),
    jobId: uuid("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    // Cascades on customer erasure: photos of someone's home are personal data.
    customerId: uuid("customer_id").references(() => customers.id, { onDelete: "cascade" }),
    blobUrl: text("blob_url").notNull(),
    // before | during | after | issue
    kind: text("kind").notNull().default("during"),
    caption: text("caption"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("job_photos_job_idx").on(t.jobId)],
);

/* ---------------------------- Offertes & facturen ---------------------------- */
export interface DocumentParty {
  name: string;
  companyName?: string | null;
  street?: string | null;
  postalCode?: string | null;
  city?: string | null;
  email?: string | null;
  phone?: string | null;
}

export const jobDocuments = pgTable(
  "job_documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    salonId: uuid("salon_id")
      .notNull()
      .references(() => salons.id, { onDelete: "cascade" }),
    jobId: uuid("job_id").references(() => jobs.id, { onDelete: "set null" }),
    customerId: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
    // quote | invoice
    kind: text("kind").notNull(),
    // O-2026-0001 / F-2026-0001 — gapless per salon/year/kind.
    number: text("number").notNull(),
    // quote: draft|sent|accepted|declined|expired  invoice: draft|sent|paid|void
    status: text("status").notNull().default("draft"),
    // Onraadbaar token voor de publieke link (/offerte/[token], /factuur/[token]).
    publicToken: text("public_token").notNull().unique(),
    // Snapshot of the recipient + the job location at issue time.
    billTo: jsonb("bill_to").$type<DocumentParty>().notNull(),
    jobAddress: text("job_address"),
    title: text("title"),
    introText: text("intro_text"),
    footerText: text("footer_text"),
    issuedAt: timestamp("issued_at", { withTimezone: true }),
    validUntil: timestamp("valid_until", { withTimezone: true }),
    dueAt: timestamp("due_at", { withTimezone: true }),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    acceptedByName: text("accepted_by_name"),
    declinedAt: timestamp("declined_at", { withTimezone: true }),
    declineReason: text("decline_reason"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    paymentMethod: text("payment_method"), // bank | cash | pin | other
    // Set on an invoice created from an accepted quote.
    sourceQuoteId: uuid("source_quote_id"),
    // Denormalized at save so lists don't re-sum lines.
    subtotalCents: integer("subtotal_cents").notNull().default(0),
    vatCents: integer("vat_cents").notNull().default(0),
    totalCents: integer("total_cents").notNull().default(0),
    vatBreakdown: jsonb("vat_breakdown")
      .$type<{ ratePercent: number; netCents: number; vatCents: number }[]>()
      .default([])
      .notNull(),
    lastReminderAt: timestamp("last_reminder_at", { withTimezone: true }),
    reminderCount: integer("reminder_count").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("job_documents_salon_number_idx").on(t.salonId, t.kind, t.number),
    index("job_documents_job_idx").on(t.jobId),
    index("job_documents_salon_kind_status_idx").on(t.salonId, t.kind, t.status),
  ],
);

export const jobDocumentLines = pgTable(
  "job_document_lines",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => jobDocuments.id, { onDelete: "cascade" }),
    salonId: uuid("salon_id")
      .notNull()
      .references(() => salons.id, { onDelete: "cascade" }),
    position: integer("position").notNull().default(0),
    // labor | material | travel | other
    kind: text("kind").notNull().default("other"),
    description: text("description").notNull(),
    quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull().default("1"),
    unit: text("unit").notNull().default("stuk"),
    unitPriceCents: integer("unit_price_cents").notNull().default(0), // excl. btw
    vatRatePercent: integer("vat_rate_percent").notNull().default(21),
  },
  (t) => [index("job_document_lines_doc_idx").on(t.documentId, t.position)],
);

/* ---------------------------- Nummering ---------------------------- */
// Atomic per-salon counters: one INSERT ... ON CONFLICT DO UPDATE ... RETURNING
// statement, so numbering is gapless and race-free over the HTTP driver
// (which has no multi-statement transactions).
export const salonCounters = pgTable(
  "salon_counters",
  {
    salonId: uuid("salon_id")
      .notNull()
      .references(() => salons.id, { onDelete: "cascade" }),
    key: text("key").notNull(), // job | quote | invoice
    year: integer("year").notNull(),
    value: integer("value").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.salonId, t.key, t.year] })],
);
