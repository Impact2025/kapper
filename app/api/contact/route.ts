import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/lib/env";
import { sendEmail } from "@/lib/mail/resend";
import { trackEvent } from "@/lib/analytics/track";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  message: z.string().min(5).max(4000),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Controleer je gegevens." }, { status: 422 });
  }
  const { name, email, message } = parsed.data;

  await sendEmail({
    to: env.REPORT_RECIPIENT,
    replyTo: email,
    subject: `Contactformulier: ${name}`,
    html: `<p><strong>${name}</strong> (${email}) schreef:</p><p>${message.replace(
      /\n/g,
      "<br>",
    )}</p>`,
  });

  await trackEvent({ type: "contact_submitted", props: { name } });

  return NextResponse.json({ ok: true });
}
