import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("server-only", () => ({}));

import { buildVapiAssistantPayload, syncVapiAssistant } from "@/lib/ai/vapi-assistant";
import type { SalonContext } from "@/lib/ai/receptionist";

const salon: SalonContext = {
  id: "salon-1",
  name: "Huidzorg Clinics",
  city: "Den Bosch",
  phone: "+31201234567",
  plan: "pro",
  agendaProvider: "salonized",
  aiSettings: {},
  noShowSettings: { enabled: true, freeCancelHours: 24, chargePercent: 100 },
  locations: [{ id: "loc-1", name: "Den Bosch", city: "Den Bosch", workingHours: { mon: [9, 18] } }],
  treatments: [
    {
      id: "treat-1",
      name: "Chemisch peeling",
      category: "Peeling",
      durationMinutes: 30,
      priceCents: 12000,
      description: null,
      prepInfo: null,
      aftercareInfo: null,
    },
  ],
  staff: [{ id: "staff-1", name: "Sanne", role: "Huidtherapeut", locationIds: ["loc-1"], treatmentIds: ["treat-1"] }],
  knowledgeEntries: [],
};

describe("buildVapiAssistantPayload", () => {
  it("carries the receptionist's system prompt, tool catalogue and webhook url", () => {
    const payload = buildVapiAssistantPayload(salon, "https://kappersassistent.nl/api/webhooks/vapi");

    expect(payload.model.provider).toBe("anthropic");
    expect(payload.model.messages[0]).toMatchObject({ role: "system" });
    expect(payload.model.messages[0]!.content).toContain("Huidzorg Clinics");
    expect(payload.model.messages[0]!.content).toContain("Chemisch peeling");

    const toolNames = payload.model.tools.map((t) => t.function.name);
    expect(toolNames).toEqual(
      expect.arrayContaining([
        "check_availability",
        "find_appointments",
        "book_appointment",
        "reschedule_appointment",
        "cancel_appointment",
        "escalate_to_staff",
      ]),
    );
    // Every tool is a real JSON schema, not an empty stub.
    for (const tool of payload.model.tools) {
      expect(tool.type).toBe("function");
      expect(tool.function.parameters).toBeTruthy();
    }

    expect(payload.server?.url).toBe("https://kappersassistent.nl/api/webhooks/vapi");
    expect(payload.firstMessage).toContain("Huidzorg Clinics");
  });
});

describe("syncVapiAssistant", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("POSTs to /assistant when there is no existing assistant id", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ id: "asst_123" }), { status: 200 }));

    const result = await syncVapiAssistant(salon, "vapi-key", "https://x/api/webhooks/vapi", null);

    expect(result).toEqual({ ok: true, assistantId: "asst_123" });
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("https://api.vapi.ai/assistant");
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBe("Bearer vapi-key");
  });

  it("PATCHes the existing assistant instead of creating a duplicate", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ id: "asst_123" }), { status: 200 }));

    await syncVapiAssistant(salon, "vapi-key", "https://x/api/webhooks/vapi", "asst_123");

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("https://api.vapi.ai/assistant/asst_123");
    expect(init.method).toBe("PATCH");
  });

  it("surfaces a clear error instead of throwing when Vapi rejects the request", async () => {
    fetchMock.mockResolvedValue(new Response("invalid model", { status: 400 }));

    const result = await syncVapiAssistant(salon, "bad-key", "https://x/api/webhooks/vapi", null);

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/400/);
  });
});
