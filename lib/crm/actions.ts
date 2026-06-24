"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { leads, crmActivities, emailMessages } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/dal";
import { sendEmail } from "@/lib/mail/resend";
import { simpleEmail } from "@/lib/mail/templates";
import { env } from "@/lib/env";
import { LEAD_STAGES, LEAD_STAGE_LABELS, type LeadStage } from "@/lib/crm/constants";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

const stageSchema = z.object({
  leadId: z.string().uuid(),
  stage: z.enum(LEAD_STAGES),
});

export async function updateLeadStage(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  const parsed = stageSchema.safeParse({
    leadId: formData.get("leadId"),
    stage: formData.get("stage"),
  });
  if (!parsed.success) return { ok: false, error: "Ongeldige invoer." };

  const { leadId, stage } = parsed.data;
  const [current] = await db
    .select({ stage: leads.stage })
    .from(leads)
    .where(eq(leads.id, leadId))
    .limit(1);
  if (!current) return { ok: false, error: "Lead niet gevonden." };
  if (current.stage === stage) return { ok: true };

  await db.update(leads).set({ stage }).where(eq(leads.id, leadId));
  await db.insert(crmActivities).values({
    leadId,
    type: "stage_change",
    userId: user.id,
    body: `Fase gewijzigd van ${LEAD_STAGE_LABELS[current.stage as LeadStage]} naar ${LEAD_STAGE_LABELS[stage]}.`,
    meta: { from: current.stage, to: stage },
  });

  revalidatePath(`/admin/crm/${leadId}`);
  revalidatePath("/admin/crm");
  return { ok: true };
}

const noteSchema = z.object({
  leadId: z.string().uuid(),
  body: z.string().min(1, "Notitie mag niet leeg zijn.").max(5000),
});

export async function addNote(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  const parsed = noteSchema.safeParse({
    leadId: formData.get("leadId"),
    body: formData.get("body"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Ongeldige invoer." };
  }

  await db.insert(crmActivities).values({
    leadId: parsed.data.leadId,
    type: "note",
    userId: user.id,
    body: parsed.data.body,
  });

  revalidatePath(`/admin/crm/${parsed.data.leadId}`);
  return { ok: true };
}

const emailSchema = z.object({
  leadId: z.string().uuid(),
  to: z.string().email("Ongeldig e-mailadres."),
  subject: z.string().min(2, "Onderwerp is verplicht.").max(200),
  body: z.string().min(2, "Bericht is verplicht.").max(20000),
});

export async function sendLeadEmail(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  const parsed = emailSchema.safeParse({
    leadId: formData.get("leadId"),
    to: formData.get("to"),
    subject: formData.get("subject"),
    body: formData.get("body"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Ongeldige invoer." };
  }

  const { leadId, to, subject, body } = parsed.data;
  const html = simpleEmail({ title: subject, body });
  const resendId = await sendEmail({ to, subject, html, replyTo: env.REPORT_RECIPIENT });

  await db.insert(emailMessages).values({
    leadId,
    direction: "outbound",
    toAddress: to,
    fromAddress: env.MAIL_FROM,
    subject,
    html,
    resendId,
    status: resendId ? "sent" : "skipped",
  });
  await db.insert(crmActivities).values({
    leadId,
    type: "email",
    userId: user.id,
    body: `E-mail verstuurd: "${subject}"`,
    meta: { to, resendId },
  });

  revalidatePath(`/admin/crm/${leadId}`);
  return resendId
    ? { ok: true }
    : { ok: true, error: "Verstuurd (let op: RESEND_API_KEY ontbreekt, e-mail niet daadwerkelijk verzonden)." };
}
