import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireJobOwner } from "@/lib/jobs/access";
import { getAssetPassport } from "@/lib/jobs/crm";
import { parseBusinessProfile } from "@/lib/jobs/business";
import { detailRows } from "@/lib/jobs/fields";
import { assetKindLabeler, assetTerms, capitalize, categoryLabeler } from "@/lib/jobs/labels";
import { customerDisplayName, formatAddressLine } from "@/lib/jobs/model";
import { PrintButton } from "@/components/jobs/quote-response";
import { fmtDate, TextLink } from "@/components/salon/jobs/ui";

export const metadata: Metadata = { title: "Installatiepaspoort" };

const DONE = new Set(["completed", "invoiced", "paid"]);

/** Printable passport of one installatie/object: what hangs there, since when,
 * warranty, next service and the klussen that touched it. Print or save as PDF. */
export default async function PaspoortPage({ params }: { params: Promise<{ id: string; assetId: string }> }) {
  const { id, assetId } = await params;
  const ctx = await requireJobOwner();
  if (!ctx.can.assets) redirect("/dashboard/abonnement");
  const data = await getAssetPassport(ctx.salonId, assetId);
  if (!data || data.asset.customerId !== id) notFound();
  const { asset, customer, address, history } = data;
  const business = parseBusinessProfile(ctx.settings, ctx.salonName);
  const terms = assetTerms(ctx.pack);
  const kind = assetKindLabeler(ctx.pack)(asset.kind);
  const category = categoryLabeler(ctx.pack);

  const facts: [string, string][] = [
    ["Soort", kind],
    ["Merk en type", [asset.brand, asset.model].filter(Boolean).join(" ") || "—"],
    ["Serienummer", asset.serialNumber ?? "—"],
    ["Geplaatst", fmtDate(asset.installedAt)],
    ["Garantie tot", fmtDate(asset.warrantyUntil)],
    ["Laatste onderhoud", fmtDate(asset.lastServiceAt)],
    ["Volgend onderhoud", fmtDate(asset.nextServiceDue)],
  ];

  return (
    <div className="mx-auto max-w-[52rem]">
      <div className="mb-md flex items-center justify-between print:hidden">
        <TextLink href={`/dashboard/klanten/${id}`} className="text-label-md">
          ← Terug naar de klant
        </TextLink>
        <PrintButton />
      </div>

      <article className="rounded-xl border border-outline-variant/40 bg-white p-lg text-on-surface print:border-0 print:p-0">
        <header className="flex flex-wrap items-start justify-between gap-md border-b border-outline-variant/50 pb-md">
          <div>
            <div className="text-headline-md font-bold text-primary">{business.companyName}</div>
            <div className="text-label-md text-on-surface-variant">{[business.phone, business.email].filter(Boolean).join(" · ")}</div>
          </div>
          <div className="text-right">
            <div className="text-headline-lg font-bold uppercase">{capitalize(terms.passport)}</div>
            <div className="text-label-md text-on-surface-variant">Opgemaakt op {fmtDate(new Date())}</div>
          </div>
        </header>

        <section className="mt-md grid grid-cols-1 gap-md sm:grid-cols-2">
          <div>
            <div className="dash-eyebrow mb-xs">Eigenaar</div>
            <div className="text-body-md">{customer ? customerDisplayName(customer) : "—"}</div>
          </div>
          <div>
            <div className="dash-eyebrow mb-xs">Adres</div>
            <div className="text-body-md">{address ? formatAddressLine(address) : "—"}</div>
          </div>
        </section>

        <section className="mt-md">
          <div className="dash-eyebrow mb-xs">Gegevens {terms.singular}</div>
          <dl className="grid grid-cols-1 gap-x-lg gap-y-xs text-body-md sm:grid-cols-2">
            {facts.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-md border-b border-outline-variant/30 py-xs">
                <dt className="text-on-surface-variant">{k}</dt>
                <dd className="text-right font-medium">{v}</dd>
              </div>
            ))}
          </dl>
          {asset.notes && <p className="mt-sm whitespace-pre-line text-body-md">{asset.notes}</p>}
        </section>

        <section className="mt-md">
          <div className="dash-eyebrow mb-xs">Onderhouds- en klushistorie</div>
          {history.length === 0 ? (
            <p className="text-body-md text-on-surface-variant">Nog geen klussen aan deze {terms.singular} gekoppeld.</p>
          ) : (
            <ul className="flex flex-col gap-sm">
              {history.map((h) => {
                const rows = detailRows(ctx.pack, h.category, h.details);
                return (
                  <li key={h.id} className="rounded-lg border border-outline-variant/40 p-sm text-body-md">
                    <div className="flex flex-wrap justify-between gap-sm">
                      <span className="font-medium">
                        {h.number} · {h.title}
                      </span>
                      <span className="text-on-surface-variant">{DONE.has(h.status) ? fmtDate(h.completedAt) : "nog niet afgerond"}</span>
                    </div>
                    <div className="text-label-md text-on-surface-variant">{category(h.category)}</div>
                    {rows.length > 0 && (
                      <ul className="mt-xs text-label-md">
                        {rows.map((r) => (
                          <li key={r.label}>
                            {r.label}: {r.value}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <footer className="mt-lg border-t border-outline-variant/50 pt-sm text-label-sm text-on-surface-variant">
          Dit {terms.passport} is opgemaakt door {business.companyName} op basis van de bij ons bekende gegevens. Het vervangt geen wettelijk of fabrikantdocument.
        </footer>
      </article>
    </div>
  );
}
