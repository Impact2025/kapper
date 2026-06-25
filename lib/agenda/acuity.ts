import type { AgendaAdapter, TimeSlot, BookingInput, BookingResult } from "./types";

// Acuity uses Basic auth with userId:apiKey
const BASE = "https://acuityscheduling.com/api/v1";

export class AcuityAdapter implements AgendaAdapter {
  private auth: string;

  constructor(apiKey: string) {
    // apiKey format: "userId:apiKey"
    this.auth = `Basic ${Buffer.from(apiKey).toString("base64")}`;
  }

  private headers() {
    return { Authorization: this.auth, Accept: "application/json", "Content-Type": "application/json" };
  }

  async getAvailableSlots(days = 7): Promise<TimeSlot[]> {
    const date = new Date().toISOString().split("T")[0];
    const res = await fetch(`${BASE}/availability/times?date=${date}&days=${days}`, {
      headers: this.headers(),
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const slots: unknown[] = Array.isArray(data) ? data : [];

    return slots.map((s: unknown) => {
      const slot = s as Record<string, unknown>;
      const time = String(slot.time ?? "");
      const [date = "", timeFull = ""] = time.split("T");
      return {
        date,
        time: timeFull.slice(0, 5),
        serviceType: String(slot.type ?? "Behandeling"),
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
          datetime: `${input.date}T${input.time}:00+0000`,
          firstName: input.customerName.split(" ")[0] ?? input.customerName,
          lastName: input.customerName.split(" ").slice(1).join(" ") || "",
          phone: input.customerPhone,
          type: input.serviceType,
        }),
      });
      if (!res.ok) return { ok: false, error: `Acuity ${res.status}` };
      const data = await res.json();
      return { ok: true, externalId: String(data?.id ?? "") };
    } catch (err) {
      return { ok: false, error: String(err) };
    }
  }
}
