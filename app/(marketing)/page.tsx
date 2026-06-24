import type { Metadata } from "next";
import { Icon } from "@/components/ui/icon";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/marketing/reveal";
import { PricingCards } from "@/components/marketing/pricing-cards";
import { publicEnv } from "@/lib/env";

export const metadata: Metadata = {
  title: "Focus op je vak, niet op de telefoon",
  alternates: { canonical: "/" },
};

const steps = [
  {
    n: 1,
    title: "Koppel je agenda",
    body: "Verbind Salonized, Phorest of Treatwell in 5 minuten. Onze AI integreert direct.",
  },
  {
    n: 2,
    title: "Stel je regels in",
    body: '"Sanne kleurt, Amber knipt alleen." De AI leert wie wat doet. Jij houdt de regie.',
  },
  {
    n: 3,
    title: "Laat de AI het werk doen",
    body: "Je receptioniste plant afspraken terwijl jij knipt. Geen gemiste inkomsten meer.",
  },
];

const stats = [
  {
    icon: "calendar_add_on",
    bg: "bg-primary-fixed",
    fg: "text-primary",
    value: "+25% boekingen",
    label: "Geen gemiste oproepen meer.",
  },
  {
    icon: "event_busy",
    bg: "bg-secondary-fixed",
    fg: "text-secondary",
    value: "<2% no-shows",
    label: "Slimme WhatsApp-reminders.",
  },
  {
    icon: "hourglass_empty",
    bg: "bg-tertiary-fixed",
    fg: "text-tertiary",
    value: "10+ uur winst",
    label: "Minder administratie per week.",
  },
];

export default function HomePage() {
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "KapperAssistent.nl",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "149",
      priceCurrency: "EUR",
    },
    description:
      "AI-receptioniste voor kapsalons: telefoon en WhatsApp, gekoppeld aan je agenda.",
    url: publicEnv.NEXT_PUBLIC_SITE_URL,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />

      {/* ---------- Hero ---------- */}
      <section className="relative pt-xl pb-lg md:pb-xl overflow-hidden">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-xl grid grid-cols-1 lg:grid-cols-2 gap-lg items-center">
          <div className="z-10 order-2 lg:order-1">
            <span className="inline-block px-sm py-xs bg-primary-fixed text-on-primary-fixed-variant rounded-full font-label-sm text-label-sm mb-md uppercase tracking-wider">
              De rust die je verdient
            </span>
            <h1 className="font-display-lg text-display-lg md:text-[56px] leading-[1.1] mb-md text-on-surface">
              Nooit meer een rinkelende telefoon terwijl je knipt.
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant mb-xl max-w-[32rem]">
              Je AI-assistent neemt op via WhatsApp en telefoon. Direct gekoppeld
              aan jouw agenda, zodat je stoelen volstromen zonder onderbrekingen.
            </p>
            <div className="flex flex-col sm:flex-row gap-md">
              <ButtonLink href="/scan" size="lg" className="rounded-lg">
                Probeer 14 dagen gratis
              </ButtonLink>
              <ButtonLink
                href="/#hoe-het-werkt"
                variant="outline"
                size="lg"
                className="rounded-lg border-secondary text-secondary"
              >
                Bekijk hoe het werkt
              </ButtonLink>
            </div>
          </div>

          {/* Hero visual */}
          <div className="relative order-1 lg:order-2 h-[400px] md:h-[550px]">
            <div className="absolute inset-0 bg-primary/5 rounded-3xl -rotate-3 scale-105" />
            <div className="relative h-full w-full rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-container via-primary-fixed-dim to-secondary-fixed" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Icon
                  name="content_cut"
                  className="text-white/30 text-[160px]"
                />
              </div>
              <div className="absolute top-md right-md glass-card p-md rounded-xl max-w-[200px] animate-pulse">
                <div className="flex items-center gap-sm mb-xs">
                  <Icon
                    name="check_circle"
                    className="text-primary text-[20px]"
                  />
                  <span className="font-label-sm text-label-sm text-primary">
                    Nieuwe boeking
                  </span>
                </div>
                <p className="font-label-md text-label-md text-on-surface">
                  Wassen &amp; Föhnen
                </p>
                <p className="font-label-sm text-label-sm text-on-surface-variant">
                  Vandaag, 14:00
                </p>
              </div>
              <div className="absolute bottom-md left-md glass-card p-md rounded-xl flex items-center gap-md">
                <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-fixed">
                  <Icon name="forum" />
                </div>
                <div>
                  <p className="font-label-sm text-label-sm font-bold">
                    AI Receptioniste
                  </p>
                  <p className="font-label-sm text-label-sm text-on-surface-variant italic">
                    &quot;Afspraak bevestigd!&quot;
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Problem & Solution ---------- */}
      <section id="voordelen" className="bg-surface-container-low py-xl">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-xl">
          <div className="flex flex-col lg:flex-row gap-xl items-center">
            <div className="w-full lg:w-1/2">
              <h2 className="font-headline-lg text-headline-lg mb-md text-on-surface">
                Focus op je vak, niet op de telefoon.
              </h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
                Je bent net bezig met een balayage of een strakke overloop en de
                telefoon gaat... Weer een onderbreking. KapperAssistent is de
                perfecte digitale receptioniste die 24/7 vloeiend Nederlands praat
                via telefoon en WhatsApp. Wij boeken, verzetten en voorkomen
                no-shows terwijl jij doet waar je goed in bent.
              </p>
              <div className="mt-lg grid grid-cols-1 sm:grid-cols-2 gap-md">
                <div className="flex items-start gap-sm">
                  <Icon name="verified_user" className="text-primary" />
                  <p className="font-label-md text-label-md text-on-surface">
                    Nooit meer storende oproepen
                  </p>
                </div>
                <div className="flex items-start gap-sm">
                  <Icon name="schedule" className="text-primary" />
                  <p className="font-label-md text-label-md text-on-surface">
                    24/7 bereikbaar voor klanten
                  </p>
                </div>
              </div>
            </div>
            <div className="w-full lg:w-1/2 grid grid-cols-2 gap-md">
              <div className="bg-white p-lg rounded-xl soft-shadow flex flex-col items-center text-center hover-lift">
                <Icon name="trending_up" className="text-primary text-[40px] mb-sm" />
                <span className="font-display-lg text-[36px] text-primary mb-xs">
                  +25%
                </span>
                <p className="font-label-md text-label-md text-on-surface-variant">
                  Meer boekingen
                </p>
              </div>
              <div className="bg-white p-lg rounded-xl soft-shadow flex flex-col items-center text-center hover-lift mt-lg">
                <Icon
                  name="history_toggle_off"
                  className="text-secondary text-[40px] mb-sm"
                />
                <span className="font-display-lg text-[36px] text-secondary mb-xs">
                  10+ uur
                </span>
                <p className="font-label-md text-label-md text-on-surface-variant">
                  Tijdwinst per week
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section id="hoe-het-werkt" className="py-xl bg-surface">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-xl">
          <div className="text-center mb-xl">
            <h2 className="font-headline-lg text-headline-lg text-on-surface mb-sm">
              In 3 simpele stappen naar een rustige salon.
            </h2>
            <p className="text-on-surface-variant font-body-md max-w-[32rem] mx-auto">
              Zonder technische kennis binnen een middag live met je eigen
              AI-assistent.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-xl relative">
            <div className="hidden md:block absolute top-8 left-base right-base h-[2px] bg-outline-variant z-0" />
            {steps.map((s, i) => (
              <Reveal key={s.n} delay={i * 120}>
                <div className="relative z-10 flex flex-col items-center text-center group">
                  <div className="w-16 h-16 rounded-full bg-primary text-on-primary flex items-center justify-center font-display-lg text-[24px] mb-md group-hover:scale-110 transition-transform shadow-lg">
                    {s.n}
                  </div>
                  <h3 className="font-headline-md text-headline-md text-on-surface mb-sm">
                    {s.title}
                  </h3>
                  <p className="font-body-md text-on-surface-variant">{s.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Social proof ---------- */}
      <section className="py-xl bg-surface-container-highest">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-xl">
          <div className="flex flex-col items-center text-center mb-xl">
            <div className="flex gap-xs mb-sm">
              {Array.from({ length: 5 }).map((_, i) => (
                <Icon key={i} name="star" filled className="text-secondary" />
              ))}
            </div>
            <blockquote className="font-headline-md text-headline-md italic text-on-surface max-w-2xl mb-base">
              &quot;Eindelijk weer rust in de zaak. Mijn telefoon staat op stil,
              terwijl de boekingen gewoon binnenstromen. Ik kan me 100%
              concentreren op mijn klanten.&quot;
            </blockquote>
            <cite className="font-label-md text-label-md text-on-surface-variant not-italic">
              — Salonhouder, Amsterdam
            </cite>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
            {stats.map((s) => (
              <div
                key={s.value}
                className="bg-white p-lg rounded-xl soft-shadow flex gap-md items-center"
              >
                <div
                  className={`w-12 h-12 rounded-lg ${s.bg} flex items-center justify-center`}
                >
                  <Icon name={s.icon} className={s.fg} />
                </div>
                <div>
                  <p className="font-label-md text-label-md font-bold text-on-surface">
                    {s.value}
                  </p>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">
                    {s.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Pricing ---------- */}
      <section id="prijzen" className="py-xl bg-surface">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-xl">
          <div className="text-center mb-xl">
            <h2 className="font-headline-lg text-headline-lg text-on-surface mb-sm">
              Transparante tarieven voor elke salon.
            </h2>
            <p className="text-on-surface-variant font-body-md max-w-[32rem] mx-auto">
              Vaste prijs per maand. Geen verrassingen, geen variabele
              minuutkosten.
            </p>
          </div>
          <PricingCards />
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="py-xl">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-xl">
          <div className="bg-primary text-on-primary rounded-[2rem] p-lg md:p-xl text-center relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="font-display-lg text-display-lg mb-md">
                Klaar voor meer rust?
              </h2>
              <p className="font-body-lg text-body-lg opacity-90 mb-xl max-w-[36rem] mx-auto">
                Start vandaag je gratis proefperiode van 14 dagen. Geen creditcard
                nodig. Stop de chaos, start met KapperAssistent.
              </p>
              <ButtonLink href="/scan" variant="white" size="lg" className="rounded-lg">
                Probeer nu gratis
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
