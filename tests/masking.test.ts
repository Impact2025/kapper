import { describe, it, expect, vi } from "vitest";
import { MaskingSession } from "@/lib/ai/masking";
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
