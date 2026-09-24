import "server-only";
import type { salons } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { decrypt } from "@/lib/crypto";
import { resolveWatiCredentials } from "@/lib/ai/wati-turn";
import { sendWatiMessage } from "@/lib/salon/wati-client";
import { sendEmail } from "@/lib/mail/resend";
import { captureError } from "@/lib/observability";

export interface NotifyResult {
  whatsapp: boolean;
  email: boolean;
}

/**
 * Best-effort customer message over every channel we have for them: WhatsApp
 * (the salon's WATI credentials) and/or e-mail. Never throws — a failed
 * notification must not undo the business action that triggered it.
 */
export async function notifyCustomer(input: {
  salon: typeof salons.$inferSelect;
  phone?: string | null;
  email?: string | null;
  text: string;
  emailSubject: string;
  emailHtml: string;
  replyTo?: string;
}): Promise<NotifyResult> {
  const result: NotifyResult = { whatsapp: false, email: false };

  if (input.phone) {
    try {
      const creds = resolveWatiCredentials(input.salon, env.WATI_API_KEY, env.WATI_BASE_URL, decrypt);
      if (creds) {
        await sendWatiMessage(creds.watiBaseUrl, creds.watiApiKey, input.phone, input.text);
        result.whatsapp = true;
      }
    } catch (err) {
      captureError("jobs/notify-whatsapp", err);
    }
  }

  if (input.email) {
    try {
      const id = await sendEmail({
        to: input.email,
        subject: input.emailSubject,
        html: input.emailHtml,
        replyTo: input.replyTo,
      });
      result.email = id !== null;
    } catch (err) {
      captureError("jobs/notify-email", err);
    }
  }

  return result;
}
