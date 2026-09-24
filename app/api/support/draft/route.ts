import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupportActor } from "@/lib/support/actor";
import { draftAgentReply } from "@/lib/support/draft";
import { getTicketById, listMessages } from "@/lib/support/tickets";
import { clientIp, rateLimit } from "@/lib/support/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 30;

/** Admin-only: AI-concept voor het antwoordveld van een ticket. */
export async function POST(req: Request) {
  const actor = await getSupportActor();
  if (actor.role !== "admin") return NextResponse.json({ error: "Geen toegang." }, { status: 403 });
  if (!rateLimit(`draft:${clientIp(req)}`, 30, 600_000).ok) return NextResponse.json({ error: "Te snel." }, { status: 429 });

  const parsed = z.object({ ticketId: z.string().uuid() }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ongeldige aanvraag." }, { status: 422 });

  const ticket = await getTicketById(parsed.data.ticketId);
  if (!ticket) return NextResponse.json({ error: "Ticket niet gevonden." }, { status: 404 });

  const result = await draftAgentReply(ticket, await listMessages(ticket.id, { includeInternal: false }));
  if (!result) return NextResponse.json({ error: "Concept genereren is nu niet beschikbaar." }, { status: 503 });
  return NextResponse.json(result);
}
