import { HELP_ARTICLES, type HelpArticle, type HelpAudience } from "@/lib/help/articles";

/** Lowercase, strip diacritics and punctuation so "Wachtwoord?" matches "wachtwoord". */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^\p{L}\p{N}%€\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const STOPWORDS = new Set([
  "de", "het", "een", "en", "of", "van", "voor", "met", "op", "in", "is", "ik", "je", "jij", "jullie",
  "mijn", "hoe", "wat", "waar", "kan", "kun", "ook", "te", "om", "dat", "die", "dit", "er", "nu",
  "wil", "moet", "zijn", "als", "aan", "bij", "naar", "niet", "geen", "maar", "dan", "kunnen",
]);

export function tokenize(text: string): string[] {
  return normalize(text)
    .split(" ")
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

/** Cheap Dutch-friendly stemming: match on a shared prefix of ≥5 chars so
 * "opzeggen"/"opzegging" and "koppelingen"/"koppeling" find each other. */
function tokenMatches(queryToken: string, docToken: string): boolean {
  if (queryToken === docToken) return true;
  const n = Math.min(queryToken.length, docToken.length);
  if (n < 5) return false;
  const prefix = Math.max(5, n - 2);
  return queryToken.slice(0, prefix) === docToken.slice(0, prefix);
}

export interface SearchOptions {
  audience?: "prospect" | "salon";
  limit?: number;
  /** Defaults to the code-defined articles; pass the DB-merged corpus on the server. */
  corpus?: HelpArticle[];
}

export interface SearchHit {
  article: HelpArticle;
  score: number;
}

function audienceOk(a: HelpAudience, want?: "prospect" | "salon"): boolean {
  return !want || a === "both" || a === want;
}

function scoreArticle(qTokens: string[], qNorm: string, article: HelpArticle): number {
  const title = tokenize(article.title);
  const keywords = article.keywords.flatMap((k) => tokenize(k));
  const summary = tokenize(article.summary);
  const body = tokenize(article.body);

  let score = 0;
  for (const q of qTokens) {
    if (title.some((t) => tokenMatches(q, t))) score += 6;
    if (keywords.some((t) => tokenMatches(q, t))) score += 4;
    if (summary.some((t) => tokenMatches(q, t))) score += 2;
    if (body.some((t) => tokenMatches(q, t))) score += 1;
  }
  // Whole-phrase bonus: an exact keyword phrase in the question is a strong signal.
  for (const kw of article.keywords) {
    const k = normalize(kw);
    if (k.includes(" ") && qNorm.includes(k)) score += 5;
  }
  return score;
}

/** Ranked full-text search over the (small, static) help corpus. */
export function searchHelp(query: string, opts: SearchOptions = {}): SearchHit[] {
  const qNorm = normalize(query);
  const qTokens = tokenize(query);
  if (!qTokens.length) return [];

  const hits: SearchHit[] = [];
  for (const article of opts.corpus ?? HELP_ARTICLES) {
    if (!audienceOk(article.audience, opts.audience)) continue;
    const score = scoreArticle(qTokens, qNorm, article);
    if (score > 0) hits.push({ article, score });
  }
  hits.sort((a, b) => b.score - a.score || a.article.title.localeCompare(b.article.title, "nl"));
  return hits.slice(0, opts.limit ?? 10);
}

/** Minimum score for a hit to count as a real answer rather than noise. */
export const CONFIDENT_SCORE = 8;
