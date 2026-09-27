import { notFound } from "next/navigation";
import { buildLlmsTxt, llmsResponse } from "@/lib/seo/llms";
import { DEFAULT_VERTICAL_ID, getVerticalConfig, isVerticalId, listLiveVerticals } from "@/lib/verticals";

// Rendered per request and cached at the CDN (Cache-Control) instead of
// prerendered via generateStaticParams: Vercel's build adapter can't map
// prerendered route handlers under /sites/[vertical] ("failed to find source
// route … for prerender"), which blocked every production deploy since the
// multi-site split. Unknown and not-yet-live verticals still 404 below.
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ vertical: string }> }) {
  const { vertical } = await params;
  if (!isVerticalId(vertical) || vertical === DEFAULT_VERTICAL_ID || !listLiveVerticals().some((v) => v.id === vertical)) notFound();
  return llmsResponse(await buildLlmsTxt(getVerticalConfig(vertical)));
}
