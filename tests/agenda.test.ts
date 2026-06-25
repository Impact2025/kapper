import { describe, it, expect } from "vitest";
import { getAgendaAdapter } from "@/lib/agenda";

describe("getAgendaAdapter factory", () => {
  it("returns null when provider is null", () => {
    expect(getAgendaAdapter(null, "key")).toBeNull();
  });

  it("returns null when apiKey is null", () => {
    expect(getAgendaAdapter("salonized", null)).toBeNull();
  });

  it("returns null for an unknown provider", () => {
    expect(getAgendaAdapter("unknown-system", "key")).toBeNull();
  });

  it("returns an adapter for each supported provider", () => {
    for (const provider of ["salonized", "phorest", "treatwell", "acuity"]) {
      const adapter = getAgendaAdapter(provider, "test-key");
      expect(adapter, `${provider} should return an adapter`).not.toBeNull();
      expect(typeof adapter!.getAvailableSlots).toBe("function");
      expect(typeof adapter!.bookAppointment).toBe("function");
    }
  });

  it("adapter methods return promises (AgendaAdapter interface)", async () => {
    const adapter = getAgendaAdapter("salonized", "test-key");
    expect(adapter).not.toBeNull();

    // These will fail at the network level, but they must return a Promise
    const slotsPromise = adapter!.getAvailableSlots(1);
    expect(slotsPromise).toBeInstanceOf(Promise);

    // Expect a BookingResult with ok: false (network error in test env)
    const result = await adapter!.bookAppointment({
      customerName: "Test Klant",
      customerPhone: "+31612345678",
      serviceType: "Knipbeurt",
      date: "2026-06-30",
      time: "10:00",
    });
    expect(result).toHaveProperty("ok");
    expect(typeof result.ok).toBe("boolean");
  });
});
