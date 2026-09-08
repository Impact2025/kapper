import { SalonizedAdapter } from "./salonized";
import { PhorestAdapter } from "./phorest";
import { TreatwellAdapter } from "./treatwell";
import { AcuityAdapter } from "./acuity";
import { decrypt } from "@/lib/crypto";
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

/** Providers whose adapter calls a real availability endpoint and returns
 * genuine free/busy data (verified against official docs — see acuity.ts /
 * phorest.ts). Salonized has no availability endpoint at all and Treatwell
 * has no API surface, so both adapters always return `[]` regardless of
 * actual availability — cross-checking against them would wrongly hide
 * every slot, so callers must only trust this set for that purpose. */
export const LIVE_AVAILABILITY_PROVIDERS = new Set(["acuity", "phorest"]);

/** Credentials are stored AES-256-GCM encrypted (see lib/salon/actions.ts).
 * Falls back to the raw value for legacy rows saved before encryption was
 * added, matching the fallback pattern already used at every other call
 * site (app/api/webhooks/wati/route.ts). */
export function resolveAgendaApiKey(rawKey: string | null | undefined): string | null {
  if (!rawKey) return null;
  return decrypt(rawKey) ?? rawKey;
}
