import type { AgendaAdapter, TimeSlot, BookingInput, BookingResult } from "./types";

const BASE = "https://api.treatwell.com/v1";

export class TreatwellAdapter implements AgendaAdapter {
  constructor(private apiKey: string) {}

  private headers() {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    };
  }

  async getAvailableSlots(days = 7): Promise<TimeSlot[]> {
    const date = new Date().toISOString().split("T")[0];
    const endDate = new Date(Date.now() + days * 86400_000).toISOString().split("T")[0];
    const res = await fetch(
      `${BASE}/availability?date=${date}&end_date=${endDate}`,
      { headers: this.headers(), next: { revalidate: 60 } },
    );
    if (!res.ok) return [];
    const data = await res.json();
    const slots: unknown[] = Array.isArray(data?.availability) ? data.availability : [];

    return slots.map((s: unknown) => {
      const slot = s as Record<string, unknown>;
      return {
        date: String(slot.date ?? ""),
        time: String(slot.time ?? ""),
        serviceType: String(slot.service ?? "Behandeling"),
        durationMinutes: Number(slot.duration ?? 30),
        priceEuros: Number(slot.price ?? 0),
      };
    });
  }

  async bookAppointment(input: BookingInput): Promise<BookingResult> {
    try {
      const res = await fetch(`${BASE}/appointments`, {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify({
          date: input.date,
          time: input.time,
          service: input.serviceType,
          customer: { name: input.customerName, phone: input.customerPhone },
        }),
      });
      if (!res.ok) return { ok: false, error: `Treatwell ${res.status}` };
      const data = await res.json();
      return { ok: true, externalId: String(data?.id ?? "") };
    } catch (err) {
      return { ok: false, error: String(err) };
    }
  }
}
