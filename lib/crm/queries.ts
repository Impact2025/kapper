import "server-only";
import { and, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { leads, crmActivities, emailMessages, users } from "@/lib/db/schema";
import type { LeadStage } from "@/lib/crm/constants";
import { env } from "@/lib/env";

export interface LeadListItem {
  id: string;
  salonName: string;
  email: string | null;
  city: string | null;
  stage: LeadStage;
  missedRevenueEstimate: number | null;
  createdAt: Date;
}

export interface LeadListFilters {
  stage?: LeadStage;
  search?: string;
  limit?: number;
}

export async function listLeads(filters: LeadListFilters = {}): Promise<LeadListItem[]> {
  if (!env.DATABASE_URL) return [];
  const conditions: SQL[] = [];
  if (filters.stage) conditions.push(eq(leads.stage, filters.stage));
  if (filters.search?.trim()) {
    const q = `%${filters.search.trim()}%`;
    const search = or(
      ilike(leads.salonName, q),
      ilike(leads.email, q),
      ilike(leads.city, q),
    );
    if (search) conditions.push(search);
  }

  return db
    .select({
      id: leads.id,
      salonName: leads.salonName,
      email: leads.email,
      city: leads.city,
      stage: leads.stage,
      missedRevenueEstimate: leads.missedRevenueEstimate,
      createdAt: leads.createdAt,
    })
    .from(leads)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(leads.createdAt))
    .limit(filters.limit ?? 200);
}

export interface LeadActivity {
  id: string;
  type: string;
  body: string | null;
  meta: Record<string, unknown> | null;
  createdAt: Date;
  userName: string | null;
}

export interface LeadEmail {
  id: string;
  direction: string;
  subject: string | null;
  toAddress: string;
  status: string | null;
  createdAt: Date;
}

export interface LeadDetail {
  id: string;
  salonName: string;
  url: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  stage: LeadStage;
  scanResult: Record<string, unknown> | null;
  missedRevenueEstimate: number | null;
  createdAt: Date;
  activities: LeadActivity[];
  emails: LeadEmail[];
}

export async function getLead(id: string): Promise<LeadDetail | null> {
  if (!env.DATABASE_URL) return null;

  const [leadRow] = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  if (!leadRow) return null;

  const [activities, emails] = await Promise.all([
    db
      .select({
        id: crmActivities.id,
        type: crmActivities.type,
        body: crmActivities.body,
        meta: crmActivities.meta,
        createdAt: crmActivities.createdAt,
        userName: users.name,
      })
      .from(crmActivities)
      .leftJoin(users, eq(crmActivities.userId, users.id))
      .where(eq(crmActivities.leadId, id))
      .orderBy(desc(crmActivities.createdAt)),
    db
      .select({
        id: emailMessages.id,
        direction: emailMessages.direction,
        subject: emailMessages.subject,
        toAddress: emailMessages.toAddress,
        status: emailMessages.status,
        createdAt: emailMessages.createdAt,
      })
      .from(emailMessages)
      .where(eq(emailMessages.leadId, id))
      .orderBy(desc(emailMessages.createdAt)),
  ]);

  return {
    id: leadRow.id,
    salonName: leadRow.salonName,
    url: leadRow.url,
    email: leadRow.email,
    phone: leadRow.phone,
    city: leadRow.city,
    stage: leadRow.stage,
    scanResult: leadRow.scanResult ?? null,
    missedRevenueEstimate: leadRow.missedRevenueEstimate,
    createdAt: leadRow.createdAt,
    activities,
    emails,
  };
}
