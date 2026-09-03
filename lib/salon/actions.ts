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
  agendaEmail: z.string().max(320),
  agendaPassword: z.string().max(500),
  agendaBusinessId: z.string().max(100),
  agendaBranchId: z.string().max(100),
  agendaRegion: z.enum(["eu", "us", ""]),
  watiApiKey: z.string().max(500),
  vapiApiKey: z.string().max(500),
  phoneNumber: z.string().max(30),
});

/**
 * The password field is never round-tripped to the client (it's rendered
 * blank on every page load), so a resubmit that didn't retype it should
 * reuse whatever password is already stored, not silently wipe it.
 */
async function recoverStoredPassword(salonId: string): Promise<string> {
  const { decrypt } = await import("@/lib/crypto");
  const [current] = await db
    .select({ settings: salons.settings })
    .from(salons)
    .where(eq(salons.id, salonId))
    .limit(1);
  const existingKey = (current?.settings?.ai as Record<string, unknown> | undefined)?.agendaApiKey;
  if (typeof existingKey !== "string") return "";
  try {
    const decrypted = decrypt(existingKey) ?? "";
    return (JSON.parse(decrypted) as { password?: string }).password ?? "";
  } catch {
    return "";
  }
}

export async function updateIntegrations(
  _prev: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireSalonOwner();
  if (!env.DATABASE_URL) return { error: "Database niet geconfigureerd." };

  const parsed = integrationSchema.safeParse({
    agendaProvider: formData.get("agendaProvider") ?? "",
    agendaApiKey: formData.get("agendaApiKey") ?? "",
    agendaEmail: formData.get("agendaEmail") ?? "",
    agendaPassword: formData.get("agendaPassword") ?? "",
    agendaBusinessId: formData.get("agendaBusinessId") ?? "",
    agendaBranchId: formData.get("agendaBranchId") ?? "",
    agendaRegion: formData.get("agendaRegion") ?? "",
    watiApiKey: formData.get("watiApiKey") ?? "",
    vapiApiKey: formData.get("vapiApiKey") ?? "",
    phoneNumber: formData.get("phoneNumber") ?? "",
  });

  if (!parsed.success) return { error: "Ongeldige invoer." };

  const {
    agendaProvider,
    agendaApiKey,
    agendaEmail,
    agendaPassword,
    agendaBusinessId,
    agendaBranchId,
    agendaRegion,
    watiApiKey,
    vapiApiKey,
    phoneNumber,
  } = parsed.data;

  // Encrypt API keys before storage
  const { encrypt } = await import("@/lib/crypto");
  const encryptIfSet = (v: string) => (v ? encrypt(v) : null);

  // Salonized and Phorest have no API key — both log in with a salon-owned
  // email/password, so the "credential" stored is a small JSON blob rather
  // than a bearer token.
  let storedAgendaCredential: string | null;
  if (agendaProvider === "salonized" || agendaProvider === "phorest") {
    const password = agendaPassword || (await recoverStoredPassword(user.salonId));
    const blob =
      agendaProvider === "salonized"
        ? { email: agendaEmail, password }
        : {
            email: agendaEmail,
            password,
            businessId: agendaBusinessId,
            branchId: agendaBranchId,
            region: agendaRegion || "eu",
          };
    storedAgendaCredential = agendaEmail ? encrypt(JSON.stringify(blob)) : null;
  } else {
    storedAgendaCredential = encryptIfSet(agendaApiKey);
  }

  const aiSettings = {
    whatsappEnabled: !!watiApiKey,
    phoneEnabled: !!phoneNumber,
    watiApiKey: encryptIfSet(watiApiKey),
    vapiApiKey: encryptIfSet(vapiApiKey),
    phoneNumber: phoneNumber || null,
    agendaApiKey: storedAgendaCredential,
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
