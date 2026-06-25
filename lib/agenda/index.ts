import { SalonizedAdapter } from "./salonized";
import { PhorestAdapter } from "./phorest";
import { TreatwellAdapter } from "./treatwell";
import { AcuityAdapter } from "./acuity";
import type { AgendaAdapter } from "./types";

export type { AgendaAdapter, TimeSlot, BookingInput, BookingResult } from "./types";

export function getAgendaAdapter(
  provider: string | null | undefined,
  apiKey: string | null | undefined,
): AgendaAdapter | null {
  if (!provider || !apiKey) return null;
  switch (provider) {
    case "salonized": return new SalonizedAdapter(apiKey);
    case "phorest":   return new PhorestAdapter(apiKey);
    case "treatwell": return new TreatwellAdapter(apiKey);
    case "acuity":    return new AcuityAdapter(apiKey);
    default:          return null;
  }
}
