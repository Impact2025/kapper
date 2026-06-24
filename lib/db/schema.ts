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
  settings: jsonb("settings").$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
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
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
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
    authorId: uuid("author_id").references(() => users.id, { onDelete: "set null" }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("blog_status_idx").on(t.status)],
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
