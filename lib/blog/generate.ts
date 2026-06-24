import "server-only";
import { complete } from "@/lib/ai/anthropic";
import { env } from "@/lib/env";
import { slugify } from "@/lib/utils";
import { computeSeo } from "@/lib/blog/seo";
import { publicEnv } from "@/lib/env";

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

const SYSTEM = `Je bent een Nederlandse SEO-contentspecialist voor kapsalons.
Schrijf praktische, autoritaire en warme blogartikelen (B2B, voor saloneigenaren).
Gebruik Markdown met ## en ### tussenkoppen, korte alinea's en bullets.
Vermijd overdrijving en holle marketingtaal. Schrijf in het Nederlands.`;

function buildPrompt(topic: string, keywords?: string[]): string {
  return `Schrijf een diepgaand, SEO-geoptimaliseerd blogartikel over: "${topic}".
${keywords?.length ? `Verwerk deze keywords natuurlijk: ${keywords.join(", ")}.` : ""}

Eisen:
- 700-1000 woorden, Markdown body met minimaal 3 tussenkoppen (##).
- Praktisch en concreet voor saloneigenaren.
- Eindig met een korte call-to-action richting KapperAssistent.

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
): Promise<GeneratedPost> {
  if (!env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY ontbreekt — AI-generatie niet beschikbaar.");
  }

  const raw = await complete({
    model: env.ANTHROPIC_MODEL_LONGFORM,
    maxTokens: 3000,
    system: SYSTEM,
    prompt: buildPrompt(topic, keywords),
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
    url: `${publicEnv.NEXT_PUBLIC_SITE_URL}/blog/${slug}`,
    publisher: {
      "@type": "Organization",
      name: "KapperAssistent.nl",
      url: publicEnv.NEXT_PUBLIC_SITE_URL,
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
