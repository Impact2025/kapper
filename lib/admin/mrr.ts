/**
 * Pure MRR movement analysis between two snapshots (mrr_snapshots). Standard
 * SaaS decomposition: end = start + new + expansion − contraction − churn
 * (+ reactivation). Amounts in euro cents.
 */

export interface MrrPoint {
  salonId: string;
  mrrCents: number;
}

export interface MrrMovements {
  startCents: number;
  endCents: number;
  newCents: number;
  expansionCents: number;
  contractionCents: number;
  churnCents: number;
  newCustomers: number;
  churnedCustomers: number;
  /** Net revenue retention over the period, % (null without starting MRR). */
  nrrPct: number | null;
}

/**
 * `start` is the earlier snapshot; a salon absent there (or at 0) with MRR at
 * the end counts as new; present with MRR at start and 0/absent at end is churn.
 */
export function mrrMovements(start: MrrPoint[], end: MrrPoint[]): MrrMovements {
  const before = new Map(start.map((p) => [p.salonId, Math.max(0, p.mrrCents)]));
  const after = new Map(end.map((p) => [p.salonId, Math.max(0, p.mrrCents)]));
  const ids = new Set([...before.keys(), ...after.keys()]);

  const m: MrrMovements = {
    startCents: 0,
    endCents: 0,
    newCents: 0,
    expansionCents: 0,
    contractionCents: 0,
    churnCents: 0,
    newCustomers: 0,
    churnedCustomers: 0,
    nrrPct: null,
  };

  for (const id of ids) {
    const a = before.get(id) ?? 0;
    const b = after.get(id) ?? 0;
    m.startCents += a;
    m.endCents += b;
    if (a === 0 && b > 0) {
      m.newCents += b;
      m.newCustomers++;
    } else if (a > 0 && b === 0) {
      m.churnCents += a;
      m.churnedCustomers++;
    } else if (b > a) m.expansionCents += b - a;
    else if (a > b) m.contractionCents += a - b;
  }

  if (m.startCents > 0) {
    const retained = m.startCents + m.expansionCents - m.contractionCents - m.churnCents;
    m.nrrPct = Math.round((retained / m.startCents) * 1000) / 10;
  }
  return m;
}
