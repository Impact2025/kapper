import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { healthRecords, photos, treatmentCards } from "@/lib/db/schema";

export interface TreatmentCard {
  id: string;
  salonId: string;
  customerId: string;
  staffId: string | null;
  appointmentId: string | null;
  details: Record<string, unknown>;
  notes: string | null;
  createdAt: Date;
}

export async function listTreatmentCards(salonId: string, customerId: string): Promise<TreatmentCard[]> {
  return db
    .select()
    .from(treatmentCards)
    .where(and(eq(treatmentCards.salonId, salonId), eq(treatmentCards.customerId, customerId)))
    .orderBy(desc(treatmentCards.createdAt));
}

export async function addTreatmentCard(input: {
  salonId: string;
  customerId: string;
  staffId?: string | null;
  appointmentId?: string | null;
  details?: Record<string, unknown>;
  notes?: string | null;
}): Promise<TreatmentCard> {
  const [row] = await db
    .insert(treatmentCards)
    .values({
      salonId: input.salonId,
      customerId: input.customerId,
      staffId: input.staffId ?? null,
      appointmentId: input.appointmentId ?? null,
      details: input.details ?? {},
      notes: input.notes ?? null,
    })
    .returning();
  return row!;
}

export interface HealthRecord {
  id: string;
  salonId: string;
  customerId: string;
  allergies: string | null;
  scalpCondition: string | null;
  patchTestResult: string | null;
  patchTestAt: Date | null;
  consentGivenAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Callers MUST have already checked requireHealthRecordsAccess()
 * (lib/auth/dal.ts) — this function itself does not re-check the role flag,
 * it only enforces salon tenancy. Keeping the AVG-access gate in the caller
 * (a redirect, not a query filter) matches how requireSalonOwner already
 * gates every other salon query in this codebase.
 */
export async function listHealthRecords(salonId: string, customerId: string): Promise<HealthRecord[]> {
  return db
    .select()
    .from(healthRecords)
    .where(and(eq(healthRecords.salonId, salonId), eq(healthRecords.customerId, customerId)))
    .orderBy(desc(healthRecords.createdAt));
}

/** consentGivenAt is required at the type level — there is no code path that
 * can write a health record without an explicit opt-in timestamp. */
export async function addHealthRecord(input: {
  salonId: string;
  customerId: string;
  allergies?: string | null;
  scalpCondition?: string | null;
  patchTestResult?: string | null;
  patchTestAt?: Date | null;
  consentGivenAt: Date;
}): Promise<HealthRecord> {
  const [row] = await db
    .insert(healthRecords)
    .values({
      salonId: input.salonId,
      customerId: input.customerId,
      allergies: input.allergies ?? null,
      scalpCondition: input.scalpCondition ?? null,
      patchTestResult: input.patchTestResult ?? null,
      patchTestAt: input.patchTestAt ?? null,
      consentGivenAt: input.consentGivenAt,
    })
    .returning();
  return row!;
}

export interface Photo {
  id: string;
  salonId: string;
  customerId: string;
  blobUrl: string;
  type: "before" | "after";
  portfolioConsentAt: Date | null;
  createdAt: Date;
}

export async function listPhotos(salonId: string, customerId: string): Promise<Photo[]> {
  return db
    .select()
    .from(photos)
    .where(and(eq(photos.salonId, salonId), eq(photos.customerId, customerId)))
    .orderBy(desc(photos.createdAt));
}

export async function addPhoto(input: {
  salonId: string;
  customerId: string;
  blobUrl: string;
  type: "before" | "after";
  portfolioConsentAt?: Date | null;
}): Promise<Photo> {
  const [row] = await db
    .insert(photos)
    .values({
      salonId: input.salonId,
      customerId: input.customerId,
      blobUrl: input.blobUrl,
      type: input.type,
      portfolioConsentAt: input.portfolioConsentAt ?? null,
    })
    .returning();
  return row!;
}
