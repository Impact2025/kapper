"use server";

import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { locations, treatments, staff, staffLocations, staffTreatments, knowledgeEntries } from "@/lib/db/schema";
import { requireSalonOwner } from "@/lib/auth/dal";
import type { ActionState } from "@/lib/salon/actions";

const PATH = "/dashboard/praktijk";
const DOW = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

function buildWorkingHours(openHour: number, closeHour: number, saturdayOpen: boolean): Record<string, [number, number] | null> {
  const hours: Record<string, [number, number] | null> = {};
  for (const day of DOW) {
    if (day === "sun") hours[day] = null;
    else if (day === "sat") hours[day] = saturdayOpen ? [openHour, closeHour] : null;
    else hours[day] = [openHour, closeHour];
  }
  return hours;
}

/* ------------------------------- Locaties ------------------------------- */

const locationSchema = z.object({
  name: z.string().min(1).max(200),
  city: z.string().max(200),
  address: z.string().max(300),
  openHour: z.number().int().min(0).max(23),
  closeHour: z.number().int().min(1).max(24),
  saturdayOpen: z.boolean(),
});

export async function addLocation(_prev: ActionState | undefined, formData: FormData): Promise<ActionState> {
  const user = await requireSalonOwner();
  const parsed = locationSchema.safeParse({
    name: formData.get("name") ?? "",
    city: formData.get("city") ?? "",
    address: formData.get("address") ?? "",
    openHour: Number(formData.get("openHour") ?? 9),
    closeHour: Number(formData.get("closeHour") ?? 18),
    saturdayOpen: formData.get("saturdayOpen") === "true",
  });
  if (!parsed.success || parsed.data.openHour >= parsed.data.closeHour) {
    return { error: "Ongeldige invoer voor de locatie." };
  }

  await db.insert(locations).values({
    salonId: user.salonId,
    name: parsed.data.name,
    city: parsed.data.city || null,
    address: parsed.data.address || null,
    workingHours: buildWorkingHours(parsed.data.openHour, parsed.data.closeHour, parsed.data.saturdayOpen),
  });

  revalidatePath(PATH);
  return { success: true };
}

export async function deleteLocation(_prev: ActionState | undefined, formData: FormData): Promise<ActionState> {
  const user = await requireSalonOwner();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Ontbrekend id." };
  await db.delete(locations).where(and(eq(locations.id, id), eq(locations.salonId, user.salonId)));
  revalidatePath(PATH);
  return { success: true };
}

/* ---------------------------- Behandelingen ------------------------------ */

// Intelligent Double-Booking (Pro): the three phase fields are optional —
// leave them blank and the treatment stays one continuous durationMinutes
// block, exactly like before this feature existed.
const phaseMinutes = z
  .number()
  .int()
  .min(0)
  .max(480)
  .optional();

const treatmentSchema = z.object({
  name: z.string().min(1).max(200),
  category: z.string().max(100),
  durationMinutes: z.number().int().min(5).max(480),
  applicationMinutes: phaseMinutes,
  processingMinutes: phaseMinutes,
  finishingMinutes: phaseMinutes,
  priceEuros: z.number().min(0).max(10_000),
  description: z.string().max(2000),
  prepInfo: z.string().max(2000),
  aftercareInfo: z.string().max(2000),
});

function parseOptionalMinutes(formData: FormData, field: string): number | undefined {
  const raw = formData.get(field);
  if (raw === null || raw === "") return undefined;
  return Number(raw);
}

export async function addTreatment(_prev: ActionState | undefined, formData: FormData): Promise<ActionState> {
  const user = await requireSalonOwner();
  const parsed = treatmentSchema.safeParse({
    name: formData.get("name") ?? "",
    category: formData.get("category") ?? "",
    durationMinutes: Number(formData.get("durationMinutes") ?? 30),
    applicationMinutes: parseOptionalMinutes(formData, "applicationMinutes"),
    processingMinutes: parseOptionalMinutes(formData, "processingMinutes"),
    finishingMinutes: parseOptionalMinutes(formData, "finishingMinutes"),
    priceEuros: Number(formData.get("priceEuros") ?? 0),
    description: formData.get("description") ?? "",
    prepInfo: formData.get("prepInfo") ?? "",
    aftercareInfo: formData.get("aftercareInfo") ?? "",
  });
  if (!parsed.success) return { error: "Ongeldige invoer voor de behandeling." };

  await db.insert(treatments).values({
    salonId: user.salonId,
    name: parsed.data.name,
    category: parsed.data.category || null,
    durationMinutes: parsed.data.durationMinutes,
    applicationMinutes: parsed.data.applicationMinutes ?? null,
    processingMinutes: parsed.data.processingMinutes ?? null,
    finishingMinutes: parsed.data.finishingMinutes ?? null,
    priceCents: Math.round(parsed.data.priceEuros * 100),
    description: parsed.data.description || null,
    prepInfo: parsed.data.prepInfo || null,
    aftercareInfo: parsed.data.aftercareInfo || null,
  });

  revalidatePath(PATH);
  return { success: true };
}

export async function deleteTreatment(_prev: ActionState | undefined, formData: FormData): Promise<ActionState> {
  const user = await requireSalonOwner();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Ontbrekend id." };
  await db.delete(treatments).where(and(eq(treatments.id, id), eq(treatments.salonId, user.salonId)));
  revalidatePath(PATH);
  return { success: true };
}

/* --------------------------------- Team ---------------------------------- */

const staffSchema = z.object({
  name: z.string().min(1).max(200),
  role: z.string().max(100),
});

export async function addStaff(_prev: ActionState | undefined, formData: FormData): Promise<ActionState> {
  const user = await requireSalonOwner();
  const parsed = staffSchema.safeParse({
    name: formData.get("name") ?? "",
    role: formData.get("role") ?? "",
  });
  if (!parsed.success) return { error: "Ongeldige invoer voor de behandelaar." };

  await db.insert(staff).values({
    salonId: user.salonId,
    name: parsed.data.name,
    role: parsed.data.role || null,
  });

  revalidatePath(PATH);
  return { success: true };
}

export async function deleteStaff(_prev: ActionState | undefined, formData: FormData): Promise<ActionState> {
  const user = await requireSalonOwner();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Ontbrekend id." };
  await db.delete(staff).where(and(eq(staff.id, id), eq(staff.salonId, user.salonId)));
  revalidatePath(PATH);
  return { success: true };
}

/** Replaces which locations/treatments one team member is bevoegd for. */
export async function updateStaffAssignments(_prev: ActionState | undefined, formData: FormData): Promise<ActionState> {
  const user = await requireSalonOwner();
  const staffId = String(formData.get("staffId") ?? "");
  if (!staffId) return { error: "Ontbrekend id." };

  const [owned] = await db.select({ id: staff.id }).from(staff).where(and(eq(staff.id, staffId), eq(staff.salonId, user.salonId))).limit(1);
  if (!owned) return { error: "Onbekende behandelaar." };

  const locationIds = formData.getAll("locationIds").map(String).filter(Boolean);
  const treatmentIds = formData.getAll("treatmentIds").map(String).filter(Boolean);

  await db.delete(staffLocations).where(eq(staffLocations.staffId, staffId));
  await db.delete(staffTreatments).where(eq(staffTreatments.staffId, staffId));
  if (locationIds.length) {
    await db.insert(staffLocations).values(locationIds.map((locationId) => ({ staffId, locationId })));
  }
  if (treatmentIds.length) {
    await db.insert(staffTreatments).values(treatmentIds.map((treatmentId) => ({ staffId, treatmentId })));
  }

  revalidatePath(PATH);
  return { success: true };
}

/* ------------------------------ Kennisbank -------------------------------- */

const knowledgeSchema = z.object({
  title: z.string().min(1).max(200),
  category: z.string().max(100),
  content: z.string().min(1).max(4000),
});

export async function addKnowledgeEntry(_prev: ActionState | undefined, formData: FormData): Promise<ActionState> {
  const user = await requireSalonOwner();
  const parsed = knowledgeSchema.safeParse({
    title: formData.get("title") ?? "",
    category: formData.get("category") ?? "",
    content: formData.get("content") ?? "",
  });
  if (!parsed.success) return { error: "Ongeldige invoer voor het kennisbank-item." };

  await db.insert(knowledgeEntries).values({
    salonId: user.salonId,
    title: parsed.data.title,
    category: parsed.data.category || null,
    content: parsed.data.content,
  });

  revalidatePath(PATH);
  return { success: true };
}

export async function deleteKnowledgeEntry(_prev: ActionState | undefined, formData: FormData): Promise<ActionState> {
  const user = await requireSalonOwner();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Ontbrekend id." };
  await db.delete(knowledgeEntries).where(and(eq(knowledgeEntries.id, id), eq(knowledgeEntries.salonId, user.salonId)));
  revalidatePath(PATH);
  return { success: true };
}
