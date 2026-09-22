"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSalonOwner, requireHealthRecordsAccess } from "@/lib/auth/dal";
import { addTreatmentCard, addHealthRecord, addPhoto } from "@/lib/dossier/queries";
import type { ActionState } from "@/lib/salon/actions";

function customerPath(customerId: string): string {
  return `/dashboard/klanten/${customerId}`;
}

const treatmentCardSchema = z.object({
  customerId: z.string().uuid(),
  staffId: z.string().uuid().optional(),
  appointmentId: z.string().uuid().optional(),
  colorFormula: z.string().max(500).optional(),
  mixRatio: z.string().max(200).optional(),
  technique: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
});

export async function addTreatmentCardAction(
  _prev: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireSalonOwner();
  const parsed = treatmentCardSchema.safeParse({
    customerId: formData.get("customerId") ?? "",
    staffId: formData.get("staffId") || undefined,
    appointmentId: formData.get("appointmentId") || undefined,
    colorFormula: formData.get("colorFormula") || undefined,
    mixRatio: formData.get("mixRatio") || undefined,
    technique: formData.get("technique") || undefined,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) return { error: "Ongeldige behandelkaart-invoer." };

  const { customerId, staffId, appointmentId, notes, ...details } = parsed.data;
  await addTreatmentCard({
    salonId: user.salonId,
    customerId,
    staffId: staffId ?? null,
    appointmentId: appointmentId ?? null,
    details,
    notes: notes ?? null,
  });

  revalidatePath(customerPath(customerId));
  return { success: true };
}

const healthRecordSchema = z.object({
  customerId: z.string().uuid(),
  allergies: z.string().max(1000).optional(),
  scalpCondition: z.string().max(1000).optional(),
  patchTestResult: z.string().max(500).optional(),
  patchTestAt: z.string().optional(),
  // Artikel 9 AVG: the salon must record an explicit "klant gaat akkoord"
  // moment — this checkbox is that moment, not an implicit default.
  consentConfirmed: z.literal("true"),
});

export async function addHealthRecordAction(
  _prev: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireHealthRecordsAccess();
  const parsed = healthRecordSchema.safeParse({
    customerId: formData.get("customerId") ?? "",
    allergies: formData.get("allergies") || undefined,
    scalpCondition: formData.get("scalpCondition") || undefined,
    patchTestResult: formData.get("patchTestResult") || undefined,
    patchTestAt: formData.get("patchTestAt") || undefined,
    consentConfirmed: formData.get("consentConfirmed") ?? "",
  });
  if (!parsed.success) {
    return { error: "Ongeldige invoer — bevestig expliciet toestemming van de klant." };
  }

  await addHealthRecord({
    salonId: user.salonId,
    customerId: parsed.data.customerId,
    allergies: parsed.data.allergies ?? null,
    scalpCondition: parsed.data.scalpCondition ?? null,
    patchTestResult: parsed.data.patchTestResult ?? null,
    patchTestAt: parsed.data.patchTestAt ? new Date(parsed.data.patchTestAt) : null,
    consentGivenAt: new Date(),
  });

  revalidatePath(customerPath(parsed.data.customerId));
  return { success: true };
}

const photoSchema = z.object({
  customerId: z.string().uuid(),
  blobUrl: z.string().url(),
  type: z.enum(["before", "after"]),
  portfolioConsentConfirmed: z.literal("true").optional(),
});

export async function addPhotoAction(_prev: ActionState | undefined, formData: FormData): Promise<ActionState> {
  const user = await requireSalonOwner();
  const parsed = photoSchema.safeParse({
    customerId: formData.get("customerId") ?? "",
    blobUrl: formData.get("blobUrl") ?? "",
    type: formData.get("type") ?? "",
    portfolioConsentConfirmed: formData.get("portfolioConsentConfirmed") || undefined,
  });
  if (!parsed.success) return { error: "Ongeldige foto-invoer." };

  await addPhoto({
    salonId: user.salonId,
    customerId: parsed.data.customerId,
    blobUrl: parsed.data.blobUrl,
    type: parsed.data.type,
    portfolioConsentAt: parsed.data.portfolioConsentConfirmed ? new Date() : null,
  });

  revalidatePath(customerPath(parsed.data.customerId));
  return { success: true };
}
