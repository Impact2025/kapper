import { NextResponse } from "next/server";
import { optOutByToken } from "@/lib/crm/outreach";

export const runtime = "nodejs";

/**
 * RFC 8058 one-click opt-out for CRM outreach mails: mail clients POST here
 * directly from the List-Unsubscribe header — no page, no confirmation.
 */
export async function POST(req: Request) {
  const token = new URL(req.url).searchParams.get("t") ?? "";
  await optOutByToken(token);
  return new NextResponse(null, { status: 200 });
}

/** A human who opens the header URL in a browser lands on the normal page (same host). */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("t") ?? "";
  return NextResponse.redirect(new URL(`/afmelden/${encodeURIComponent(token)}`, url), 303);
}
