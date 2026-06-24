import { NextResponse } from "next/server";
import { z } from "zod";
import { runScan } from "@/lib/scan/run-scan";
import { env } from "@/lib/env";
import { sendEmail } from "@/lib/mail/resend";
import { scanReportEmail, scanLeadNotifyEmail } from "@/lib/mail/templates";
import { trackEvent } from "@/lib/analytics/track";

export const runtime = "nodejs";
export const maxDuration = 30;

const bodySchema = z.object({
  salonName: z.string().min(2).max(120),
  url: z.string().min(3).max(200),
  email: z.string().email(),
  phone: z.string().max(40).optional().or(z.literal("")),
  city: z.string().max(80).optional().or(z.literal("")),
  chairs: z.coerce.number().int().min(1).max(50).optional(),
});

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Ongeldige aanvraag" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Controleer de ingevulde velden.", issues: parsed.error.issues },
      { status: 422 },
    );
  }
  const input = parsed.data;

  const result = await runScan({
    url: input.url,
    salonName: input.salonName,
    chairs: input.chairs,
  });

  await trackEvent({
    type: "scan_completed",
    props: {
      salonName: input.salonName,
      missedMonthly: result.revenue.totalMonthly,
      performanceScore: result.performanceScore,
    },
  });

  // Persist as a CRM lead (best-effort; skipped if DB not configured)
  if (env.DATABASE_URL) {
    try {
      const { db } = await import("@/lib/db");
      const { leads, crmActivities } = await import("@/lib/db/schema");
      const [lead] = await db
        .insert(leads)
        .values({
          salonName: input.salonName,
          url: result.normalizedUrl,
          email: input.email,
          phone: input.phone || null,
          city: input.city || null,
          scanResult: result as unknown as Record<string, unknown>,
          missedRevenueEstimate: result.revenue.totalMonthly,
          stage: "new",
        })
        .returning({ id: leads.id });

      if (lead) {
        await db.insert(crmActivities).values({
          leadId: lead.id,
          type: "scan",
          body: `AI & SEO-scan uitgevoerd. Geschat gemist maandinkomen: €${result.revenue.totalMonthly}.`,
          meta: { performanceScore: result.performanceScore },
        });
      }
    } catch (e) {
      console.error("[scan] lead persist failed:", e);
    }
  }

  // Email the report to the lead + notify admin (best-effort)
  await Promise.allSettled([
    sendEmail({
      to: input.email,
      subject: `Je gratis AI & SEO-scan voor ${input.salonName}`,
      html: scanReportEmail({ salonName: input.salonName, result }),
    }),
    sendEmail({
      to: env.REPORT_RECIPIENT,
      subject: `Nieuwe scan-lead: ${input.salonName}`,
      html: scanLeadNotifyEmail({ input, result }),
    }),
  ]);

  return NextResponse.json({ result });
}
