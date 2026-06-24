import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacyverklaring",
  description:
    "Hoe KapperAssistent.nl omgaat met jouw persoonsgegevens — helder, eerlijk en AVG-conform.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <article className="max-w-3xl mx-auto px-margin-mobile md:px-xl py-xl">
      <h1 className="font-display-lg text-display-lg text-on-surface mb-sm">
        Privacyverklaring
      </h1>
      <p className="font-label-sm text-label-sm text-on-surface-variant mb-xl">
        Laatst bijgewerkt: juni 2026
      </p>

      <div className="space-y-xl font-body-md text-body-md text-on-surface-variant leading-relaxed">

        <section className="rounded-xl bg-primary-fixed/30 border border-primary/20 p-md">
          <p className="text-on-surface">
            Privacy hoeft geen ingewikkeld verhaal te zijn. Wij verwerken zo min mogelijk gegevens,
            bewaren ze zo kort mogelijk, en delen ze alleen met partijen die strikt noodzakelijk zijn
            om onze dienst te leveren. Hieronder leggen we precies uit hoe dat werkt.
          </p>
        </section>

        <section>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-sm">Wie zijn wij?</h2>
          <p>
            KapperAssistent.nl biedt AI-receptiediensten aan kapsalons via telefoon en WhatsApp.
            Wij zijn gevestigd in Nederland en verwerken persoonsgegevens conform de Algemene
            Verordening Gegevensbescherming (AVG) en de EU AI Act.
          </p>
          <p className="mt-sm">
            Vragen over privacy? Mail ons op{" "}
            <a href="mailto:privacy@kappersassistent.nl" className="text-primary hover:underline">
              privacy@kappersassistent.nl
            </a>
            . Wij reageren binnen 5 werkdagen.
          </p>
        </section>

        <section>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-sm">
            Welke gegevens verwerken wij?
          </h2>

          <h3 className="font-label-md text-label-md font-medium text-on-surface mt-md mb-xs uppercase tracking-wide">
            Van salonhouders (onze klanten)
          </h3>
          <ul className="list-disc pl-md space-y-xs">
            <li>Naam, e-mailadres en telefoonnummer bij aanmelden</li>
            <li>Salonnaam, adres en agenda-instellingen</li>
            <li>Betalingsgegevens via Stripe — wij slaan zelf geen betaalgegevens op</li>
            <li>Gebruik van het dashboard en ingestelde voorkeuren (integraties, no-show beleid)</li>
          </ul>

          <h3 className="font-label-md text-label-md font-medium text-on-surface mt-md mb-xs uppercase tracking-wide">
            Van salonklanten (indirect, via de AI-assistent)
          </h3>
          <ul className="list-disc pl-md space-y-xs">
            <li>Naam en telefoonnummer bij het plannen van afspraken</li>
            <li>Gesprekscontent (telefoon en WhatsApp) die noodzakelijk is om te boeken of herinneringen te sturen</li>
            <li>
              <strong className="text-on-surface">Geen bijzondere persoonsgegevens</strong> — informatie
              over allergieën, huidcondities of gezondheid wordt gefilterd via een PII-gateway
              voordat het een AI-model bereikt
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-sm">
            Waarom verwerken wij deze gegevens?
          </h2>
          <ul className="list-disc pl-md space-y-xs">
            <li>Om de AI-receptionist te laten functioneren: afspraken plannen, wijzigen en herinneringen sturen</li>
            <li>Om salonhouders toegang te geven tot hun dashboard en facturering</li>
            <li>Om support te bieden en te communiceren over het abonnement</li>
            <li>Om te voldoen aan onze wettelijke verplichtingen (belasting, boekhouding)</li>
          </ul>
        </section>

        <section>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-sm">
            Hoe lang bewaren wij uw gegevens?
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/40">
                  <th className="text-left py-sm pr-md font-label-sm uppercase tracking-wide text-on-surface">Gegeven</th>
                  <th className="text-left py-sm font-label-sm uppercase tracking-wide text-on-surface">Bewaartermijn</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                <tr><td className="py-sm pr-md">Gesprekslogs en chatberichten</td><td className="py-sm">30 dagen, daarna automatisch verwijderd</td></tr>
                <tr><td className="py-sm pr-md">Accountgegevens salonhouder</td><td className="py-sm">Tot 1 jaar na opzegging, dan op verzoek verwijderd</td></tr>
                <tr><td className="py-sm pr-md">Factuur- en betalingsdata</td><td className="py-sm">7 jaar (wettelijke bewaarplicht)</td></tr>
                <tr><td className="py-sm pr-md">Scan-resultaten</td><td className="py-sm">Onbeperkt als lead in ons CRM, verwijderbaar op verzoek</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-sm">
            Met wie delen wij uw gegevens?
          </h2>
          <p className="mb-sm">
            Wij werken uitsluitend met zorgvuldig geselecteerde leveranciers. Zij mogen uw
            gegevens niet voor eigen doeleinden gebruiken en zijn contractueel verplicht
            deze te beveiligen.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm">
            {[
              { name: "Stripe", role: "Betalingsverwerking", note: "ISO 27001, PCI DSS" },
              { name: "Neon", role: "Databasehosting", note: "EU-servers" },
              { name: "Anthropic", role: "AI-modellen", note: "PII-filtering actief" },
              { name: "Resend", role: "E-mailverzending", note: "EU-compliant" },
              { name: "Google", role: "PageSpeed API (scan)", note: "Enkel URL-data" },
              { name: "Wati / Twilio", role: "WhatsApp / telefonie", note: "Optioneel, indien actief" },
            ].map((p) => (
              <div key={p.name} className="rounded-lg border border-outline-variant/40 p-sm">
                <div className="font-medium text-on-surface">{p.name}</div>
                <div className="text-label-sm">{p.role}</div>
                <div className="text-label-sm text-primary">{p.note}</div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-sm">
            Doorgifte buiten de EER
          </h2>
          <p>
            Anthropic is gevestigd in de VS. Wij filteren alle berichten via een PII-gateway
            zodat identificerende persoonsgegevens niet rauw worden doorgestuurd. Voor de
            resterende overdracht vertrouwen wij op Standard Contractual Clauses (SCC&apos;s)
            zoals goedgekeurd door de Europese Commissie.
          </p>
        </section>

        <section className="rounded-xl bg-secondary-fixed/30 border border-secondary/20 p-md">
          <h2 className="font-headline-md text-headline-md text-on-surface mb-sm">
            AI Act (EU) — transparantie
          </h2>
          <p>
            Conform Artikel 50 van de EU AI Act (van kracht augustus 2026) identificeert onze
            voice-agent zichzelf bij aanvang altijd als AI:{" "}
            <em>&ldquo;U spreekt met de virtuele receptionist van [Salonnaam].&rdquo;</em> Bellers
            kunnen altijd vragen om doorverbonden te worden met een medewerker. De AI neemt
            uitsluitend afspraken aan die live beschikbaar zijn in uw agenda — hij verzint
            nooit informatie.
          </p>
        </section>

        <section>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-sm">Uw rechten</h2>
          <p className="mb-sm">U heeft het recht om:</p>
          <ul className="list-disc pl-md space-y-xs">
            <li>Inzage te vragen in uw persoonsgegevens</li>
            <li>Onjuiste gegevens te laten corrigeren</li>
            <li>Uw gegevens te laten verwijderen (&ldquo;recht op vergetelheid&rdquo;)</li>
            <li>Bezwaar te maken tegen een specifieke verwerking</li>
            <li>Uw gegevens te ontvangen in een overdraagbaar formaat (dataportabiliteit)</li>
            <li>
              Een klacht in te dienen bij de{" "}
              <a
                href="https://autoriteitpersoonsgegevens.nl"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Autoriteit Persoonsgegevens
              </a>
            </li>
          </ul>
          <p className="mt-sm">
            Stuur uw verzoek naar{" "}
            <a href="mailto:privacy@kappersassistent.nl" className="text-primary hover:underline">
              privacy@kappersassistent.nl
            </a>
            . Wij reageren binnen 30 dagen.
          </p>
        </section>

        <section>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-sm">
            Cookies en beveiliging
          </h2>
          <p>
            Wij gebruiken uitsluitend functionele cookies die noodzakelijk zijn voor het
            inloggen en de werking van het dashboard. Geen tracking- of advertentiecookies.
          </p>
          <p className="mt-sm">
            Alle verbindingen zijn versleuteld via HTTPS. Wachtwoorden worden opgeslagen met
            scrypt-hashing (salted). API-sleutels worden versleuteld bewaard en nooit in
            logs geschreven.
          </p>
        </section>

        <section>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-sm">
            Wijzigingen in deze verklaring
          </h2>
          <p>
            Wij kunnen deze privacyverklaring aanpassen wanneer onze dienst verandert of
            wet- en regelgeving dat vereist. Bij wezenlijke wijzigingen informeren wij
            geregistreerde salonhouders per e-mail minimaal 14 dagen vooraf. De meest
            actuele versie staat altijd op{" "}
            <a href="/privacy" className="text-primary hover:underline">
              kappersassistent.nl/privacy
            </a>
            .
          </p>
        </section>

      </div>
    </article>
  );
}
