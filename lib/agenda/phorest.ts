import type { AgendaAdapter, TimeSlot, BookingInput, BookingResult } from "./types";

const BASE = "https://api.phorest.com/third-party-api-server/api";

export class PhorestAdapter implements AgendaAdapter {
  constructor(private apiKey: string) {}

  private headers() {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  async getAvailableSlots(days = 7): Promise<TimeSlot[]> {
    const from = new Date().toISOString();
    const to = new Date(Date.now() + days * 86400_000).toISOString();
    const res = await fetch(
      `${BASE}/availability?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      { headers: this.headers(), next: { revalidate: 60 } },
    );
    if (!res.ok) return [];
    const data = await res.json();
    const slots: unknown[] = Array.isArray(data?.slots) ? data.slots : [];

    return slots.map((s: unknown) => {
      const slot = s as Record<string, unknown>;
      const startTime = String(slot.startTime ?? "");
      const [date = "", timeFull = ""] = startTime.split("T");
      return {
        date,
        time: timeFull.slice(0, 5),
        serviceType: String(slot.serviceName ?? "Behandeling"),
        durationMinutes: Number(slot.duration ?? 30),
        priceEuros: Number(slot.price ?? 0),
      };
    });
  }

  async bookAppointment(input: BookingInput): Promise<BookingResult> {
    try {
      const res = await fetch(`${BASE}/appointment`, {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify({
          startTime: `${input.date}T${input.time}:00`,
          clientName: input.customerName,
          clientPhone: input.customerPhone,
          serviceName: input.serviceType,
        }),
      });
      if (!res.ok) return { ok: false, error: `Phorest ${res.status}` };
      const data = await res.json();
      return { ok: true, externalId: String(data?.id ?? "") };
    } catch (err) {
      return { ok: false, error: String(err) };
    }
  }
}
