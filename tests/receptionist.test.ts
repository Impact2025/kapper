import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const createMock = vi.fn();
vi.mock("@/lib/ai/anthropic", () => ({
  getAnthropic: () => ({ messages: { create: createMock } }),
}));

const bookAppointmentMock = vi.fn(); // agenda adapter push
vi.mock("@/lib/agenda", () => ({
  getAgendaAdapter: () => ({
    getAvailableSlots: vi.fn(),
    bookAppointment: bookAppointmentMock,
  }),
}));

vi.mock("@/lib/crypto", () => ({
  decrypt: (v: string) => v,
}));

const findAvailableSlotsMock = vi.fn();
vi.mock("@/lib/salon/availability", () => ({
  findAvailableSlots: (...args: unknown[]) => findAvailableSlotsMock(...args),
}));

const findAppointmentsByPhoneMock = vi.fn();
const bookFromSlotMock = vi.fn();
const rescheduleToSlotMock = vi.fn();
const cancelByIdMock = vi.fn();
const setExternalIdMock = vi.fn();
vi.mock("@/lib/salon/appointments", () => ({
  findAppointmentsByPhone: (...args: unknown[]) => findAppointmentsByPhoneMock(...args),
  bookFromSlot: (...args: unknown[]) => bookFromSlotMock(...args),
  rescheduleToSlot: (...args: unknown[]) => rescheduleToSlotMock(...args),
  cancelById: (...args: unknown[]) => cancelByIdMock(...args),
  setExternalId: (...args: unknown[]) => setExternalIdMock(...args),
}));

import { getReceptionistReply, executeReceptionistTool, type SalonContext } from "@/lib/ai/receptionist";

const salon: SalonContext = {
  id: "salon-1",
  name: "Huidzorg Clinics",
  city: "Den Bosch",
  phone: "+31201234567",
  plan: "pro",
  agendaProvider: "salonized",
  aiSettings: { agendaApiKey: "irrelevant-because-decrypt-is-mocked" },
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
      prepInfo: "Geen zon vooraf.",
      aftercareInfo: "SPF verplicht.",
    },
  ],
  staff: [{ id: "staff-1", name: "Sanne de Groot", role: "Huidtherapeut", locationIds: ["loc-1"], treatmentIds: ["treat-1"] }],
  knowledgeEntries: [{ title: "Acnebeleid", content: "We behandelen acne stapsgewijs.", category: "Protocol" }],
};

function toolUseResponse(name: string, input: Record<string, unknown>, id = "tool_1") {
  return { content: [{ type: "tool_use", id, name, input }] };
}
function textResponse(text: string) {
  return { content: [{ type: "text", text }] };
}

describe("getReceptionistReply — tool-based receptionist", () => {
  beforeEach(() => {
    createMock.mockReset();
    bookAppointmentMock.mockReset();
    findAvailableSlotsMock.mockReset();
    findAppointmentsByPhoneMock.mockReset();
    bookFromSlotMock.mockReset();
    rescheduleToSlotMock.mockReset();
    cancelByIdMock.mockReset();
    setExternalIdMock.mockReset();
  });

  it("checks availability via the tool and then books the exact slot_id returned", async () => {
    findAvailableSlotsMock.mockResolvedValue({
      location: "Den Bosch",
      treatment: "Chemisch peeling",
      slots: [{ slotId: "loc-1::treat-1::staff-1::2026-09-10T14:00:00.000Z", date: "2026-09-10", time: "14:00" }],
    });
    bookFromSlotMock.mockResolvedValue({
      ok: true,
      appointmentId: "apt-1",
      treatment: "Chemisch peeling",
      location: "Den Bosch",
      date: "2026-09-10",
      time: "14:00",
    });
    bookAppointmentMock.mockResolvedValue({ ok: true, externalId: "ext-1" });

    createMock
      .mockResolvedValueOnce(toolUseResponse("check_availability", { location_id: "loc-1", treatment_id: "treat-1" }))
      .mockResolvedValueOnce(
        toolUseResponse("book_appointment", {
          slot_id: "loc-1::treat-1::staff-1::2026-09-10T14:00:00.000Z",
          customer_name: "Anna Jansen",
          customer_phone: "+31611112222",
        }),
      )
      .mockResolvedValueOnce(textResponse("Je afspraak staat genoteerd voor 10 september om 14:00."));

    const result = await getReceptionistReply(
      salon,
      [{ role: "user", content: "Ik wil een chemisch peeling in Den Bosch op 10 september om 14:00, ik ben Anna Jansen" }],
      "+31611112222",
      "conv-1",
    );

    expect(findAvailableSlotsMock).toHaveBeenCalledWith(
      expect.objectContaining({ salonId: "salon-1", locationId: "loc-1", treatmentId: "treat-1" }),
    );
    expect(bookFromSlotMock).toHaveBeenCalledWith(
      expect.objectContaining({
        salonId: "salon-1",
        slotId: "loc-1::treat-1::staff-1::2026-09-10T14:00:00.000Z",
        customerName: "Anna Jansen",
        customerPhone: "+31611112222",
        conversationId: "conv-1",
      }),
    );
    expect(setExternalIdMock).toHaveBeenCalledWith("apt-1", "ext-1");
    expect(result.bookedAppointment).toMatchObject({
      customerName: "Anna Jansen",
      serviceType: "Chemisch peeling",
      date: "2026-09-10",
      time: "14:00",
      externalId: "ext-1",
    });
    expect(result.reply).toContain("genoteerd");
  });

  it("looks up an existing appointment by phone before rescheduling it", async () => {
    findAppointmentsByPhoneMock.mockResolvedValue([
      { id: "apt-9", customerName: "Marieke de Wit", treatmentName: "Intake", date: "2026-09-12", time: "10:00" },
    ]);
    findAvailableSlotsMock.mockResolvedValue({
      location: "Den Bosch",
      treatment: "Intake",
      slots: [{ slotId: "loc-1::treat-1::staff-1::2026-09-14T09:00:00.000Z", date: "2026-09-14", time: "09:00" }],
    });
    rescheduleToSlotMock.mockResolvedValue({ ok: true, treatment: "Intake", location: "Den Bosch", date: "2026-09-14", time: "09:00" });

    createMock
      .mockResolvedValueOnce(toolUseResponse("find_appointments", { phone: "0612345678" }))
      .mockResolvedValueOnce(
        toolUseResponse("reschedule_appointment", { appointment_id: "apt-9", new_slot_id: "loc-1::treat-1::staff-1::2026-09-14T09:00:00.000Z" }),
      )
      .mockResolvedValueOnce(textResponse("Je afspraak staat nu op 14 september om 09:00."));

    const result = await getReceptionistReply(
      salon,
      [{ role: "user", content: "Ik ben Marieke de Wit, 0612345678, kan mijn afspraak naar 14 september 9 uur?" }],
      "0612345678",
    );

    expect(findAppointmentsByPhoneMock).toHaveBeenCalledWith("salon-1", "0612345678");
    expect(rescheduleToSlotMock).toHaveBeenCalledWith("salon-1", "apt-9", "loc-1::treat-1::staff-1::2026-09-14T09:00:00.000Z");
    expect(result.reply).toContain("14 september");
  });

  it("cancels an appointment via cancel_appointment", async () => {
    cancelByIdMock.mockResolvedValue({ ok: true, treatment: "Intake", date: "2026-09-12", time: "10:00" });
    createMock
      .mockResolvedValueOnce(toolUseResponse("cancel_appointment", { appointment_id: "apt-9", reason: "ziek" }))
      .mockResolvedValueOnce(textResponse("Je afspraak is geannuleerd."));

    const result = await getReceptionistReply(salon, [{ role: "user", content: "annuleer mijn afspraak apt-9" }], "0612345678");

    expect(cancelByIdMock).toHaveBeenCalledWith("salon-1", "apt-9");
    expect(result.reply).toContain("geannuleerd");
  });

  it("flags the conversation for escalation without touching the booking flow", async () => {
    createMock
      .mockResolvedValueOnce(toolUseResponse("escalate_to_staff", { reason: "allergische reactie" }))
      .mockResolvedValueOnce(textResponse("Ik verbind je door met een medewerker."));

    const result = await getReceptionistReply(salon, [{ role: "user", content: "ik heb een allergische reactie gehad" }], "0612345678");

    expect(result.escalated).toEqual({ reason: "allergische reactie" });
    expect(result.bookedAppointment).toBeUndefined();
  });

  it("does not book anything when book_appointment reports an invalid slot", async () => {
    bookFromSlotMock.mockResolvedValue({ error: "Ongeldig slot_id — gebruik exact een slot_id uit check_availability." });
    createMock
      .mockResolvedValueOnce(toolUseResponse("book_appointment", { slot_id: "bogus", customer_name: "Anna", customer_phone: "+3161" }))
      .mockResolvedValueOnce(textResponse("Sorry, dat tijdstip is niet meer beschikbaar."));

    const result = await getReceptionistReply(salon, [{ role: "user", content: "boek bogus" }], "+3161");

    expect(bookAppointmentMock).not.toHaveBeenCalled();
    expect(result.bookedAppointment).toBeUndefined();
  });

  it("returns the fallback line when Claude keeps calling tools forever, instead of looping unbounded", async () => {
    bookFromSlotMock.mockResolvedValue({ error: "Ongeldig slot_id." });
    createMock.mockResolvedValue(toolUseResponse("book_appointment", { slot_id: "x", customer_name: "A", customer_phone: "B" }));

    const result = await getReceptionistReply(salon, [{ role: "user", content: "boek" }], "+3161");

    expect(createMock.mock.calls.length).toBeLessThanOrEqual(5);
    expect(result.reply.length).toBeGreaterThan(0);
  });
});

describe("executeReceptionistTool — direct tool execution for the voice channel", () => {
  beforeEach(() => {
    bookAppointmentMock.mockReset();
    findAvailableSlotsMock.mockReset();
    bookFromSlotMock.mockReset();
    setExternalIdMock.mockReset();
  });

  it("runs a single tool without going through Claude's tool loop, and surfaces the booking", async () => {
    bookFromSlotMock.mockResolvedValue({
      ok: true,
      appointmentId: "apt-1",
      treatment: "Chemisch peeling",
      location: "Den Bosch",
      date: "2026-09-10",
      time: "14:00",
    });
    bookAppointmentMock.mockResolvedValue({ ok: true, externalId: "ext-9" });

    const { resultText, bookedAppointment } = await executeReceptionistTool(
      "book_appointment",
      { slot_id: "loc-1::treat-1::staff-1::2026-09-10T14:00:00.000Z", customer_name: "Anna Jansen", customer_phone: "+31611112222" },
      salon,
      "+31611112222",
      "call-1",
    );

    expect(bookFromSlotMock).toHaveBeenCalledWith(expect.objectContaining({ conversationId: "call-1" }));
    expect(setExternalIdMock).toHaveBeenCalledWith("apt-1", "ext-9");
    expect(JSON.parse(resultText)).toMatchObject({ ok: true, treatment: "Chemisch peeling" });
    expect(bookedAppointment).toMatchObject({ customerName: "Anna Jansen", externalId: "ext-9" });
  });

  it("returns an error result instead of throwing for an unknown tool name", async () => {
    const { resultText } = await executeReceptionistTool("delete_everything", {}, salon, "+31611112222");
    expect(JSON.parse(resultText)).toMatchObject({ error: expect.stringContaining("Onbekende tool") });
  });
});
