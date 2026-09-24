import { describe, it, expect, beforeEach } from "vitest";
import { HELP_ARTICLES, HELP_CATEGORIES, getHelpArticle } from "@/lib/help/articles";
import { searchHelp, CONFIDENT_SCORE } from "@/lib/help/search";
import {
  canTransition,
  defaultPriority,
  firstResponseDeadline,
  formatTicketNumber,
  parseTicketNumber,
  slaState,
  slaTier,
  statusAfterMessage,
} from "@/lib/support/ticket-model";
import { rateLimit, resetRateLimits } from "@/lib/support/rate-limit";
import { guardMessage, shouldOfferTicketAfterMisses } from "@/lib/support/chat-guard";

describe("help-content integriteit", () => {
  it("heeft unieke slugs en alleen bestaande categorieën", () => {
    const slugs = HELP_ARTICLES.map((a) => a.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    const cats = new Set(HELP_CATEGORIES.map((c) => c.id));
    for (const a of HELP_ARTICLES) expect(cats.has(a.category)).toBe(true);
  });

  it("verwijst in 'related' en in interne /help/-links alleen naar bestaande artikelen", () => {
    for (const a of HELP_ARTICLES) {
      for (const r of a.related ?? []) expect(getHelpArticle(r), `${a.slug} → ${r}`).toBeDefined();
      for (const m of a.body.matchAll(/\]\(\/help\/([a-z0-9-]+)\)/g)) {
        expect(getHelpArticle(m[1]!), `${a.slug} → /help/${m[1]}`).toBeDefined();
      }
    }
  });

  it("bevat geen niet-ondersteunde markdown-tabellen", () => {
    for (const a of HELP_ARTICLES) expect(a.body).not.toMatch(/\|---/);
  });
});

describe("searchHelp", () => {
  it("vindt opzeggen ondanks andere vervoeging", () => {
    const hits = searchHelp("Hoe kan ik mijn abonnement opzeggen?");
    expect(hits[0]?.article.slug).toBe("hoe-zeg-ik-op");
    expect(hits[0]!.score).toBeGreaterThanOrEqual(CONFIDENT_SCORE);
  });

  it("vindt prijzen en de setup-fee", () => {
    expect(searchHelp("wat kost het per maand").map((h) => h.article.slug)).toContain("welke-plannen-zijn-er");
    expect(searchHelp("setup kosten")[0]?.article.slug).toBe("wat-houdt-de-setup-fee-in");
  });

  it("negeert hoofdletters en leestekens en geeft niets terug bij onzin", () => {
    expect(searchHelp("WACHTWOORD vergeten!!!")[0]?.article.slug).toBe("wachtwoord-vergeten");
    expect(searchHelp("qzxwvk")).toEqual([]);
    expect(searchHelp("   ")).toEqual([]);
  });

  it("filtert op doelgroep", () => {
    const prospect = searchHelp("wachtwoord inloggen", { audience: "prospect" });
    expect(prospect.every((h) => h.article.audience !== "salon")).toBe(true);
  });
});

describe("ticket-model", () => {
  it("bepaalt SLA per plan en verkort bij urgent", () => {
    const t0 = new Date("2026-01-01T10:00:00Z");
    expect(firstResponseDeadline(t0, slaTier("elite")).toISOString()).toBe("2026-01-01T11:00:00.000Z");
    expect(firstResponseDeadline(t0, slaTier("pro")).toISOString()).toBe("2026-01-01T14:00:00.000Z");
    expect(firstResponseDeadline(t0, slaTier(null)).toISOString()).toBe("2026-01-02T10:00:00.000Z");
    // urgent elite = 30 min (ondergrens)
    expect(firstResponseDeadline(t0, "elite", "urgent").toISOString()).toBe("2026-01-01T10:30:00.000Z");
  });

  it("berekent SLA-status", () => {
    const deadline = new Date("2026-01-01T12:00:00Z");
    expect(slaState(deadline, "open", null, new Date("2026-01-01T09:00:00Z"))).toBe("ok");
    expect(slaState(deadline, "open", null, new Date("2026-01-01T11:30:00Z"))).toBe("due_soon");
    expect(slaState(deadline, "open", null, new Date("2026-01-01T13:00:00Z"))).toBe("breached");
    expect(slaState(deadline, "open", new Date(), new Date("2026-01-01T13:00:00Z"))).toBe("n/a");
    expect(slaState(deadline, "gesloten", null, new Date("2026-01-01T13:00:00Z"))).toBe("n/a");
  });

  it("geeft privacy en facturatie standaard hoge prioriteit", () => {
    expect(defaultPriority("privacy", "essential")).toBe("hoog");
    expect(defaultPriority("facturatie", "pro")).toBe("hoog");
    expect(defaultPriority("overig", "essential")).toBe("normaal");
    expect(defaultPriority("overig", "elite")).toBe("hoog");
  });

  it("staat alleen geldige statusovergangen toe", () => {
    expect(canTransition("open", "opgelost")).toBe(true);
    expect(canTransition("opgelost", "open")).toBe(true);
    expect(canTransition("gesloten", "open")).toBe(false);
  });

  it("zet status na klant- of agentbericht", () => {
    expect(statusAfterMessage("wacht_op_klant", "klant")).toBe("open");
    expect(statusAfterMessage("opgelost", "klant")).toBe("open");
    expect(statusAfterMessage("open", "agent")).toBe("wacht_op_klant");
    expect(statusAfterMessage("gesloten", "klant")).toBe("gesloten");
  });

  it("formatteert en parseert ticketnummers", () => {
    expect(formatTicketNumber(10482)).toBe("KA-10482");
    expect(parseTicketNumber("Re: [KA-10482] Koppeling")).toBe(10482);
    expect(parseTicketNumber("ticket ka 10482")).toBe(10482);
    expect(parseTicketNumber("geen nummer")).toBeNull();
  });
});

describe("rateLimit", () => {
  beforeEach(() => resetRateLimits());

  it("blokkeert boven de limiet en herstelt na het venster", () => {
    const t = 1_000_000;
    for (let i = 0; i < 3; i++) expect(rateLimit("ip:a", 3, 60_000, t + i).ok).toBe(true);
    const blocked = rateLimit("ip:a", 3, 60_000, t + 10);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    expect(rateLimit("ip:b", 3, 60_000, t + 10).ok).toBe(true);
    expect(rateLimit("ip:a", 3, 60_000, t + 61_000).ok).toBe(true);
  });
});

describe("guardMessage", () => {
  it("escaleert privacyverzoeken, betalingsgeschillen, boze berichten en verzoeken om een mens", () => {
    expect(guardMessage("Ik wil inzage in mijn gegevens").reason).toBe("privacy_verzoek");
    expect(guardMessage("Jullie hebben me dubbel afgeschreven!").reason).toBe("betalingsgeschil");
    expect(guardMessage("Dit is schandalig, ik ga naar mijn advocaat").reason).toBe("boos");
    expect(guardMessage("Kan ik een medewerker spreken?").reason).toBe("mens_gevraagd");
    expect(guardMessage("maak een ticket aan").category).toBe("overig");
  });

  it("laat gewone vragen door, ook over 'een mens'", () => {
    expect(guardMessage("Wat kost het Pro plan?").escalate).toBe(false);
    expect(guardMessage("Is dit een echte mens of een AI?").escalate).toBe(false);
  });

  it("biedt na twee missers een ticket aan", () => {
    expect(shouldOfferTicketAfterMisses(1)).toBe(false);
    expect(shouldOfferTicketAfterMisses(2)).toBe(true);
  });
});
