"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { salons } from "@/lib/db/schema";
import { requireSalonOwner } from "@/lib/auth/dal";
import { env } from "@/lib/env";

export interface ActionState {
  success?: boolean;
  error?: string;
}

const noShowSchema = z.object({
  enabled: z.boolean(),
  freeCancelHours: z.number().int().min(0).max(168),
  chargePercent: z.number().int().min(0).max(100),
  depositRequired: z.boolean(),
  depositCents: z.number().int().min(0).max(100_000),
  reminderHours: z.array(z.number().int().min(1).max(168)),
});

export async function updateNoShowPolicy(
  _prev: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireSalonOwner();
  if (!env.DATABASE_URL) return { error: "Database niet geconfigureerd." };

  const parsed = noShowSchema.safeParse({
    enabled: formData.get("enabled") === "true",
    freeCancelHours: Number(formData.get("freeCancelHours") ?? 24),
    chargePercent: Number(formData.get("chargePercent") ?? 100),
    depositRequired: formData.get("depositRequired") === "true",
    // Input is in euros; store in cents
    depositCents: Math.round(Number(formData.get("depositEuros") ?? 0) * 100),
    reminderHours: formData.getAll("reminderHours").map(Number).filter(Boolean),
  });

  if (!parsed.success) return { error: "Ongeldige invoer." };

  await db
    .update(salons)
    .set({
      settings: sql`${salons.settings} || jsonb_build_object('noShow', ${JSON.stringify(parsed.data)}::jsonb)`,
    })
    .where(eq(salons.id, user.salonId));

  revalidatePath("/dashboard/no-show");
  return { success: true };
}

const integrationSchema = z.object({
  agendaProvider: z.enum(["salonized", "phorest", "treatwell", "acuity", ""]),
  agendaApiKey: z.string().max(500),
  watiApiKey: z.string().max(500),
  phoneNumber: z.string().max(30),
});

export async function updateIntegrations(
  _prev: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireSalonOwner();
  if (!env.DATABASE_URL) return { error: "Database niet geconfigureerd." };

  const parsed = integrationSchema.safeParse({
    agendaProvider: formData.get("agendaProvider") ?? "",
    agendaApiKey: formData.get("agendaApiKey") ?? "",
    watiApiKey: formData.get("watiApiKey") ?? "",
    phoneNumber: formData.get("phoneNumber") ?? "",
  });

  if (!parsed.success) return { error: "Ongeldige invoer." };

  const { agendaProvider, agendaApiKey, watiApiKey, phoneNumber } = parsed.data;

  const aiSettings = {
    whatsappEnabled: !!watiApiKey,
    phoneEnabled: !!phoneNumber,
    watiApiKey: watiApiKey || null,
    phoneNumber: phoneNumber || null,
    agendaApiKey: agendaApiKey || null,
  };

  await db
    .update(salons)
    .set({
      agendaProvider: agendaProvider || null,
      settings: sql`${salons.settings} || jsonb_build_object('ai', ${JSON.stringify(aiSettings)}::jsonb)`,
    })
    .where(eq(salons.id, user.salonId));

  revalidatePath("/dashboard/integraties");
  return { success: true };
}
