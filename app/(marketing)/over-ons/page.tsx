import type { Metadata } from "next";
import { Icon } from "@/components/ui/icon";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/marketing/reveal";

export const metadata: Metadata = {
  title: "Over Ons — KapperAssistent",
  description:
    "Waarom een oud-welzijnsdirecteur Voice-AI bouwt voor de salon: kille technologie om warme handen aan de stoel vrij te spelen.",
  alternates: { canonical: "/over-ons" },
};

const principles = [
  {
    icon: "shield",
    bg: "bg-primary-fixed",
    fg: "text-on-primary-fixed",
    title: "Eerlijke AI",
    body: "Conform Artikel 50 van de EU AI Act is onze AI altijd transparant: we openen direct met wie we zijn. Geen misleidende trucjes, maar razendsnelle spraaktechnologie die dialecten, vaktermen en inwerktijden begrijpt.",
  },
  {
    icon: "lock",
    bg: "bg-secondary-fixed",
    fg: "text-on-secondary-fixed",
    title: "Privacy by Design",
    body: "Gegevens over hoofdhuidcondities, allergieën en foto's vallen onder Artikel 9 AVG. Wij weigeren te werken met de consumenten-WhatsApp en hosten alles strikt binnen de EER met PII-masking. Veiligheid vóór winstbejag.",
  },
  {
    icon: "nightlight",
    bg: "bg-tertiary-fixed",
    fg: "text-on-tertiary-fixed",
    title: "Rust boven schaalbaarheid",
    body: "Wij verkopen geen losse uurtjes of ingewikkelde dashboards. Onze agents werken geruisloos op de achtergrond. Jij staat met twee handen aan de stoel; wij regelen de rest.",
  },
];

const milestones = [
  {
    year: "2024",
    title: "De observatie aan de stoel",
    body: "Geen theoretische plannen, maar pure ergernis over logge software. Samen met salons in de praktijk brengen we de bereikbaarheidskloof in kaart. Het doel: een agentic systeem dat de telefoon opneemt zónder dat een stylist zijn schaar hoeft neer te leggen.",
  },
  {
    year: "2025",
    title: "De vuurdoop in de praktijk",
    body: "Een besloten pilot met zes salons in Amsterdam en Rotterdam. We implementeren Voice-AI met een responstijd onder de 800 milliseconden: de beller ervaart een natuurlijk, vloeiend gesprek in plaats van een houterige robot. Het resultaat: 23% meer afspraken direct in de agenda en een daling van no-shows naar minder dan 2%.",
  },
  {
    year: "2026",
    title: "KapperAssistent staat als een huis",
    body: "We openen de deuren voor salons door heel Nederland. Direct gekoppeld aan Salonized, Phorest en Treatwell, georkestreerd met flexibele n8n-workflows en de officiële WhatsApp Business API. Geen vage IT-projecten, maar de nuchtere €180-iPhone-mentaliteit: pragmatisch gereedschap dat morgen jouw probleem oplost.",
  },
];

export default function OverOnsPage() {
  return (
    <>
      {/* Hero / Mission */}
      <section className="relative py-xl px-margin-mobile md:px-xl max-w-container-max mx-auto grid grid-cols-1 lg:grid-cols-12 gap-gutter items-center overflow-hidden">
        <div className="lg:col-span-7 z-10 space-y-base">
          <span className="inline-block px-sm py-xs bg-primary-fixed text-on-primary-fixed-variant rounded-full font-label-sm text-label-sm uppercase tracking-wider">
            Ons verhaal
          </span>
          <h1 className="font-display-lg text-display-lg text-on-surface leading-tight">
            Waarom een oud-welzijnsdirecteur Voice-AI bouwt voor de salon.
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-[40rem] leading-relaxed">
            Wanneer mensen horen dat ik als voormalig welzijnsdirecteur me druk maak
            over het aantal keren dat een kapperstelefoon overgaat, kijken sommigen
            even verrast op. Want: Vincent en AI?
          </p>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-[40rem] leading-relaxed">
            Mijn antwoord aan de keukentafel is altijd hetzelfde: juist omdat ik van
            mensen houd, omarm ik slimme technologie.
          </p>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-[40rem] leading-relaxed">
            In 2014 stapte ik bewust uit de corporate ratrace om er als fulltime vader
            te zijn voor mijn opgroeiende kinderen. Daar leerde ik de belangrijkste les
            van mijn leven: als je aandacht versnippert, ben je nergens echt. Jaren
            later zag ik op de salonvloer exact dezelfde worsteling.
          </p>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-[40rem] leading-relaxed">
            Een stylist staat met uiterste precisie een balayage te zetten. Opeens: trrrring.
            De telefoon aan de balie. Je ziet de spagaat in de ogen van de ondernemer:
            handschoenen uittrekken en opnemen (waardoor de klant in de stoel zich
            genegeerd voelt), of laten rinkelen (met een knagend schuldgevoel en
            omzetverlies)?
          </p>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-[40rem] leading-relaxed">
            Uit de praktijk weten we: 35% tot 40% van de oproepen wordt gemist tijdens
            piekuren. En 85% van de mensen die een voicemail horen, hangt binnen drie
            seconden op en belt direct de concurrent twee straten verderop. Dat is geen
            frictie; dat is pure roofbouw op je vakmanschap en je nachtrust.
          </p>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-[40rem] leading-relaxed">
            KapperAssistent is niet bedacht in een ivoren toren. Het is gebouwd op één
            filosofie: kille technologie inzetten om warme handen aan de stoel vrij te
            spelen.
          </p>
        </div>
        <div className="lg:col-span-5 relative h-[400px] md:h-[500px] w-full mt-xl lg:mt-0">
          <div className="absolute inset-0 bg-primary-fixed rounded-[2rem] translate-x-4 translate-y-4" />
          <div className="relative h-full w-full rounded-[2rem] overflow-hidden soft-shadow">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-container via-primary-fixed-dim to-secondary-fixed" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Icon name="psychology" className="text-white/30 text-[120px]" />
            </div>
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

      {/* Reis / Milestones */}
      <section className="bg-surface-container-low py-xl px-margin-mobile md:px-xl">
        <div className="max-w-container-max mx-auto">
          <div className="mb-lg">
            <h2 className="font-headline-lg text-headline-lg text-on-surface mb-sm">
              Onze reis
            </h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-[40rem]">
              KapperAssistent is niet gebouwd vanuit een vergaderzaal. Het is opgegroeid
              uit de dagelijkse realiteit op salon-vloer.
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

      {/* Principes */}
      <section className="py-xl px-margin-mobile md:px-xl">
        <div className="max-w-container-max mx-auto">
          <div className="mb-lg">
            <h2 className="font-headline-lg text-headline-lg text-on-surface mb-sm">
              De principes waar we niet aan tornen
            </h2>
            <div className="h-1 w-24 bg-primary-container rounded-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
            {principles.map((v, i) => (
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

      {/* Impact cijfers */}
      <section className="bg-surface-container-low py-xl px-margin-mobile md:px-xl">
        <div className="max-w-container-max mx-auto">
          <div className="glass-card rounded-[2rem] p-lg flex flex-col md:flex-row items-center gap-lg">
            <div className="flex-1 space-y-base">
              <span className="font-label-md text-label-md text-primary uppercase tracking-widest">
                De impact in cijfers
              </span>
              <h2 className="font-display-lg text-display-lg text-on-surface">
                Meer rust, meer omzet.
              </h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant">
                Salonhouders besparen gemiddeld 10 uur per week aan telefoondruk en
                appjes. Dat is tijd die jij terugkrijgt voor je klanten, je team — of
                gewoon voor jezelf.
              </p>
            </div>
            <div className="flex gap-xl shrink-0 flex-wrap justify-center">
              <div className="text-center">
                <div className="font-display-lg text-display-lg text-primary font-bold stat-figure">
                  +23%
                </div>
                <p className="font-label-sm text-label-sm text-on-surface-variant mt-xs">
                  Meer boekingen
                </p>
              </div>
              <div className="w-px bg-outline-variant" />
              <div className="text-center">
                <div className="font-display-lg text-display-lg text-secondary font-bold stat-figure">
                  10u
                </div>
                <p className="font-label-sm text-label-sm text-on-surface-variant mt-xs">
                  Tijdwinst p/week
                </p>
              </div>
              <div className="w-px bg-outline-variant" />
              <div className="text-center">
                <div className="font-display-lg text-display-lg text-on-surface font-bold stat-figure">
                  &lt;2%
                </div>
                <p className="font-label-sm text-label-sm text-on-surface-variant mt-xs">
                  No-shows
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Closing quote + CTA */}
      <section className="py-xl px-margin-mobile md:px-xl">
        <div className="max-w-container-max mx-auto text-center space-y-base">
          <blockquote className="font-body-lg text-body-lg text-on-surface-variant italic max-w-[36rem] mx-auto leading-relaxed">
            "Vincent van Munster is sociaal ondernemer, AI-innovator en oprichter van
            WeAreImpact en KapperAssistent. Als voormalig welzijnsdirecteur én vader van
            twee kinderen bouwt hij aan AI-oplossingen met één doel: kille technologie
            inzetten om warme handen en kostbare tijd vrij te spelen."
          </blockquote>
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
            <p className="font-label-sm text-label-sm text-on-primary/70 mt-sm">
              Zullen we eens koffie drinken? Als ondernemer en vader hoor ik graag waar
              jouw salonpraktijk vandaag de dag écht vastloopt.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
