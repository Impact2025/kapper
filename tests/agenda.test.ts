import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
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
});

describe("SalonizedAdapter", () => {
  const credentials = JSON.stringify({ email: "kapper@salon.nl", password: "geheim123" });
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("logs in via the session-cookie endpoint, not a bearer key", async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(null, { status: 200, headers: { "set-cookie": "session=abc123" } }),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({ appointments: [] }), { status: 200 }));

    const adapter = getAgendaAdapter("salonized", credentials)!;
    const slots = await adapter.getAvailableSlots(7);

    expect(slots).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [loginUrl, loginInit] = fetchMock.mock.calls[0]!;
    expect(loginUrl).toBe("https://api.salonized.com/sessions");
    expect(loginInit.body).toContain("user%5Bemail%5D=kapper%40salon.nl");
    const [dataUrl] = fetchMock.mock.calls[1]!;
    expect(dataUrl).toBe("https://api.salonized.com/appointments");
  });

  it("fails clearly when no credentials are configured, instead of guessing an endpoint", async () => {
    const adapter = getAgendaAdapter("salonized", JSON.stringify({}))!;
    await expect(adapter.getAvailableSlots(1)).rejects.toThrow(/geen inloggegevens/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("bookAppointment returns ok:false instead of throwing when the API rejects", async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(null, { status: 200, headers: { "set-cookie": "session=abc123" } }),
      )
      .mockResolvedValueOnce(new Response("bad request", { status: 400 }));

    const adapter = getAgendaAdapter("salonized", credentials)!;
    const result = await adapter.bookAppointment({
      customerName: "Test Klant",
      customerPhone: "+31612345678",
      serviceType: "Knipbeurt",
      date: "2026-06-30",
      time: "10:00",
    });

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/400/);
  });
});

describe("AcuityAdapter", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  const farFuture = "2030-01-05"; // fixed, always inside any test's availability window

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("resolves service-type IDs before checking availability, not by guessing a slots endpoint", async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([{ id: 1, name: "Knippen", duration: 30, price: "35" }]),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify([{ date: farFuture }]), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify([{ time: `${farFuture}T14:00:00+0000` }]), { status: 200 }),
      );

    const adapter = getAgendaAdapter("acuity", "12345:test-key")!;
    const slots = await adapter.getAvailableSlots(3650);

    expect(slots).toHaveLength(1);
    expect(slots[0]!.serviceType).toBe("Knippen");
    expect(slots[0]!.time).toBe("14:00");
    expect(JSON.parse(slots[0]!.slotId)).toEqual({
      appointmentTypeID: 1,
      datetime: `${farFuture}T14:00:00+0000`,
    });

    const [typesUrl] = fetchMock.mock.calls[0]!;
    expect(typesUrl).toBe("https://acuityscheduling.com/api/v1/appointment-types");
  });

  it("books using the slotId's appointmentTypeID/datetime instead of re-guessing them", async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ id: 999 }), { status: 200 }));

    const adapter = getAgendaAdapter("acuity", "12345:test-key")!;
    const result = await adapter.bookAppointment({
      slotId: JSON.stringify({ appointmentTypeID: 1, datetime: `${farFuture}T14:00:00+0000` }),
      customerName: "Test Klant",
      customerPhone: "+31612345678",
      serviceType: "Knippen",
      date: farFuture,
      time: "14:00",
    });

    expect(result.ok).toBe(true);
    expect(result.externalId).toBe("999");
    const [, init] = fetchMock.mock.calls[0]!;
    const body = JSON.parse(init.body);
    expect(body).toMatchObject({ appointmentTypeID: 1, datetime: `${farFuture}T14:00:00+0000` });
  });
});

describe("PhorestAdapter", () => {
  const credentials = JSON.stringify({
    email: "kapper@salon.nl",
    password: "geheim123",
    businessId: "B1",
    branchId: "BR1",
    region: "eu",
  });
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("checks real per-service availability, carrying serviceId/staffId/staffName in the slotId", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.endsWith("/service")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({ _embedded: { services: [{ serviceId: "S1", name: "Knippen", price: 35, duration: 30 }] } }),
            { status: 200 },
          ),
        );
      }
      if (url.endsWith("/staff")) {
        return Promise.resolve(
          new Response(JSON.stringify({ _embedded: { staffs: [{ staffId: "ST1", firstName: "Sanne" }] } }), { status: 200 }),
        );
      }
      if (url.endsWith("/appointments/availability")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              data: [
                {
                  startTime: "2030-01-05T14:00:00Z",
                  clientSchedules: [
                    {
                      serviceSchedules: [
                        { serviceId: "S1", staffId: "ST1", startTime: "2030-01-05T14:00:00Z", endTime: "2030-01-05T14:30:00Z", price: 35 },
                      ],
                    },
                  ],
                },
              ],
            }),
            { status: 200 },
          ),
        );
      }
      throw new Error(`unexpected fetch: ${url}`);
    });

    const adapter = getAgendaAdapter("phorest", credentials)!;
    const slots = await adapter.getAvailableSlots(7);

    expect(slots).toHaveLength(1);
    expect(slots[0]!.serviceType).toBe("Knippen");
    expect(slots[0]!.staffName).toBe("Sanne");
    expect(JSON.parse(slots[0]!.slotId)).toMatchObject({ serviceId: "S1", staffId: "ST1" });
  });

  it("books an existing client and passes serviceId/staffId straight through from the slotId", async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ _embedded: { clients: [{ clientId: "C1" }] } }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ clientAppointmentSchedules: [{ appointmentId: "A1" }] }), { status: 201 }),
      );

    const adapter = getAgendaAdapter("phorest", credentials)!;
    const result = await adapter.bookAppointment({
      slotId: JSON.stringify({ serviceId: "S1", staffId: "ST1", startTime: "2030-01-05T14:00:00Z" }),
      customerName: "Test Klant",
      customerPhone: "+31612345678",
      serviceType: "Knippen",
      date: "2030-01-05",
      time: "14:00",
    });

    expect(result.ok).toBe(true);
    expect(result.externalId).toBe("A1");
    expect(fetchMock).toHaveBeenCalledTimes(2); // client lookup + booking, no client creation needed
  });

  it("throws a clear error instead of guessing when businessId/branchId are missing", async () => {
    const adapter = getAgendaAdapter("phorest", JSON.stringify({ email: "a@b.nl", password: "x" }))!;
    await expect(adapter.getAvailableSlots(7)).rejects.toThrow(/businessId/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("TreatwellAdapter", () => {
  it("reports no slots and refuses to book instead of calling a nonexistent API", async () => {
    const adapter = getAgendaAdapter("treatwell", "irrelevant")!;
    expect(await adapter.getAvailableSlots(7)).toEqual([]);

    const result = await adapter.bookAppointment({
      customerName: "Test Klant",
      customerPhone: "+31612345678",
      serviceType: "Knippen",
      date: "2030-01-05",
      time: "14:00",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/Connect/);
  });
});
