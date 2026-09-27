import { describe, it, expect, vi } from "vitest";
import { MaskingSession, knownNamesFor, withKnownPiiNames } from "@/lib/ai/masking";
import { withPiiMasking } from "@/lib/ai/anthropic";

describe("MaskingSession — Protecto-methode PII tokenizer", () => {
  it("masks a name, an 06-phone number and a health/allergy term, then unmasks the reply back to the originals", () => {
    const session = new MaskingSession();
    const input = "Hoi, ik ben Anna Jansen, mijn nummer is 0612345678 en ik heb een verfallergie.";

    const masked = session.mask(input);

    expect(masked).not.toContain("Anna Jansen");
    expect(masked).not.toContain("0612345678");
    expect(masked).not.toContain("verfallergie");
    expect(masked).toContain("[KLANT_NAAM_1]");
    expect(masked).toContain("[TELEFOON_1]");
    expect(masked).toContain("[CONDITIE_1]");

    // Simulate a model reply that echoes the tokens back.
    const modelReply = "Bedankt [KLANT_NAAM_1], we noteren de [CONDITIE_1] en bellen je op [TELEFOON_1] terug.";
    const unmasked = session.unmask(modelReply);

    expect(unmasked).toBe("Bedankt Anna Jansen, we noteren de verfallergie en bellen je op 0612345678 terug.");
  });

  it("masks E.164 phone numbers and email addresses", () => {
    const session = new MaskingSession();
    const masked = session.mask("Bel me op +31612345678 of mail anna@example.com");

    expect(masked).not.toContain("+31612345678");
    expect(masked).not.toContain("anna@example.com");
    expect(masked).toContain("[TELEFOON_1]");
    expect(masked).toContain("[EMAIL_1]");
  });

  it("masks every term the Artikel 9 guard reacts to — one shared list, incl. two-word 'patch test'", () => {
    const session = new MaskingSession();
    const text = "Na mijn chemotherapie en alopecia wil ik eerst een patch test.";
    const masked = session.mask(text);

    for (const term of ["chemotherapie", "alopecia", "patch test"]) {
      expect(masked).not.toContain(term);
    }
    expect(session.unmask(masked)).toBe(text);
  });

  it("gives the same entity the same token when it repeats, and different entities different tokens", () => {
    const session = new MaskingSession();
    const masked = session.mask("Ik ben Anna Jansen. Anna Jansen heeft ook psoriasis en eczeem.");

    expect(masked.match(/\[KLANT_NAAM_1\]/g)).toHaveLength(2);
    expect(masked).toContain("[CONDITIE_1]");
    expect(masked).toContain("[CONDITIE_2]");
  });

  it("masks a known name (e.g. the WATI contact name) whenever it appears in the message", () => {
    const session = new MaskingSession();
    const masked = session.mask("Anna Jansen belde net nog.", ["Anna Jansen"]);
    expect(masked).not.toContain("Anna Jansen");
    expect(masked).toContain("[KLANT_NAAM_1]");
  });
});

describe("withPiiMasking — anthropic.ts gateway integration", () => {
  function fakeClient(replyText: string) {
    const create = vi.fn().mockResolvedValue({ content: [{ type: "text", text: replyText }] });
    const client = { messages: { create } } as unknown as import("@anthropic-ai/sdk").default;
    return { client, create };
  }

  it("never sends raw PII or health data in the payload reaching the Anthropic client", async () => {
    const { client, create } = fakeClient("ok");
    const wrapped = withPiiMasking(client);

    await wrapped.messages.create({
      model: "test-model",
      max_tokens: 100,
      messages: [
        {
          role: "user",
          content: "Ik ben Anna Jansen, bel me op 0612345678, ik heb een zwangerschap en eczeem.",
        },
      ],
    } as never);

    const sentParams = create.mock.calls[0]![0] as { messages: { content: string }[] };
    const sentText = sentParams.messages[0]!.content;

    expect(sentText).not.toContain("Anna Jansen");
    expect(sentText).not.toContain("0612345678");
    expect(sentText).not.toContain("zwangerschap");
    expect(sentText).not.toContain("eczeem");
  });

  it("de-identifies the request and re-identifies the model's reply back to the customer", async () => {
    const { client } = fakeClient(
      "Genoteerd [KLANT_NAAM_1], we bellen [TELEFOON_1] terug over de [CONDITIE_1].",
    );
    const wrapped = withPiiMasking(client);

    const response = await wrapped.messages.create({
      model: "test-model",
      max_tokens: 100,
      messages: [
        { role: "user", content: "Ik ben Anna Jansen, 0612345678, ik heb een verfallergie." },
      ],
    } as never);

    expect(response.content[0]).toMatchObject({
      type: "text",
      text: "Genoteerd Anna Jansen, we bellen 0612345678 terug over de verfallergie.",
    });
  });
});

describe("withPiiMasking — tool-use (boeken met echte gegevens)", () => {
  it("re-identifies tool_use input, so a booking never gets a literal [KLANT_NAAM_1] token", async () => {
    const create = vi.fn().mockResolvedValue({
      content: [
        {
          type: "tool_use",
          id: "tu-1",
          name: "book_appointment",
          input: { slot_id: "s-1", customer_name: "[KLANT_NAAM_1]", customer_phone: "[TELEFOON_1]", extra: ["[TELEFOON_1]"] },
        },
      ],
    });
    const wrapped = withPiiMasking({ messages: { create } } as unknown as import("@anthropic-ai/sdk").default);

    const response = await wrapped.messages.create({
      model: "test-model",
      max_tokens: 100,
      messages: [{ role: "user", content: "Ik ben Anna Jansen, mijn nummer is 0612345678. Boek maar." }],
    } as never);

    expect(response.content[0]).toMatchObject({
      type: "tool_use",
      input: { slot_id: "s-1", customer_name: "Anna Jansen", customer_phone: "0612345678", extra: ["0612345678"] },
    });
  });

  it("masks the re-identified tool_use input and tool_result blocks again on the next tool-loop round", async () => {
    const create = vi.fn().mockResolvedValue({ content: [{ type: "text", text: "ok" }] });
    const wrapped = withPiiMasking({ messages: { create } } as unknown as import("@anthropic-ai/sdk").default);

    await wrapped.messages.create({
      model: "test-model",
      max_tokens: 100,
      messages: [
        { role: "user", content: "Ik ben Anna Jansen, 0612345678." },
        {
          role: "assistant",
          content: [{ type: "tool_use", id: "tu-1", name: "book_appointment", input: { customer_name: "Anna Jansen", customer_phone: "0612345678" } }],
        },
        {
          role: "user",
          content: [{ type: "tool_result", tool_use_id: "tu-1", content: [{ type: "text", text: "Geboekt voor Anna Jansen" }] }],
        },
      ],
    } as never);

    const sent = JSON.stringify(create.mock.calls[0]![0]);
    expect(sent).not.toContain("Anna Jansen");
    expect(sent).not.toContain("0612345678");
    // Same entity → same token across text, tool_use and tool_result.
    expect(sent.match(/\[KLANT_NAAM_1\]/g)).toHaveLength(3);
  });

  it("masks a known contact name inside withKnownPiiNames, even without a self-introduction", async () => {
    const create = vi.fn().mockResolvedValue({ content: [{ type: "text", text: "Hoi [KLANT_NAAM_1]!" }] });
    const wrapped = withPiiMasking({ messages: { create } } as unknown as import("@anthropic-ai/sdk").default);

    const response = await withKnownPiiNames(knownNamesFor("Anna Jansen"), () =>
      wrapped.messages.create({
        model: "test-model",
        max_tokens: 100,
        messages: [{ role: "user", content: "Anna hier, kan ik morgen komen?" }],
      } as never),
    );

    const sent = JSON.stringify(create.mock.calls[0]![0]);
    expect(sent).not.toContain("Anna");
    expect(response.content[0]).toMatchObject({ type: "text", text: "Hoi Anna!" });
  });

  it("knownNamesFor skips contact names that would tokenize ordinary words", () => {
    expect(knownNamesFor("Anna Jansen")).toEqual(["Anna Jansen", "Anna"]);
    expect(knownNamesFor("Jo de Vries")).toEqual(["Jo de Vries"]);
    expect(knownNamesFor("+31612345678")).toEqual([]);
    expect(knownNamesFor(null)).toEqual([]);
  });
});

describe("MaskingSession — zelfintroductie-heuristiek", () => {
  it("maskeert geen gewone woorden of merknamen na 'met' of 'ik ben'", () => {
    const s = new MaskingSession();
    const input = "Werkt het met Booksy? Ik ben benieuwd, ik wil een afspraak met een stylist.";
    expect(s.mask(input)).toBe(input);
  });

  it("herkent nog steeds 'ik ben Anna' en een telefoon-begroeting 'Met Anna Jansen'", () => {
    expect(new MaskingSession().mask("Hoi, ik ben Anna.")).toContain("[KLANT_NAAM_1]");
    expect(new MaskingSession().mask("Met Anna Jansen, ik wil boeken.")).toContain("[KLANT_NAAM_1]");
    expect(new MaskingSession().mask("Goedemiddag. Met Anna")).toContain("[KLANT_NAAM_1]");
  });
});
