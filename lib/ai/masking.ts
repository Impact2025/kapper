/**
 * PII-masking gateway (Protecto-methode): de-identifies customer text before
 * it leaves the app for Anthropic, and re-identifies the model's reply
 * afterwards. Mapping lives only in request-scoped memory (a MaskingSession
 * instance per call) — never persisted, so nothing to encrypt at rest.
 */

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

/** E.164 (+31...), 0031..., and NL national (06.../0...) mobile & landline formats. */
const PHONE_RE = /(?:\+31|0031|0)[\s-]?[1-9](?:[\s-]?\d){7,8}\b/g;

/** Article 9 GDPR special-category terms this domain actually sees:
 * health/allergy/pregnancy. Wrapped in \p{L}* on both sides so compound
 * words like "verfallergie" or "allergieën" are masked whole, not partially. */
const HEALTH_STEMS = ["allergie", "allergisch", "ammoniak", "psoriasis", "eczeem", "zwanger"];
const HEALTH_RE = new RegExp(`\\p{L}*(?:${HEALTH_STEMS.join("|")})\\p{L}*`, "giu");

/** Catches a customer introducing themselves inline, e.g. "ik ben Anna Jansen" / "mijn naam is Anna". */
const SELF_INTRO_RE =
  /\b(?:ik ben|ik heet|mijn naam is|met)\s+([A-ZÀ-ÖØ-Þ][a-zà-öø-ÿ'-]+(?:\s[A-ZÀ-ÖØ-Þ][a-zà-öø-ÿ'-]+)*)/gi;

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
