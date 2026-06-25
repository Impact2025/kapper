import type { AgendaAdapter, TimeSlot, BookingInput, BookingResult } from "./types";

const BASE = "https://api.salonized.com/v2";

export class SalonizedAdapter implements AgendaAdapter {
  constructor(private apiKey: string) {}

  private async get(path: string) {
    const res = await fetch(`${BASE}${path}`, {
      headers: { Authorization: `Bearer ${this.apiKey}`, Accept: "application/json" },
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error(`Salonized API ${res.status}: ${path}`);
    return res.json();
  }

  private async post(path: string, body: unknown) {
    const res = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Salonized API ${res.status}: ${text}`);
    }
    return res.json();
  }

  async getAvailableSlots(days = 7): Promise<TimeSlot[]> {
    const startDate = new Date().toISOString().split("T")[0];
    const endDate = new Date(Date.now() + days * 86400_000).toISOString().split("T")[0];

    const data = await this.get(`/slots?start_date=${startDate}&end_date=${endDate}&available=true`);
    const rawSlots: unknown[] = Array.isArray(data?.data) ? data.data : [];

    return rawSlots.map((s: unknown) => {
      const slot = s as Record<string, unknown>;
      const startAt = String(slot.start_at ?? "");
      const [date = "", timeFull = ""] = startAt.split("T");
      const time = timeFull.slice(0, 5);
      return {
        date,
        time,
        serviceType: String(slot.service_name ?? "Behandeling"),
        durationMinutes: Number(slot.duration ?? 30),
        priceEuros: Number(slot.price ?? 0),
      };
    });
  }

  async bookAppointment(input: BookingInput): Promise<BookingResult> {
    try {
      const data = await this.post("/appointments", {
        start_at: `${input.date}T${input.time}:00`,
        client: { name: input.customerName, phone: input.customerPhone },
        service_name: input.serviceType,
      });
      return { ok: true, externalId: String(data?.data?.id ?? "") };
    } catch (err) {
      return { ok: false, error: String(err) };
    }
  }
}
