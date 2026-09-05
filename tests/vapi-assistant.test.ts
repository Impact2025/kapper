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

    // All 6 receptionist tools stay in the array — one (escalate_to_staff)
    // is mapped to a native transferCall tool instead of a function tool,
    // but every name must still be present.
    const toolNames = payload.model.tools.map((t) => t.function.name);
    expect(toolNames).toEqual([
      "check_availability",
      "find_appointments",
      "book_appointment",
      "reschedule_appointment",
      "cancel_appointment",
      "escalate_to_staff",
    ]);

    // Every ordinary function tool carries a real JSON schema, not an empty stub.
    const functionTools = payload.model.tools.filter((t) => t.type === "function");
    expect(functionTools).toHaveLength(5);
    for (const tool of functionTools) {
      expect(tool.function.parameters).toBeTruthy();
    }

    expect(payload.server?.url).toBe("https://kappersassistent.nl/api/webhooks/vapi");
    expect(payload.firstMessage).toContain("Huidzorg Clinics");
  });

  it("Artikel 50 AI Act: hardcodes the AI-identification greeting in firstMessage, not left to the model", () => {
    const payload = buildVapiAssistantPayload(salon, "https://x/api/webhooks/vapi");

    expect(payload.firstMessage).toBe(
      "Goedendag, u spreekt met de digitale AI-assistent van Huidzorg Clinics. Waarmee kan ik u helpen?",
    );
    // And the voice system prompt reinforces transparency on repeated/doubtful questions.
    expect(payload.model.messages[0]!.content).toMatch(/virtuele AI-assistent/);
  });

  it("configures Deepgram (STT) and Cartesia (TTS) for sub-300ms latency", () => {
    const payload = buildVapiAssistantPayload(salon, "https://x/api/webhooks/vapi");

    expect(payload.transcriber).toMatchObject({
      provider: "deepgram",
      language: "nl",
      languageHint: "nl",
      smartEndpointing: true,
    });
    expect(payload.transcriber.endpointing).toBeLessThanOrEqual(100);

    expect(payload.voice).toMatchObject({
      provider: "cartesia",
      model: "sonic-3-5",
      language: "nl",
    });
    expect(payload.voice.voiceId).toBeTruthy();
  });

  it("enables full-duplex barge-in and a tight silence timeout", () => {
    const payload = buildVapiAssistantPayload(salon, "https://x/api/webhooks/vapi");

    expect(payload.stopSpeakingPlan.numWords).toBe(0);
    expect(payload.startSpeakingPlan.smartEndpointingEnabled).toBe(true);
    expect(payload.silenceTimeoutSeconds).toBe(0.5);
  });

  it("maps escalate_to_staff to a native transferCall tool targeting the salon's phone number", () => {
    const payload = buildVapiAssistantPayload(salon, "https://x/api/webhooks/vapi");

    const transferTool = payload.model.tools.find((t) => t.function.name === "escalate_to_staff");
    expect(transferTool?.type).toBe("transferCall");
    if (transferTool?.type !== "transferCall") throw new Error("expected a transferCall tool");

    expect(transferTool.destinations).toHaveLength(1);
    expect(transferTool.destinations[0]).toMatchObject({
      type: "number",
      number: salon.phone,
      transferPlan: { mode: "blind-transfer" },
    });
    expect(transferTool.destinations[0]!.message).toMatch(/verbind u nu direct door/);
  });

  it("falls back to a plain function tool for escalate_to_staff when the salon has no phone number on file", () => {
    const payload = buildVapiAssistantPayload({ ...salon, phone: null }, "https://x/api/webhooks/vapi");

    const escalateTool = payload.model.tools.find((t) => t.function.name === "escalate_to_staff");
    expect(escalateTool?.type).toBe("function");
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
