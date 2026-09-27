import { describe, it, expect } from "vitest";
import { parseBlocks, emptyBlock, starterBlocks, type NewsletterBlock } from "@/lib/newsletter/blocks";
import { renderNewsletterHtml, renderNewsletterText, personalize, firstName } from "@/lib/newsletter/render";
import { matchesSegment, parseSegment, abVariant, type SegmentCandidate } from "@/lib/newsletter/segment";
import { clickUrl, verifyClick, openPixelUrl, verifyOpen } from "@/lib/newsletter/tracking";

const brand = { name: "KapperAssistent", domain: "kappersassistent.nl", siteUrl: "https://www.kappersassistent.nl" };
const recipient = { name: "Sanne de Vries", email: "sanne@example.nl" };

describe("newsletter blocks", () => {
  it("drops invalid blocks instead of throwing", () => {
    const blocks = parseBlocks([
      { id: "1", type: "heading", text: "Hoi", level: 2 },
      { id: "2", type: "button", label: "x", url: "javascript:alert(1)" },
      { id: "3", type: "nope" },
      "garbage",
    ]);
    expect(blocks.map((b) => b.id)).toEqual(["1"]);
    expect(parseBlocks(null)).toEqual([]);
  });

  it("creates valid empty and starter blocks", () => {
    expect(parseBlocks(starterBlocks())).toHaveLength(3);
    expect(parseBlocks([emptyBlock("divider", "d"), emptyBlock("spacer", "s"), emptyBlock("text", "t")])).toHaveLength(3);
  });
});

describe("personalize", () => {
  it("fills names with fallbacks and escapes in HTML mode", () => {
    expect(firstName("  Sanne de Vries ")).toBe("Sanne");
    expect(personalize("Hoi {{voornaam|daar}}!", recipient, true)).toBe("Hoi Sanne!");
    expect(personalize("Hoi {{ voornaam | daar }}!", { email: "a@b.nl" }, true)).toBe("Hoi daar!");
    expect(personalize("{{naam}}", { name: "<b>X</b>", email: "a@b.nl" }, true)).toBe("&lt;b&gt;X&lt;/b&gt;");
    expect(personalize("{{onbekend}}", recipient, true)).toBe("{{onbekend}}");
  });
});

describe("renderNewsletterHtml", () => {
  const blocks: NewsletterBlock[] = [
    { id: "h", type: "heading", text: "Nieuws voor {{voornaam}}", level: 1 },
    { id: "t", type: "text", markdown: "Lees [ons artikel](/blog/test) en **meer**." },
    { id: "b", type: "button", label: "Start", url: "https://example.com/start", align: "center" },
    { id: "p", type: "post", title: "Titel <script>", excerpt: "Kort", url: "/blog/x", image: "" },
  ];
  const track = (u: string) => `https://t.example/c?u=${encodeURIComponent(u)}`;

  it("personalizes, absolutizes and tracks links but never the unsubscribe link", () => {
    const html = renderNewsletterHtml(blocks, {
      brand,
      subject: "Test",
      previewText: "Voorproef",
      recipient,
      unsubscribeUrl: "https://www.kappersassistent.nl/nieuwsbrief/afmelden/tok",
      trackUrl: track,
      openPixelUrl: "https://t.example/o?s=1",
    });
    expect(html).toContain("Nieuws voor Sanne");
    expect(html).toContain(`href="https://t.example/c?u=${encodeURIComponent("https://www.kappersassistent.nl/blog/test")}"`);
    expect(html).toContain(encodeURIComponent("https://example.com/start"));
    expect(html).toContain('href="https://www.kappersassistent.nl/nieuwsbrief/afmelden/tok"');
    expect(html).toContain("Titel &lt;script&gt;");
    expect(html).not.toContain("<script>");
    expect(html).toContain("Voorproef");
    expect(html).toContain('src="https://t.example/o?s=1"');
  });

  it("renders without tracking for previews", () => {
    const html = renderNewsletterHtml(blocks, { brand, subject: "T", recipient, unsubscribeUrl: "#" });
    expect(html).toContain('href="https://www.kappersassistent.nl/blog/test"');
    expect(html).not.toContain("t.example");
  });

  it("produces a plain-text alternative with the unsubscribe link", () => {
    const text = renderNewsletterText(blocks, { brand, recipient, unsubscribeUrl: "https://x/afmelden" });
    expect(text).toContain("NIEUWS VOOR SANNE");
    expect(text).toContain("ons artikel (https://www.kappersassistent.nl/blog/test)");
    expect(text).toContain("Start: https://example.com/start");
    expect(text).toContain("afmelden: https://x/afmelden");
  });
});

describe("segments", () => {
  const sub: SegmentCandidate = { status: "subscribed", source: "klant", vertical: "hovenier", salonStatus: "active", tags: ["beta"] };

  it("only ever matches subscribed contacts", () => {
    expect(matchesSegment(sub, parseSegment({}))).toBe(true);
    expect(matchesSegment({ ...sub, status: "unsubscribed" }, parseSegment({}))).toBe(false);
    expect(matchesSegment({ ...sub, status: "pending" }, parseSegment({}))).toBe(false);
  });

  it("ANDs the filters and ORs within one", () => {
    expect(matchesSegment(sub, parseSegment({ verticals: ["kapper", "hovenier"], sources: ["klant"] }))).toBe(true);
    expect(matchesSegment(sub, parseSegment({ verticals: ["kapper"] }))).toBe(false);
    expect(matchesSegment({ ...sub, salonStatus: null }, parseSegment({ salonStatuses: ["active"] }))).toBe(false);
    expect(matchesSegment(sub, parseSegment({ tags: ["x", "beta"] }))).toBe(true);
  });

  it("falls back to 'everyone' on a malformed segment and splits A/B stably", () => {
    expect(parseSegment({ sources: ["hacker"] })).toEqual(parseSegment({}));
    expect(abVariant("abc", false)).toBe("A");
    expect(abVariant("abc", true)).toBe(abVariant("abc", true));
    const variants = Array.from({ length: 200 }, (_, i) => abVariant(`id-${i}`, true));
    const bShare = variants.filter((v) => v === "B").length / variants.length;
    expect(bShare).toBeGreaterThan(0.35);
    expect(bShare).toBeLessThan(0.65);
  });
});

describe("tracking tokens", () => {
  const secret = "test-secret";

  it("round-trips a signed click and rejects tampering", () => {
    const u = new URL(clickUrl("https://site.nl/", secret, "send-1", "https://example.com/a?b=1"));
    const s = u.searchParams.get("s")!;
    const target = u.searchParams.get("u")!;
    const k = u.searchParams.get("k")!;
    expect(u.pathname).toBe("/api/newsletter/c");
    expect(verifyClick(secret, s, target, k)).toBe(true);
    expect(verifyClick(secret, s, "https://evil.example", k)).toBe(false);
    expect(verifyClick("other", s, target, k)).toBe(false);
    expect(verifyClick(secret, s, "javascript:alert(1)", k)).toBe(false);
  });

  it("signs open pixels per send", () => {
    const u = new URL(openPixelUrl("https://site.nl", secret, "send-1"));
    expect(verifyOpen(secret, "send-1", u.searchParams.get("k")!)).toBe(true);
    expect(verifyOpen(secret, "send-2", u.searchParams.get("k")!)).toBe(false);
  });
});
