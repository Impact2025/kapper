import type { AgendaAdapter, TimeSlot, BookingInput, BookingResult } from "./types";

// Verified against the official Acuity Scheduling API v1
// (developers.acuityscheduling.com): Basic auth with numeric userId as
// username and the API key as password.
const BASE = "https://acuityscheduling.com/api/v1";

// Acuity requires every availability/booking call to be scoped to a numeric
// appointmentTypeID — there is no "any service" query. We resolve service
// names to that ID via /appointment-types and cap how many types we probe
// per request so a single WhatsApp reply doesn't fan out into dozens of
// upstream calls.
const MAX_TYPES_PER_QUERY = 4;
const MAX_DATES_PER_TYPE = 2;

interface AppointmentType {
  id: number;
  name: string;
  duration: number;
  price: string;
}

export class AcuityAdapter implements AgendaAdapter {
  private auth: string;

  constructor(apiKey: string) {
    // credentials format: "userId:apiKey"
    this.auth = `Basic ${Buffer.from(apiKey).toString("base64")}`;
  }

  private headers() {
    return { Authorization: this.auth, Accept: "application/json", "Content-Type": "application/json" };
  }

  private async get(path: string) {
    const res = await fetch(`${BASE}${path}`, { headers: this.headers(), next: { revalidate: 60 } });
    if (!res.ok) throw new Error(`Acuity API ${res.status}: ${path}`);
    return res.json();
  }

  private async getAppointmentTypes(): Promise<AppointmentType[]> {
    const data = await this.get("/appointment-types");
    return Array.isArray(data) ? (data as AppointmentType[]) : [];
  }

  async getAvailableSlots(days = 7): Promise<TimeSlot[]> {
    const types = (await this.getAppointmentTypes()).slice(0, MAX_TYPES_PER_QUERY);
    const month = new Date().toISOString().slice(0, 7);
    const windowEnd = new Date(Date.now() + days * 86400_000);

    const results: TimeSlot[] = [];

    for (const type of types) {
      let dates: string[];
      try {
        const dateRows: unknown[] = await this.get(
          `/availability/dates?month=${month}&appointmentTypeID=${type.id}`,
        );
        dates = Array.isArray(dateRows)
          ? dateRows
              .map((d) => String((d as Record<string, unknown>).date ?? ""))
              .filter((d) => d && new Date(d) <= windowEnd)
              .slice(0, MAX_DATES_PER_TYPE)
          : [];
      } catch {
        continue;
      }

      for (const date of dates) {
        try {
          const timeRows: unknown[] = await this.get(
            `/availability/times?date=${date}&appointmentTypeID=${type.id}`,
          );
          for (const t of Array.isArray(timeRows) ? timeRows : []) {
            const iso = String((t as Record<string, unknown>).time ?? "");
            const [d = date, timeFull = ""] = iso.split("T");
            results.push({
              date: d,
              time: timeFull.slice(0, 5),
              serviceType: type.name,
              durationMinutes: type.duration,
              priceEuros: Number(type.price ?? 0),
              slotId: JSON.stringify({ appointmentTypeID: type.id, datetime: iso }),
            });
          }
        } catch {
          // skip this date, keep collecting others
        }
      }
    }

    return results;
  }

  async bookAppointment(input: BookingInput): Promise<BookingResult> {
    let appointmentTypeID: number | undefined;
    let datetime: string | undefined;

    if (input.slotId) {
      try {
        const parsed = JSON.parse(input.slotId) as { appointmentTypeID: number; datetime: string };
        appointmentTypeID = parsed.appointmentTypeID;
        datetime = parsed.datetime;
      } catch {
        return { ok: false, error: "Acuity: ongeldige slotId" };
      }
    } else {
      // Fallback for callers without a slotId (legacy phone-transcript path):
      // resolve the type by name instead of guessing an ID.
      try {
        const types = await this.getAppointmentTypes();
        const match = types.find(
          (t) => t.name.toLowerCase() === input.serviceType.toLowerCase(),
        );
        if (!match) return { ok: false, error: `Acuity: onbekende dienst "${input.serviceType}"` };
        appointmentTypeID = match.id;
        datetime = `${input.date}T${input.time}:00`;
      } catch (err) {
        return { ok: false, error: String(err) };
      }
    }

    const [firstName, ...rest] = input.customerName.split(" ");

    try {
      const res = await fetch(`${BASE}/appointments`, {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify({
          datetime,
          appointmentTypeID,
          firstName: firstName ?? input.customerName,
          lastName: rest.join(" ") || "-",
          phone: input.customerPhone,
        }),
      });
      if (!res.ok) return { ok: false, error: `Acuity ${res.status}: ${await res.text()}` };
      const data = await res.json();
      return { ok: true, externalId: String(data?.id ?? "") };
    } catch (err) {
      return { ok: false, error: String(err) };
    }
  }
}
