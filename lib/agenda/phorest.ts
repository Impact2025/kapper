import type { AgendaAdapter, TimeSlot, BookingInput, BookingResult } from "./types";

// Verified against the official Phorest third-party API (developer.phorest.com).
// Phorest has no self-serve bearer key: access is HTTP Basic auth with a
// "global/{email}" username and a password Phorest support issues on request,
// scoped to a businessId + branchId that only exist once that access is
// granted. There is no inline "any service" availability query either — every
// check is against specific serviceIds, and booking needs an existing
// clientId (Phorest has no "create client inline" on the booking call).
const MAX_SERVICES_PER_QUERY = 5;

interface PhorestCredentials {
  email: string;
  password: string;
  businessId: string;
  branchId: string;
  region?: "eu" | "us";
}

interface PhorestService {
  serviceId: string;
  name: string;
  price: number;
  duration: number;
}

export class PhorestAdapter implements AgendaAdapter {
  private creds: PhorestCredentials;
  private base: string;

  constructor(credentials: string) {
    let parsed: Partial<PhorestCredentials> = {};
    try {
      parsed = JSON.parse(credentials) as Partial<PhorestCredentials>;
    } catch {
      // leave parsed empty — requests below will fail fast with a clear error
    }
    this.creds = {
      email: parsed.email ?? "",
      password: parsed.password ?? "",
      businessId: parsed.businessId ?? "",
      branchId: parsed.branchId ?? "",
      region: parsed.region ?? "eu",
    };
    this.base =
      this.creds.region === "us"
        ? "https://api-gateway-us.phorest.com/third-party-api-server"
        : "https://api-gateway-eu.phorest.com/third-party-api-server";
  }

  private branchPath(suffix: string) {
    const { businessId, branchId } = this.creds;
    return `/api/business/${businessId}/branch/${branchId}${suffix}`;
  }

  private headers() {
    if (!this.creds.email || !this.creds.password || !this.creds.businessId || !this.creds.branchId) {
      throw new Error("Phorest: businessId, branchId, e-mail of wachtwoord ontbreekt");
    }
    const basic = Buffer.from(`global/${this.creds.email}:${this.creds.password}`).toString("base64");
    return {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  private async get(path: string) {
    const res = await fetch(`${this.base}${path}`, { headers: this.headers(), next: { revalidate: 60 } });
    if (!res.ok) throw new Error(`Phorest API ${res.status}: ${path}`);
    return res.json();
  }

  private async post(path: string, body: unknown) {
    const res = await fetch(`${this.base}${path}`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Phorest API ${res.status}: ${await res.text()}`);
    return res.json();
  }

  private async getServices(): Promise<PhorestService[]> {
    const data = await this.get(this.branchPath("/service"));
    const rows = data?._embedded?.services ?? [];
    return Array.isArray(rows) ? (rows as PhorestService[]) : [];
  }

  /** staffId -> first name, so the AI can name who's available (e.g. "Sanne kleurt om 14:00"). */
  private async getStaffNames(): Promise<Map<string, string>> {
    try {
      const data = await this.get(this.branchPath("/staff"));
      const rows: Array<{ staffId?: string; firstName?: string }> = data?._embedded?.staffs ?? [];
      return new Map(rows.filter((s) => s.staffId).map((s) => [String(s.staffId), s.firstName ?? ""]));
    } catch {
      return new Map(); // non-fatal: slots just come back without a staff name
    }
  }

  async getAvailableSlots(days = 7): Promise<TimeSlot[]> {
    const services = (await this.getServices()).slice(0, MAX_SERVICES_PER_QUERY);
    if (services.length === 0) return [];

    const startTime = new Date().toISOString();
    const endTime = new Date(Date.now() + days * 86400_000).toISOString();

    const [data, staffNames] = await Promise.all([
      this.post(this.branchPath("/appointments/availability"), {
        startTime,
        endTime,
        isOnlineAvailability: true,
        clientServiceSelections: [
          { serviceSelections: services.map((s) => ({ serviceId: s.serviceId })) },
        ],
      }),
      this.getStaffNames(),
    ]);

    const results: TimeSlot[] = [];
    const byServiceId = new Map(services.map((s) => [s.serviceId, s]));

    for (const slot of data?.data ?? []) {
      for (const clientSchedule of slot.clientSchedules ?? []) {
        for (const svc of clientSchedule.serviceSchedules ?? []) {
          const service = byServiceId.get(String(svc.serviceId));
          if (!service) continue;
          const startAt = String(svc.startTime ?? slot.startTime ?? "");
          const [date = "", timeFull = ""] = startAt.split("T");
          results.push({
            date,
            time: timeFull.slice(0, 5),
            serviceType: service.name,
            durationMinutes: service.duration,
            priceEuros: Number(svc.price ?? service.price ?? 0),
            staffName: staffNames.get(String(svc.staffId)) || undefined,
            slotId: JSON.stringify({
              serviceId: svc.serviceId,
              staffId: svc.staffId,
              startTime: startAt,
              endTime: svc.endTime,
            }),
          });
        }
      }
    }

    return results;
  }

  /** Find an existing client by phone, or create one. */
  private async resolveClientId(name: string, phone: string): Promise<string> {
    const found = await this.get(this.branchPath(`/client?phone=${encodeURIComponent(phone)}`));
    const existing = found?._embedded?.clients?.[0];
    if (existing?.clientId) return String(existing.clientId);

    const [firstName, ...rest] = name.split(" ");
    const created = await this.post(this.branchPath("/client"), {
      firstName: firstName || name,
      lastName: rest.join(" ") || "-",
      mobile: phone,
    });
    return String(created?.clientId ?? "");
  }

  async bookAppointment(input: BookingInput): Promise<BookingResult> {
    let serviceId: string | undefined;
    let staffId: string | undefined;
    let startTime: string | undefined;

    if (input.slotId) {
      try {
        const parsed = JSON.parse(input.slotId) as {
          serviceId: string;
          staffId: string;
          startTime: string;
        };
        serviceId = parsed.serviceId;
        staffId = parsed.staffId;
        startTime = parsed.startTime;
      } catch {
        return { ok: false, error: "Phorest: ongeldige slotId" };
      }
    } else {
      // No slotId (legacy phone-transcript path): re-check availability for
      // this exact date/time to find a qualified staffId — Phorest has no
      // "any staff" booking call, and guessing one risks an unqualified
      // stylist or a double-booked chair.
      try {
        const services = await this.getServices();
        const service = services.find(
          (s) => s.name.toLowerCase() === input.serviceType.toLowerCase(),
        );
        if (!service) return { ok: false, error: `Phorest: onbekende dienst "${input.serviceType}"` };

        const wantedStart = `${input.date}T${input.time}:00`;
        const data = await this.post(this.branchPath("/appointments/availability"), {
          startTime: wantedStart,
          endTime: new Date(new Date(wantedStart).getTime() + 60 * 60_000).toISOString(),
          isOnlineAvailability: true,
          clientServiceSelections: [{ serviceSelections: [{ serviceId: service.serviceId }] }],
        });
        const match = (data?.data ?? [])
          .flatMap((s: { clientSchedules?: unknown[] }) => s.clientSchedules ?? [])
          .flatMap((c: { serviceSchedules?: unknown[] }) => c.serviceSchedules ?? [])[0] as
          | { staffId?: string; startTime?: string }
          | undefined;
        if (!match?.staffId) return { ok: false, error: "Phorest: geen beschikbare medewerker voor dit tijdstip" };
        serviceId = service.serviceId;
        staffId = match.staffId;
        startTime = match.startTime ?? wantedStart;
      } catch (err) {
        return { ok: false, error: String(err) };
      }
    }

    try {
      const clientId = await this.resolveClientId(input.customerName, input.customerPhone);
      const data = await this.post(this.branchPath("/booking"), {
        clientId,
        clientAppointmentSchedules: [{ serviceId, staffId, startTime }],
        bookingStatus: "ACTIVE",
      });
      const appointmentId = data?.clientAppointmentSchedules?.[0]?.appointmentId ?? data?.bookingId;
      return { ok: true, externalId: String(appointmentId ?? "") };
    } catch (err) {
      return { ok: false, error: String(err) };
    }
  }
}
