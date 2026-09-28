import { env } from "@/lib/env";
import { complete } from "@/lib/ai/anthropic";
import { getVerticalConfig } from "@/lib/verticals";
import { scanProfileFor, type ScanProfile } from "@/lib/scan/profiles";

export interface ScanInput {
  url: string;
  salonName: string;
  /** Vertical with a scan profile (lib/scan/profiles.ts); defaults to kapper. */
  vertical?: string;
  /** Optional: business size (chairs, monteurs, …) to scale the revenue model. */
  size?: number;
}

export interface RevenueModel {
  avgTicket: number;
  missedCallsPerMonth: number;
  recoveredLeads: number;
  extraBookings: number;
  /** Secondary monthly saving: no-shows for kapper, time saved for trades (see savingsLabel). */
  noShowSavings: number;
  totalMonthly: number;
  totalYearly: number;
  /** Display labels; absent on scans stored before scans were per vertical. */
  bookingsLabel?: string;
  savingsLabel?: string;
  recoveryRate?: number;
  conversionRate?: number;
}

export interface ScanResult {
  url: string;
  normalizedUrl: string;
  performanceScore: number | null; // 0-100
  seoScore: number | null; // 0-100
  mobileFriendly: boolean | null;
  checks: { label: string; ok: boolean; hint: string }[];
  revenue: RevenueModel;
  summary: string;
  generatedAt: string;
}

function normalizeUrl(raw: string): string {
  let u = raw.trim();
  if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
  try {
    return new URL(u).toString();
  } catch {
    return u;
  }
}

/**
 * Missed Call Revenue Formula, per vertical: missed calls scale with business
 * size, a share is recovered and converts at the average ticket, plus a
 * secondary saving (no-shows / admin time). Kapper at 6 chairs is the
 * business-plan baseline.
 */
export function computeRevenue(size?: number, vertical: string = "kapper"): RevenueModel {
  const p: ScanProfile = scanProfileFor(vertical) ?? scanProfileFor("kapper")!;
  const units = size ?? p.sizeDefault;
  const avgTicket = p.avgTicket;
  const missedCallsPerMonth = Math.round(units * p.missedCallsPerUnit);
  const recoveredLeads = Math.round(missedCallsPerMonth * p.recoveryRate);
  const extraBookings = Math.round(recoveredLeads * p.conversionRate);
  const noShowSavings = Math.round(units * p.savingsPerUnit);
  const totalMonthly = extraBookings * avgTicket + noShowSavings;
  return {
    avgTicket,
    missedCallsPerMonth,
    recoveredLeads,
    extraBookings,
    noShowSavings,
    totalMonthly,
    totalYearly: totalMonthly * 12,
    bookingsLabel: p.bookingsLabel,
    savingsLabel: p.savingsLabel,
    recoveryRate: p.recoveryRate,
    conversionRate: p.conversionRate,
  };
}

/** The checklist shown under the scan result. */
export function scanChecks(p: ScanProfile, performance: number | null, seo: number | null) {
  return [
    {
      label: "Snelle, mobielvriendelijke website",
      ok: (performance ?? 0) >= 70,
      hint: "Trage sites verliezen tot 40% van mobiele bezoekers.",
    },
    {
      label: "Sterke lokale SEO-basis",
      ok: (seo ?? 0) >= 80,
      hint: `Klanten zoeken op '${p.searchTerm} [stad]'. Goede SEO = meer gevonden worden.`,
    },
    { label: "24/7 bereikbaarheid", ok: false, hint: p.reachabilityHint },
    { label: p.extraCheck.label, ok: false, hint: p.extraCheck.hint },
  ];
}

async function runPageSpeed(url: string): Promise<{
  performance: number | null;
  seo: number | null;
}> {
  if (!env.PAGESPEED_API_KEY) return { performance: null, seo: null };
  try {
    const api = new URL(
      "https://www.googleapis.com/pagespeedonline/v5/runPagespeed",
    );
    api.searchParams.set("url", url);
    api.searchParams.set("key", env.PAGESPEED_API_KEY);
    api.searchParams.append("category", "PERFORMANCE");
    api.searchParams.append("category", "SEO");
    api.searchParams.set("strategy", "MOBILE");

    const res = await fetch(api, { next: { revalidate: 0 } });
    if (!res.ok) return { performance: null, seo: null };
    const data = await res.json();
    const cats = data?.lighthouseResult?.categories ?? {};
    return {
      performance:
        cats.performance?.score != null
          ? Math.round(cats.performance.score * 100)
          : null,
      seo: cats.seo?.score != null ? Math.round(cats.seo.score * 100) : null,
    };
  } catch {
    return { performance: null, seo: null };
  }
}

export async function runScan(input: ScanInput): Promise<ScanResult> {
  const profile = scanProfileFor(input.vertical) ?? scanProfileFor("kapper")!;
  const brand = getVerticalConfig(profile.vertical).brand.name;
  const normalizedUrl = normalizeUrl(input.url);
  const { performance, seo } = await runPageSpeed(normalizedUrl);
  const revenue = computeRevenue(input.size, profile.vertical);
  const checks = scanChecks(profile, performance, seo);

  const fallbackSummary = `Op basis van een snelle analyse van ${input.salonName} laat je naar schatting €${revenue.totalMonthly.toLocaleString(
    "nl-NL",
  )} per maand liggen aan gemiste oproepen en ${revenue.savingsLabel!.toLowerCase()}. ${brand} vangt deze oproepen 24/7 op via telefoon en WhatsApp en zet alles direct klaar in je agenda.`;

  let summary = fallbackSummary;
  const ai = await complete({
    feature: "scan",
    model: env.OPENMODEL_MODEL,
    maxTokens: 350,
    system: `Je bent een Nederlandse ${profile.advisorRole}. Schrijf bondig, warm en zonder overdrijving. Max 4 zinnen.`,
    prompt: `${profile.vertical === "kapper" ? "Salon" : "Bedrijf"}: ${input.salonName} (${normalizedUrl}).
Website performance score: ${performance ?? "onbekend"}/100. SEO score: ${seo ?? "onbekend"}/100.
Geschat gemist maandinkomen: €${revenue.totalMonthly} (${revenue.extraBookings} ${revenue.bookingsLabel!.toLowerCase()} + €${revenue.noShowSavings} ${revenue.savingsLabel!.toLowerCase()}).
Schrijf een persoonlijke, motiverende samenvatting van de kans voor ${profile.businessNoun} met ${brand}. Geen opsomming, lopende tekst.`,
  });
  if (ai && ai.trim()) summary = ai.trim();

  return {
    url: input.url,
    normalizedUrl,
    performanceScore: performance,
    seoScore: seo,
    mobileFriendly: performance != null ? performance >= 50 : null,
    checks,
    revenue,
    summary,
    generatedAt: new Date().toISOString(),
  };
}
