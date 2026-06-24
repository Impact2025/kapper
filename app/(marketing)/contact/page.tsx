import type { Metadata } from "next";
import { Icon } from "@/components/ui/icon";
import { ContactForm } from "@/components/marketing/contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Neem contact op met het team van KapperAssistent.nl. We helpen je persoonlijk op weg.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <section className="py-xl bg-surface">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-xl grid grid-cols-1 lg:grid-cols-2 gap-xl items-start">
        <div>
          <h1 className="font-display-lg text-display-lg text-on-surface mb-md">
            Laten we kennismaken.
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant mb-lg">
            Vragen over de pilot, koppelingen of compliance? Geen anonieme
            helpdesk — je praat direct met iemand die je salon begrijpt.
          </p>
          <div className="space-y-md">
            <div className="flex items-center gap-md">
              <div className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center">
                <Icon name="mail" className="text-primary" />
              </div>
              <a
                href="mailto:hallo@kappersassistent.nl"
                className="font-body-md text-on-surface hover:text-primary"
              >
                hallo@kappersassistent.nl
              </a>
            </div>
            <div className="flex items-center gap-md">
              <div className="w-12 h-12 rounded-full bg-secondary-fixed flex items-center justify-center">
                <Icon name="schedule" className="text-secondary" />
              </div>
              <span className="font-body-md text-on-surface">
                Reactie binnen 1 werkdag
              </span>
            </div>
          </div>
        </div>
        <ContactForm />
      </div>
    </section>
  );
}
