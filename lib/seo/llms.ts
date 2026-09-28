import { listPublishedPosts } from "@/lib/blog/queries";
import { listPublishedKnowledgePosts } from "@/lib/kennisbank/queries";
import type { VerticalPack } from "@/lib/verticals";
import { siteUrlFor } from "@/lib/verticals/site-url";
import { solutionsFor } from "@/lib/marketing/solutions";
import { WAI } from "@/lib/seo/wai";
import { scanProfileFor } from "@/lib/scan/profiles";
import { INTEGRATION_PAGES } from "@/lib/marketing/integrations";

/**
 * /llms.txt — a plain-Markdown map of one site for LLM crawlers and answer
 * engines (llmstxt.org): what the product is, then the pages worth reading.
 * Built per vertical from the same sources as the sitemap.
 */
export async function buildLlmsTxt(pack: VerticalPack): Promise<string> {
  const base = siteUrlFor(pack.id);
  const [posts, kposts] = await Promise.all([
    listPublishedPosts(pack.id).catch(() => []),
    listPublishedKnowledgePosts(pack.id).catch(() => []),
  ]);

  const line = (title: string, path: string, note?: string | null) => `- [${title}](${base}${path})${note ? `: ${note.replace(/\s+/g, " ").trim().slice(0, 160)}` : ""}`;

  const out: string[] = [
    `# ${pack.brand.name}.nl`,
    "",
    `> ${pack.brand.description}`,
    "",
    "## Over de maker",
    `- [Vincent van Munster, oprichter van ${WAI.name}](${WAI.url}): bouwt de Assistent-sites vanuit ${WAI.name}.`,
    "",
    "## Belangrijkste pagina's",
    line("Home", "/"),
    line("Prijzen", "/prijzen", "Vaste maandtarieven, geen variabele kosten per gesprek."),
    line("Hulpcentrum", "/help"),
    line("Veelgestelde vragen", "/faq"),
    line("Contact", "/contact"),
  ];

  const solutions = solutionsFor(pack.id);
  if (solutions.length) {
    out.push("", "## Oplossingen", ...solutions.map((s) => line(s.headline, `/oplossingen/${s.slug}`, s.metaDescription)));
  }

  if (pack.id !== "kapper" && scanProfileFor(pack.id)) {
    out.push(line("Gratis AI-scan", "/scan", "Bereken in 60 seconden wat gemiste oproepen je per maand kosten."));
  }

  if (pack.id === "kapper") {
    out.push(line("Diensten", "/diensten"), line("Gratis AI-scan", "/scan"), line("Over ons", "/over-ons"));
    out.push("", "## Koppelingen", ...INTEGRATION_PAGES.map((p) => line(`Koppeling met ${p.name}`, `/integraties/${p.slug}`, p.metaDescription)));
  }

  if (kposts.length) {
    out.push("", "## Kennisbank", ...kposts.map((p) => line(p.title, `/kennisbank/${p.slug}`, p.excerpt)));
  }
  if (posts.length) {
    out.push("", "## Blog", ...posts.map((p) => line(p.title, `/blog/${p.slug}`, p.excerpt)));
  }

  return out.join("\n") + "\n";
}

export function llmsResponse(body: string): Response {
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=0, s-maxage=3600" },
  });
}
