import type { Metadata } from "next";
import Link from "next/link";
import { NoShowCalculator } from "@/components/marketing/no-show-calculator";

export const metadata: Metadata = {
  title: "No-showkosten calculator voor kappers",
  description:
    "Bereken in 10 seconden hoeveel omzet no-shows en te laat afgezegde afspraken je salon per maand kosten, en wat herinneringen en no-show beleid kunnen voorkomen.",
  alternates: { canonical: "/tools/no-showkosten-calculator" },
};

const FAQ = [
  {
    q: "Hoe betrouwbaar is deze berekening?",
    a: "De uitkomst is een schatting op basis van de cijfers die je zelf invult: geen marktgemiddelde, maar jouw afspraken, no-show percentage en gemiddelde prijs. Hoe dichter die bij de werkelijkheid liggen, hoe bruikbaarder de uitkomst.",
  },
  {
    q: "Waarom voorkomt herinneringen niet alle no-shows?",
    a: "Sommige afzeggingen komen door ziekte of overmacht, en die voorkom je niet met een herinnering. De calculator gaat daarom uit van een deel van de misgelopen omzet, niet van het geheel.",
  },
  {
    q: "Wat kan ik zelf doen tegen no-shows?",
    a: "Leg je annuleringstermijn vast en vermeld hem bij het boeken, vraag bij lange of dure behandelingen om bevestiging of een aanbetaling, en houd een lijst met klanten die op korte termijn een plek willen.",
  },
];

export default function NoShowCalculatorPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <section className="py-xl bg-surface-container-low">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-xl">
        <div className="max-w-3xl mx-auto text-center mb-xl">
          <span className="inline-block px-sm py-xs bg-secondary-fixed text-on-secondary-fixed-variant rounded-full font-label-sm text-label-sm mb-md uppercase tracking-wider">
            Gratis tool
          </span>
          <h1 className="mkt-h1 text-display-lg text-on-surface mb-md">
            Wat kosten no-shows jouw salon?
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            Sleep de balkjes naar jouw situatie en zie direct de geschatte misgelopen omzet, en wat een
            no-show beleid met herinneringen daarvan kan voorkomen.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <NoShowCalculator />
        </div>

        <div className="max-w-3xl mx-auto mt-xl">
          <h2 className="font-headline-sm text-headline-sm text-on-surface mb-md">
            Veelgestelde vragen over no-showkosten
          </h2>
          <div className="space-y-md">
            {FAQ.map((f) => (
              <div key={f.q} className="bg-white rounded-xl soft-shadow p-md">
                <h3 className="font-title-md text-title-md text-on-surface mb-xs">{f.q}</h3>
                <p className="font-body-md text-body-md text-on-surface-variant">{f.a}</p>
              </div>
            ))}
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant mt-lg">
            Meer over dit onderwerp lees je in{" "}
            <Link href="/oplossingen/no-shows-voorkomen" className="text-primary underline">
              onze pagina over no-shows voorkomen
            </Link>
            .
          </p>
        </div>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </section>
  );
}
