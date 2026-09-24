import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { requireJobOwner } from "@/lib/jobs/access";
import { getDocumentForOwner, lineRowsToDrafts } from "@/lib/jobs/documents";
import { db } from "@/lib/db";
import { treatments } from "@/lib/db/schema";
import { parseBusinessProfile } from "@/lib/jobs/business";
import {
  INVOICE_STATUS_LABEL,
  QUOTE_STATUS_LABEL,
  computeDocumentTotals,
  formatMoney,
  invoicePaymentState,
  isQuoteExpired,
} from "@/lib/jobs/model";
import { siteUrlFor } from "@/lib/verticals/site-url";
import { eligibleForReducedVatHint } from "@/lib/jobs/fields";
import { getJobRow } from "@/lib/jobs/queries";
import { Badge, Card } from "@/components/salon/dash-ui";
import { Icon } from "@/components/ui/icon";
import { ActionForm } from "@/components/salon/jobs/action-form";
import { DocumentEditor, type CatalogItem, type EditorLine } from "@/components/salon/jobs/document-editor";
import { DocumentSheet } from "@/components/jobs/document-sheet";
import { TextLink, btnDanger, btnOutline, btnPrimary, fmtDateTime, inputCls } from "@/components/salon/jobs/ui";
import { convertQuoteAction, deleteDraftAction, markPaidAction, voidDocumentAction } from "@/lib/jobs/actions";

export const metadata: Metadata = { title: "Document" };

export default async function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireJobOwner();
  const found = await getDocumentForOwner(ctx.salonId, id);
  if (!found) notFound();
  const { doc, lines } = found;

  const kind = doc.kind as "quote" | "invoice";
  const business = parseBusinessProfile(ctx.settings, ctx.salonName);
  const totals = { subtotalCents: doc.subtotalCents, vatCents: doc.vatCents, totalCents: doc.totalCents, breakdown: doc.vatBreakdown };
  const isDraft = doc.status === "draft";
  const now = new Date();
  const payState = kind === "invoice" ? invoicePaymentState({ status: doc.status, dueAt: doc.dueAt }, now) : null;
  const expired = kind === "quote" && isQuoteExpired({ status: doc.status, validUntil: doc.validUntil }, now);
  const publicUrl = `${siteUrlFor(ctx.pack.id)}/${kind === "quote" ? "offerte" : "factuur"}/${doc.publicToken}`;

  const linkedJob = doc.jobId ? await getJobRow(ctx.salonId, doc.jobId) : null;
  const vatHint = linkedJob && eligibleForReducedVatHint(linkedJob.details);

  let catalog: CatalogItem[] = [];
  let editorLines: EditorLine[] = [];
  if (isDraft) {
    const rows = await db.select().from(treatments).where(and(eq(treatments.salonId, ctx.salonId), eq(treatments.active, true)));
    catalog = rows.length
      ? rows.map((t) => ({ name: t.name, priceEuros: t.priceCents / 100, vat: t.vatRatePercent, unit: "post", kind: "labor" as const }))
      : ctx.pack.serviceTemplates.map((t) => ({ name: t.name, priceEuros: t.priceCents / 100, vat: t.vatRatePercent, unit: "post", kind: "labor" as const }));
    editorLines = lineRowsToDrafts(lines).map((l) => ({
      kind: l.kind,
      description: l.description,
      quantity: String(l.quantity).replace(".", ","),
      unit: l.unit,
      unitPrice: (l.unitPriceCents / 100).toFixed(2).replace(".", ","),
      vat: l.vatRatePercent,
    }));
  } else {
    // keep totals honest even if a stored breakdown were ever missing
    if (!doc.vatBreakdown.length && lines.length) {
      const t = computeDocumentTotals(lines.map((l) => ({ quantity: Number(l.quantity), unitPriceCents: l.unitPriceCents, vatRatePercent: l.vatRatePercent })));
      totals.breakdown = t.breakdown;
    }
  }

  const statusLabel =
    kind === "quote"
      ? expired
        ? "Verlopen"
        : QUOTE_STATUS_LABEL[doc.status as keyof typeof QUOTE_STATUS_LABEL] ?? doc.status
      : payState === "overdue"
        ? "Achterstallig"
        : INVOICE_STATUS_LABEL[doc.status as keyof typeof INVOICE_STATUS_LABEL] ?? doc.status;

  return (
    <div className="flex flex-col gap-lg">
      <div>
        <TextLink href={`/dashboard/facturatie?tab=${kind === "quote" ? "quotes" : "invoices"}`} className="text-label-md">
          ← Offertes &amp; facturen
        </TextLink>
        <div className="mt-xs flex flex-wrap items-center gap-sm">
          <h1 className="dash-h1 text-headline-lg">
            {kind === "quote" ? "Offerte" : "Factuur"} {isDraft ? "(concept)" : doc.number}
          </h1>
          <Badge tone={doc.status === "paid" || doc.status === "accepted" ? "success" : payState === "overdue" || doc.status === "declined" || doc.status === "void" || expired ? "error" : doc.status === "sent" ? "warning" : "neutral"}>
            {statusLabel}
          </Badge>
          <span className="text-headline-md font-bold">{formatMoney(doc.totalCents)}</span>
        </div>
        <div className="mt-xs flex flex-wrap gap-md text-body-md text-on-surface-variant">
          {doc.jobId && (
            <TextLink href={`/dashboard/klussen/${doc.jobId}`} className="inline-flex items-center gap-xs">
              <Icon name="construction" className="text-[18px]" />
              Naar de klus
            </TextLink>
          )}
          {doc.customerId && (
            <TextLink href={`/dashboard/klanten/${doc.customerId}`} className="inline-flex items-center gap-xs">
              <Icon name="person" className="text-[18px]" />
              {doc.billTo.companyName || doc.billTo.name}
            </TextLink>
          )}
          {!isDraft && (
            <a href={publicUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-xs text-primary hover:underline">
              <Icon name="open_in_new" className="text-[18px]" />
              Openbare link / afdrukken
            </a>
          )}
        </div>
        {doc.acceptedAt && (
          <p className="mt-xs text-label-md text-on-surface-variant">
            <Icon name="verified" filled className="mr-xs align-middle text-[16px] text-primary" />
            Geaccepteerd door {doc.acceptedByName} op {fmtDateTime(doc.acceptedAt)}
          </p>
        )}
        {doc.declinedAt && (
          <p className="mt-xs text-label-md text-error">
            Afgewezen op {fmtDateTime(doc.declinedAt)}
            {doc.declineReason ? ` — ${doc.declineReason}` : ""}
          </p>
        )}
        {doc.paidAt && (
          <p className="mt-xs text-label-md text-on-surface-variant">
            Betaald op {fmtDateTime(doc.paidAt)} ({doc.paymentMethod})
          </p>
        )}
        {doc.reminderCount > 0 && <p className="mt-xs text-label-md text-on-surface-variant">{doc.reminderCount} betalingsherinnering(en) verstuurd.</p>}
      </div>

      {isDraft && vatHint && (
        <p className="rounded-lg bg-secondary-fixed/50 px-sm py-xs text-label-md text-on-surface">
          Deze woning is als &ldquo;ouder dan 2 jaar&rdquo; gemarkeerd: op arbeid kan het verlaagde btw-tarief gelden. Kies het tarief per regel en controleer het actuele tarief bij de Belastingdienst.
        </p>
      )}
      {isDraft ? (
        <Card>
          <DocumentEditor
            documentId={doc.id}
            kind={kind}
            initialLines={editorLines}
            title={doc.title ?? ""}
            introText={doc.introText ?? (kind === "quote" ? business.quoteIntro : "")}
            footerText={doc.footerText ?? (kind === "invoice" ? business.invoiceFooter : "")}
            catalog={catalog}
            defaultVat={ctx.pack.vatRates.treatment}
            canSend={ctx.can.quotes}
          />
          <div className="mt-md border-t border-outline-variant/30 pt-md">
            <ActionForm action={deleteDraftAction} submitLabel="Concept verwijderen" buttonClassName={btnDanger} confirm="Dit concept verwijderen?">
              <input type="hidden" name="documentId" value={doc.id} />
            </ActionForm>
          </div>
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap gap-md">
            {kind === "quote" && doc.status === "accepted" && (
              <ActionForm action={convertQuoteAction} submitLabel="Maak factuur van deze offerte" submitIcon="receipt_long" buttonClassName={btnPrimary}>
                <input type="hidden" name="documentId" value={doc.id} />
              </ActionForm>
            )}
            {kind === "invoice" && doc.status === "sent" && (
              <ActionForm action={markPaidAction} submitLabel="Boek als betaald" submitIcon="paid" buttonClassName={btnPrimary} className="flex-row items-end">
                <input type="hidden" name="documentId" value={doc.id} />
                <select name="method" defaultValue="bank" className={`${inputCls} w-auto`} aria-label="Betaalmethode">
                  <option value="bank">Bankoverschrijving</option>
                  <option value="pin">Pin</option>
                  <option value="cash">Contant</option>
                  <option value="other">Anders</option>
                </select>
              </ActionForm>
            )}
            {["sent", "draft"].includes(doc.status) && (
              <ActionForm action={voidDocumentAction} submitLabel="Laten vervallen" buttonClassName={btnOutline} confirm="Dit document laten vervallen? Het nummer blijft bestaan.">
                <input type="hidden" name="documentId" value={doc.id} />
              </ActionForm>
            )}
          </div>
          <DocumentSheet
            kind={kind}
            number={doc.number}
            title={doc.title}
            status={doc.status}
            business={business}
            billTo={doc.billTo}
            jobAddress={doc.jobAddress}
            lines={lines}
            totals={totals}
            issuedAt={doc.issuedAt}
            validUntil={doc.validUntil}
            dueAt={doc.dueAt}
            introText={doc.introText}
            footerText={doc.footerText}
            paid={doc.status === "paid"}
          />
        </>
      )}
      <Link href="/dashboard/facturatie/instellingen" className="text-label-sm text-on-surface-variant hover:text-primary">
        Bedrijfsgegevens op dit document aanpassen →
      </Link>
    </div>
  );
}
