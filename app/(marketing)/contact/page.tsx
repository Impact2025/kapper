import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { TicketForm } from "@/components/support/ticket-form";
import { OpenChatButton } from "@/components/help/open-chat-button";
import { getSupportActor } from "@/lib/support/actor";

export const metadata: Metadata = {
  title: "Contact & support",
  description:
    "Stel je vraag aan het team van KapperAssistent.nl: maak een ticket, volg de status online en krijg antwoord binnen 1 werkdag.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const actor = await getSupportActor();
  const isSalon = actor.audience === "salon";

  return (
    <section className="bg-surface py-xl">
      <div className="mx-auto grid max-w-container-max grid-cols-1 items-start gap-xl px-margin-mobile md:px-xl lg:grid-cols-2">
        <div>
          <h1 className="mkt-h1 mb-md text-display-lg text-on-surface">Hoe kunnen we helpen?</h1>
          <p className="mb-lg text-body-lg text-on-surface-variant">
            Vragen over de pilot, koppelingen of compliance? Geen anonieme helpdesk — je praat direct met iemand die je salon
            begrijpt. Je krijgt een ticketnummer en volgt alles online.
          </p>

          <div className="space-y-md">
            <div className="rounded-xl border border-outline-variant/50 bg-white p-md">
              <div className="mb-xs flex items-center gap-sm">
                <Icon name="smart_toy" className="text-primary" />
                <span className="font-label-md text-body-md text-on-surface">Direct antwoord van de AI-assistent</span>
              </div>
              <p className="mb-sm text-label-md text-on-surface-variant">
                Beantwoordt je vraag uit ons hulpcentrum en maakt zo nodig zelf een ticket voor je aan.
              </p>
              <OpenChatButton className="px-md py-xs" />
            </div>

            <div className="rounded-xl border border-outline-variant/50 bg-white p-md">
              <div className="mb-xs flex items-center gap-sm">
                <Icon name="menu_book" className="text-primary" />
                <span className="font-label-md text-body-md text-on-surface">Hulpcentrum &amp; FAQ</span>
              </div>
              <p className="text-label-md text-on-surface-variant">
                Antwoorden op prijzen, koppelingen, privacy en meer.{" "}
                <Link href="/help" className="text-primary underline">Naar het hulpcentrum</Link> ·{" "}
                <Link href="/faq" className="text-primary underline">FAQ</Link>
              </p>
            </div>

            <div className="flex items-center gap-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary-fixed">
                <Icon name="schedule" className="text-secondary" />
              </div>
              <span className="text-body-md text-on-surface">Reactie binnen 1 werkdag — Pro en Elite sneller</span>
            </div>
            <div className="flex items-center gap-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-fixed">
                <Icon name="mail" className="text-primary" />
              </div>
              <a href="mailto:hallo@kappersassistent.nl" className="text-body-md text-on-surface hover:text-primary">
                hallo@kappersassistent.nl
              </a>
            </div>
          </div>
        </div>

        <TicketForm knownUser={isSalon} audience={isSalon ? "salon" : "prospect"} />
      </div>
    </section>
  );
}
