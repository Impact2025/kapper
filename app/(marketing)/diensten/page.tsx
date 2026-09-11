import type { Metadata } from "next";
import { Icon } from "@/components/ui/icon";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/marketing/reveal";

export const metadata: Metadata = {
  title: "Diensten — Kille technologie voor warme handen aan de stoel",
  description:
    "Voice-AI met sub-800ms latentie, juridisch waterdichte WhatsApp-bevestigingen, Intelligent Double-Booking en autonome voorraadbeheer. KapperAssistent legt een schil om jouw salon.",
  alternates: { canonical: "/diensten" },
};

const services = [
  {
    icon: "call",
    bg: "bg-primary-fixed",
    fg: "text-on-primary-fixed",
    plan: "Pro & Elite",
    title: "Voice-AI Telefonist (Sub-800ms)",
    tagline: "Neemt op als een vriendelijke collega",
    body: "Terwijl jij een balayage zet, neemt de AI Voice Agent de telefoon op. De stem klinkt natuurlijk, luistert nauwkeurig en verwerkt de boeking direct — zonder wachtrij of voicemail.",
    bullets: [
      "Responst in minder dan 800 milliseconden",
      "Herhaalt de gevraagde dienst en stylist exact",
      "Boekt rechtstreeks in jouw agenda-software",
      "SIP REFER-doorschakeling naar jouw mobiel bij complexe vragen",
      "Geen gemiste oproepen, ook buiten openingstijden",
    ],
  },
  {
    icon: "forum",
    bg: "bg-secondary-fixed",
    fg: "text-on-secondary-fixed",
    plan: null,
    title: "WhatsApp Receptie met juridisch waterdichte bevestiging",
    tagline: "24/7 bereikbaar via WhatsApp Business API",
    body: "Geen trage appjes meer na sluitingstijd. Onze agent handelt boekingen binnen 60 seconden af. We vragen altijd om een actieve bevestiging van de annuleringsvoorwaarden, zodat je bij een no-show sterk staat.",
    bullets: [
      "Officiële WhatsApp Business API (geen consumer app)",
      "Actieve bevestigingsknop (pending_confirmation)",
      "Volledige PII-masking conform Artikel 9 AVG",
      "Beantwoordt veelgestelde vragen direct",
      "Boekt, verzet en annuleert automatisch",
    ],
  },
  {
    icon: "calendar_month",
    bg: "bg-tertiary-fixed",
    fg: "text-on-tertiary-fixed",
    plan: null,
    title: "Intelligent Double-Booking & Agenda-Sync",
    tagline: "Haal 30% meer omzet uit je stoel",
    body: "Sluit naadloos aan op Salonized, Phorest, Treatwell en Acuity. Ons algoritme herkent automatisch de chemische inwerktijd van een balayage of kleuring (Fase 2) en plant in dat vrije gat moeiteloos een herensnit of fohnbehandeling in. Maximale bezetting zonder overspannen personeel.",
    bullets: [
      "Directe sync: geen dubbele boekingen",
      "Herhaalt inwerktijden automatisch (bv. 35–45 min bij kleuring)",
      "Multi-agenda support voor meerdere vestigingen (Elite)",
      "Setup door ons team, jij hoeft niets technisch te doen",
    ],
  },
  {
    icon: "event_busy",
    bg: "bg-primary-fixed",
    fg: "text-on-primary-fixed",
    plan: null,
    title: "No-show Preventie",
    tagline: "Minder lege stoelen, meer omzet",
    body: "Elke no-show kost je gemiddeld €40–€80. KapperAssistent stuurt op het perfecte moment een herinnering via SMS (98% open rate) of WhatsApp. Klanten bevestigen met één woord — of je weet het op tijd om de plek op te vullen.",
    bullets: [
      "Automatische SMS-herinneringen op 48u en 2u vooraf",
      "WhatsApp-bevestigingsverzoeken (aanpasbaar per stylistschema)",
      "No-show rate daalt gemiddeld naar onder de 2%",
      "Gedifferentieerde aanbetalingen bij langdurige behandelingen",
    ],
  },
  {
    icon: "insights",
    bg: "bg-secondary-fixed",
    fg: "text-on-secondary-fixed",
    plan: "Elite",
    title: "Lokale SEO & Reputatie-Engine",
    tagline: "Word gevonden als eerste op Google Maps",
    body: "Consumenten kiezen met hun duim op Google Maps. Onze geautomatiseerde post-behandeling vraagt tevreden klanten 90 minuten na hun bezoek via WhatsApp om een recensie. De ingebouwde blog-engine publiceert autonome, geoptimaliseerde content waardoor jij lokaal onverslaanbaar wordt.",
    bullets: [
      "AI schrijft relevante, lokale content",
      "SEO-geoptimaliseerd met meta-tags en JSON-LD",
      "Automatische recensieverzoeken na afspraak",
      "Gepubliceerd op jouw eigen domein",
    ],
  },
  {
    icon: "inventory_2",
    bg: "bg-tertiary-fixed",
    fg: "text-on-tertiary-fixed",
    plan: "Pro & Elite",
    title: "Autonome Voorraad- & Praktijkbeheer",
    tagline: "Nooit meer misgrijpen naar blondeerpoeder",
    body: "Onze Inventory Agent analyseert je 30-daagse verkoopsnelheid en signaleert tijdig wanneer voorraden onder de drempelwaarde zakken. Inclusief maandelijkse rapportages over beschermde omzet, geredde calls en tijdwinst.",
    bullets: [
      "Automatische herbestelsuggesties (30-dagenanalyse)",
      "Realtime voorraadwaarschuwingen",
      "Maandelijkse geautomatiseerde rapportages",
      "Stripe checkout voor webshop-artikelen",
    ],
  },
];

const integrations = [
  { name: "Salonized", icon: "event" },
  { name: "Phorest", icon: "spa" },
  { name: "Treatwell", icon: "cut" },
  { name: "Acuity", icon: "schedule" },
  { name: "WhatsApp", icon: "chat" },
  { name: "Stripe", icon: "credit_card" },
];

const howSteps = [
  {
    n: "01",
    title: "White-glove setup",
    body: "Onze specialisten koppelen jouw agenda binnen 48 uur. Geen technische hobbels — wij regelen de API-verbinding volledig op de achtergrond.",
  },
  {
    n: "02",
    title: "Jij bepaalt de regels",
    body: "Wie knipt wat? Welke inwerktijden heeft een kleuring? De AI leert jouw salonfilosofie tot in details kennen.",
  },
  {
    n: "03",
    title: "Gaat live",
    body: "Activeer telefoon en/of WhatsApp. Boekingen komen binnen terwijl jij knipt.",
  },
  {
    n: "04",
    title: "Rust & groei",
    body: "Bekijk je metrics en ontvang maandelijks je ROI-rapport. Geniet van een volle agenda.",
  },
];

export default function DienstenPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Diensten KapperAssistent.nl",
    itemListElement: services.map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: s.title,
      description: s.body,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── Hero ── */}
      <section className="relative py-xl overflow-hidden bg-surface">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 w-[400px] h-[400px] rounded-full bg-secondary/5 blur-3xl" />
        </div>
        <div className="relative max-w-container-max mx-auto px-margin-mobile md:px-xl text-center">
          <span className="inline-block px-sm py-xs bg-primary-fixed text-on-primary-fixed-variant rounded-full font-label-sm text-label-sm mb-md uppercase tracking-wider">
            Onze diensten
          </span>
          <h1 className="font-display-lg text-display-lg md:text-[56px] leading-[1.1] text-on-surface mb-md max-w-3xl mx-auto">
            Kille technologie voor warme handen aan de behandelstoel.
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto mb-xl">
            Geen log softwarepakket dat je dwingt om je hele werkwijze om te gooien.
            KapperAssistent legt een intelligente, autonome schil om jouw bestaande salonpraktijk.
            Wij vangen de ruis weg, zodat jij je kunt focussen op je vakmanschap.
          </p>
          <div className="flex flex-col sm:flex-row gap-md justify-center">
            <ButtonLink href="/scan" size="lg" className="rounded-lg">
              Bereken gratis je gemiste omzet
            </ButtonLink>
            <ButtonLink
              href="/prijzen"
              variant="outline"
              size="lg"
              className="rounded-lg border-secondary text-secondary"
            >
              Bekijk prijzen
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* ── Service cards ── */}
      <section className="py-xl bg-surface-container-low">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
            {services.map((s, i) => (
              <Reveal key={s.title} delay={i * 80}>
                <div className="bg-white rounded-xl p-lg soft-shadow hover-lift flex flex-col h-full relative">
                  {s.plan && (
                    <span className="absolute top-md right-md font-label-sm text-label-sm text-on-surface-variant bg-surface-container px-sm py-xs rounded-full border border-outline-variant/40">
                      {s.plan}
                    </span>
                  )}
                  <div
                    className={`w-12 h-12 rounded-xl ${s.bg} flex items-center justify-center mb-md shrink-0`}
                  >
                    <Icon name={s.icon} className={`${s.fg} text-[24px]`} />
                  </div>
                  <p className={`font-label-sm text-label-sm uppercase tracking-wider mb-xs`}>
                    {s.tagline}
                  </p>
                  <h2 className="font-headline-md text-headline-md text-on-surface mb-sm">
                    {s.title}
                  </h2>
                  <p className="font-body-md text-body-md text-on-surface-variant mb-md flex-grow">
                    {s.body}
                  </p>
                  <ul className="space-y-xs">
                    {s.bullets.map((b) => (
                      <li
                        key={b}
                        className="flex items-start gap-sm font-label-md text-label-md text-on-surface"
                      >
                        <Icon
                          name="check_circle"
                          className="text-primary text-[18px] mt-px shrink-0"
                        />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Deep dive: AI receptionist ── */}
      <section className="py-xl bg-surface">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-xl grid grid-cols-1 lg:grid-cols-2 gap-xl items-center">
          <div className="space-y-md">
            <span className="inline-block px-sm py-xs bg-primary-fixed text-on-primary-fixed-variant rounded-full font-label-sm text-label-sm uppercase tracking-wider">
              Kerndienst
            </span>
            <h2 className="font-headline-lg text-headline-lg text-on-surface leading-tight">
              Jouw AI-receptionist werkt terwijl jij knipt.
            </h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
              De combinatie van WhatsApp en telefoon betekent dat geen enkele klant meer
              verloren gaat. Of ze nu appen of bellen — altijd wordt er direct en vriendelijk
              gereageerd. De afspraak staat binnen 60 seconden in je agenda.
            </p>
            <div className="grid grid-cols-2 gap-md pt-sm">
              {[
                { icon: "timer", label: "Reactietijd", value: "< 60 sec" },
                { icon: "language", label: "Taal", value: "Vloeiend NL" },
                { icon: "schedule", label: "Beschikbaar", value: "24/7" },
                { icon: "trending_up", label: "Meer boekingen", value: "+25%" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-surface-container-low rounded-xl p-md flex items-center gap-sm"
                >
                  <Icon name={stat.icon} className="text-primary text-[22px]" />
                  <div>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">
                      {stat.label}
                    </p>
                    <p className="font-label-md text-label-md text-on-surface font-medium">
                      {stat.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Visual */}
          <div className="relative h-[460px]">
            <div className="absolute inset-0 bg-primary/5 rounded-3xl -rotate-2 scale-105" />
            <div className="relative h-full w-full rounded-3xl bg-gradient-to-br from-primary-container via-primary-fixed-dim to-secondary-fixed overflow-hidden shadow-xl">
              <div className="absolute inset-0 flex items-center justify-center">
                <Icon name="forum" className="text-white/20 text-[160px]" />
              </div>
              {/* Chat bubbles */}
              <div className="absolute top-md left-md right-md space-y-sm">
                <div className="bg-white rounded-2xl rounded-tl-sm p-sm max-w-[75%] soft-shadow">
                  <p className="font-label-sm text-label-sm text-on-surface">
                    Hoi, kan ik volgende week dinsdag om 10 uur knippen bij Amber?
                  </p>
                  <p className="font-label-sm text-label-sm text-on-surface-variant text-[10px] mt-xs">
                    Klant · 09:14
                  </p>
                </div>
                <div className="bg-primary rounded-2xl rounded-tr-sm p-sm max-w-[75%] ml-auto soft-shadow">
                  <p className="font-label-sm text-label-sm text-on-primary">
                    Hoi! Dinsdag 22 juli om 10:00 bij Amber is beschikbaar. Zal ik deze
                    afspraak voor je inplannen?
                  </p>
                  <p className="font-label-sm text-label-sm text-on-primary/70 text-[10px] mt-xs">
                    AI-assistent · 09:14
                  </p>
                </div>
                <div className="bg-white rounded-2xl rounded-tl-sm p-sm max-w-[40%] soft-shadow">
                  <p className="font-label-sm text-label-sm text-on-surface">
                    Ja, graag!
                  </p>
                  <p className="font-label-sm text-label-sm text-on-surface-variant text-[10px] mt-xs">
                    Klant · 09:15
                  </p>
                </div>
              </div>
              {/* Confirmation badge */}
              <div className="absolute bottom-md left-md right-md glass-card rounded-xl p-md flex items-center gap-sm">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <Icon name="check" className="text-on-primary text-[18px]" />
                </div>
                <div>
                  <p className="font-label-md text-label-md text-on-surface font-medium">
                    Afspraak bevestigd
                  </p>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">
                    Di 22 jul · 10:00 · Amber
                  </p>
                </div>
                <span className="ml-auto font-label-sm text-label-sm text-primary bg-primary-fixed px-sm py-xs rounded-full">
                  In agenda
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-xl bg-surface">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-xl">
          <div className="text-center mb-xl">
            <h2 className="font-headline-lg text-headline-lg text-on-surface mb-sm">
              Van aanmelding tot volle agenda in 4 stappen.
            </h2>
            <p className="font-body-md text-on-surface-variant max-w-[36rem] mx-auto">
              Geen technische kennis nodig. Ons team regelt de setup, jij plukt de vruchten.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-md relative">
            <div className="hidden md:block absolute top-8 left-base right-base h-[2px] bg-outline-variant/40 z-0" />
            {howSteps.map((s, i) => (
              <Reveal key={s.n} delay={i * 100}>
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-primary text-on-primary flex items-center justify-center font-headline-md text-[18px] mb-md shadow-lg">
                    {s.n}
                  </div>
                  <h3 className="font-headline-md text-headline-md text-on-surface mb-xs">
                    {s.title}
                  </h3>
                  <p className="font-body-md text-on-surface-variant">{s.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Integrations ── */}
      <section className="py-xl bg-surface-container-highest">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-xl text-center">
          <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest mb-lg">
            Werkt naadloos samen met
          </p>
          <div className="flex flex-wrap justify-center gap-md">
            {integrations.map((item) => (
              <div
                key={item.name}
                className="flex items-center gap-sm bg-white rounded-xl px-md py-sm soft-shadow"
              >
                <Icon name={item.icon} className="text-primary text-[20px]" />
                <span className="font-label-md text-label-md text-on-surface">
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-xl bg-surface">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-xl">
          <div className="bg-primary rounded-[2rem] p-lg md:p-xl text-center relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/5 blur-2xl" />
              <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-white/5 blur-2xl" />
            </div>
            <div className="relative z-10">
              <h2 className="font-display-lg text-display-lg text-on-primary mb-md">
                Klaar om de rust te ervaren?
              </h2>
              <p className="font-body-lg text-body-lg text-on-primary/80 mb-xl max-w-[34rem] mx-auto">
                Bereken in 60 seconden hoeveel omzet jij nu mist aan gemiste oproepen en
                no-shows. Geen verplichtingen.
              </p>
              <div className="flex flex-col sm:flex-row gap-md justify-center">
                <ButtonLink href="/scan" variant="white" size="lg" className="rounded-lg">
                  Start gratis scan
                </ButtonLink>
                <ButtonLink
                  href="/contact"
                  variant="outline"
                  size="lg"
                  className="rounded-lg border-white/60 text-white hover:bg-white/10"
                >
                  Neem contact op
                </ButtonLink>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
