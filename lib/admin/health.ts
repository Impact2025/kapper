/**
 * Pure customer-health scoring for the platform cockpit. Rule-based on
 * purpose: every point deducted comes with a Dutch reason the account
 * manager can read and act on — no black-box number.
 */

import type { MarginTone } from "@/lib/admin/margin";

export interface HealthInput {
  status: "trial" | "active" | "past_due" | "canceled";
  /** Days since the salon was created. */
  tenureDays: number;
  /** Days since any user of the salon last logged in; null = never. */
  daysSinceLogin: number | null;
  /** Conversations handled in the last 14 days and the 14 days before. */
  conversationsRecent: number;
  conversationsPrior: number;
  bookingsRecent: number;
  escalationsRecent: number;
  openTickets: number;
  breachedTickets: number;
  marginTone: MarginTone;
}

export type HealthBand = "gezond" | "aandacht" | "risico" | "opgezegd";

export interface HealthReason {
  label: string;
  impact: number; // negative = deducted
}

export interface HealthResult {
  score: number; // 0–100
  band: HealthBand;
  reasons: HealthReason[];
  nextAction: string;
}

/** Customers younger than this are onboarding: inactivity weighs less. */
export const ONBOARDING_DAYS = 14;

export function computeHealth(h: HealthInput): HealthResult {
  if (h.status === "canceled") {
    return { score: 0, band: "opgezegd", reasons: [{ label: "Abonnement opgezegd", impact: -100 }], nextAction: "Win-back: vraag naar de reden van opzeggen en bied een gesprek aan." };
  }

  const reasons: HealthReason[] = [];
  const deduct = (impact: number, label: string) => reasons.push({ label, impact: -impact });
  const onboarding = h.tenureDays < ONBOARDING_DAYS;

  if (h.status === "past_due") deduct(30, "Betaling mislukt (achterstallig)");

  // Usage — the strongest predictor: a receptionist nobody talks to gets canceled.
  if (h.conversationsRecent === 0) {
    deduct(onboarding ? 10 : 30, onboarding ? "Nog geen gesprekken (in onboarding)" : "Geen gesprekken in 14 dagen");
  } else if (h.conversationsPrior >= 5) {
    const change = (h.conversationsRecent - h.conversationsPrior) / h.conversationsPrior;
    if (change <= -0.5) deduct(20, `Gesprekken ${Math.round(change * 100)}% t.o.v. vorige 14 dagen`);
    else if (change <= -0.25) deduct(10, `Gesprekken ${Math.round(change * 100)}% t.o.v. vorige 14 dagen`);
  }
  if (h.conversationsRecent >= 10 && h.bookingsRecent === 0) deduct(10, "Wel gesprekken, geen boekingen");

  if (h.conversationsRecent >= 5) {
    const escalationRate = h.escalationsRecent / h.conversationsRecent;
    if (escalationRate >= 0.3) deduct(10, `${Math.round(escalationRate * 100)}% van de gesprekken geëscaleerd`);
  }

  // Engagement with the dashboard.
  if (h.daysSinceLogin === null) deduct(onboarding ? 5 : 15, "Nog nooit ingelogd");
  else if (h.daysSinceLogin > 30) deduct(15, `${h.daysSinceLogin} dagen niet ingelogd`);
  else if (h.daysSinceLogin > 14) deduct(5, `${h.daysSinceLogin} dagen niet ingelogd`);

  // Support friction.
  if (h.breachedTickets > 0) deduct(10, `${h.breachedTickets} ticket(s) over de SLA`);
  if (h.openTickets >= 3) deduct(10, `${h.openTickets} open tickets`);
  else if (h.openTickets > 0) deduct(3, `${h.openTickets} open ticket(s)`);

  // Unit economics — a risk for us rather than for the customer.
  if (h.marginTone === "loss") deduct(10, "AI-kosten hoger dan de omzet");
  else if (h.marginTone === "watch") deduct(5, "AI-kosten boven 30% van de omzet");

  const score = Math.max(0, Math.min(100, 100 + reasons.reduce((sum, r) => sum + r.impact, 0)));
  reasons.sort((a, b) => a.impact - b.impact);
  const band: HealthBand = score >= 75 ? "gezond" : score >= 50 ? "aandacht" : "risico";
  return { score, band, reasons, nextAction: nextActionFor(h, reasons, band) };
}

function nextActionFor(h: HealthInput, reasons: HealthReason[], band: HealthBand): string {
  if (h.status === "past_due") return "Betaling opvolgen: stuur een vriendelijke herinnering met betaallink.";
  if (h.breachedTickets > 0) return "Eerst de verlopen tickets beantwoorden — dit weegt zwaarder dan al het andere.";
  if (h.conversationsRecent === 0 && h.tenureDays < ONBOARDING_DAYS) return "Onboarding-check: staat WhatsApp/telefoon al gekoppeld? Plan een korte belafspraak.";
  if (h.conversationsRecent === 0) return "Bellen: de receptioniste krijgt geen gesprekken — koppeling of doorschakeling controleren.";
  if (reasons.some((r) => r.label.startsWith("Gesprekken -"))) return "Navragen wat er veranderd is (seizoen, doorschakeling uit, concurrent?).";
  if (h.marginTone === "loss" || h.marginTone === "watch") return "Upgrade voorstellen of verbruik doorlichten (lange gesprekken, loops).";
  if (h.daysSinceLogin === null || (h.daysSinceLogin ?? 0) > 14) return "Maandoverzicht sturen met hun resultaten — laat de waarde zien.";
  if (band === "gezond") return "Goed moment voor een review- of referral-verzoek.";
  return "Kort contactmoment inplannen.";
}

/** Share-change helper for trend arrows: null when there's no baseline. */
export function pctChange(current: number, previous: number): number | null {
  if (!previous) return null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}
