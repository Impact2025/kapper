import "server-only";
import { complete } from "@/lib/ai/anthropic";
import { getVerticalConfig } from "@/lib/verticals";
import type { NewsletterBlock } from "@/lib/newsletter/blocks";

/**
 * AI helpers for the newsletter editor. All output is a *suggestion* the
 * operator edits before sending — never auto-sent. Voice: Vincent's own
 * (ik-vorm, sentence case, concrete), see the content-voice guideline.
 */

const VOICE = `Schrijf in helder, warm Nederlands in de je-vorm, als oprichter die zelf met vakmensen werkt (ik-vorm mag).
Sentence case in koppen (alleen eerste woord met hoofdletter). Concreet, geen hype, geen uitroeptekens-spam, geen emoji.
Het publiek: eigenaren van kleine vakbedrijven (kapsalons, loodgieters, schilders, hoveniers). Druk, praktisch, geen tijd voor wollige tekst.`;

/** Plain-text digest of the blocks, as model context. */
export function blocksToBrief(blocks: NewsletterBlock[]): string {
  return blocks
    .map((b) => {
      switch (b.type) {
        case "heading":
          return `# ${b.text}`;
        case "text":
          return b.markdown;
        case "button":
          return `[knop: ${b.label}]`;
        case "post":
          return `[artikel: ${b.title} — ${b.excerpt}]`;
        default:
          return "";
      }
    })
    .filter(Boolean)
    .join("\n\n")
    .slice(0, 6000);
}

export interface SubjectSuggestion {
  subject: string;
  previewText: string;
}

/** Tolerant JSON-array extraction from a model reply. */
export function parseSuggestions(raw: string | null): SubjectSuggestion[] {
  if (!raw) return [];
  const match = raw.match(/\[[\s\S]*\]/);
  if (!match) return [];
  try {
    const arr: unknown = JSON.parse(match[0]);
    if (!Array.isArray(arr)) return [];
    return arr
      .map((x) => (x && typeof x === "object" ? (x as Record<string, unknown>) : {}))
      .filter((x) => typeof x.subject === "string" && x.subject.trim())
      .map((x) => ({
        subject: String(x.subject).trim().slice(0, 120),
        previewText: typeof x.previewText === "string" ? x.previewText.trim().slice(0, 160) : "",
      }))
      .slice(0, 5);
  } catch {
    return [];
  }
}

export async function suggestSubjects(blocks: NewsletterBlock[], vertical: string): Promise<SubjectSuggestion[]> {
  const pack = getVerticalConfig(vertical);
  const raw = await complete({
    feature: "newsletter",
    maxTokens: 500,
    system: `${VOICE}\nJe schrijft onderwerpregels voor de nieuwsbrief van ${pack.brand.name}. Onderwerpregel max 55 tekens, previewtekst max 90 tekens en een aanvulling op (geen herhaling van) het onderwerp. Geef drie duidelijk verschillende invalshoeken (nieuwsgierigheid, concreet voordeel, vraag) zodat ze A/B-testbaar zijn.
Antwoord uitsluitend met JSON: [{"subject":"…","previewText":"…"}, …]`,
    prompt: `Inhoud van de nieuwsbrief:\n\n${blocksToBrief(blocks) || "(nog leeg)"}`,
  });
  return parseSuggestions(raw);
}

export async function blogIntro(post: { title: string; excerpt: string | null; body: string }, vertical: string): Promise<string | null> {
  const pack = getVerticalConfig(vertical);
  return complete({
    feature: "newsletter",
    maxTokens: 500,
    system: `${VOICE}\nJe schrijft de inleiding van een nieuwsbrief van ${pack.brand.name} die naar een blogartikel verwijst. Begin met "Hoi {{voornaam|daar}}," op een eigen regel. Daarna 2 korte alinea's (samen max 90 woorden): waarom dit onderwerp nú relevant is en wat de lezer eraan heeft. Geen samenvatting van het hele artikel, geen link (die komt eronder). Alleen de tekst in Markdown.`,
    prompt: `Artikel: ${post.title}\n${post.excerpt ?? ""}\n\n${post.body.slice(0, 4000)}`,
  });
}

export async function rewriteText(markdown: string, instruction: string): Promise<string | null> {
  return complete({
    feature: "newsletter",
    maxTokens: 900,
    system: `${VOICE}\nJe herschrijft een tekstblok uit een nieuwsbrief volgens de instructie. Behoud placeholders zoals {{voornaam|daar}} en bestaande links exact. Antwoord alleen met de nieuwe tekst in Markdown.`,
    prompt: `Instructie: ${instruction}\n\nTekst:\n${markdown}`,
  });
}
