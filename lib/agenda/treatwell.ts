import type { AgendaAdapter, TimeSlot, BookingResult } from "./types";

/**
 * Treatwell has no self-serve, publicly documented booking API. Their
 * "Connect" product is only reachable today through Treatwell-approved
 * salon-software partners (Salonized, Phorest, ...) integrating on
 * Treatwell's side — not a bearer-token REST API a third party can call
 * directly. There is no verified endpoint to build against (unlike
 * Salonized's undocumented-but-working session-cookie API), so this adapter
 * reports itself as unavailable rather than guessing one.
 *
 * If a salon's calendar lives in Treatwell, route them to Treatwell's own
 * "Connect" integration with their salon software instead of via this app.
 */
export class TreatwellAdapter implements AgendaAdapter {
  // Signature matches the other adapters' `new XAdapter(credentials)` call
  // site even though this adapter ignores the value.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(_credentials?: string) {}

  async getAvailableSlots(): Promise<TimeSlot[]> {
    return [];
  }

  async bookAppointment(): Promise<BookingResult> {
    return {
      ok: false,
      error:
        "Treatwell heeft geen publieke boekings-API — koppel via Treatwell Connect met je salonssoftware.",
    };
  }
}
