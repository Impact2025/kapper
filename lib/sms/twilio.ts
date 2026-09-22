import "server-only";
import twilio from "twilio";
import { env } from "@/lib/env";
import { captureError } from "@/lib/observability";

function getClient() {
  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_FROM_NUMBER) return null;
  return twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
}

/**
 * Fase 4 SMS-fallback: sent when a phone booking stalls — the AI receptionist
 * answered the call but the caller hung up (or the call ended some other
 * way) without an appointment being made and without being escalated to a
 * human. Silently skipped if Twilio isn't configured, same degrade-gracefully
 * pattern as every other optional integration in this codebase (Stripe
 * deposits, agenda sync, ...).
 */
export async function sendBookingFallbackSms(input: {
  toPhone: string;
  salonName: string;
  salonPhone: string | null;
}): Promise<void> {
  const client = getClient();
  if (!client) return;

  const body = input.salonPhone
    ? `Sorry, het lukte niet om je afspraak bij ${input.salonName} telefonisch af te ronden. Bel ons terug op ${input.salonPhone} of app ons op WhatsApp om alsnog een afspraak te plannen.`
    : `Sorry, het lukte niet om je afspraak bij ${input.salonName} telefonisch af te ronden. App ons op WhatsApp om alsnog een afspraak te plannen.`;

  try {
    await client.messages.create({ to: input.toPhone, from: env.TWILIO_FROM_NUMBER!, body });
  } catch (err) {
    captureError("sms/booking-fallback", err);
  }
}
