import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { ScanForm } from "@/components/marketing/scan-form";
import { getVerticalConfig } from "@/lib/verticals";
import { scanProfileFor } from "@/lib/scan/profiles";

type Params = Promise<{ vertical?: string }>;

export async function generateMetadata({ params }: { params?: Params } = {}): Promise<Metadata> {
  const vertical = (await params)?.vertical;
  const { brand } = getVerticalConfig(vertical);
  const profile = scanProfileFor(vertical);
  const what = profile?.vertical === "kapper" ? "je salon" : "je bedrijf";
  const loss = profile?.savingsLabel.toLowerCase() ?? "no-shows";
  return {
    title: "Gratis AI & SEO-scan",
    description: `Ontdek in 60 seconden hoeveel omzet ${what} misloopt door gemiste oproepen, plus je ${loss}. Gratis AI & SEO-scan van ${brand.name}.nl.`,
    alternates: { canonical: "/scan" },
  };
}

export default async function ScanPage({ params }: { params?: Params } = {}) {
  const profile = scanProfileFor((await params)?.vertical);
  if (!profile) notFound();

  return (
    <section className="py-xl bg-surface-container-low">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-xl grid grid-cols-1 lg:grid-cols-2 gap-xl items-start">
        <div className="lg:sticky lg:top-24">
          <span className="inline-block px-sm py-xs bg-secondary-fixed text-on-secondary-fixed-variant rounded-full font-label-sm text-label-sm mb-md uppercase tracking-wider">
            Gratis &amp; vrijblijvend
          </span>
          <h1 className="mkt-h1 text-display-lg text-on-surface mb-md">{profile.headline}</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant mb-lg">{profile.intro}</p>
          <ul className="space-y-md">
            {profile.usps.map((u) => (
              <li key={u.text} className="flex items-center gap-md">
                <div className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center flex-shrink-0">
                  <Icon name={u.icon} className="text-primary" />
                </div>
                <span className="font-body-md text-body-md text-on-surface">{u.text}</span>
              </li>
            ))}
          </ul>
        </div>
        <ScanForm
          profile={{
            vertical: profile.vertical,
            sizeLabel: profile.sizeLabel,
            sizeDefault: profile.sizeDefault,
            sizeMax: profile.sizeMax,
            nameLabel: profile.nameLabel,
            namePlaceholder: profile.namePlaceholder,
            urlLabel: profile.urlLabel,
            urlPlaceholder: profile.urlPlaceholder,
            emailPlaceholder: profile.emailPlaceholder,
          }}
        />
      </div>
    </section>
  );
}
