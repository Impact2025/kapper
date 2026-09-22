import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({ db: { insert: () => ({ values: () => Promise.resolve() }) } }));
vi.mock("@/lib/ai/receptionist", () => ({ getReceptionistReply: vi.fn() }));

const { ARTICLE9_RE } = await import("@/lib/ai/manager");

describe("ARTICLE9_RE — Artikel 9 AVG signal-word detection", () => {
  it.each([
    "Ik heb een verfallergie, mag dat?",
    "Ben je allergisch voor ammoniak?",
    "Ik heb last van psoriasis op mijn hoofdhuid",
    "Kan een eczeem behandeling last geven van de kleuring?",
    "Ik heb alopecia, kan de styliste daar rekening mee houden?",
    "Ben je zwanger, mag je dan geverfd worden?",
    "Wat was de uitslag van mijn patch test?",
    "wanneer was de patch-test gedaan",
    "Ik heb een hoofdhuidaandoening",
    "kunnen jullie een diagnose stellen voor mijn huid",
    "Ik ben nu onder chemotherapie",
  ])("flags: %s", (message) => {
    expect(ARTICLE9_RE.test(message)).toBe(true);
  });

  it.each([
    "Kan ik zaterdag om 14:00 terecht voor een knipbeurt?",
    "Wat kost een balayage?",
    "Ik wil mijn afspraak verzetten naar volgende week",
    "Is Sarah morgen beschikbaar?",
  ])("does not flag ordinary booking messages: %s", (message) => {
    expect(ARTICLE9_RE.test(message)).toBe(false);
  });
});
