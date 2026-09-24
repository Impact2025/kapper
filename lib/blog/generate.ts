import "server-only";
import { complete } from "@/lib/ai/anthropic";
import { env } from "@/lib/env";
import { slugify } from "@/lib/utils";
import { computeSeo } from "@/lib/blog/seo";
import { DEFAULT_VERTICAL_ID, getVerticalConfig, type VerticalPack } from "@/lib/verticals";
import { siteUrlFor } from "@/lib/verticals/site-url";

export interface GeneratedPost {
  title: string;
  slug: string;
  excerpt: string;
  bodyMdx: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  jsonLd: Record<string, unknown>;
  seoScore: number;
}

function buildPrompt(topic: string, keywords: string[] | undefined, pack: VerticalPack): string {
  return `Schrijf een diepgaand, SEO-geoptimaliseerd blogartikel over: "${topic}".
${keywords?.length ? `Verwerk deze keywords natuurlijk: ${keywords.join(", ")}.` : ""}

Eisen:
- 700-1000 woorden, Markdown body met minimaal 3 tussenkoppen (##).
- Praktisch en concreet voor ${pack.content.audience}.
- Eindig met een korte call-to-action richting ${pack.brand.name}.

Geef UITSLUITEND geldige JSON terug (geen codeblok, geen uitleg) met deze velden:
{
  "title": "pakkende titel (max 65 tekens)",
  "excerpt": "samenvatting van 1-2 zinnen",
  "metaTitle": "SEO meta titel (30-60 tekens)",
  "metaDescription": "SEO meta omschrijving (70-160 tekens)",
  "keywords": ["3-6", "relevante", "keywords"],
  "bodyMdx": "volledige Markdown body"
}`;
}

function extractJson(raw: string): Record<string, unknown> | null {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1));
  } catch {
    return null;
  }
}

/**
 * Generate a complete blog draft with Claude. Throws if no API key or if the
 * model output can't be parsed into the expected shape.
 */
export async function generateBlogPost(
  topic: string,
  keywords?: string[],
  vertical: string = DEFAULT_VERTICAL_ID,
): Promise<GeneratedPost> {
  const pack = getVerticalConfig(vertical);
  const siteUrl = siteUrlFor(pack.id);
  if (!env.OPENMODEL_API_KEY) {
    throw new Error("OPENMODEL_API_KEY ontbreekt — AI-generatie niet beschikbaar.");
  }

  const raw = await complete({
    model: env.OPENMODEL_MODEL,
    maxTokens: 3000,
    system: pack.content.blogSystemPrompt,
    prompt: buildPrompt(topic, keywords, pack),
  });
  if (!raw) throw new Error("Geen reactie van het AI-model.");

  const parsed = extractJson(raw);
  if (!parsed || typeof parsed.title !== "string" || typeof parsed.bodyMdx !== "string") {
    throw new Error("AI-uitvoer kon niet worden verwerkt. Probeer opnieuw.");
  }

  const title = String(parsed.title).slice(0, 70);
  const bodyMdx = String(parsed.bodyMdx);
  const slug = slugify(title) || slugify(topic);
  const kw = Array.isArray(parsed.keywords)
    ? (parsed.keywords as unknown[]).map(String).slice(0, 8)
    : (keywords ?? []);
  const metaTitle = String(parsed.metaTitle ?? title).slice(0, 70);
  const metaDescription = String(parsed.metaDescription ?? parsed.excerpt ?? "").slice(0, 170);
  const excerpt = String(parsed.excerpt ?? metaDescription).slice(0, 280);

  const { score } = computeSeo({ title, metaTitle, metaDescription, bodyMdx, keywords: kw, slug });

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    description: metaDescription,
    keywords: kw.join(", "),
    inLanguage: "nl-NL",
    url: `${siteUrl}/blog/${slug}`,
    publisher: {
      "@type": "Organization",
      name: `${pack.brand.name}.nl`,
      url: siteUrl,
    },
  };

  return {
    title,
    slug,
    excerpt,
    bodyMdx,
    metaTitle,
    metaDescription,
    keywords: kw,
    jsonLd,
    seoScore: score,
  };
}
