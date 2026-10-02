/**
 * Uurtarief-calculator (puur rekenmodel, geen API). De methode is die van de
 * KVK: benodigde omzet (zakelijke kosten + wat je wilt verdienen, inclusief
 * reservering voor belasting en premies) gedeeld door het aantal declarabele
 * uren. Bron: https://www.kvk.nl/geldzaken/uurtarief-bepalen/ — 230 werkdagen
 * van 8 uur is 1.840 uur; een beginnend ondernemer kan 50 tot 60% daarvan
 * factureren. Belasting wordt hier niet berekend: dat reserveert de gebruiker
 * zelf in het gewenste inkomen.
 */
export const WORKABLE_HOURS_PER_YEAR = 1840;
export const DEFAULT_VAT_PERCENT = 21;

export interface HourlyRateInput {
  /** Zakelijke kosten per jaar, in euro's. */
  costsPerYear: number;
  /** Gewenst inkomen per jaar, inclusief reservering voor belasting en premies. */
  incomePerYear: number;
  /** Welk deel van de 1.840 werkbare uren je factureert (10-100). */
  billablePercent: number;
  vatPercent?: number;
}

export interface HourlyRateResult {
  revenueNeeded: number;
  billableHours: number;
  /** Null when there are no billable hours to divide by. */
  rateExVat: number | null;
  rateInclVat: number | null;
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, Number.isFinite(n) ? n : min));

export function computeHourlyRate(input: HourlyRateInput): HourlyRateResult {
  const costs = Math.max(0, Number.isFinite(input.costsPerYear) ? input.costsPerYear : 0);
  const income = Math.max(0, Number.isFinite(input.incomePerYear) ? input.incomePerYear : 0);
  const percent = clamp(input.billablePercent, 10, 100);
  const vat = clamp(input.vatPercent ?? DEFAULT_VAT_PERCENT, 0, 100);

  const revenueNeeded = costs + income;
  const billableHours = Math.round((WORKABLE_HOURS_PER_YEAR * percent) / 100);
  if (billableHours <= 0) return { revenueNeeded, billableHours: 0, rateExVat: null, rateInclVat: null };
  const rateExVat = revenueNeeded / billableHours;
  return { revenueNeeded, billableHours, rateExVat, rateInclVat: rateExVat * (1 + vat / 100) };
}
