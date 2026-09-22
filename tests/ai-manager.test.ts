import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const getReceptionistReplyMock = vi.fn();
vi.mock("@/lib/ai/receptionist", () => ({
  getReceptionistReply: (...args: unknown[]) => getReceptionistReplyMock(...args),
}));

const insertValuesMock = vi.fn((_v: unknown) => Promise.resolve());
vi.mock("@/lib/db", () => ({
  db: {
    insert: () => ({ values: (v: unknown) => insertValuesMock(v) }),
  },
}));

vi.mock("@/lib/observability", () => ({ captureError: vi.fn() }));

import { runAiManager } from "@/lib/ai/manager";
import type { SalonContext } from "@/lib/ai/receptionist";

const salon = { id: "salon-1", name: "Kapsalon Test" } as SalonContext;

describe("runAiManager — Artikel 9 compliance guard + agent routing", () => {
  beforeEach(() => {
    getReceptionistReplyMock.mockReset();
    insertValuesMock.mockReset().mockResolvedValue(undefined);
  });

  it("blocks a WhatsApp message mentioning a health/allergy term before it ever reaches Claude", async () => {
    const result = await runAiManager({
      salonId: "salon-1",
      salon,
      history: [{ role: "user", content: "Ik heb een verfallergie, mag ik toch een kleuring?" }],
      customerPhone: "+31611112222",
      conversationId: "conv-1",
      channel: "whatsapp",
    });

    expect(getReceptionistReplyMock).not.toHaveBeenCalled();
    expect(result.escalated).toBeTruthy();
    expect(result.reply).toMatch(/gezondheids|huidinformatie/i);
    expect(insertValuesMock).toHaveBeenCalledWith(
      expect.objectContaining({ agent: "compliance_guard", guardTriggered: true, escalated: true }),
    );
  });

  it("routes an ordinary WhatsApp message straight to the receptionist agent", async () => {
    getReceptionistReplyMock.mockResolvedValue({ reply: "Welke dag komt u uit?" });

    const result = await runAiManager({
      salonId: "salon-1",
      salon,
      history: [{ role: "user", content: "Kan ik zaterdag knippen?" }],
      customerPhone: "+31611112222",
      conversationId: "conv-1",
      channel: "whatsapp",
    });

    expect(getReceptionistReplyMock).toHaveBeenCalledTimes(1);
    expect(result.reply).toBe("Welke dag komt u uit?");
    expect(insertValuesMock).toHaveBeenCalledWith(
      expect.objectContaining({ agent: "receptionist", guardTriggered: false }),
    );
  });

  it("does not apply the WhatsApp-only guard on the phone channel", async () => {
    getReceptionistReplyMock.mockResolvedValue({ reply: "Ik verwijs u door naar een intake." });

    const result = await runAiManager({
      salonId: "salon-1",
      salon,
      history: [{ role: "user", content: "Ik heb eczeem, kan dat een probleem zijn?" }],
      customerPhone: "+31611112222",
      channel: "phone",
    });

    expect(getReceptionistReplyMock).toHaveBeenCalledTimes(1);
    expect(result.reply).toBe("Ik verwijs u door naar een intake.");
  });
});
