import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const updateCalls: unknown[] = [];
vi.mock("@/lib/db", () => ({
  // setExternalId does `db.update(appointments).set({externalId}).where(...)`
  // with no `.returning()` — the `.where()` call itself is what's awaited.
  db: {
    update: () => ({
      set: (values: unknown) => ({
        where: () => {
          updateCalls.push(values);
          return Promise.resolve();
        },
      }),
    }),
  },
}));

const bookAppointmentMock = vi.fn();
const getAgendaAdapterMock = vi.fn();
vi.mock("@/lib/agenda", () => ({
  getAgendaAdapter: (...args: unknown[]) => getAgendaAdapterMock(...args),
  resolveAgendaApiKey: (raw: string | null | undefined) => (raw ? `decrypted:${raw}` : null),
  LIVE_AVAILABILITY_PROVIDERS: new Set(["acuity", "phorest"]),
}));

const captureErrorMock = vi.fn();
vi.mock("@/lib/observability", () => ({
  captureError: (...args: unknown[]) => captureErrorMock(...args),
}));

import { pushBookingToAgenda } from "@/lib/salon/appointments";

const booking = {
  customerName: "Anna Jansen",
  customerPhone: "+31611112222",
  serviceType: "Chemisch peeling",
  date: "2026-09-10",
  time: "14:00",
};

describe("pushBookingToAgenda — best-effort push of a confirmed booking to the connected agenda software", () => {
  beforeEach(() => {
    updateCalls.length = 0;
    bookAppointmentMock.mockReset();
    getAgendaAdapterMock.mockReset();
    captureErrorMock.mockReset();
  });

  it("does nothing when no agenda provider is connected", async () => {
    getAgendaAdapterMock.mockReturnValue(null);

    await pushBookingToAgenda(null, null, "apt-1", booking);

    expect(getAgendaAdapterMock).toHaveBeenCalledWith(null, null);
    expect(updateCalls).toHaveLength(0);
    expect(captureErrorMock).not.toHaveBeenCalled();
  });

  it("decrypts the stored api key before handing it to the adapter", async () => {
    getAgendaAdapterMock.mockReturnValue({ bookAppointment: bookAppointmentMock });
    bookAppointmentMock.mockResolvedValue({ ok: true, externalId: "ext-1" });

    await pushBookingToAgenda("acuity", "cipher-text", "apt-1", booking);

    expect(getAgendaAdapterMock).toHaveBeenCalledWith("acuity", "decrypted:cipher-text");
  });

  it("stores the returned externalId on a successful push", async () => {
    getAgendaAdapterMock.mockReturnValue({ bookAppointment: bookAppointmentMock });
    bookAppointmentMock.mockResolvedValue({ ok: true, externalId: "ext-42" });

    await pushBookingToAgenda("acuity", "key", "apt-1", booking);

    expect(bookAppointmentMock).toHaveBeenCalledWith(booking);
    expect(updateCalls).toEqual([{ externalId: "ext-42" }]);
  });

  it("does not touch the database when the push succeeds without an externalId", async () => {
    getAgendaAdapterMock.mockReturnValue({ bookAppointment: bookAppointmentMock });
    bookAppointmentMock.mockResolvedValue({ ok: true });

    await pushBookingToAgenda("acuity", "key", "apt-1", booking);

    expect(updateCalls).toHaveLength(0);
  });

  it("captures the error instead of throwing when the adapter reports failure", async () => {
    getAgendaAdapterMock.mockReturnValue({ bookAppointment: bookAppointmentMock });
    bookAppointmentMock.mockResolvedValue({ ok: false, error: "Acuity 500: server error" });

    await expect(pushBookingToAgenda("acuity", "key", "apt-1", booking)).resolves.toBeUndefined();

    expect(captureErrorMock).toHaveBeenCalledWith(
      "agenda-sync/push-booking",
      expect.objectContaining({ message: "Acuity 500: server error" }),
    );
  });

  it("captures the error instead of throwing when the adapter call itself rejects", async () => {
    getAgendaAdapterMock.mockReturnValue({ bookAppointment: bookAppointmentMock });
    bookAppointmentMock.mockRejectedValue(new Error("network timeout"));

    await expect(pushBookingToAgenda("acuity", "key", "apt-1", booking)).resolves.toBeUndefined();

    expect(captureErrorMock).toHaveBeenCalledWith("agenda-sync/push-booking", expect.any(Error));
  });
});
