import type { BusinessProfile } from "@/lib/jobs/business";
import { formatIban } from "@/lib/jobs/business";
import type { DocumentParty } from "@/lib/db/schema-jobs";
import { LINE_KIND_LABEL, formatMoney, formatQuantity, lineNetCents, type LineKind } from "@/lib/jobs/model";

export interface SheetLine {
  kind: string;
  description: string;
  quantity: string | number;
  unit: string;
  unitPriceCents: number;
  vatRatePercent: number;
}

const DATE = new Intl.DateTimeFormat("nl-NL", { timeZone: "Europe/Amsterdam", day: "numeric", month: "long", year: "numeric" });
const fmt = (d: Date | null | undefined) => (d ? DATE.format(d) : "—");

/**
 * A printable quote/invoice. Server-safe (no hooks) so the same sheet renders
 * in the owner's dashboard and on the customer's public link — and prints
 * cleanly via the browser ("Afdrukken → Opslaan als PDF").
 */
export function DocumentSheet({
  kind,
  number,
  title,
  status,
  business,
  billTo,
  jobAddress,
  lines,
  totals,
  issuedAt,
  validUntil,
  dueAt,
  introText,
  footerText,
  paid,
}: {
  kind: "quote" | "invoice";
  number: string;
  title: string | null;
  status: string;
  business: BusinessProfile;
  billTo: DocumentParty;
  jobAddress: string | null;
  lines: SheetLine[];
  totals: { subtotalCents: number; vatCents: number; totalCents: number; breakdown: { ratePercent: number; netCents: number; vatCents: number }[] };
  issuedAt: Date | null;
  validUntil: Date | null;
  dueAt: Date | null;
  introText: string | null;
  footerText: string | null;
  paid?: boolean;
}) {
  const isDraft = number.startsWith("CONCEPT");
  return (
    <article className="rounded-xl border border-outline-variant/40 bg-white p-lg text-on-surface shadow-sm print:border-0 print:p-0 print:shadow-none">
      <header className="flex flex-wrap items-start justify-between gap-md">
        <div>
          <div className="text-headline-md font-bold text-primary">{business.companyName}</div>
          <div className="mt-xs text-label-md text-on-surface-variant">
            {business.street && <div>{business.street}</div>}
            {(business.postalCode || business.city) && (
              <div>
                {business.postalCode} {business.city}
              </div>
            )}
            {business.phone && <div>{business.phone}</div>}
            {business.email && <div>{business.email}</div>}
            {business.kvk && <div>KvK {business.kvk}</div>}
            {business.vatNumber && <div>Btw {business.vatNumber}</div>}
          </div>
        </div>
        <div className="text-right">
          <div className="text-headline-lg font-bold uppercase tracking-wide">{kind === "quote" ? "Offerte" : "Factuur"}</div>
          <div className="text-label-md text-on-surface-variant">{isDraft ? "Concept — nog geen nummer" : number}</div>
          {paid && <div className="mt-xs inline-block rounded-full bg-primary-fixed px-sm py-[2px] text-label-md font-label-md text-on-primary-fixed">Betaald</div>}
          {status === "void" && <div className="mt-xs inline-block rounded-full bg-error-container px-sm py-[2px] text-label-md text-on-error-container">Vervallen</div>}
        </div>
      </header>

      <section className="mt-lg grid grid-cols-1 gap-md sm:grid-cols-2">
        <div>
          <div className="dash-eyebrow mb-xs">Aan</div>
          <div className="text-body-md">
            {billTo.companyName && <div className="font-label-md">{billTo.companyName}</div>}
            <div>{billTo.name}</div>
            {billTo.street && <div>{billTo.street}</div>}
            {(billTo.postalCode || billTo.city) && (
              <div>
                {billTo.postalCode} {billTo.city}
              </div>
            )}
          </div>
        </div>
        <div className="text-body-md sm:text-right">
          <div>
            <span className="text-on-surface-variant">Datum: </span>
            {fmt(issuedAt)}
          </div>
          {kind === "quote" ? (
            <div>
              <span className="text-on-surface-variant">Geldig tot: </span>
              {fmt(validUntil)}
            </div>
          ) : (
            <div>
              <span className="text-on-surface-variant">Vervaldatum: </span>
              {fmt(dueAt)}
            </div>
          )}
          {jobAddress && (
            <div>
              <span className="text-on-surface-variant">Werkadres: </span>
              {jobAddress}
            </div>
          )}
        </div>
      </section>

      {title && <h2 className="mt-lg text-headline-md font-label-md">{title}</h2>}
      {introText && <p className="mt-xs whitespace-pre-line text-body-md text-on-surface-variant">{introText}</p>}

      <div className="mt-md overflow-x-auto">
        <table className="w-full text-body-md">
          <thead>
            <tr className="border-b border-outline-variant/50 text-left text-label-sm text-on-surface-variant">
              <th className="py-xs pr-sm font-normal">Omschrijving</th>
              <th className="py-xs pr-sm text-right font-normal">Aantal</th>
              <th className="py-xs pr-sm text-right font-normal">Prijs</th>
              <th className="py-xs pr-sm text-right font-normal">Btw</th>
              <th className="py-xs text-right font-normal">Bedrag</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l, i) => {
              const qty = Number(l.quantity);
              return (
                <tr key={i} className="border-b border-outline-variant/20 align-top">
                  <td className="py-xs pr-sm">
                    {l.description}
                    <div className="text-label-sm text-on-surface-variant">{LINE_KIND_LABEL[l.kind as LineKind] ?? ""}</div>
                  </td>
                  <td className="py-xs pr-sm text-right tabular-nums">
                    {formatQuantity(qty)} {l.unit}
                  </td>
                  <td className="py-xs pr-sm text-right tabular-nums">{formatMoney(l.unitPriceCents)}</td>
                  <td className="py-xs pr-sm text-right tabular-nums">{l.vatRatePercent}%</td>
                  <td className="py-xs text-right tabular-nums">{formatMoney(lineNetCents({ quantity: qty, unitPriceCents: l.unitPriceCents }))}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="ml-auto mt-md w-full max-w-[20rem] text-body-md">
        <div className="flex justify-between">
          <span className="text-on-surface-variant">Subtotaal</span>
          <span className="tabular-nums">{formatMoney(totals.subtotalCents)}</span>
        </div>
        {totals.breakdown.map((b) => (
          <div key={b.ratePercent} className="flex justify-between text-label-md text-on-surface-variant">
            <span>
              Btw {b.ratePercent}% over {formatMoney(b.netCents)}
            </span>
            <span className="tabular-nums">{formatMoney(b.vatCents)}</span>
          </div>
        ))}
        <div className="mt-xs flex justify-between border-t border-outline-variant/50 pt-xs text-headline-md font-bold">
          <span>Totaal</span>
          <span className="tabular-nums">{formatMoney(totals.totalCents)}</span>
        </div>
      </div>

      {kind === "invoice" && !paid && status !== "void" && business.iban && !isDraft && (
        <div className="mt-lg rounded-lg bg-surface-container p-sm text-body-md">
          Betaal <strong>{formatMoney(totals.totalCents)}</strong> vóór {fmt(dueAt)} naar <strong>{formatIban(business.iban)}</strong> t.n.v. {business.companyName}, onder vermelding van{" "}
          <strong>{number}</strong>.
        </div>
      )}
      {footerText && <p className="mt-md whitespace-pre-line text-label-md text-on-surface-variant">{footerText}</p>}
    </article>
  );
}
