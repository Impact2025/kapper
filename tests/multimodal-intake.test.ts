import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const createMock = vi.fn();
vi.mock("@/lib/ai/anthropic", () => ({
  getAnthropic: () => ({ messages: { create: createMock } }),
}));
vi.mock("@/lib/crypto", () => ({ decrypt: (v: string) => v }));
vi.mock("@/lib/salon/availability", () => ({ findAvailableSlots: vi.fn() }));
vi.mock("@/lib/salon/appointments", () => ({
  findAppointmentsByPhone: vi.fn(),
  bookFromSlot: vi.fn(),
  rescheduleToSlot: vi.fn(),
  cancelById: vi.fn(),
  setExternalId: vi.fn(),
  pushBookingToAgenda: vi.fn(),
}));

import { getReceptionistReply, type SalonContext } from "@/lib/ai/receptionist";

const salon: SalonContext = {
  id: "salon-1",
  name: "Kapsalon Test",
  city: "Utrecht",
  phone: null,
  plan: "pro",
  vertical: "kapper",
  agendaProvider: null,
  aiSettings: {},
  noShowSettings: {},
  locations: [],
  treatments: [],
  staff: [],
  knowledgeEntries: [],
};

function textResponse(text: string) {
  return { content: [{ type: "text", text }] };
}

describe("multimodale input — foto-analyse (Fase 4)", () => {
  beforeEach(() => {
    createMock.mockReset();
  });

  it("sends an image content block to Claude when the user message carries imageUrl", async () => {
    createMock.mockResolvedValueOnce(textResponse("Dat lijkt op een balayage met flinke uitgroei."));

    await getReceptionistReply(
      salon,
      [{ role: "user", content: "kan dit qua kleur?", imageUrl: "https://wati.example/media/abc.jpg" }],
      "0612345678",
    );

    const sentMessages = createMock.mock.calls[0]![0].messages as {
      content: unknown;
    }[];
    expect(sentMessages).toHaveLength(1);
    const blocks = sentMessages[0]!.content as { type: string; source?: { type: string; url: string }; text?: string }[];
    expect(blocks[0]).toEqual({ type: "image", source: { type: "url", url: "https://wati.example/media/abc.jpg" } });
    expect(blocks[1]).toEqual({ type: "text", text: "kan dit qua kleur?" });
  });

  it("falls back to a placeholder caption when a photo arrives without any text", async () => {
    createMock.mockResolvedValueOnce(textResponse("Bedankt voor de foto!"));

    await getReceptionistReply(
      salon,
      [{ role: "user", content: "", imageUrl: "https://wati.example/media/def.jpg" }],
      "0612345678",
    );

    const sentMessages = createMock.mock.calls[0]![0].messages as { content: { type: string; text?: string }[] }[];
    expect(sentMessages[0]!.content[1]).toEqual({ type: "text", text: "(foto zonder tekst)" });
  });

  it("sends plain text (no content-block array) for a message without an image", async () => {
    createMock.mockResolvedValueOnce(textResponse("Prima!"));

    await getReceptionistReply(salon, [{ role: "user", content: "hoi" }], "0612345678");

    const sentMessages = createMock.mock.calls[0]![0].messages as { content: unknown }[];
    expect(sentMessages[0]!.content).toBe("hoi");
  });
});
