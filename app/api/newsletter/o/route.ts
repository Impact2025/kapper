import { after } from "next/server";
import { recordOpen } from "@/lib/newsletter/campaigns";
import { verifyOpen } from "@/lib/newsletter/tracking";
import { env } from "@/lib/env";

export const runtime = "nodejs";

const PIXEL = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");

/** Open-tracking pixel. Always returns the GIF; only records when the signature is valid. */
export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  const sendId = p.get("s") ?? "";
  if (env.AUTH_SECRET && verifyOpen(env.AUTH_SECRET, sendId, p.get("k") ?? "")) {
    after(() => recordOpen(sendId).catch((err) => console.error("[newsletter] open:", err)));
  }
  return new Response(PIXEL, {
    headers: { "Content-Type": "image/gif", "Cache-Control": "no-store, max-age=0" },
  });
}
