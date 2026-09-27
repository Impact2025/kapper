import { NextResponse } from "next/server";
import { z } from "zod";
import { subscribePublic } from "@/lib/newsletter/subscribers";
import { clientIp, rateLimit } from "@/lib/support/rate-limit";
import { isVerticalId } from "@/lib/verticals";
import { captureError } from "@/lib/observability";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().trim().email().max(254),
  name: z.string().trim().max(120).optional().or(z.literal("")),
  vertical: z.string().max(40).optional(),
  page: z.string().max(300).optional(),
  // Honeypot: real people leave this empty.
  website: z.string().max(0).optional().or(z.literal("")),
});

/** Public newsletter sign-up → double opt-in mail. Same answer for every outcome (no address enumeration). */
export async function POST(req: Request) {
  const ip = clientIp(req);
  if (!rateLimit(`newsletter:${ip}`, 5, 60 * 60_000).ok) {
    return NextResponse.json({ error: "Te veel aanmeldingen. Probeer het later opnieuw." }, { status: 429 });
  }
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Vul een geldig e-mailadres in." }, { status: 400 });
  // Bots filling the honeypot get a fake success.
  if (parsed.data.website) return NextResponse.json({ ok: true });

  try {
    await subscribePublic({
      email: parsed.data.email,
      name: parsed.data.name || null,
      vertical: parsed.data.vertical && isVerticalId(parsed.data.vertical) ? parsed.data.vertical : null,
      consentSource: `formulier: ${parsed.data.page ?? "onbekend"}`,
      ip: ip === "unknown" ? null : ip,
    });
  } catch (err) {
    captureError("newsletter/subscribe", err);
    return NextResponse.json({ error: "Aanmelden lukte niet. Probeer het later opnieuw." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
