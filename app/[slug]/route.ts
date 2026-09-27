import { notFound } from "next/navigation";
import { env } from "@/lib/env";

/**
 * IndexNow keyfile: search engines fetch <host>/<key>.txt to verify a submit
 * (lib/google/indexnow.ts). Not routed through proxy.ts (its matcher excludes
 * extension paths), so this same handler serves the file identically on
 * every vertical's domain — one shared key works across all of them.
 *
 * `[slug]` otherwise only has a nested /winkel route (app/[slug]/winkel); a
 * bare `/<slug>` request 404s exactly as it did before this file existed.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!env.INDEXNOW_KEY || slug !== `${env.INDEXNOW_KEY}.txt`) notFound();
  return new Response(env.INDEXNOW_KEY, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
