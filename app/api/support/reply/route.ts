import { NextResponse } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { env } from "@/lib/env";
import { getSupportActor } from "@/lib/support/actor";
import { clientIp, rateLimit } from "@/lib/support/rate-limit";
import { addMessage, getTicketByGuestToken, getTicketById, getTicketForSalon } from "@/lib/support/tickets";
import { isAllowedAttachmentUrl } from "@/lib/support/attachments";
import type { TicketStatus } from "@/lib/support/ticket-model";
import { captureError } from "@/lib/observability";

export const runtime = "nodejs";

const schema = z.object({
  token: z.string().min(16).max(80).optional(),
  ticketId: z.string().uuid().optional(),
  message: z.string().trim().min(1).max(5000),
  internal: z.boolean().optional(),
  attachments: z
    .array(z.object({ url: z.string().url().max(600), name: z.string().max(200), size: z.number().int().max(10 * 1024 * 1024), type: z.string().max(100) }))
    .max(3)
    .default([]),
});

/**
 * Reply on a ticket. Three mutually exclusive identities:
 *  - guest:  a valid private token            → klant message
 *  - salon:  logged-in owner of the ticket's salon → klant message
 *  - admin:  logged-in admin                  → agent message (or interne notitie)
 */
export async function POST(req: Request) {
  if (!env.DATABASE_URL) return NextResponse.json({ error: "Niet beschikbaar." }, { status: 503 });
  if (!rateLimit(`reply:${clientIp(req)}`, 20, 600_000).ok) {
    return NextResponse.json({ error: "Te veel berichten. Probeer het zo opnieuw." }, { status: 429 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Controleer je bericht." }, { status: 422 });
  const { token, ticketId, message, internal, attachments } = parsed.data;
  if (!attachments.every((a) => isAllowedAttachmentUrl(a.url))) {
    return NextResponse.json({ error: "Ongeldige bijlage." }, { status: 422 });
  }

  try {
    let resolved: { id: string; status: string; requesterName: string } | null = null;
    let authorType: "klant" | "agent" | "notitie" = "klant";
    let authorName = "";
    let authorUserId: string | null = null;

    if (token) {
      const t = await getTicketByGuestToken(token);
      if (t) {
        resolved = t;
        authorName = t.requesterName;
      }
    } else if (ticketId) {
      const actor = await getSupportActor();
      if (actor.role === "admin") {
        const t = await getTicketById(ticketId);
        if (t) {
          resolved = t;
          authorType = internal ? "notitie" : "agent";
          authorName = actor.name ?? "KapperAssistent Support";
          authorUserId = actor.userId;
        }
      } else if (actor.role === "owner" && actor.salon) {
        const t = await getTicketForSalon(ticketId, actor.salon.id);
        if (t) {
          resolved = t;
          authorName = t.requesterName;
          authorUserId = actor.userId;
        }
      }
    }
    if (!resolved) return NextResponse.json({ error: "Ticket niet gevonden." }, { status: 404 });

    // Customers cannot write into a closed ticket; they start a new one.
    if (authorType === "klant" && (resolved.status as TicketStatus) === "gesloten") {
      return NextResponse.json({ error: "Dit ticket is gesloten. Maak een nieuw ticket aan." }, { status: 409 });
    }

    const result = await addMessage({ ticketId: resolved.id, authorType, authorName, authorUserId, body: message, attachments });
    if (!result.ok) return NextResponse.json({ error: "Versturen mislukt." }, { status: 500 });

    revalidatePath(`/admin/support/${resolved.id}`);
    revalidatePath(`/dashboard/support/${resolved.id}`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    captureError("support/reply", err);
    return NextResponse.json({ error: "Er ging iets mis." }, { status: 500 });
  }
}
