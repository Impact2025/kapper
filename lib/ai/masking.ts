/**
 * PII-masking gateway (Protecto-methode): de-identifies customer text before
 * it leaves the app for Anthropic, and re-identifies the model's reply
 * afterwards. Mapping lives only in request-scoped memory (a MaskingSession
 * instance per call) — never persisted, so nothing to encrypt at rest.
 */

import { AsyncLocalStorage } from "node:async_hooks";

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

/** E.164 (+31...), 0031..., and NL national (06.../0...) mobile & landline formats. */
const PHONE_RE = /(?:\+31|0031|0)[\s-]?[1-9](?:[\s-]?\d){7,8}\b/g;

/** Article 9 GDPR special-category terms this domain actually sees:
 * health/allergy/pregnancy. The single list behind both this masking and
 * the WhatsApp Artikel 9 guard (lib/ai/manager.ts ARTICLE9_RE), so a term
 * the guard reacts to is never sent to the model unmasked. Wrapped in
 * \p{L}* on both sides so compound words like "verfallergie" or
 * "allergieën" are matched whole, not partially. */
const HEALTH_STEMS = [
  "allergie",
  "allergisch",
  "ammoniak",
  "psoriasis",
  "eczeem",
  "alopecia",
  "zwanger",
  "hoofdhuidaandoening",
  "huidaandoening",
  "chemotherapie",
  "diagnose",
];
// "patch test"/"patch-test" as two tokens needs its own alternative — the
// \p{L}* stem-wrapping trick above only works for single words.
export const HEALTH_PATTERN = `\\p{L}*(?:${HEALTH_STEMS.join("|")})\\p{L}*|patch[\\s-]?test`;
const HEALTH_RE = new RegExp(HEALTH_PATTERN, "giu");

/** Catches a customer introducing themselves inline, e.g. "ik ben Anna Jansen" / "mijn naam is Anna" /
 * a phone greeting "Met Anna Jansen". The intro phrase is matched case-insensitively by spelling out
 * both cases — the name itself MUST start with a capital (no `i` flag, otherwise any word after "met"
 * or "ik ben" would count as a name). Bare "met" only counts at the start of a sentence, so
 * "Werkt het met Booksy?" is not mistaken for an introduction. */
const SELF_INTRO_RE =
  /(?:\b(?:[Ii]k ben|[Ii]k heet|[Mm]ijn naam is)|(?:^|(?<=[.!?]\s+))[Mm]et)\s+([A-ZÀ-ÖØ-Þ][a-zà-öø-ÿ'-]+(?:\s[A-ZÀ-ÖØ-Þ][a-zà-öø-ÿ'-]+)*)/g;

export type PiiMapping = Record<string, string>;

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Context-preserving tokenizer: the same original value always maps to the
 * same token within a session, and mask()/unmask() are exact inverses.
 */
export class MaskingSession {
  private mapping: PiiMapping = {};
  private tokenByValue = new Map<string, string>();
  private counters: Record<string, number> = {};
  /** Names learned this session (self-intro or caller-supplied) — reapplied
   * on every mask() call so a bare repeat later in the conversation, without
   * the "ik ben ..." context, still gets tokenized consistently. */
  private rememberedNames = new Set<string>();

  private tokenFor(kind: string, original: string): string {
    const key = `${kind}:${original.toLowerCase()}`;
    const existing = this.tokenByValue.get(key);
    if (existing) return existing;
    this.counters[kind] = (this.counters[kind] ?? 0) + 1;
    const token = `[${kind}_${this.counters[kind]}]`;
    this.tokenByValue.set(key, token);
    this.mapping[token] = original;
    return token;
  }

  private maskName(text: string, name: string): string {
    const escaped = escapeRegExp(name.trim());
    if (!escaped) return text;
    const re = new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`, "giu");
    return text.replace(re, () => this.tokenFor("KLANT_NAAM", name));
  }

  /** Mask one piece of text. `knownNames` are entities already known from
   * outside the message body (e.g. the WATI contact name) so they get
   * tokenized even if the customer never types them literally-quoted here. */
  mask(text: string, knownNames: string[] = []): string {
    let out = text;
    for (const name of knownNames) {
      this.rememberedNames.add(name);
      out = this.maskName(out, name);
    }
    for (const name of this.rememberedNames) out = this.maskName(out, name);

    out = out.replace(SELF_INTRO_RE, (full, name: string) => {
      this.rememberedNames.add(name);
      return full.replace(name, this.tokenFor("KLANT_NAAM", name));
    });
    // Second pass: mask any other bare occurrence of a name just learned above.
    for (const name of this.rememberedNames) out = this.maskName(out, name);

    out = out.replace(EMAIL_RE, (m) => this.tokenFor("EMAIL", m));
    out = out.replace(PHONE_RE, (m) => this.tokenFor("TELEFOON", m));
    out = out.replace(HEALTH_RE, (m) => this.tokenFor("CONDITIE", m));
    return out;
  }

  /** Decode tokens back to their original values — used on the model's reply
   * before it reaches the customer or the database. */
  unmask(text: string): string {
    let out = text;
    for (const [token, original] of Object.entries(this.mapping)) {
      out = out.split(token).join(original);
    }
    return out;
  }

  getMapping(): PiiMapping {
    return { ...this.mapping };
  }
}

/** Customer names already known from outside the message text (e.g. the
 * WATI contact name), scoped to one async call chain so every LLM call
 * inside it — including each round of a tool loop — tokenizes them without
 * callers having to thread them through the SDK. Read by withPiiMasking. */
const knownPiiNames = new AsyncLocalStorage<string[]>();

export function withKnownPiiNames<T>(names: string[], fn: () => Promise<T>): Promise<T> {
  return knownPiiNames.run(names, fn);
}

export function getKnownPiiNames(): string[] {
  return knownPiiNames.getStore() ?? [];
}

/** The full contact name plus its first word, so a bare "Anna" is masked
 * too when WATI knows "Anna Jansen". Anything without letters (a number
 * saved as the contact name) or a one/two-letter fragment is skipped — it
 * would tokenize ordinary words. */
export function knownNamesFor(customerName: string | null | undefined): string[] {
  const full = customerName?.trim() ?? "";
  if (!/\p{L}{2}/u.test(full)) return [];
  const first = full.split(/\s+/)[0]!;
  return first !== full && first.length >= 3 ? [full, first] : [full];
}
