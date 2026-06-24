import { env } from "@/lib/env";
import { complete } from "@/lib/ai/anthropic";

export interface ScanInput {
  url: string;
  salonName: string;
  /** Optional: estimated chairs to scale the revenue model. */
  chairs?: number;
}

export interface RevenueModel {
  avgTicket: number;
  missedCallsPerMonth: number;
  recoveredLeads: number; // 60% recovery
  extraBookings: number; // 30% conversion
  noShowSavings: number;
  totalMonthly: number;
  totalYearly: number;
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

/** Business-plan "Missed Call Revenue Formula", scaled by chair count. */
export function computeRevenue(chairs = 6): RevenueModel {
  const avgTicket = 65;
  const missedCallsPerMonth = Math.round((chairs / 6) * 40);
  const recoveredLeads = Math.round(missedCallsPerMonth * 0.6);
  const extraBookings = Math.round(recoveredLeads * 0.3);
  const noShowSavings = Math.round((chairs / 6) * 500);
  const totalMonthly = extraBookings * avgTicket + noShowSavings;
  return {
    avgTicket,
    missedCallsPerMonth,
    recoveredLeads,
    extraBookings,
    noShowSavings,
    totalMonthly,
    totalYearly: totalMonthly * 12,
  };
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
  const normalizedUrl = normalizeUrl(input.url);
  const { performance, seo } = await runPageSpeed(normalizedUrl);
  const revenue = computeRevenue(input.chairs ?? 6);

  const checks = [
    {
      label: "Snelle, mobielvriendelijke website",
      ok: (performance ?? 0) >= 70,
      hint: "Trage sites verliezen tot 40% van mobiele bezoekers.",
    },
    {
      label: "Sterke lokale SEO-basis",
      ok: (seo ?? 0) >= 80,
      hint: "Klanten zoeken op 'kapper [stad]'. Goede SEO = meer gevonden worden.",
    },
    {
      label: "24/7 bereikbaarheid",
      ok: false,
      hint: "85% van bellers met voicemail belt direct de concurrent.",
    },
    {
      label: "No-show preventie",
      ok: false,
      hint: "No-shows kosten een gemiddelde salon ~€12.000 per jaar.",
    },
  ];

  const fallbackSummary = `Op basis van een snelle analyse van ${input.salonName} laat je naar schatting €${revenue.totalMonthly.toLocaleString(
    "nl-NL",
  )} per maand liggen aan gemiste oproepen en no-shows. KapperAssistent vangt deze oproepen 24/7 op via telefoon en WhatsApp en koppelt direct aan je agenda.`;

  let summary = fallbackSummary;
  const ai = await complete({
    model: env.ANTHROPIC_MODEL_FAST,
    maxTokens: 350,
    system:
      "Je bent een Nederlandse salon-groeiadviseur. Schrijf bondig, warm en zonder overdrijving. Max 4 zinnen.",
    prompt: `Salon: ${input.salonName} (${normalizedUrl}).
Website performance score: ${performance ?? "onbekend"}/100. SEO score: ${seo ?? "onbekend"}/100.
Geschat gemist maandinkomen: €${revenue.totalMonthly} (${revenue.extraBookings} extra afspraken + €${revenue.noShowSavings} no-show besparing).
Schrijf een persoonlijke, motiverende samenvatting van de kans voor deze salon met KapperAssistent. Geen opsomming, lopende tekst.`,
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
