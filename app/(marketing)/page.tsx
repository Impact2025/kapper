import type { Metadata } from "next";
import Image from "next/image";
import { Icon } from "@/components/ui/icon";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/marketing/reveal";
import { PricingCards } from "@/components/marketing/pricing-cards";
import { publicEnv } from "@/lib/env";

export const metadata: Metadata = {
  title: "Twee handen aan de stoel. Nul gemiste afspraken aan de balie.",
  description:
    "KapperAssistent is je AI-receptionist die 24/7 telefoon en WhatsApp opneemt, direct boekt in jouw agenda en no-shows voorkomt. Sub-800ms Voice-AI. White-glove setup binnen 48 uur.",
  alternates: { canonical: "/" },
};

const steps = [
  {
    n: 1,
    title: "Jij koppelt jouw agenda",
    body: "Of je nu werkt met Salonized, Phorest, Acuity of Treatwell: jij hoeft geen ingewikkelde software te leren of data te migreren. Wij richten de koppeling binnen 48 uur geruisloos voor je op.",
  },
  {
    n: 2,
    title: "Jij bepaalt de spelregels",
    body: "Wie knipt wat? Welke behandelingen mogen tegelijkertijd? Hoe lang moet een kleuring inwerken? De AI leert jouw salonfilosofie tot in detail kennen.",
  },
  {
    n: 3,
    title: "De AI maakt het werk",
    body: "Vanaf dag één worden telefoontjes en WhatsApp-berichten binnen seconden professioneel beantwoord en ingeboekt. Jij knipt; je agenda loopt vol.",
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
              Voorkom no-shows &amp; gemiste afspraken
            </span>
            <h1 className="font-display-lg text-display-lg md:text-[56px] leading-[1.1] mb-md text-on-surface">
              Twee handen aan de stoel.
              <br />
              Nul gemiste afspraken aan de balie.
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant mb-xl max-w-[32rem]">
              Terwijl jij met uiterste precisie een balayage zet, rinkelt de telefoon. Neem
              je op met verf aan je handen, of laat je de beller vertrekken naar de
              concurrent? KapperAssistent is jouw digitale salonreceptionist die 24/7 opneemt
              via telefoon en WhatsApp, direct inboekt in jouw vertrouwde agenda en no-shows
              vrijwel uitsluitend voorkomt.
            </p>
            <div className="flex flex-col sm:flex-row gap-md">
              <ButtonLink href="/scan" size="lg" className="rounded-lg">
                Bereken je gemiste omzet
              </ButtonLink>
              <ButtonLink
                href="/diensten"
                variant="outline"
                size="lg"
                className="rounded-lg border-secondary text-secondary"
              >
                Bekijk live demo
              </ButtonLink>
            </div>
            <p className="font-label-sm text-label-sm text-on-surface-variant mt-sm">
              Geen creditcard nodig · Binnen 48 uur werkend · Sub-800ms Voice-AI
            </p>
            <div className="mt-lg grid grid-cols-3 gap-sm max-w-[32rem]">
              {stats.map((s) => (
                <div key={s.value} className="flex flex-col items-start gap-xs">
                  <Icon name={s.icon} className={`${s.fg} text-[22px]`} />
                  <p className="font-label-md text-label-md font-bold text-on-surface leading-tight">
                    {s.value}
                  </p>
                  <p className="font-label-sm text-label-sm text-on-surface-variant leading-tight">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Hero visual */}
          <div className="relative order-1 lg:order-2 h-[400px] md:h-[550px]">
            <div className="absolute inset-0 bg-primary/5 rounded-3xl -rotate-3 scale-105" />
            <div className="relative h-full w-full rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
              <Image
                src="/hero.png"
                alt="Kapsster vlechtt haar van klant in een sfeervolle salon"
                fill
                priority
                className="object-cover object-center"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
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
                    "Afspraak bevestigd!"
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Problem & Solution ---------- */}
      <section id="voordelen" className="bg-surface-container-low py-lg">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-xl">
          <div className="max-w-[40rem] mx-auto text-center">
            <h2 className="font-headline-lg text-headline-lg mb-md text-on-surface">
              Focus op je vak, niet op de telefoon.
            </h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
              Je bent net bezig met een balayage of een strakke overloop en de telefoon
              gaat... Weer een onderbreking. KapperAssistent is de perfecte digitale
              receptioniste die 24/7 vloeiend Nederlands praat via telefoon en WhatsApp. Wij
              boeken, verzetten en voorkomen no-shows terwijl jij doet waar je goed in
              bent.
            </p>
            <div className="mt-lg flex flex-col sm:flex-row justify-center gap-md">
              <div className="flex items-center gap-sm">
                <Icon name="verified_user" className="text-primary" />
                <p className="font-label-md text-label-md text-on-surface">
                  Nooit meer storende oproepen
                </p>
              </div>
              <div className="flex items-center gap-sm">
                <Icon name="schedule" className="text-primary" />
                <p className="font-label-md text-label-md text-on-surface">
                  24/7 bereikbaar voor klanten
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section id="hoe-het-werkt" className="py-lg bg-surface">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-xl">
          <div className="text-center mb-xl">
            <h2 className="font-headline-lg text-headline-lg text-on-surface mb-sm">
              In 3 simpele stappen naar een rustige salon.
            </h2>
            <p className="text-on-surface-variant font-body-md max-w-[32rem] mx-auto">
              Geen technische kennis nodig. Ons team regelt de setup, jij plukt de vruchten.
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

      {/* ---------- ROI callout ---------- */}
      <section className="py-xl bg-surface-container-low">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-xl">
          <div className="glass-card rounded-[2rem] p-lg md:p-xl text-center max-w-3xl mx-auto">
            <span className="font-label-sm text-label-sm text-primary uppercase tracking-widest">
              De rekensom voor jouw salon
            </span>
            <h2 className="font-display-lg text-display-lg text-on-surface my-md">
              Eén geredde balayage per maand = +€165
            </h2>
            <div className="space-y-sm text-left max-w-md mx-auto mb-lg font-body-md text-on-surface-variant">
              <p className="flex justify-between">
                <span>Eén geredde balayage per maand</span><span>+ €165</span>
              </p>
              <p className="flex justify-between">
                <span>Twee opgevangen knipbeurten buiten openingstijden</span>
                <span>+ €110</span>
              </p>
              <p className="flex justify-between">
                <span>Twee voorkomen no-shows via SMS-herinneringen</span>
                <span>+ €130</span>
              </p>
              <p className="border-t border-outline-variant/40 pt-sm flex justify-between font-bold">
                <span>Herwonnen omzet per maand</span>
                <span className="text-primary">+ €405</span>
              </p>
              <p className="flex justify-between">
                <span>Kosten KapperAssistent Pro</span>
                <span className="text-error">- €299</span>
              </p>
              <p className="border-t border-outline-variant/40 pt-sm flex justify-between text-lg">
                <span>Netto winst per maand</span>
                <span className="text-primary font-bold">+ €106</span>
              </p>
            </div>
            <p className="font-body-sm text-on-surface-variant">
              Als KapperAssistent zich zelf in de eerste 30 dagen niet minimaal dubbel en
              dwars terugverdient in herwonnen omzet en bespaarde tijd, help ik je persoonlijk
              om het weer stop te zetten. Zonder kleine lettertjes of wurgcontracten.
            </p>
          </div>
        </div>
      </section>

      {/* ---------- Social proof ---------- */}
      <section className="py-lg bg-surface-container-highest">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-xl">
          <div className="flex flex-col items-center text-center">
            <div className="flex gap-xs mb-sm">
              {Array.from({ length: 5 }).map((_, i) => (
                <Icon key={i} name="star" filled className="text-secondary" />
              ))}
            </div>
            <blockquote className="font-headline-md text-headline-md italic text-on-surface max-w-2xl mb-base">
              "Eindelijk weer rust in de zaak. Mijn telefoon staat op stil, terwijl de
              boekingen gewoon binnenstromen. Ik kan me 100% concentreren op mijn klanten."
            </blockquote>
            <div className="flex items-center gap-sm">
              <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center">
                <Icon name="person" className="text-on-primary-fixed-variant text-[20px]" />
              </div>
              <cite className="font-label-md text-label-md text-on-surface-variant not-italic">
                Salonhouder, Amsterdam
              </cite>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Pricing ---------- */}
      <section id="prijzen" className="py-lg bg-surface">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-xl">
          <div className="text-center mb-xl">
            <h2 className="font-headline-lg text-headline-lg text-on-surface mb-sm">
              Transparante tarieven voor elke salon.
            </h2>
            <p className="text-on-surface-variant font-body-md max-w-[32rem] mx-auto">
              Vaste prijs per maand. Geen verrassingen, geen variabele minuutkosten.
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
                Start vandaag een gratis scan. Zie direct hoeveel omzet jij nu mist.
              </p>
              <ButtonLink href="/scan" variant="white" size="lg" className="rounded-lg">
                Bereken nu gratis
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
