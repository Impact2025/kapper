import { NextResponse } from "next/server";
import { unsubscribeByToken } from "@/lib/newsletter/subscribers";
import { publicEnv } from "@/lib/env";

export const runtime = "nodejs";

/**
 * RFC 8058 one-click unsubscribe: mail clients POST here directly from the
 * List-Unsubscribe header — no page, no confirmation, must just work.
 */
export async function POST(req: Request) {
  const token = new URL(req.url).searchParams.get("t") ?? "";
  await unsubscribeByToken(token);
  return new NextResponse(null, { status: 200 });
}

/** A human who opens the header URL in a browser lands on the normal page. */
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("t") ?? "";
  return NextResponse.redirect(`${publicEnv.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")}/nieuwsbrief/afmelden/${encodeURIComponent(token)}`, 303);
}
