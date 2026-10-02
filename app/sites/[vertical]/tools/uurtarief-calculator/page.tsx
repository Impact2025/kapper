import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HourlyRateCalculator } from "@/components/marketing/hourly-rate-calculator";
import { breadcrumbLd, faqLd, ldJson } from "@/lib/seo/jsonld";
import { HOURLY_RATE_TOOL_PATH, hasHourlyRateTool } from "@/lib/marketing/tools";
import { siteUrlFor } from "@/lib/verticals/site-url";
import { DEFAULT_VERTICAL_ID, getVerticalConfig, listVerticals } from "@/lib/verticals";

export function generateStaticParams() {
  return listVerticals()
    .filter((v) => v.id !== DEFAULT_VERTICAL_ID && hasHourlyRateTool(v))
    .map((v) => ({ vertical: v.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ vertical: string }> }): Promise<Metadata> {
  const { vertical } = await params;
  const pack = getVerticalConfig(vertical);
  if (!hasHourlyRateTool(pack)) return {};
  return {
    title: `Uurtarief berekenen als ${pack.terms.practitioner}`,
    description:
      "Bereken je minimale uurtarief met de methode van de KVK: zakelijke kosten, gewenst inkomen en declarabele uren. Gratis, in de browser, zonder gegevens te bewaren.",
    alternates: { canonical: HOURLY_RATE_TOOL_PATH },
  };
}

const FAQ = [
  {
    q: "Hoe berekent deze tool mijn uurtarief?",
    a: "Met de methode van de KVK: je zakelijke kosten plus wat je wilt verdienen (inclusief reservering voor belasting en premies) gedeeld door het aantal uren dat je werkelijk factureert.",
  },
  {
    q: "Waarom reken ik niet met alle 1.840 uur?",
    a: "Een werkjaar heeft volgens de KVK ongeveer 1.840 werkbare uren, maar je factureert er maar een deel van. Reistijd, offertes, administratie en inkoop zijn niet declarabel. De KVK noemt 50 tot 60% haalbaar voor een startende ondernemer. Kijk in je eigen agenda wat jij haalt.",
  },
  {
    q: "Rekent de tool ook belasting uit?",
    a: "Nee. Je neemt de reservering voor belasting en premies zelf mee in je gewenste inkomen. Voor een berekening met belasting gebruik je de rekentool van de KVK.",
  },
  {
    q: "Is dit het tarief dat ik moet vragen?",
    a: "Het is een ondergrens: onder dit tarief dekt je omzet je kosten en gewenste inkomen niet. Wat je werkelijk rekent hangt ook af van je regio, je specialisme en wat klanten bereid zijn te betalen.",
  },
  {
    q: "Waar zet ik voorrijkosten en spoedtarief?",
    a: "Reken ze apart of verwerk ze in je tarief, maar noem ze vooraf. De Autoriteit Consument & Markt adviseert klanten om bij spoed vooraf een prijsindicatie te vragen en afspraken schriftelijk te laten bevestigen.",
  },
];

/** The vak's own article about uurtarief, when there is one. */
const BLOG: Record<string, { href: string; label: string }> = {
  loodgieter: { href: "/blog/uurtarief-loodgieter-bepalen", label: "Uurtarief loodgieter bepalen: reken vanuit je kosten, niet vanuit de buurman" },
  hovenier: { href: "/blog/uurtarief-hovenier-2026", label: "Uurtarief hovenier 2026: zo bepaal je wat je moet rekenen" },
};

export default async function HourlyRateToolPage({ params }: { params: Promise<{ vertical: string }> }) {
  const { vertical } = await params;
  const pack = getVerticalConfig(vertical);
  if (!hasHourlyRateTool(pack)) notFound();
  const base = siteUrlFor(pack.id);
  const noun = pack.terms.practitioner;

  const ld = [
    breadcrumbLd(base, [
      { name: "Home", path: "/" },
      { name: "Uurtarief berekenen", path: HOURLY_RATE_TOOL_PATH },
    ]),
    faqLd(FAQ),
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: `Uurtarief berekenen als ${noun}`,
      url: `${base}${HOURLY_RATE_TOOL_PATH}`,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
      publisher: { "@type": "Organization", name: pack.brand.name, url: base },
    },
  ];

  return (
    <section className="bg-surface-container-low py-xl">
      {ld.map((d, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(d) }} />
      ))}
      <div className="mx-auto max-w-container-max px-margin-mobile md:px-xl">
        <div className="mx-auto mb-xl max-w-3xl text-center">
          <span className="mb-md inline-block rounded-full bg-secondary-fixed px-sm py-xs font-label-sm text-label-sm uppercase tracking-wider text-on-secondary-fixed-variant">
            Gratis tool
          </span>
          <h1 className="mkt-h1 mb-md text-display-lg text-on-surface">Uurtarief berekenen als {noun}</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            Vul je kosten, je gewenste inkomen en je declarabele uren in en zie direct welk uurtarief je minimaal nodig hebt. Je gegevens blijven in je browser.
          </p>
        </div>

        <div className="mx-auto max-w-4xl">
          <HourlyRateCalculator />
        </div>

        <div className="mx-auto mt-xl max-w-3xl">
          <h2 className="mkt-h2 mb-sm text-headline-lg text-on-surface">Zo werkt de berekening</h2>
          <p className="mb-md text-body-lg text-on-surface-variant">
            Volgens de{" "}
            <a href="https://www.kvk.nl/geldzaken/uurtarief-bepalen/" className="text-primary underline" rel="noopener">
              KVK
            </a>{" "}
            bepaal je een uurtarief in vier stappen: je zakelijke kosten, wat je wilt verdienen, de omzet die daarbij hoort en het aantal uren dat je kunt factureren. Benodigde omzet gedeeld door declarabele uren is je uurtarief.
          </p>

          <h2 className="mkt-h2 mb-md mt-xl text-headline-lg text-on-surface">Veelgestelde vragen</h2>
          <dl className="flex flex-col gap-md">
            {FAQ.map((f) => (
              <div key={f.q} className="rounded-xl bg-white p-md soft-shadow">
                <dt className="font-label-md text-label-md text-on-surface">{f.q}</dt>
                <dd className="mt-xs text-body-md text-on-surface-variant">{f.a}</dd>
              </div>
            ))}
          </dl>

          <nav aria-label="Meer lezen" className="mt-xl border-t border-outline-variant pt-lg">
            <p className="mb-sm font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">Lees verder</p>
            <ul className="flex flex-col gap-xs">
              {BLOG[pack.id] && (
                <li>
                  <Link href={BLOG[pack.id].href} className="text-primary underline">
                    {BLOG[pack.id].label}
                  </Link>
                </li>
              )}
              <li>
                <Link href="/oplossingen/offertesoftware" className="text-primary underline">
                  Van offerte tot betaalde factuur
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </section>
  );
}
