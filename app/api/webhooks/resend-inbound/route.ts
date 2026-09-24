import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { getResend } from "@/lib/mail/resend";
import { processInboundEmail } from "@/lib/support/inbound";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * Resend inbound-mail webhook (event `email.received`). Signature-verified with
 * RESEND_WEBHOOK_SECRET; fails closed when the secret is not configured.
 * Setup: Resend → Webhooks → endpoint `<site>/api/webhooks/resend-inbound`,
 * event email.received; route the support address to Resend inbound.
 */
export async function POST(req: Request) {
  const resend = getResend();
  if (!resend || !env.RESEND_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Inbound mail is niet geconfigureerd." }, { status: 503 });
  }

  const payload = await req.text();
  let event;
  try {
    event = resend.webhooks.verify({
      payload,
      headers: {
        id: req.headers.get("svix-id") ?? "",
        timestamp: req.headers.get("svix-timestamp") ?? "",
        signature: req.headers.get("svix-signature") ?? "",
      },
      webhookSecret: env.RESEND_WEBHOOK_SECRET,
    });
  } catch {
    return NextResponse.json({ error: "Ongeldige handtekening." }, { status: 401 });
  }

  if (event.type !== "email.received") return NextResponse.json({ ok: true, ignored: event.type });

  const outcome = await processInboundEmail(event.data.email_id);
  // "failed" → 500 so Resend retries; everything else is final.
  return NextResponse.json({ ok: outcome !== "failed", outcome }, { status: outcome === "failed" ? 500 : 200 });
}
