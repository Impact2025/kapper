import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Algemene Voorwaarden",
  description:
    "De algemene voorwaarden van KapperAssistent.nl — eerlijk, leesbaar en zonder juridisch jargon.",
  alternates: { canonical: "/voorwaarden" },
};

export default function VoorwaardenPage() {
  return (
    <article className="max-w-3xl mx-auto px-margin-mobile md:px-xl py-xl">
      <h1 className="font-display-lg text-display-lg text-on-surface mb-sm">
        Algemene Voorwaarden
      </h1>
      <p className="font-label-sm text-label-sm text-on-surface-variant mb-xl">
        Versie 1.0 — juni 2026
      </p>

      <div className="space-y-xl font-body-md text-body-md text-on-surface-variant leading-relaxed">

        <section className="rounded-xl bg-primary-fixed/30 border border-primary/20 p-md">
          <p className="text-on-surface">
            Wij proberen deze voorwaarden zo leesbaar mogelijk te houden. Heb je vragen?
            Mail ons op{" "}
            <a href="mailto:hallo@kappersassistent.nl" className="text-primary hover:underline">
              hallo@kappersassistent.nl
            </a>{" "}
            — wij leggen het je graag persoonlijk uit.
          </p>
        </section>

        <section>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-sm">
            1. Wie zijn wij?
          </h2>
          <p>
            KapperAssistent.nl is een SaaS-dienst die AI-receptietechnologie aanbiedt aan
            kapsalons in Nederland en België. Met &ldquo;wij&rdquo; bedoelen we
            KapperAssistent.nl en haar exploitant. Met &ldquo;jij&rdquo; of &ldquo;klant&rdquo;
            bedoelen we de salonhouder of het bedrijf dat een abonnement afsluit.
          </p>
        </section>

        <section>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-sm">
            2. Wat leveren wij?
          </h2>
          <p>
            KapperAssistent biedt een AI-assistent die via telefoon en WhatsApp afspraken
            aanneemt, inplant, wijzigt en herinneringen stuurt — direct gekoppeld aan jouw
            agendaprogramma (Salonized, Phorest, Treatwell of een vergelijkbaar platform).
            De beschikbare functies zijn afhankelijk van het gekozen abonnement
            (Essential, Pro of Elite).
          </p>
          <p className="mt-sm">
            Wij leveren een <strong className="text-on-surface">inspanningsverplichting</strong>,
            geen resultaatsverplichting. De AI werkt op basis van de informatie die jij aanlevert
            (agenda, prijslijst, beschikbaarheid). Onjuiste of onvolledige instellingen kunnen
            leiden tot onjuiste antwoorden van de assistent.
          </p>
        </section>

        <section>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-sm">
            3. Proefperiode
          </h2>
          <p>
            Nieuwe klanten krijgen <strong className="text-on-surface">14 dagen gratis</strong> toegang
            tot alle functies van het gekozen plan, zonder creditcard of vooruitbetaling.
            Na de proefperiode gaat het abonnement automatisch in, tenzij je vóór afloop
            opzegt via je dashboard of per e-mail.
          </p>
        </section>

        <section>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-sm">
            4. Abonnementen en betaling
          </h2>
          <ul className="list-disc pl-md space-y-xs mb-sm">
            <li>
              Abonnementen worden maandelijks vooraf gefactureerd via Stripe en
              automatisch verlengd.
            </li>
            <li>
              Prijzen zijn in euro&apos;s, exclusief BTW, tenzij anders vermeld.
            </li>
            <li>
              Wij behouden ons het recht voor om tarieven aan te passen. Wij
              informeren je minimaal 30 dagen van tevoren per e-mail.
            </li>
            <li>
              Bij niet-betaling na een betalingsherinnering wordt de dienst tijdelijk
              opgeschort. Na 60 dagen achterstand kunnen wij het account beëindigen.
            </li>
          </ul>
          <p>
            Een eenmalige <strong className="text-on-surface">setup-fee vanaf €250</strong> is
            van toepassing voor de initiële configuratie (agenda-koppeling, prijslijst,
            WhatsApp Business-platform). De exacte hoogte wordt vooraf bevestigd.
          </p>
        </section>

        <section>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-sm">
            5. Opzeggen
          </h2>
          <p>
            Je kunt op elk moment opzeggen via je dashboard of door een e-mail te sturen naar{" "}
            <a href="mailto:hallo@kappersassistent.nl" className="text-primary hover:underline">
              hallo@kappersassistent.nl
            </a>
            . Opzegging geldt per einde van de lopende factureringsperiode. Er is geen
            minimale contractduur na de proefperiode.
          </p>
          <p className="mt-sm">
            Bij opzegging exporteren wij op verzoek jouw gegevens naar een gangbaar formaat
            (CSV of JSON) binnen 14 werkdagen.
          </p>
        </section>

        <section>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-sm">
            6. Beschikbaarheid (SLA)
          </h2>
          <p>
            Wij streven naar een beschikbaarheid van <strong className="text-on-surface">99,5% per maand</strong>.
            Gepland onderhoud wordt minimaal 24 uur van tevoren aangekondigd. Bij aantoonbare
            onderbrekingen langer dan 4 uur buiten gepland onderhoud, ontvang je op verzoek
            een pro-rata creditnota voor de getroffen periode.
          </p>
        </section>

        <section>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-sm">
            7. Jouw verplichtingen
          </h2>
          <ul className="list-disc pl-md space-y-xs">
            <li>
              Zorg dat de agenda-integratie up-to-date is. Afspraken die niet in jouw
              agenda staan, worden door de AI aangeboden — ook als ze in de praktijk
              niet beschikbaar zijn.
            </li>
            <li>
              Informeer jouw klanten dat je een AI-assistent gebruikt voor de
              receptie, conform de EU AI Act.
            </li>
            <li>
              Gebruik de dienst uitsluitend voor legale doeleinden en niet om spam,
              misleidende berichten of ongewenste berichten te sturen.
            </li>
            <li>
              Houd je inloggegevens geheim. Je bent verantwoordelijk voor alle
              activiteiten die plaatsvinden via jouw account.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-sm">
            8. Persoonsgegevens en AVG
          </h2>
          <p>
            Wij treden op als <strong className="text-on-surface">verwerker</strong> van de
            persoonsgegevens van jouw salonklanten; jij bent de verwerkingsverantwoordelijke.
            Door gebruik te maken van onze dienst ga je akkoord met de{" "}
            <Link href="/privacy" className="text-primary hover:underline">
              Verwerkersovereenkomst
            </Link>{" "}
            die is opgenomen in onze privacyverklaring. Wij verwerken jouw klantdata
            uitsluitend om de dienst te leveren en nooit voor eigen commerciële doeleinden.
          </p>
        </section>

        <section>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-sm">
            9. Aansprakelijkheid
          </h2>
          <p>
            Onze aansprakelijkheid is beperkt tot het bedrag dat je in de voorafgaande
            drie maanden hebt betaald voor de dienst. Wij zijn niet aansprakelijk voor:
          </p>
          <ul className="list-disc pl-md space-y-xs mt-sm">
            <li>Gemiste afspraken als gevolg van onjuiste agenda-instellingen</li>
            <li>Schade door uitval van derde partijen (telefonieproviders, WhatsApp, Stripe)</li>
            <li>Indirecte schade, gevolgschade of gederfde inkomsten</li>
          </ul>
        </section>

        <section>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-sm">
            10. Intellectueel eigendom
          </h2>
          <p>
            Alle software, ontwerpen en content van KapperAssistent.nl zijn ons eigendom
            of vallen onder een licentie aan ons. Jij behoudt volledig eigendom van jouw
            salongegevens, agenda-informatie en klantdata.
          </p>
        </section>

        <section>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-sm">
            11. Wijzigingen in de voorwaarden
          </h2>
          <p>
            Wij kunnen deze voorwaarden aanpassen. Bij wezenlijke wijzigingen informeren wij
            je minimaal 30 dagen van tevoren per e-mail. Blijf je na die datum gebruik maken
            van de dienst, dan ga je akkoord met de nieuwe voorwaarden. Bij bezwaar heb je
            het recht om het abonnement kosteloos te beëindigen vóór de ingangsdatum.
          </p>
        </section>

        <section>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-sm">
            12. Toepasselijk recht
          </h2>
          <p>
            Op deze voorwaarden is Nederlands recht van toepassing. Geschillen worden
            voorgelegd aan de bevoegde rechter in Nederland, tenzij consumentenwetgeving
            een andere bevoegde rechter aanwijst.
          </p>
        </section>

        <section className="rounded-xl bg-surface-container p-md">
          <p>
            Vragen over deze voorwaarden?{" "}
            <a href="mailto:hallo@kappersassistent.nl" className="text-primary hover:underline">
              hallo@kappersassistent.nl
            </a>{" "}
            — wij helpen je graag.
          </p>
        </section>

      </div>
    </article>
  );
}
