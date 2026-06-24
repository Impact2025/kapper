import type { Metadata } from "next";
import { PricingCards } from "@/components/marketing/pricing-cards";
import { Icon } from "@/components/ui/icon";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Prijzen",
  description:
    "Transparante, vaste maandtarieven voor KapperAssistent.nl. Essential, Pro en Elite — geen variabele minuutkosten.",
  alternates: { canonical: "/prijzen" },
};

const faq = [
  {
    q: "Zijn er variabele kosten per gesprek of per minuut?",
    a: "Nee. Je betaalt één vast bedrag per maand, ongeacht hoeveel oproepen of WhatsApp-berichten je AI-assistent afhandelt. Geen verrassingen op je factuur.",
  },
  {
    q: "Wat houdt de setup-fee in?",
    a: "Eenmalig sluiten wij jouw agenda aan (Salonized, Phorest of Treatwell), importeren we je prijslijst en diensten, en activeren we het WhatsApp Business-account op jouw naam. Dat kost vanaf €250 en wordt door ons team gedaan — jij hoeft niets technisch te doen.",
  },
  {
    q: "Kan ik tussentijds opzeggen?",
    a: "Ja. Er is geen minimale contractduur na de proefperiode. Je zegt op via je dashboard of per e-mail, en het abonnement stopt aan het einde van de lopende maand.",
  },
  {
    q: "Wat gebeurt er na de 14 dagen gratis?",
    a: "Na de proefperiode gaat je abonnement automatisch in op het gekozen plan. Je ontvangt een herinnering drie dagen voor het einde van de trial. Opzeggen kan altijd — geen creditcard nodig om te starten.",
  },
  {
    q: "Zijn de kosten voor WhatsApp API inbegrepen?",
    a: "In het Pro- en Elite-plan zijn de WhatsApp API-kosten inbegrepen tot een redelijk gebruik (circa 500 gesprekken per maand). Boven dat aantal bespreken we een passende oplossing.",
  },
  {
    q: "Wat als mijn agenda niet wordt ondersteund?",
    a: "We ondersteunen momenteel Salonized, Phorest en Treatwell. Gebruik je een ander systeem? Neem dan contact met ons op — we kijken graag of we een maatwerkoplossing kunnen bieden.",
  },
  {
    q: "Kan ik upgraden of downgraden?",
    a: "Ja, je kunt altijd wisselen van plan via je dashboard. Bij een upgrade gaat het nieuwe plan direct in; bij een downgrade aan het einde van de lopende maand.",
  },
  {
    q: "Is er korting bij jaarlijkse betaling?",
    a: "We bieden op aanvraag jaarcontracten aan met een korting van 15%. Stuur ons een mail op hallo@kappersassistent.nl voor een offerte op maat.",
  },
];

export default function PrijzenPage() {
  return (
    <>
      {/* Hero */}
      <section className="py-xl bg-surface">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-xl">
          <div className="text-center mb-xl max-w-2xl mx-auto">
            <span className="inline-block px-sm py-xs bg-primary-fixed text-on-primary-fixed-variant rounded-full font-label-sm text-label-sm mb-md uppercase tracking-wider">
              Transparante tarieven
            </span>
            <h1 className="font-display-lg text-display-lg text-on-surface mb-md">
              Voorspelbare prijzen. Geen verrassingen.
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant">
              Geen variabele minuutprijzen. Geen verborgen kosten. Je betaalt een vaste
              prijs per maand en verdient die gemiddeld al in de eerste week terug door
              gemiste oproepen die voortaan wél worden aangenomen.
            </p>
          </div>
          <PricingCards />
        </div>
      </section>

      {/* Guarantee */}
      <section className="py-xl bg-surface-container-low">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
            {[
              {
                icon: "timer",
                title: "14 dagen gratis",
                body: "Probeer alles zonder creditcard of verplichting. Stopt automatisch als je niet verder wilt.",
              },
              {
                icon: "lock_open",
                title: "Geen lock-in",
                body: "Maandelijks opzegbaar. Al jouw salondata kun je altijd exporteren — van ons of van niemand.",
              },
              {
                icon: "support_agent",
                title: "Persoonlijke onboarding",
                body: "Ons team koppelt jouw agenda en richt alles in. Jij hoeft niets technisch te doen.",
              },
            ].map((item) => (
              <div key={item.title} className="flex gap-sm rounded-xl bg-white p-md soft-shadow">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-fixed">
                  <Icon name={item.icon} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-label-md font-medium text-on-surface mb-xs">{item.title}</h3>
                  <p className="font-body-md text-label-md text-on-surface-variant">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-xl bg-surface">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-xl">
          <div className="mb-xl text-center">
            <h2 className="font-headline-lg text-headline-lg text-on-surface mb-sm">
              Veelgestelde vragen over de prijs
            </h2>
            <p className="font-body-md text-on-surface-variant">
              Geen jargon, gewoon eerlijke antwoorden.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-md max-w-4xl mx-auto">
            {faq.map((item) => (
              <div
                key={item.q}
                className="rounded-xl border border-outline-variant/40 bg-white p-md soft-shadow"
              >
                <h3 className="font-label-md font-medium text-on-surface mb-sm flex items-start gap-sm">
                  <Icon name="help" className="shrink-0 text-[20px] text-primary mt-0.5" />
                  {item.q}
                </h3>
                <p className="font-body-md text-label-md text-on-surface-variant pl-[28px]">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-xl bg-surface-container-low">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-xl">
          <div className="rounded-[2rem] bg-primary p-lg md:p-xl text-center text-on-primary relative overflow-hidden">
            <h2 className="font-display-lg text-display-lg mb-sm">
              Nog twijfels? Start gewoon gratis.
            </h2>
            <p className="font-body-lg text-body-lg opacity-90 mb-xl max-w-[34rem] mx-auto">
              Laat ons je laten zien hoeveel omzet je nu laat liggen. De scan duurt
              60 seconden en is volledig vrijblijvend.
            </p>
            <div className="flex flex-col sm:flex-row gap-md justify-center">
              <ButtonLink href="/scan" variant="white" size="lg" className="rounded-lg">
                Doe de gratis scan
              </ButtonLink>
              <ButtonLink
                href="/contact"
                variant="outline"
                size="lg"
                className="rounded-lg border-white/60 text-white hover:bg-white/10"
              >
                Praat met ons team
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
