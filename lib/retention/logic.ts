/**
 * Fase 5 Client ReConnect — pure decision logic, kept separate from the cron
 * route's DB plumbing so it's unit-testable without mocking the whole query
 * chain (same pattern as isDebounceQuiet in lib/ai/wati-turn.ts).
 */

const RETENTION_COOLDOWN_MS = 30 * 24 * 3600_000; // 30 days
const OVERDUE_FACTOR = 1.5;

export { RETENTION_COOLDOWN_MS, OVERDUE_FACTOR };

/**
 * True once a customer is overdue for a reactivation nudge: they have at
 * least two past (non-cancelled) visits to establish their own rhythm, no
 * upcoming appointment already booked, they're overdue by more than
 * OVERDUE_FACTOR × their own average interval, and they haven't been sent a
 * reactivation message within the cooldown window.
 */
export function shouldSendRetentionMessage(input: {
  pastAppointmentTimes: Date[]; // ascending, appointments strictly before `now`
  hasUpcoming: boolean;
  lastRetentionSentAt: Date | null;
  now: Date;
}): boolean {
  const { pastAppointmentTimes, hasUpcoming, lastRetentionSentAt, now } = input;
  if (hasUpcoming) return false;
  if (pastAppointmentTimes.length < 2) return false;
  if (lastRetentionSentAt && now.getTime() - lastRetentionSentAt.getTime() < RETENTION_COOLDOWN_MS) {
    return false;
  }

  const gaps: number[] = [];
  for (let i = 1; i < pastAppointmentTimes.length; i++) {
    gaps.push(pastAppointmentTimes[i]!.getTime() - pastAppointmentTimes[i - 1]!.getTime());
  }
  const avgGapMs = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  const lastVisit = pastAppointmentTimes[pastAppointmentTimes.length - 1]!;
  const overdueMs = now.getTime() - lastVisit.getTime();

  return overdueMs >= avgGapMs * OVERDUE_FACTOR;
}
