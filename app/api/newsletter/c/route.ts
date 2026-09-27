import { NextResponse, after } from "next/server";
import { recordClick } from "@/lib/newsletter/campaigns";
import { verifyClick } from "@/lib/newsletter/tracking";
import { env, publicEnv } from "@/lib/env";

export const runtime = "nodejs";

/** Click tracking redirect. Only follows URLs we signed — never an open redirect. */
export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  const sendId = p.get("s") ?? "";
  const url = p.get("u") ?? "";
  if (!env.AUTH_SECRET || !verifyClick(env.AUTH_SECRET, sendId, url, p.get("k") ?? "")) {
    return NextResponse.redirect(publicEnv.NEXT_PUBLIC_SITE_URL, 302);
  }
  after(() => recordClick(sendId, url).catch((err) => console.error("[newsletter] click:", err)));
  return NextResponse.redirect(url, 302);
}
