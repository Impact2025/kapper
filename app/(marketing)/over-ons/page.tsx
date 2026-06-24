import type { Metadata } from "next";
import { Icon } from "@/components/ui/icon";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/marketing/reveal";

export const metadata: Metadata = {
  title: "Over Ons",
  description:
    "Waarom we KapperAssistent.nl hebben gebouwd: AI-technologie voor de lokale hoofdstraat, op een menselijke en laagdrempelige manier.",
  alternates: { canonical: "/over-ons" },
};

const values = [
  {
    icon: "record_voice_over",
    bg: "bg-primary-fixed",
    fg: "text-primary",
    title: "Menselijke AI",
    body: "De stemmen en berichten klinken zo natuurlijk dat klanten het verschil nauwelijks merken. Technologie die verbindt in plaats van afstand schept.",
  },
  {
    icon: "auto_awesome",
    bg: "bg-secondary-fixed",
    fg: "text-secondary",
    title: "Simpelheid boven alles",
    body: "Geen ingewikkelde dashboards of leercurves. Onze systemen werken geruisloos op de achtergrond, zodat jij je kunt focussen op de klant in de stoel.",
  },
  {
    icon: "handshake",
    bg: "bg-tertiary-fixed",
    fg: "text-tertiary",
    title: "Lokale support",
    body: "Wij praten jouw taal en helpen je persoonlijk bij de opstart. Geen anonieme helpdesk, maar partners die jouw regio en business begrijpen.",
  },
];

const milestones = [
  {
    year: "2024",
    title: "Het idee",
    body: "Een bevriende salonhouder in Amsterdam vertelt ons dat ze dagelijks 15 tot 20 oproepen mist terwijl ze aan het werk is. Elke gemiste oproep is een gemiste boeking. Wij besluiten dat dit anders kan.",
  },
  {
    year: "2025",
    title: "De eerste pilot",
    body: "We draaien een besloten pilot met zes salons in Amsterdam en Rotterdam. De AI-assistent neemt op, plant in en stuurt herinneringen. Resultaat: gemiddeld 23% meer boekingen in de eerste maand.",
  },
  {
    year: "2026",
    title: "KapperAssistent.nl live",
    body: "We openen de deuren voor alle Nederlandse kapsalons. Met WhatsApp Business API, telefonie en een directe koppeling op Salonized, Phorest en Treatwell.",
  },
];

export default function OverOnsPage() {
  return (
    <>
      {/* Mission */}
      <section className="relative py-xl px-margin-mobile md:px-xl max-w-container-max mx-auto grid grid-cols-1 lg:grid-cols-12 gap-gutter items-center overflow-hidden">
        <div className="lg:col-span-6 z-10 space-y-md">
          <span className="inline-block px-sm py-xs bg-primary-fixed text-on-primary-fixed-variant rounded-full font-label-sm text-label-sm uppercase tracking-wider">
            Ons verhaal
          </span>
          <h1 className="font-display-lg text-display-lg text-on-surface leading-tight">
            Wij bouwen de rust die kappers verdienen.
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-[36rem] leading-relaxed">
            Als je haar knipt, hoef jij niet ook de telefoon op te nemen. Wij geloven
            dat kappers en stylisten volledig bezig moeten kunnen zijn met hun vak en
            hun klanten — zonder onderbroken te worden door rinkelende telefoons of
            WhatsApp-berichten die uren onbeantwoord blijven.
          </p>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-[36rem] leading-relaxed">
            Daarom brengen wij AI-receptietechnologie naar de lokale hoofdstraat. Niet
            als kil, afstandelijk systeem — maar als een warme, vloeiend Nederlands
            sprekende assistent die jouw salon begrijpt en jouw klanten welkom laat voelen.
          </p>
        </div>
        <div className="lg:col-span-6 relative h-[400px] md:h-[500px] w-full mt-md lg:mt-0">
          <div className="absolute inset-0 bg-primary-fixed rounded-[2rem] translate-x-4 translate-y-4" />
          <div className="relative h-full w-full rounded-[2rem] overflow-hidden soft-shadow">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-container via-primary-fixed-dim to-secondary-fixed" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Icon name="diversity_3" className="text-white/30 text-[140px]" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            <div className="absolute bottom-md left-md text-on-primary">
              <p className="font-headline-md text-headline-md font-bold">
                Het team achter de rust
              </p>
              <p className="font-label-sm text-label-sm opacity-80">
                Amsterdam · opgericht 2024
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Story / milestones */}
      <section className="bg-surface-container-low py-xl px-margin-mobile md:px-xl">
        <div className="max-w-container-max mx-auto">
          <div className="mb-lg">
            <h2 className="font-headline-lg text-headline-lg text-on-surface mb-sm">
              Hoe het begon.
            </h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-[40rem]">
              KapperAssistent is niet gebouwd vanuit een vergaderzaal. Het begon met een
              eenvoudige observatie op de werkvloer van een kapsalon.
            </p>
          </div>
          <div className="relative">
            <div className="absolute left-[20px] top-0 bottom-0 w-[2px] bg-outline-variant/40 hidden md:block" />
            <div className="flex flex-col gap-lg">
              {milestones.map((m, i) => (
                <Reveal key={m.year} delay={i * 150}>
                  <div className="flex gap-md items-start">
                    <div className="shrink-0 flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center font-label-md font-medium text-[13px] z-10">
                        {m.year}
                      </div>
                    </div>
                    <div className="bg-surface-container-lowest rounded-xl p-md soft-shadow flex-1">
                      <h3 className="font-headline-md text-headline-md text-on-surface mb-xs">
                        {m.title}
                      </h3>
                      <p className="font-body-md text-body-md text-on-surface-variant">
                        {m.body}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-xl px-margin-mobile md:px-xl">
        <div className="max-w-container-max mx-auto">
          <div className="mb-lg">
            <h2 className="font-headline-lg text-headline-lg text-on-surface mb-sm">
              Waar we in geloven.
            </h2>
            <div className="h-1 w-24 bg-primary-container rounded-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
            {values.map((v, i) => (
              <Reveal key={v.title} delay={i * 150}>
                <div className="bg-surface-container-lowest p-md rounded-xl soft-shadow flex flex-col space-y-md h-full">
                  <div
                    className={`w-12 h-12 rounded-full ${v.bg} flex items-center justify-center`}
                  >
                    <Icon name={v.icon} className={v.fg} />
                  </div>
                  <div>
                    <h3 className="font-headline-md text-headline-md text-on-surface mb-sm">
                      {v.title}
                    </h3>
                    <p className="font-body-md text-body-md text-on-surface-variant">
                      {v.body}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Impact */}
      <section className="bg-surface-container-low py-xl px-margin-mobile md:px-xl">
        <div className="max-w-container-max mx-auto">
          <div className="glass-card rounded-[2rem] p-lg flex flex-col md:flex-row items-center gap-lg">
            <div className="flex-1 space-y-base">
              <span className="font-label-md text-label-md text-primary uppercase tracking-widest">
                Onze impact
              </span>
              <h2 className="font-display-lg text-display-lg text-on-surface">
                Meer rust, meer omzet.
              </h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant">
                Salonhouders besparen gemiddeld 10 uur per week aan telefoontjes en
                appjes. Dat is tijd die jij terugkrijgt voor je klanten, je team —
                of gewoon voor jezelf.
              </p>
            </div>
            <div className="flex gap-xl shrink-0">
              <div className="text-center">
                <div className="font-display-lg text-display-lg text-primary font-bold">+23%</div>
                <p className="font-label-sm text-label-sm text-on-surface-variant mt-xs">
                  Meer boekingen
                </p>
              </div>
              <div className="w-px bg-outline-variant" />
              <div className="text-center">
                <div className="font-display-lg text-display-lg text-secondary font-bold">10u</div>
                <p className="font-label-sm text-label-sm text-on-surface-variant mt-xs">
                  Tijdwinst p/week
                </p>
              </div>
              <div className="w-px bg-outline-variant" />
              <div className="text-center">
                <div className="font-display-lg text-display-lg text-on-surface font-bold">&lt;2%</div>
                <p className="font-label-sm text-label-sm text-on-surface-variant mt-xs">
                  No-shows
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-xl px-margin-mobile">
        <div className="max-w-container-max mx-auto bg-primary rounded-[2.5rem] overflow-hidden relative">
          <div className="relative z-10 py-xl px-md flex flex-col items-center text-center space-y-md">
            <h2 className="font-display-lg text-display-lg text-on-primary">
              Klaar voor een rustige salon en een volle agenda?
            </h2>
            <p className="font-body-lg text-body-lg text-on-primary/80 max-w-[36rem]">
              Doe de gratis scan en ontdek in 60 seconden hoeveel omzet jouw salon nu
              laat liggen aan gemiste oproepen en no-shows.
            </p>
            <div className="flex flex-col sm:flex-row gap-md mt-sm">
              <ButtonLink href="/scan" variant="white" size="lg" className="rounded-full">
                Start nu gratis
              </ButtonLink>
              <ButtonLink
                href="/contact"
                variant="outline"
                size="lg"
                className="rounded-full border-white/60 text-white hover:bg-white/10"
              >
                Neem contact op
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
