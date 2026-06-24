import { Resend } from "resend";
import { env } from "@/lib/env";

let client: Resend | null = null;

export function getResend(): Resend | null {
  if (!env.RESEND_API_KEY) return null;
  if (!client) client = new Resend(env.RESEND_API_KEY);
  return client;
}

export interface SendEmailInput {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
  from?: string;
}

/**
 * Send an email via Resend. Returns the Resend id, or null when no API key is
 * configured (so local dev / previews don't crash).
 */
export async function sendEmail(input: SendEmailInput): Promise<string | null> {
  const resend = getResend();
  if (!resend) {
    console.warn("[mail] RESEND_API_KEY missing — skipping send:", input.subject);
    return null;
  }
  const { data, error } = await resend.emails.send({
    from: input.from ?? env.MAIL_FROM,
    to: input.to,
    subject: input.subject,
    html: input.html,
    replyTo: input.replyTo,
  });
  if (error) {
    console.error("[mail] send error:", error);
    return null;
  }
  return data?.id ?? null;
}
