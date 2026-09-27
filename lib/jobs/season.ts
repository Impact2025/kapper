import { inSeason, MONTH_NAMES_SHORT, type ContractCadence } from "@/lib/jobs/model";

/**
 * Seizoenskalender voor onderhoudscontracten: per maand de verwachte beurten
 * en omzet. Pure functies — unit tested. Gebruikt dezelfde `inSeason` als de
 * contractgenerator, zodat de kalender klopt met wat er echt gepland wordt.
 */
export type SeasonContract = ContractCadence & { priceCents: number };

/** Verwachte beurten in een gegeven maand (1–12); 0 buiten het seizoen. */
export function visitsInMonth(c: ContractCadence, month: number): number {
  if (!inSeason(c, month)) return 0;
  if (c.intervalWeeks) return 52 / 12 / c.intervalWeeks;
  return 1 / Math.max(1, c.intervalMonths);
}

export interface SeasonMonth {
  month: number;
  label: string;
  visits: number;
  revenueCents: number;
}

/** Verwachte beurten en omzet (excl. btw) per maand over alle contracten. */
export function seasonTotals(contracts: SeasonContract[]): SeasonMonth[] {
  return MONTH_NAMES_SHORT.map((label, i) => {
    const month = i + 1;
    let visits = 0;
    let revenueCents = 0;
    for (const c of contracts) {
      const v = visitsInMonth(c, month);
      visits += v;
      revenueCents += v * c.priceCents;
    }
    return { month, label, visits: Math.round(visits * 10) / 10, revenueCents: Math.round(revenueCents) };
  });
}
