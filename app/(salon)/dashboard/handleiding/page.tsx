import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireJobOwner } from "@/lib/jobs/access";
import { NAV_CATALOG, resolveNav } from "@/lib/verticals";
import { guideFor } from "@/lib/help/guide";
import { PageHeader, Card, IconTile } from "@/components/salon/dash-ui";
import { Icon } from "@/components/ui/icon";

export const metadata: Metadata = { title: "Handleiding" };

const QUICKSTART = [
  { icon: "storefront", title: "Diensten en tarieven", body: "Start met de voorbeeldcatalogus en pas de prijzen aan.", href: "/dashboard/praktijk" },
  { icon: "group", title: "Team toevoegen", body: "Zet je hoveniers en ploegen erin, dan kun je klussen toewijzen.", href: "/dashboard/praktijk" },
  { icon: "cable", title: "Telefoon en WhatsApp koppelen", body: "Zo kan de AI klanten woord voor woord opvangen.", href: "/dashboard/integraties" },
  { icon: "construction", title: "Eerste klus aanmaken", body: "Maak een klus, plan hem in en probeer de checklist.", href: "/dashboard/klussen/nieuw" },
];

export default async function HandleidingPage() {
  const ctx = await requireJobOwner();
  const items = resolveNav(ctx.pack.nav)
    .map((n) => ({ n, g: guideFor(ctx.pack.id, n.key) }))
    .filter((x): x is { n: (typeof x)["n"]; g: NonNullable<(typeof x)["g"]> } => Boolean(x.g) && x.n.key !== "guide");
  if (!items.length) redirect("/dashboard");

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        eyebrow="Hulp"
        title="Handleiding"
        subtitle={`Wat elk onderdeel van ${ctx.pack.brand.name} doet en hoe je het gebruikt. Kort, praktisch en in gewone taal.`}
      />

      <Card tint="primary" className="mb-lg">
        <h2 className="dash-h2 mb-sm text-headline-md text-on-surface">In vier stappen aan de slag</h2>
        <ol className="grid gap-sm sm:grid-cols-2">
          {QUICKSTART.map((q, i) => (
            <li key={q.title}>
              <Link href={q.href} className="flex h-full items-start gap-sm rounded-xl bg-surface-container-lowest p-sm transition-colors hover:bg-surface">
                <IconTile icon={q.icon} size={36} />
                <span className="min-w-0">
                  <span className="block text-label-md font-label-md text-on-surface">
                    {i + 1}. {q.title}
                  </span>
                  <span className="block text-label-sm text-on-surface-variant">{q.body}</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </Card>

      <nav aria-label="Inhoud" className="mb-lg flex flex-wrap gap-xs">
        {items.map(({ n }) => (
          <a
            key={n.key}
            href={`#${n.key}`}
            className="inline-flex items-center gap-xs rounded-full border border-outline-variant/60 bg-surface-container-lowest px-sm py-[2px] text-label-sm text-on-surface-variant hover:bg-primary/5 hover:text-primary"
          >
            <Icon name={n.icon} className="text-[16px]" />
            {n.label}
          </a>
        ))}
      </nav>

      <div className="flex flex-col gap-md">
        {items.map(({ n, g }) => (
          <Card key={n.key} className="scroll-mt-lg">
            <section id={n.key} aria-labelledby={`${n.key}-titel`}>
              <div className="mb-sm flex items-center gap-sm">
                <IconTile icon={n.icon} />
                <div className="min-w-0">
                  <h2 id={`${n.key}-titel`} className="dash-h2 text-headline-md text-on-surface">
                    {n.label}
                  </h2>
                  <p className="text-label-sm text-on-surface-variant">{g.short}</p>
                </div>
              </div>
              <p className="mb-sm text-body-md text-on-surface">{g.what}</p>
              <div className="dash-eyebrow mb-xs">Zo gebruik je het</div>
              <ol className="mb-sm flex list-decimal flex-col gap-xs pl-lg text-body-md text-on-surface marker:font-semibold marker:text-primary">
                {g.steps.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
              {g.tip && (
                <div className="flex items-start gap-sm rounded-xl bg-tertiary-fixed/40 p-sm text-label-md text-on-surface">
                  <Icon name="lightbulb" className="mt-[1px] text-[18px] text-tertiary" />
                  <span>
                    <strong className="font-semibold">Tip: </strong>
                    {g.tip}
                  </span>
                </div>
              )}
              <div className="mt-sm">
                <Link href={NAV_CATALOG[n.key].href} className="inline-flex items-center gap-xs text-label-md font-label-md text-primary hover:underline">
                  Naar {n.label}
                  <Icon name="arrow_forward" className="text-[16px]" />
                </Link>
              </div>
            </section>
          </Card>
        ))}
      </div>

      <Card tint="secondary" className="mt-lg flex flex-wrap items-center gap-sm">
        <Icon name="support_agent" className="text-[24px] text-secondary" />
        <div className="min-w-0 flex-1">
          <div className="text-label-md font-label-md text-on-surface">Er staat iets niet in?</div>
          <div className="text-label-sm text-on-surface-variant">Vraag het de support-AI rechtsonder of maak een ticket aan.</div>
        </div>
        <Link href="/dashboard/support" className="rounded-full bg-primary px-md py-sm text-label-md font-label-md text-on-primary hover:opacity-90">
          Naar support
        </Link>
      </Card>
    </div>
  );
}
