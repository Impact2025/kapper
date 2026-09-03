import type { AgendaAdapter, TimeSlot, BookingInput, BookingResult } from "./types";

const BASE = "https://api.salonized.com";

/**
 * Salonized publishes no official, documented API — their own support confirms
 * there is no OAuth/API-key product. The only way in is the same session-cookie
 * mechanism their own web app (app.salonized.com) uses, logging in with the
 * salon's normal email + password. That surface is unversioned and can change
 * without notice; treat every response shape here as best-effort, not a contract.
 *
 * Endpoints below (POST /sessions, GET /appointments, /services, /resources,
 * /customers, /locations) are verified against a working third-party integration
 * (github.com/SabbeRubbish/gatsby-source-salonized). There is no dedicated
 * "available slots" endpoint, and Salonized exposes no working-hours/shift data
 * via this surface — so real availability cannot be computed honestly yet. That
 * requires our own employees/shifts model (tracked separately); until then this
 * adapter reports zero slots rather than inventing them.
 */
export class SalonizedAdapter implements AgendaAdapter {
  private email: string;
  private password: string;
  private cookie: string | null = null;

  constructor(credentials: string) {
    try {
      const parsed = JSON.parse(credentials) as { email?: string; password?: string };
      this.email = parsed.email ?? "";
      this.password = parsed.password ?? "";
    } catch {
      this.email = "";
      this.password = "";
    }
  }

  private async login(): Promise<string> {
    if (this.cookie) return this.cookie;
    if (!this.email || !this.password) {
      throw new Error("Salonized: geen inloggegevens geconfigureerd");
    }

    const body = `${encodeURIComponent("user[email]")}=${encodeURIComponent(this.email)}&${encodeURIComponent("user[password]")}=${encodeURIComponent(this.password)}`;

    const res = await fetch(`${BASE}/sessions`, {
      method: "POST",
      headers: {
        Origin: "https://app.salonized.com",
        Referer: "https://app.salonized.com/",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
      body,
    });
    if (!res.ok) throw new Error(`Salonized login ${res.status}`);

    const setCookie = res.headers.get("set-cookie");
    if (!setCookie) throw new Error("Salonized login: geen sessie ontvangen");

    this.cookie = setCookie;
    return this.cookie;
  }

  private async get(path: string) {
    const cookie = await this.login();
    const res = await fetch(`${BASE}${path}`, {
      headers: { Accept: "application/json", Cookie: cookie },
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error(`Salonized API ${res.status}: ${path}`);
    return res.json();
  }

  private async post(path: string, body: unknown) {
    const cookie = await this.login();
    const res = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json", Cookie: cookie },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Salonized API ${res.status}: ${text}`);
    }
    return res.json();
  }

  async getAvailableSlots(): Promise<TimeSlot[]> {
    // Confirms the connection is live (real endpoint, real auth) without
    // pretending to know free/busy gaps we have no working-hours data for.
    await this.get("/appointments");
    return [];
  }

  async bookAppointment(input: BookingInput): Promise<BookingResult> {
    // Payload shape below is unverified — Salonized has no documented write
    // API. Confirm against a real sandbox salon before relying on this path.
    try {
      const data = await this.post("/appointments", {
        start_at: `${input.date}T${input.time}:00`,
        client: { name: input.customerName, phone: input.customerPhone },
        service_name: input.serviceType,
      });
      return { ok: true, externalId: String(data?.appointment?.id ?? data?.id ?? "") };
    } catch (err) {
      return { ok: false, error: String(err) };
    }
  }
}
