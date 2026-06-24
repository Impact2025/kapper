import type { Metadata } from "next";
import { Icon } from "@/components/ui/icon";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/marketing/reveal";

export const metadata: Metadata = {
  title: "Diensten — Alles voor jouw kapsalon",
  description:
    "Van AI-receptionist tot SEO-blog: ontdek alle diensten van KapperAssistent.nl die jouw salon meer boekingen en minder stress opleveren.",
  alternates: { canonical: "/diensten" },
};

const services = [
  {
    icon: "forum",
    bg: "bg-primary-fixed",
    fg: "text-primary",
    plan: null,
    title: "AI WhatsApp-assistent",
    tagline: "24/7 bereikbaar via WhatsApp",
    body: "Jouw AI-assistent leest elk WhatsApp-bericht, begrijpt de vraag en plant — of verzet — de afspraak direct in jouw agenda. Klanten krijgen binnen seconden een bevestiging, jij hoeft niets te doen.",
    bullets: [
      "Boekt, verzet en annuleert afspraken automatisch",
      "Stuurt bevestigingen en reminders",
      "Beantwoordt veelgestelde vragen (openingstijden, prijzen, stylisten)",
      "Spreekt vloeiend Nederlands, altijd vriendelijk",
    ],
  },
  {
    icon: "call",
    bg: "bg-secondary-fixed",
    fg: "text-secondary",
    plan: "Pro & Elite",
    title: "AI Voice Agent",
    tagline: "Neemt op als jij niet kunt",
    body: "Terwijl jij een balayage zet, neemt de AI Voice Agent de telefoon aan. De stem klinkt natuurlijk, luistert nauwkeurig en verwerkt de boeking direct — zonder wachtrij of voicemail.",
    bullets: [
      "Neemt op in jouw saloonnaam",
      "Herkent de gevraagde dienst en stylist",
      "Boekt rechtstreeks in jouw agenda-software",
      "Geen gemiste oproepen meer, ook buiten openingstijden",
    ],
  },
  {
    icon: "calendar_month",
    bg: "bg-tertiary-fixed",
    fg: "text-tertiary",
    plan: null,
    title: "Agenda-koppeling",
    tagline: "Werkt met jouw bestaande software",
    body: "KapperAssistent koppelt rechtstreeks op Salonized, Phorest, Treatwell en Acuity. Jij blijft je vertrouwde agenda gebruiken — wij zorgen dat de AI altijd de actuele bezetting ziet.",
    bullets: [
      "Directe sync: geen dubbele boekingen",
      "Intelligente inwerktijden per stylist",
      "Multi-agenda support voor meerdere vestigingen (Elite)",
      "Setup door ons team, jij hoeft niets technisch te doen",
    ],
  },
  {
    icon: "event_busy",
    bg: "bg-primary-fixed",
    fg: "text-primary",
    plan: null,
    title: "No-show preventie",
    tagline: "Minder lege stoelen, meer omzet",
    body: "Elke no-show kost je gemiddeld €40–€80. KapperAssistent stuurt automatisch een herinnering op het juiste moment via SMS of WhatsApp. Klanten bevestigen met één klik — of je weet het op tijd.",
    bullets: [
      "Automatische SMS-herinneringen",
      "WhatsApp-bevestigingsverzoeken (Pro+)",
      "Slimme timing: 48 uur én 2 uur van tevoren",
      "No-show rate daalt gemiddeld naar onder de 2%",
    ],
  },
  {
    icon: "edit_note",
    bg: "bg-secondary-fixed",
    fg: "text-secondary",
    plan: "Elite",
    title: "Auto-Blog SEO-engine",
    tagline: "Word gevonden door nieuwe klanten",
    body: "De Auto-Blog engine schrijft maandelijks originele blogartikelen op basis van jouw diensten, locatie en actuele trends in de kapperssector. Google indexeert ze — nieuwe klanten vinden jou.",
    bullets: [
      "AI schrijft relevante, lokale content",
      "SEO-geoptimaliseerd met meta-tags en JSON-LD",
      "Gepubliceerd op jouw eigen domein",
      "Geen schrijfwerk, geen contentbureau nodig",
    ],
  },
  {
    icon: "insights",
    bg: "bg-tertiary-fixed",
    fg: "text-tertiary",
    plan: "Alle plannen",
    title: "Analytics & Rapportages",
    tagline: "Weet precies wat jouw AI doet",
    body: "In je dashboard zie je realtime hoeveel boekingen, WhatsApp-berichten en telefoongesprekken jouw AI heeft afgehandeld. Elite-klanten ontvangen maandelijks een ROI-audit met concrete verbeterpunten.",
    bullets: [
      "Live metrics: boekingen, calls, WhatsApp, no-shows",
      "Vergelijk maand-op-maand prestaties",
      "Maandelijkse ROI-audit rapport per e-mail (Elite)",
      "Exporteer data altijd naar CSV",
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

const steps = [
  {
    n: "01",
    title: "Koppel je agenda",
    body: "Onze AI integreert direct met Salonized, Phorest of Treatwell. Klaar in 5 minuten.",
  },
  {
    n: "02",
    title: "Stel je regels in",
    body: '"Sanne doet alleen kleur, Amber knipt heren." De AI leert wie wat doet.',
  },
  {
    n: "03",
    title: "Ga live",
    body: "Activeer WhatsApp en/of telefoon. Boekingen komen binnen terwijl jij knipt.",
  },
  {
    n: "04",
    title: "Groei zonder stress",
    body: "Bekijk je metrics, ontvang je maandrapport en geniet van een volle agenda.",
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
            Alles wat jouw kapsalon nodig heeft, op één plek.
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto mb-xl">
            Van AI-receptionist tot slimme no-show preventie en lokale SEO — KapperAssistent
            neemt het werk over zodat jij je kunt focussen op je vak.
          </p>
          <div className="flex flex-col sm:flex-row gap-md justify-center">
            <ButtonLink href="/scan" size="lg" className="rounded-lg">
              Start gratis proefperiode
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
                  <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-xs">
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
                      <li key={b} className="flex items-start gap-sm font-label-md text-label-md text-on-surface">
                        <Icon name="check_circle" className="text-primary text-[18px] mt-px shrink-0" />
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
              De combinatie van WhatsApp én telefoon betekent dat geen enkele klant meer verloren gaat.
              Of ze nu appen of bellen — altijd wordt er direct en vriendelijk gereageerd.
              De afspraak staat binnen 60 seconden in je agenda.
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
                    <p className="font-label-sm text-label-sm text-on-surface-variant">{stat.label}</p>
                    <p className="font-label-md text-label-md text-on-surface font-medium">{stat.value}</p>
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
                  <p className="font-label-sm text-label-sm text-on-surface-variant text-[10px] mt-xs">Klant · 09:14</p>
                </div>
                <div className="bg-primary rounded-2xl rounded-tr-sm p-sm max-w-[75%] ml-auto soft-shadow">
                  <p className="font-label-sm text-label-sm text-on-primary">
                    Hoi! Dinsdag 22 juli om 10:00 bij Amber is beschikbaar. Zal ik deze afspraak voor je inplannen? 😊
                  </p>
                  <p className="font-label-sm text-label-sm text-on-primary/70 text-[10px] mt-xs">AI-assistent · 09:14</p>
                </div>
                <div className="bg-white rounded-2xl rounded-tl-sm p-sm max-w-[40%] soft-shadow">
                  <p className="font-label-sm text-label-sm text-on-surface">Ja, graag!</p>
                  <p className="font-label-sm text-label-sm text-on-surface-variant text-[10px] mt-xs">Klant · 09:15</p>
                </div>
              </div>
              {/* Confirmation badge */}
              <div className="absolute bottom-md left-md right-md glass-card rounded-xl p-md flex items-center gap-sm">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <Icon name="check" className="text-on-primary text-[18px]" />
                </div>
                <div>
                  <p className="font-label-md text-label-md text-on-surface font-medium">Afspraak bevestigd</p>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">Di 22 jul · 10:00 · Amber</p>
                </div>
                <span className="ml-auto font-label-sm text-label-sm text-primary bg-primary-fixed px-sm py-xs rounded-full">
                  In agenda ✓
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Deep dive: no-show preventie ── */}
      <section className="py-xl bg-surface-container-low">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-xl grid grid-cols-1 lg:grid-cols-2 gap-xl items-center">
          {/* Visual */}
          <div className="relative h-[380px] order-2 lg:order-1">
            <div className="absolute inset-0 bg-secondary/5 rounded-3xl rotate-2 scale-105" />
            <div className="relative h-full rounded-3xl bg-gradient-to-br from-secondary-container to-secondary-fixed overflow-hidden shadow-xl flex flex-col justify-center gap-md p-lg">
              {[
                { icon: "notifications", label: "48u van tevoren", msg: "Herinnering: morgen om 14:00 bij Sanne. Bevestig met 'JA'.", color: "bg-primary-fixed text-primary" },
                { icon: "check_circle", label: "Klant bevestigt", msg: "JA", color: "bg-secondary-fixed text-secondary" },
                { icon: "event_available", label: "2u van tevoren", msg: "Tot zo! Parkeren kan op het Marktplein.", color: "bg-tertiary-fixed text-tertiary" },
              ].map((item, i) => (
                <Reveal key={item.label} delay={i * 100}>
                  <div className="glass-card rounded-xl p-md flex gap-sm items-start">
                    <div className={`w-9 h-9 rounded-full ${item.color.split(" ")[0]} flex items-center justify-center shrink-0`}>
                      <Icon name={item.icon} className={`${item.color.split(" ")[1]} text-[18px]`} />
                    </div>
                    <div>
                      <p className="font-label-sm text-label-sm text-on-surface-variant">{item.label}</p>
                      <p className="font-label-md text-label-md text-on-surface">{item.msg}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          <div className="space-y-md order-1 lg:order-2">
            <span className="inline-block px-sm py-xs bg-secondary-fixed text-secondary rounded-full font-label-sm text-label-sm uppercase tracking-wider">
              No-show preventie
            </span>
            <h2 className="font-headline-lg text-headline-lg text-on-surface leading-tight">
              Elke lege stoel kost je €40 tot €80.
            </h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
              KapperAssistent stuurt op het perfecte moment een herinnering via SMS of WhatsApp.
              Klanten bevestigen met één woord — of je weet het op tijd om de plek op te vullen.
              Salons zien hun no-show rate dalen naar onder de 2%.
            </p>
            <div className="flex gap-lg pt-sm">
              <div className="text-center">
                <p className="font-display-lg text-[40px] text-secondary font-bold">&lt;2%</p>
                <p className="font-label-sm text-label-sm text-on-surface-variant">No-show rate</p>
              </div>
              <div className="w-px bg-outline-variant" />
              <div className="text-center">
                <p className="font-display-lg text-[40px] text-primary font-bold">€960</p>
                <p className="font-label-sm text-label-sm text-on-surface-variant">Meer omzet p/maand</p>
              </div>
              <div className="w-px bg-outline-variant" />
              <div className="text-center">
                <p className="font-display-lg text-[40px] text-on-surface font-bold">2×</p>
                <p className="font-label-sm text-label-sm text-on-surface-variant">Herinneringen p/afspraak</p>
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
            <p className="font-body-md text-on-surface-variant max-w-xl mx-auto">
              Geen technische kennis nodig. Ons team regelt de setup, jij plukt de vruchten.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-md relative">
            <div className="hidden md:block absolute top-8 left-base right-base h-[2px] bg-outline-variant/40 z-0" />
            {steps.map((s, i) => (
              <Reveal key={s.n} delay={i * 100}>
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-primary text-on-primary flex items-center justify-center font-headline-md text-[18px] mb-md shadow-lg">
                    {s.n}
                  </div>
                  <h3 className="font-headline-md text-headline-md text-on-surface mb-xs">{s.title}</h3>
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
                <span className="font-label-md text-label-md text-on-surface">{item.name}</span>
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
                Klaar om te starten?
              </h2>
              <p className="font-body-lg text-body-lg text-on-primary/80 mb-xl max-w-[34rem] mx-auto">
                Probeer KapperAssistent 14 dagen gratis. Geen creditcard, geen lock-in.
                Ons team regelt de volledige setup voor je.
              </p>
              <div className="flex flex-col sm:flex-row gap-md justify-center">
                <ButtonLink href="/scan" variant="white" size="lg" className="rounded-lg">
                  Start gratis proefperiode
                </ButtonLink>
                <ButtonLink
                  href="/prijzen"
                  variant="outline"
                  size="lg"
                  className="rounded-lg border-white/60 text-white hover:bg-white/10"
                >
                  Bekijk alle plannen
                </ButtonLink>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
