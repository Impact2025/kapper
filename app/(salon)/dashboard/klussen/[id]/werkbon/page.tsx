import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireJobOwner } from "@/lib/jobs/access";
import { getJobDetail } from "@/lib/jobs/queries";
import { parseBusinessProfile } from "@/lib/jobs/business";
import { detailRows } from "@/lib/jobs/fields";
import { assetKindLabeler, categoryLabeler } from "@/lib/jobs/labels";
import { customerDisplayName } from "@/lib/jobs/model";
import { PrintButton } from "@/components/jobs/quote-response";
import { fmtDate, fmtDateTime, TextLink } from "@/components/salon/jobs/ui";

export const metadata: Metadata = { title: "Werkbon" };

/** Printable werkbon: what the monteur takes along — or saves as PDF. */
export default async function WerkbonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireJobOwner();
  const detail = await getJobDetail(ctx.salonId, id);
  if (!detail) notFound();
  const { job, customer, address, asset, staff } = detail;
  const business = parseBusinessProfile(ctx.settings, ctx.salonName);
  const rows = detailRows(ctx.pack, job.category, job.details);

  return (
    <div className="mx-auto max-w-[52rem]">
      <div className="mb-md flex items-center justify-between print:hidden">
        <TextLink href={`/dashboard/klussen/${job.id}`} className="text-label-md">
          ← Terug naar de klus
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
            <div className="text-headline-lg font-bold uppercase">Werkbon</div>
            <div className="text-label-md text-on-surface-variant">{job.number}</div>
            {job.priority === "urgent" && <div className="mt-xs inline-block rounded-full bg-error-container px-sm py-[2px] text-label-md font-label-md text-on-error-container">SPOED</div>}
          </div>
        </header>

        <section className="mt-md grid grid-cols-1 gap-md sm:grid-cols-2">
          <div>
            <div className="dash-eyebrow mb-xs">Klant</div>
            <div className="text-body-md">
              {customer ? customerDisplayName(customer) : "—"}
              {customer?.phone && <div>{customer.phone}</div>}
            </div>
          </div>
          <div>
            <div className="dash-eyebrow mb-xs">Werkadres</div>
            <div className="text-body-md">
              {job.addressLine ?? "—"}
              {address?.accessNotes && <div className="text-label-md text-on-surface-variant">Toegang: {address.accessNotes}</div>}
              {address?.contactName && (
                <div className="text-label-md text-on-surface-variant">
                  Contact ter plaatse: {address.contactName} {address.contactPhone ?? ""}
                </div>
              )}
            </div>
          </div>
          <div>
            <div className="dash-eyebrow mb-xs">Gepland</div>
            <div className="text-body-md">
              {fmtDateTime(job.scheduledStart)} · {job.estimatedMinutes} min{staff ? ` · ${staff.name}` : ""}
            </div>
          </div>
          <div>
            <div className="dash-eyebrow mb-xs">Soort werk</div>
            <div className="text-body-md">{categoryLabeler(ctx.pack)(job.category)}</div>
          </div>
        </section>

        <section className="mt-md">
          <div className="dash-eyebrow mb-xs">{job.title}</div>
          {job.description && <p className="whitespace-pre-line text-body-md">{job.description}</p>}
        </section>

        {(rows.length > 0 || asset) && (
          <section className="mt-md">
            <div className="dash-eyebrow mb-xs">Specificaties</div>
            <ul className="text-body-md">
              {asset && (
                <li>
                  {assetKindLabeler(ctx.pack)(asset.kind)}: {[asset.brand, asset.model].filter(Boolean).join(" ")}
                  {asset.serialNumber ? ` (SN ${asset.serialNumber})` : ""} — laatste onderhoud {fmtDate(asset.lastServiceAt)}
                </li>
              )}
              {rows.map((r) => (
                <li key={r.label}>
                  {r.label}: {r.value}
                </li>
              ))}
            </ul>
          </section>
        )}

        {job.checklist.length > 0 && (
          <section className="mt-md">
            <div className="dash-eyebrow mb-xs">Checklist</div>
            <ul className="flex flex-col gap-xs text-body-md">
              {job.checklist.map((c) => (
                <li key={c.id} className="flex items-center gap-sm">
                  <span className="inline-block h-4 w-4 border border-on-surface">{c.done ? "✓" : ""}</span>
                  {c.label}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-md">
          <div className="dash-eyebrow mb-xs">Uitgevoerd werk &amp; gebruikt materiaal</div>
          <div className="min-h-[9rem] rounded-lg border border-outline-variant/60 p-sm text-body-md whitespace-pre-line">{job.workSummary ?? ""}</div>
        </section>

        <section className="mt-lg grid grid-cols-2 gap-lg">
          <div>
            <div className="h-14 border-b border-on-surface" />
            <div className="mt-xs text-label-sm text-on-surface-variant">Handtekening monteur</div>
          </div>
          <div>
            <div className="h-14 border-b border-on-surface" />
            <div className="mt-xs text-label-sm text-on-surface-variant">Akkoord klant (naam + handtekening)</div>
          </div>
        </section>
      </article>
    </div>
  );
}
