import type { Metadata } from "next";
import { Icon } from "@/components/ui/icon";
import { ScanForm } from "@/components/marketing/scan-form";

export const metadata: Metadata = {
  title: "Gratis AI & SEO-scan",
  description:
    "Ontdek in 60 seconden hoeveel omzet je salon misloopt door gemiste oproepen en no-shows. Gratis AI & SEO-scan van KapperAssistent.nl.",
  alternates: { canonical: "/scan" },
};

const usps = [
  { icon: "call_missed", text: "Bereken je gemiste oproep-omzet" },
  { icon: "speed", text: "Check je website-snelheid & SEO" },
  { icon: "savings", text: "Zie je potentiële no-show besparing" },
];

export default function ScanPage() {
  return (
    <section className="py-xl bg-surface-container-low">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-xl grid grid-cols-1 lg:grid-cols-2 gap-xl items-start">
        <div className="lg:sticky lg:top-24">
          <span className="inline-block px-sm py-xs bg-secondary-fixed text-on-secondary-fixed-variant rounded-full font-label-sm text-label-sm mb-md uppercase tracking-wider">
            Gratis &amp; vrijblijvend
          </span>
          <h1 className="font-display-lg text-display-lg text-on-surface mb-md">
            Hoeveel omzet laat jouw salon liggen?
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant mb-lg">
            Onze AI scant je website en berekent met de Missed Call Revenue-formule
            hoeveel je per maand misloopt aan gemiste oproepen en no-shows. In 60
            seconden, direct in je inbox.
          </p>
          <ul className="space-y-md">
            {usps.map((u) => (
              <li key={u.text} className="flex items-center gap-md">
                <div className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center flex-shrink-0">
                  <Icon name={u.icon} className="text-primary" />
                </div>
                <span className="font-body-md text-body-md text-on-surface">
                  {u.text}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <ScanForm />
      </div>
    </section>
  );
}
