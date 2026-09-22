import {
  pgTable,
  pgEnum,
  uuid,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  jsonb,
  primaryKey,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/* ============================ Enums ============================ */
export const roleEnum = pgEnum("role", ["admin", "owner"]);
export const planEnum = pgEnum("plan", ["essential", "pro", "elite"]);
export const salonStatusEnum = pgEnum("salon_status", [
  "trial",
  "active",
  "past_due",
  "canceled",
]);
export const leadStageEnum = pgEnum("lead_stage", [
  "new",
  "qualified",
  "pilot",
  "customer",
  "lost",
]);
export const activityTypeEnum = pgEnum("activity_type", [
  "note",
  "email",
  "call",
  "stage_change",
  "scan",
]);
export const mailDirectionEnum = pgEnum("mail_direction", ["outbound", "inbound"]);
export const postStatusEnum = pgEnum("post_status", ["draft", "review", "published"]);
export const couponTypeEnum = pgEnum("coupon_type", ["percent", "fixed", "trial"]);
export const reportPeriodEnum = pgEnum("report_period", ["daily", "monthly"]);
export const inventoryMovementTypeEnum = pgEnum("inventory_movement_type", [
  "restock",
  "sale",
  "adjustment",
]);
export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "paid",
  "fulfilled",
  "canceled",
]);

/* ============================ Auth / Users ============================ */
export const salons = pgTable("salons", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  plan: planEnum("plan").default("essential").notNull(),
  status: salonStatusEnum("status").default("trial").notNull(),
  mrr: integer("mrr").default(0).notNull(), // in euro cents
  agendaProvider: text("agenda_provider"), // salonized | phorest | treatwell | acuity
  city: text("city"),
  phone: text("phone"),
  // Fase 7 core/vertical-scheiding: keys into lib/salon/vertical.ts's
  // registry (terms, btw-defaults, system-prompt variant). "kapper" for
  // every salon today; a second vertical (e.g. "loodgieter") reuses this
  // same core unchanged.
  vertical: text("vertical").default("kapper").notNull(),
  settings: jsonb("settings").$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
});

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  // Self-hosted credentials auth (scrypt). Null for OAuth-only accounts.
  passwordHash: text("password_hash"),
  emailVerified: timestamp("email_verified", { withTimezone: true }),
  image: text("image"),
  role: roleEnum("role").default("owner").notNull(),
  salonId: uuid("salon_id").references(() => salons.id, { onDelete: "set null" }),
  // Artikel 9 AVG: health_records (allergieën, patch-tests, hoofdhuidcondities)
  // require an explicit, stronger-gated role flag — not every owner/admin
  // login should see this by default. Defaults true for today's sole
  // per-salon login (the owner); a future per-stylist login can default it
  // false and let the owner grant it per person.
  canAccessHealthRecords: boolean("can_access_health_records").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
});

// Auth.js adapter tables
export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })],
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { withTimezone: true }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { withTimezone: true }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

/* ============================ CRM ============================ */
export const leads = pgTable(
  "leads",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    salonName: text("salon_name").notNull(),
    url: text("url"),
    email: text("email"),
    phone: text("phone"),
    city: text("city"),
    stage: leadStageEnum("stage").default("new").notNull(),
    scanResult: jsonb("scan_result").$type<Record<string, unknown>>(),
    missedRevenueEstimate: integer("missed_revenue_estimate"), // euro/month
    ownerId: uuid("owner_id").references(() => users.id, { onDelete: "set null" }),
    salonId: uuid("salon_id").references(() => salons.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("leads_stage_idx").on(t.stage)],
);

export const crmActivities = pgTable("crm_activities", {
  id: uuid("id").defaultRandom().primaryKey(),
  leadId: uuid("lead_id")
    .notNull()
    .references(() => leads.id, { onDelete: "cascade" }),
  type: activityTypeEnum("type").notNull(),
  body: text("body"),
  meta: jsonb("meta").$type<Record<string, unknown>>(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/* ============================ Mail ============================ */
export const emailTemplates = pgTable("email_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  html: text("html").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const emailMessages = pgTable("email_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  leadId: uuid("lead_id").references(() => leads.id, { onDelete: "cascade" }),
  direction: mailDirectionEnum("direction").notNull(),
  toAddress: text("to_address").notNull(),
  fromAddress: text("from_address").notNull(),
  subject: text("subject"),
  html: text("html"),
  resendId: text("resend_id"),
  status: text("status").default("sent"),
  openedAt: timestamp("opened_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/* ============================ Blog / SEO ============================ */
export const blogPosts = pgTable(
  "blog_posts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    status: postStatusEnum("status").default("draft").notNull(),
    excerpt: text("excerpt"),
    bodyMdx: text("body_mdx").notNull().default(""),
    metaTitle: varchar("meta_title", { length: 70 }),
    metaDescription: varchar("meta_description", { length: 170 }),
    keywords: jsonb("keywords").$type<string[]>().default([]).notNull(),
    internalLinks: jsonb("internal_links").$type<string[]>().default([]).notNull(),
    externalLinks: jsonb("external_links").$type<string[]>().default([]).notNull(),
    jsonLd: jsonb("json_ld").$type<Record<string, unknown>>(),
    seoScore: integer("seo_score").default(0).notNull(),
    coverImage: text("cover_image"),
    coverImageAlt: text("cover_image_alt"),
    audioUrl: text("audio_url"),
    audioTitle: text("audio_title"),
    audioDurationSeconds: integer("audio_duration_seconds"),
    transcript: text("transcript"),
    // true for posts pushed in by the AgentOS publish pipeline (body is
    // pre-rendered HTML from a reviewed, non-user-facing source) instead of
    // the admin editor's Markdown.
    bodyIsHtml: boolean("body_is_html").default(false).notNull(),
    authorId: uuid("author_id").references(() => users.id, { onDelete: "set null" }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("blog_status_idx").on(t.status)],
);

export const knowledgePosts = pgTable(
  "knowledge_posts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    status: postStatusEnum("status").default("draft").notNull(),
    excerpt: text("excerpt"),
    bodyMdx: text("body_mdx").notNull().default(""),
    bodyIsHtml: boolean("body_is_html").default(false).notNull(),
    metaTitle: varchar("meta_title", { length: 70 }),
    metaDescription: varchar("meta_description", { length: 170 }),
    keywords: jsonb("keywords").$type<string[]>().default([]).notNull(),
    internalLinks: jsonb("internal_links").$type<string[]>().default([]).notNull(),
    externalLinks: jsonb("external_links").$type<string[]>().default([]).notNull(),
    jsonLd: jsonb("json_ld").$type<Record<string, unknown>>(),
    seoScore: integer("seo_score").default(0).notNull(),
    coverImage: text("cover_image"),
    coverImageAlt: text("cover_image_alt"),
    // kennisbank onderwerpscategorie (bv. "Techniek", "Hoofdhuid", "Producten",
    // "Aftercare", "Inwerktijd", "Balayage", "Kleurcorrectie")
    category: text("category"),
    authorId: uuid("author_id").references(() => users.id, { onDelete: "set null" }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("knowledge_status_idx").on(t.status),
    index("knowledge_category_idx").on(t.category),
  ],
);

/* ============================ Coupons & Billing ============================ */
export const coupons = pgTable("coupons", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull().unique(),
  type: couponTypeEnum("type").notNull(),
  value: integer("value").notNull(), // percent (0-100), euro cents, or trial days
  maxRedemptions: integer("max_redemptions"),
  redeemed: integer("redeemed").default(0).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  stripeCouponId: text("stripe_coupon_id"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const couponRedemptions = pgTable("coupon_redemptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  couponId: uuid("coupon_id")
    .notNull()
    .references(() => coupons.id, { onDelete: "cascade" }),
  salonId: uuid("salon_id").references(() => salons.id, { onDelete: "set null" }),
  redeemedAt: timestamp("redeemed_at", { withTimezone: true }).defaultNow().notNull(),
});

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  salonId: uuid("salon_id")
    .notNull()
    .references(() => salons.id, { onDelete: "cascade" }),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubId: text("stripe_sub_id"),
  plan: planEnum("plan").notNull(),
  status: text("status").notNull(),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/* ============================ AI Receptionist ============================ */
export const conversationChannelEnum = pgEnum("conversation_channel", ["whatsapp", "phone"]);
export const conversationStatusEnum = pgEnum("conversation_status", [
  "active",
  "closed",
  "transferred",
  "escalated",
]);
export const messageRoleEnum = pgEnum("message_role", ["user", "assistant"]);
export const appointmentStatusEnum = pgEnum("appointment_status", [
  // Fase 2: a deposit checkout session is open — the slot is held (every
  // non-cancelled status already counts as occupied in availability.ts) but
  // not yet a Middelburg-norm pending_confirmation until Stripe confirms
  // payment (see lib/payments-policy and the stripe webhook).
  "pending_deposit",
  "pending_confirmation",
  "confirmed",
  "completed",
  "no_show",
  "cancelled",
]);
export const appointmentSourceEnum = pgEnum("appointment_source", [
  "ai_whatsapp",
  "ai_phone",
  "manual",
]);

/* ============================ Customers (salon's own end-customers) ============================ */
// The sector-neutral customer entity — distinct from `leads` (the SaaS's own
// B2B sales pipeline of prospective salons). appointments/orders keep their
// denormalized customerName/customerPhone for backward compatibility and are
// backfilled to point customerId here (see 0011 migration).
export const customers = pgTable(
  "customers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    salonId: uuid("salon_id")
      .notNull()
      .references(() => salons.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    phone: text("phone").notNull(), // normalized, unique per salon
    email: text("email"),
    birthDate: timestamp("birth_date", { withTimezone: true }),
    source: appointmentSourceEnum("source").notNull().default("manual"),
    marketingOptIn: boolean("marketing_opt_in").default(false).notNull(),
    // Three-strikes no-show policy (Fase 2): coulance on the first no-show,
    // online AI booking blocked from the second onward until the salon
    // owner manually lifts it — see lib/payments-policy/queries.ts.
    noShowCount: integer("no_show_count").default(0).notNull(),
    blockedFromOnlineBooking: boolean("blocked_from_online_booking").default(false).notNull(),
    // Fase 5 — Elite-only loyaliteitspunten (running balance; the full
    // mutation log lives in loyaltyMutations below). 1 point per €10 spent
    // via the kassa, awarded in lib/loyalty/queries.ts.
    loyaltyPoints: integer("loyalty_points").default(0).notNull(),
    // Fase 5 — Client ReConnect: when a reactivation WhatsApp message was
    // last sent, so the retention cron doesn't nag the same customer every
    // run once they've gone quiet.
    lastRetentionSentAt: timestamp("last_retention_sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
  },
  (t) => [uniqueIndex("customers_salon_phone_idx").on(t.salonId, t.phone)],
);

export const photoTypeEnum = pgEnum("photo_type", ["before", "after"]);

/* ============================ Dossier (Artikel 9 AVG) ============================ */
// Kleurrecepten/kniptechnieken — ordinary treatment history, no special AVG
// category. Kept in its own table (not folded into `customers`) because it's
// per-visit, not per-customer.
export const treatmentCards = pgTable(
  "treatment_cards",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    salonId: uuid("salon_id")
      .notNull()
      .references(() => salons.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    staffId: uuid("staff_id").references(() => staff.id, { onDelete: "set null" }),
    appointmentId: uuid("appointment_id").references(() => appointments.id, { onDelete: "set null" }),
    // { colorFormula, mixRatio, technique, ... } — free-form per salon/vertical.
    details: jsonb("details").$type<Record<string, unknown>>().default({}).notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("treatment_cards_customer_idx").on(t.customerId)],
);

// Artikel 9 AVG special-category data — deliberately its own table so access
// can be gated separately from ordinary customer/treatment data (see
// users.canAccessHealthRecords and lib/dossier/queries.ts). Never written
// without consentGivenAt: the compliance guard in lib/ai/manager.ts also
// blocks the AI from ever writing to this table directly over WhatsApp.
export const healthRecords = pgTable(
  "health_records",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    salonId: uuid("salon_id")
      .notNull()
      .references(() => salons.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    allergies: text("allergies"),
    scalpCondition: text("scalp_condition"),
    patchTestResult: text("patch_test_result"),
    patchTestAt: timestamp("patch_test_at", { withTimezone: true }),
    consentGivenAt: timestamp("consent_given_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
  },
  (t) => [index("health_records_customer_idx").on(t.customerId)],
);

export const photos = pgTable(
  "photos",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    salonId: uuid("salon_id")
      .notNull()
      .references(() => salons.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    blobUrl: text("blob_url").notNull(),
    type: photoTypeEnum("type").notNull(),
    // Portfolio use (website/socials) is a separate, broader consent from
    // simply keeping the photo in the dossier for aftercare comparison.
    portfolioConsentAt: timestamp("portfolio_consent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("photos_customer_idx").on(t.customerId)],
);

// Fase 5 — Elite loyaliteitspunten audit log. customers.loyaltyPoints is the
// running balance; every award/redemption gets a row here so the balance is
// always explainable (matches the agent_runs pattern: a denormalized counter
// plus a full log, never just the counter).
export const loyaltyMutations = pgTable(
  "loyalty_mutations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    salonId: uuid("salon_id")
      .notNull()
      .references(() => salons.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    delta: integer("delta").notNull(),
    reason: text("reason").notNull(),
    orderId: uuid("order_id").references(() => orders.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("loyalty_mutations_customer_idx").on(t.customerId)],
);

/* ============================ Praktijk (locaties, behandelingen, team) ============================ */
export const locations = pgTable(
  "locations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    salonId: uuid("salon_id")
      .notNull()
      .references(() => salons.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    city: text("city"),
    address: text("address"),
    // { mon: [9,18], tue: [9,18], ..., sun: null } — null = gesloten
    workingHours: jsonb("working_hours").$type<Record<string, [number, number] | null>>().notNull(),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("locations_salon_idx").on(t.salonId)],
);

export const treatments = pgTable(
  "treatments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    salonId: uuid("salon_id")
      .notNull()
      .references(() => salons.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    category: text("category"),
    durationMinutes: integer("duration_minutes").notNull().default(30),
    // Intelligent Double-Booking (Pro): optional phase breakdown for
    // treatments with a processing/inwerktijd window (e.g. hair color) where
    // the stylist is free for another client. When set, application +
    // processing + finishing should add up to durationMinutes; when null,
    // the treatment is treated as one continuous block of durationMinutes.
    applicationMinutes: integer("application_minutes"),
    processingMinutes: integer("processing_minutes"),
    finishingMinutes: integer("finishing_minutes"),
    priceCents: integer("price_cents").notNull().default(0),
    description: text("description"),
    prepInfo: text("prep_info"),
    aftercareInfo: text("aftercare_info"),
    // NL btw-tarief: 9% op behandelingen (dienst), 21% op producten — see
    // lib/salon/vertical.ts KAPPER_VERTICAL.vatRates for the same default.
    vatRatePercent: integer("vat_rate_percent").notNull().default(9),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("treatments_salon_idx").on(t.salonId)],
);

export const staff = pgTable(
  "staff",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    salonId: uuid("salon_id")
      .notNull()
      .references(() => salons.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    role: text("role"),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("staff_salon_idx").on(t.salonId)],
);

export const staffLocations = pgTable(
  "staff_locations",
  {
    staffId: uuid("staff_id")
      .notNull()
      .references(() => staff.id, { onDelete: "cascade" }),
    locationId: uuid("location_id")
      .notNull()
      .references(() => locations.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.staffId, t.locationId] })],
);

export const staffTreatments = pgTable(
  "staff_treatments",
  {
    staffId: uuid("staff_id")
      .notNull()
      .references(() => staff.id, { onDelete: "cascade" }),
    treatmentId: uuid("treatment_id")
      .notNull()
      .references(() => treatments.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.staffId, t.treatmentId] })],
);

export const knowledgeEntries = pgTable(
  "knowledge_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    salonId: uuid("salon_id")
      .notNull()
      .references(() => salons.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    content: text("content").notNull(),
    category: text("category"),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
  },
  (t) => [index("knowledge_salon_idx").on(t.salonId)],
);

export const conversations = pgTable("conversations", {
  id: uuid("id").defaultRandom().primaryKey(),
  salonId: uuid("salon_id")
    .notNull()
    .references(() => salons.id, { onDelete: "cascade" }),
  channel: conversationChannelEnum("channel").notNull(),
  externalId: text("external_id"), // WATI conversation ID or Vapi call ID
  phoneNumber: text("phone_number"), // normalized E.164
  customerName: text("customer_name"),
  status: conversationStatusEnum("status").default("active").notNull(),
  // Fase 4 human-in-the-loop dashboard: why the AI handed off, set together
  // with status: "escalated" so a stylist can triage without re-reading the
  // whole transcript.
  escalationReason: text("escalation_reason"),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
  closedAt: timestamp("closed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
});

export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  role: messageRoleEnum("role").notNull(),
  content: text("content").notNull(),
  // Fase 4 multimodale input: set when the customer sent a photo (kapsel-
  // inspiratie, huidige haarkleur, uitgroei) alongside/instead of text.
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// One row per AI-manager-routed conversation turn — doubles as the Artikel
// 50 EU AI Act audit trail (which agent handled what) and the basis for the
// Artikel 17 right-to-erasure purge routine (Fase 6).
export const agentRuns = pgTable(
  "agent_runs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    salonId: uuid("salon_id")
      .notNull()
      .references(() => salons.id, { onDelete: "cascade" }),
    conversationId: uuid("conversation_id").references(() => conversations.id, { onDelete: "set null" }),
    channel: conversationChannelEnum("channel").notNull(),
    // Free text, not an enum: new agents (pos, retention, ...) are added per
    // phase and shouldn't need an ALTER TYPE migration each time.
    agent: text("agent").notNull(),
    guardTriggered: boolean("guard_triggered").default(false).notNull(),
    escalated: boolean("escalated").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("agent_runs_salon_idx").on(t.salonId)],
);

export const appointments = pgTable(
  "appointments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    salonId: uuid("salon_id")
      .notNull()
      .references(() => salons.id, { onDelete: "cascade" }),
    conversationId: uuid("conversation_id").references(() => conversations.id, {
      onDelete: "set null",
    }),
    externalId: text("external_id"), // ID in the agenda provider
    agendaProvider: text("agenda_provider").notNull(),
    locationId: uuid("location_id").references(() => locations.id, { onDelete: "set null" }),
    staffId: uuid("staff_id").references(() => staff.id, { onDelete: "set null" }),
    treatmentId: uuid("treatment_id").references(() => treatments.id, { onDelete: "set null" }),
    customerId: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
    customerName: text("customer_name").notNull(),
    customerPhone: text("customer_phone").notNull(),
    serviceType: text("service_type").notNull(),
    appointmentTime: timestamp("appointment_time", { withTimezone: true }).notNull(),
    durationMinutes: integer("duration_minutes").notNull().default(30),
    status: appointmentStatusEnum("status").default("pending_confirmation").notNull(),
    source: appointmentSourceEnum("source").notNull(),
    reminderSentAt: timestamp("reminder_sent_at", { withTimezone: true }),
    // Fase 5 — reviewbeheer: set once a review-request WhatsApp message has
    // been sent for this appointment, so the reviews cron never asks twice.
    reviewRequestedAt: timestamp("review_requested_at", { withTimezone: true }),
    // Middelburg-norm: appointment is not enforceable against the customer
    // until they explicitly accept the cancellation policy.
    policyAcceptedAt: timestamp("policy_accepted_at", { withTimezone: true }),
    confirmationChannel: text("confirmation_channel"), // 'whatsapp_button' | 'sms_link' | 'voice_otp'
    cancellationDeadline: timestamp("cancellation_deadline", { withTimezone: true }),
    // Fase 2 vooruitbetalingen — set together when a deposit is required;
    // depositPaidAt is filled in by the Stripe webhook once payment lands.
    depositAmountCents: integer("deposit_amount_cents"),
    stripeDepositSessionId: text("stripe_deposit_session_id").unique(),
    depositPaidAt: timestamp("deposit_paid_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("appointments_salon_time_idx").on(t.salonId, t.appointmentTime),
    index("appointments_status_idx").on(t.status),
  ],
);

/* ============================ Webwinkel (Pro) ============================ */
export const products = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    salonId: uuid("salon_id")
      .notNull()
      .references(() => salons.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    sku: text("sku"),
    category: text("category"),
    priceCents: integer("price_cents").notNull().default(0),
    imageUrl: text("image_url"),
    stockQuantity: integer("stock_quantity").notNull().default(0),
    lowStockThreshold: integer("low_stock_threshold").notNull().default(5),
    // NL btw-tarief: 21% op producten (goederen), 9% op behandelingen.
    vatRatePercent: integer("vat_rate_percent").notNull().default(21),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
  },
  (t) => [index("products_salon_idx").on(t.salonId)],
);

export const inventoryMovements = pgTable(
  "inventory_movements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    salonId: uuid("salon_id")
      .notNull()
      .references(() => salons.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    type: inventoryMovementTypeEnum("type").notNull(),
    quantityDelta: integer("quantity_delta").notNull(), // positive = in, negative = out
    reason: text("reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("inventory_movements_product_idx").on(t.productId)],
);

export const orderChannelEnum = pgEnum("order_channel", ["webshop", "pos"]);
export const paymentMethodEnum = pgEnum("payment_method", ["cash", "pin", "card"]);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    salonId: uuid("salon_id")
      .notNull()
      .references(() => salons.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
    customerName: text("customer_name").notNull(),
    // Nullable: a chair-side POS sale (channel: "pos") rarely collects an
    // email, unlike a webshop checkout which requires one.
    customerEmail: text("customer_email"),
    customerPhone: text("customer_phone"),
    status: orderStatusEnum("status").default("pending").notNull(),
    channel: orderChannelEnum("channel").default("webshop").notNull(),
    paymentMethod: paymentMethodEnum("payment_method"),
    tipCents: integer("tip_cents").default(0).notNull(),
    totalCents: integer("total_cents").notNull().default(0),
    stripeSessionId: text("stripe_session_id").unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
  },
  (t) => [index("orders_salon_idx").on(t.salonId)],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    // set null on product/treatment delete so past orders keep their history.
    // Exactly one of the two is set for a POS sale; both are null for a
    // webshop order (product-only historically, but kept nullable to match).
    productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
    treatmentId: uuid("treatment_id").references(() => treatments.id, { onDelete: "set null" }),
    productName: text("product_name").notNull(),
    unitPriceCents: integer("unit_price_cents").notNull(),
    quantity: integer("quantity").notNull(),
    // Snapshotted at sale time — accounting must reflect the rate that
    // applied then, even if the salon changes vatRatePercent later.
    vatRatePercent: integer("vat_rate_percent").notNull().default(21),
  },
  (t) => [index("order_items_order_idx").on(t.orderId)],
);

/* ============================ Analytics & Reports ============================ */
export const events = pgTable(
  "events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    type: text("type").notNull(),
    salonId: uuid("salon_id").references(() => salons.id, { onDelete: "cascade" }),
    props: jsonb("props").$type<Record<string, unknown>>().default({}).notNull(),
    // idempotency for external (n8n) webhook events
    dedupeKey: text("dedupe_key").unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("events_type_idx").on(t.type)],
);

export const reports = pgTable("reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  period: reportPeriodEnum("period").notNull(),
  periodKey: text("period_key").notNull(), // e.g. 2026-06-21 or 2026-06
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
  summary: text("summary"),
  sentAt: timestamp("sent_at", { withTimezone: true }).defaultNow().notNull(),
});
