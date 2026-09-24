/**
 * Bedrijfsgegevens op offertes en facturen — stored in
 * salons.settings.business. Pure helpers (parse + validation) so the rules a
 * Dutch factuur must satisfy are unit tested. Wettelijk verplicht op een
 * factuur: naam en adres van de ondernemer, KvK-nummer, btw-identificatie-
 * nummer, factuurnummer, datum, omschrijving, bedrag en btw per tarief.
 */
export interface BusinessProfile {
  companyName: string;
  kvk: string;
  vatNumber: string;
  iban: string;
  street: string;
  postalCode: string;
  city: string;
  email: string;
  phone: string;
  paymentTermDays: number;
  quoteValidDays: number;
  quoteIntro: string;
  invoiceFooter: string;
}

export const DEFAULT_PAYMENT_TERM_DAYS = 14;
export const DEFAULT_QUOTE_VALID_DAYS = 30;

const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");
const int = (v: unknown, fallback: number, min: number, max: number): number => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : fallback;
};

export function parseBusinessProfile(
  settings: Record<string, unknown> | null | undefined,
  fallbackName = "",
): BusinessProfile {
  const b = (settings?.business ?? {}) as Record<string, unknown>;
  return {
    companyName: str(b.companyName) || fallbackName,
    kvk: str(b.kvk),
    vatNumber: str(b.vatNumber),
    iban: str(b.iban),
    street: str(b.street),
    postalCode: str(b.postalCode),
    city: str(b.city),
    email: str(b.email),
    phone: str(b.phone),
    paymentTermDays: int(b.paymentTermDays, DEFAULT_PAYMENT_TERM_DAYS, 0, 120),
    quoteValidDays: int(b.quoteValidDays, DEFAULT_QUOTE_VALID_DAYS, 1, 365),
    quoteIntro: str(b.quoteIntro),
    invoiceFooter: str(b.invoiceFooter),
  };
}

/** Which legally required invoice fields are still empty (Dutch labels). */
export function missingInvoiceFields(p: BusinessProfile): string[] {
  const missing: string[] = [];
  if (!p.companyName) missing.push("bedrijfsnaam");
  if (!p.street || !p.postalCode || !p.city) missing.push("adres");
  if (!p.kvk) missing.push("KvK-nummer");
  if (!p.vatNumber) missing.push("btw-nummer");
  if (!p.iban) missing.push("IBAN");
  return missing;
}

/** Strip spaces, uppercase. */
export function normalizeIban(input: string): string {
  return input.replace(/\s+/g, "").toUpperCase();
}

/** ISO 13616 mod-97 check (any country; length per country not enforced). */
export function isValidIban(input: string): boolean {
  const iban = normalizeIban(input);
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(iban)) return false;
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  let remainder = 0;
  for (const ch of rearranged) {
    const v = ch >= "A" && ch <= "Z" ? String(ch.charCodeAt(0) - 55) : ch;
    for (const digit of v) remainder = (remainder * 10 + Number(digit)) % 97;
  }
  return remainder === 1;
}

/** "NL91 ABNA 0417 1643 00" — grouped by 4 for printing. */
export function formatIban(input: string): string {
  return normalizeIban(input).replace(/(.{4})/g, "$1 ").trim();
}

/** Dutch btw-id: NL + 9 digits + B + 2 digits. Accepts dots/spaces. */
export function isValidVatNumber(input: string): boolean {
  return /^NL\d{9}B\d{2}$/.test(input.replace(/[\s.]/g, "").toUpperCase());
}

export function isValidKvk(input: string): boolean {
  return /^\d{8}$/.test(input.replace(/\s/g, ""));
}
