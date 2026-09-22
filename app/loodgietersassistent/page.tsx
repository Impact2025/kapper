import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { ButtonLink } from "@/components/ui/button";

const SITE_URL = "https://www.loodgietersassistent.nl";

export const metadata: Metadata = {
  title: { absolute: "LoodgietersAssistent.nl — Nooit meer een gemiste noodoproep" },
  description:
    "LoodgietersAssistent is je AI-receptionist die 24/7 telefoon en WhatsApp opneemt, direct inplant in je agenda en nooit een spoedklus mist. Klinkt als een echte collega. Binnen 48 uur werkend.",
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: "website",
    locale: "nl_NL",
    url: SITE_URL,
    siteName: "LoodgietersAssistent.nl",
    title: "LoodgietersAssistent.nl — Nooit meer een gemiste noodoproep",
    description:
      "Je AI-receptionist neemt 24/7 op via telefoon en WhatsApp, gekoppeld aan je agenda. Meer klussen, minder gemiste oproepen, meer rust.",
  },
  robots: { index: true, follow: true },
};

const steps = [
  {
    n: 1,
    title: "Jij koppelt jouw agenda",
    body: "Of je nu met Salonized-achtige planningssoftware werkt of gewoon een digitale agenda: wij richten de koppeling binnen 48 uur geruisloos voor je in. Geen migratie, geen gedoe.",
  },
  {
    n: 2,
    title: "Jij bepaalt de spelregels",
    body: "Welke klussen zijn spoed? Hoe lang staat een monteur gemiddeld op een klus ingepland? Wanneer mag er wel of niet worden doorverbonden? De AI leert jouw manier van werken.",
  },
  {
    n: 3,
    title: "De AI neemt het werk uit handen",
    body: "Vanaf dag één worden telefoontjes en WhatsApp-berichten binnen seconden professioneel beantwoord en ingepland. Jij bent onder de gootsteen bezig; je agenda loopt vol.",
  },
];

const stats = [
  {
    icon: "call",
    bg: "bg-primary-fixed",
    fg: "text-primary",
    value: "Nooit gemist",
    label: "Ook 's avonds en in het weekend.",
  },
  {
    icon: "event_available",
    bg: "bg-secondary-fixed",
    fg: "text-secondary",
    value: "Direct ingepland",
    label: "Geen terugbel-rondjes meer.",
  },
  {
    icon: "hourglass_empty",
    bg: "bg-tertiary-fixed",
    fg: "text-tertiary",
    value: "10+ uur winst",
    label: "Minder administratie per week.",
  },
];

const plans = [
  {
    name: "Essential Assistent",
    price: 149,
    tagline: "Voor zelfstandige loodgieters.",
    features: [
      "AI beantwoordt WhatsApp 24/7 en plant direct de juiste klus in",
      "Synct automatisch met je agenda — geen dubbele invoer",
      "Onthoudt het gesprek, voelt als een collega en niet als een bot",
      "Automatische herinneringen — minder no-shows bij afspraken",
    ],
  },
  {
    name: "Pro Assistent",
    price: 299,
    tagline: "Voor bedrijven met meerdere monteurs.",
    popular: true,
    features: [
      "Alles uit Essential",
      "AI beantwoordt ook de telefoon — dag en nacht, nooit meer een gemiste spoedklus",
      "Plant slim in rond de agenda's van al je monteurs",
      "WhatsApp-berichtkosten zitten al in de prijs, geen aparte factuur",
    ],
  },
  {
    name: "Elite Cockpit",
    price: 499,
    tagline: "Voor grotere installatiebedrijven.",
    features: [
      "Alles uit Pro",
      "Reageert automatisch op Google-reviews",
      "Beheer al je vestigingen en agenda's vanuit één cockpit",
      "Maandelijks rapport: precies wat de AI je heeft opgeleverd",
    ],
  },
];

export default function LoodgietersAssistentPage() {
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "LoodgietersAssistent.nl",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "149", priceCurrency: "EUR" },
    description: "AI-receptioniste voor loodgietersbedrijven: telefoon en WhatsApp, gekoppeld aan je agenda.",
    url: SITE_URL,
  };

  return (
    <div className="flex flex-col min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />

      {/* Header */}
      <header className="bg-surface/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <nav className="flex justify-between items-center w-full px-margin-mobile md:px-xl py-base max-w-container-max mx-auto">
          <Link href="/" className="flex items-center gap-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-on-primary">
              <Icon name="plumbing" className="text-[22px]" />
            </div>
            <span className="font-headline-lg text-headline-lg font-bold text-primary">
              LoodgietersAssistent
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-md">
            <Link href="#hoe-het-werkt" className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors">
              Hoe het werkt
            </Link>
            <Link href="#prijzen" className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors">
              Prijzen
            </Link>
          </div>
          <div className="flex items-center gap-sm">
            <Link href="/login" className="hidden sm:inline-flex font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors">
              Inloggen
            </Link>
            <ButtonLink href="/contact" size="sm">
              Gratis kennismaking
            </ButtonLink>
          </div>
        </nav>
      </header>

      <main className="flex-grow">
        {/* Hero */}
        <section className="relative pt-xl pb-lg md:pb-xl overflow-hidden">
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-xl grid grid-cols-1 lg:grid-cols-2 gap-lg items-center">
            <div className="z-10">
              <span className="inline-block px-sm py-xs bg-primary-fixed text-on-primary-fixed-variant rounded-full font-label-sm text-label-sm mb-md uppercase tracking-wider">
                Voorkom gemiste spoedklussen
              </span>
              <h1 className="font-display-lg text-display-lg md:text-[56px] leading-[1.1] mb-md text-on-surface">
                Nooit meer een gemiste noodoproep.
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant mb-xl max-w-[32rem]">
                Terwijl jij onder een lekkende leiding ligt, rinkelt de telefoon. Neem je op met natte
                handen, of laat je de beller naar de volgende loodgieter op Google gaan? LoodgietersAssistent
                is jouw digitale receptionist die 24/7 opneemt via telefoon en WhatsApp, direct inplant in
                je agenda en spoedklussen er meteen uitfiltert.
              </p>
              <div className="flex flex-col sm:flex-row gap-md">
                <ButtonLink href="/contact" size="lg" className="rounded-lg">
                  Vraag een demo aan
                </ButtonLink>
                <ButtonLink href="#prijzen" variant="outline" size="lg" className="rounded-lg border-secondary text-secondary">
                  Bekijk prijzen
                </ButtonLink>
              </div>
              <p className="font-label-sm text-label-sm text-on-surface-variant mt-sm">
                Geen creditcard nodig · Binnen 48 uur werkend · Klinkt als een echte collega
              </p>
              <div className="mt-lg grid grid-cols-3 gap-sm max-w-[32rem]">
                {stats.map((s) => (
                  <div key={s.value} className="flex flex-col items-start gap-xs">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-full ${s.bg}`}>
                      <Icon name={s.icon} className={`text-[18px] ${s.fg}`} />
                    </div>
                    <div className="font-label-md text-label-md text-on-surface">{s.value}</div>
                    <div className="text-label-sm text-on-surface-variant">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative z-10 rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-lg soft-shadow">
              <div className="flex items-center gap-sm mb-md">
                <Icon name="chat" className="text-[22px] text-primary" />
                <span className="font-label-md text-label-md text-on-surface">WhatsApp — LoodgietersAssistent</span>
              </div>
              <div className="flex flex-col gap-sm text-body-md">
                <div className="self-start max-w-[85%] rounded-xl bg-surface-container px-md py-sm text-on-surface">
                  Hoi, mijn cv-ketel lekt en het water staat al op de vloer. Kunnen jullie vandaag nog komen?
                </div>
                <div className="self-end max-w-[85%] rounded-xl bg-primary px-md py-sm text-on-primary">
                  Dat klinkt als spoed — ik zet je direct door naar de eerstvolgende vrije monteur. Kun je het
                  water bij de hoofdkraan afsluiten tot hij er is? Hij kan er over ongeveer 40 minuten zijn.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Hoe het werkt */}
        <section id="hoe-het-werkt" className="py-xl bg-surface-container-lowest">
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-xl">
            <h2 className="font-headline-lg text-headline-lg text-center mb-xl text-on-surface">
              Binnen 48 uur werkend, zonder gedoe
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
              {steps.map((s) => (
                <div key={s.n} className="flex flex-col gap-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-on-primary font-label-md text-label-md">
                    {s.n}
                  </div>
                  <h3 className="font-headline-md text-headline-md text-on-surface">{s.title}</h3>
                  <p className="text-body-md text-on-surface-variant">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Prijzen */}
        <section id="prijzen" className="py-xl">
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-xl">
            <h2 className="font-headline-lg text-headline-lg text-center mb-xs text-on-surface">Prijzen</h2>
            <p className="text-body-md text-on-surface-variant text-center mb-xl">
              Geen setup-verrassingen. Opzegbaar per maand.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
              {plans.map((p) => (
                <div
                  key={p.name}
                  className={`rounded-xl border p-lg flex flex-col gap-md ${p.popular ? "border-primary soft-shadow" : "border-outline-variant/40"}`}
                >
                  {p.popular && (
                    <span className="self-start rounded-full bg-primary px-sm py-xs text-label-sm text-on-primary uppercase tracking-wide">
                      Meest gekozen
                    </span>
                  )}
                  <div>
                    <h3 className="font-headline-md text-headline-md text-on-surface">{p.name}</h3>
                    <p className="text-label-sm text-on-surface-variant mt-xs">{p.tagline}</p>
                  </div>
                  <div className="stat-figure text-headline-lg text-on-surface">
                    €{p.price}
                    <span className="text-body-md text-on-surface-variant font-body-md"> /maand</span>
                  </div>
                  <ul className="flex flex-col gap-xs">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-xs text-label-sm text-on-surface-variant">
                        <Icon name="check_circle" filled className="mt-0.5 shrink-0 text-[16px] text-primary" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <ButtonLink href="/contact" variant={p.popular ? "primary" : "outline"} className="mt-auto">
                    Vraag een demo aan
                  </ButtonLink>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-xl bg-primary-fixed">
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-xl text-center">
            <h2 className="font-headline-lg text-headline-lg mb-sm text-on-primary-fixed">
              Klaar om nooit meer een oproep te missen?
            </h2>
            <p className="text-body-md text-on-primary-fixed-variant mb-md max-w-[32rem] mx-auto">
              Plan een gratis kennismaking — binnen 48 uur werkend, geen creditcard nodig.
            </p>
            <ButtonLink href="/contact" size="lg" variant="white" className="rounded-lg">
              Vraag een demo aan
            </ButtonLink>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-outline-variant/40 py-lg">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-xl flex flex-col sm:flex-row items-center justify-between gap-sm">
          <span className="text-label-sm text-on-surface-variant">
            © {new Date().getFullYear()} LoodgietersAssistent.nl
          </span>
          <div className="flex items-center gap-md">
            <Link href="/privacy" className="text-label-sm text-on-surface-variant hover:text-primary">
              Privacy
            </Link>
            <Link href="/voorwaarden" className="text-label-sm text-on-surface-variant hover:text-primary">
              Voorwaarden
            </Link>
            <Link href="/contact" className="text-label-sm text-on-surface-variant hover:text-primary">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
