import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDocumentByToken } from "@/lib/jobs/documents";
import { isQuoteExpired } from "@/lib/jobs/model";
import { DocumentSheet } from "@/components/jobs/document-sheet";
import { PrintButton, QuoteResponse } from "@/components/jobs/quote-response";

export const metadata: Metadata = { title: "Offerte", robots: { index: false, follow: false } };
// Tokens are private and content changes on accept/decline — never cache.
export const dynamic = "force-dynamic";

export default async function PublicQuotePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const found = await getDocumentByToken(token);
  if (!found || found.doc.kind !== "quote") notFound();
  const { doc, lines, business } = found;

  const expired = doc.status === "expired" || isQuoteExpired({ status: doc.status, validUntil: doc.validUntil });
  const answerable = doc.status === "sent" && !expired;

  return (
    <main className="min-h-screen bg-surface-container-low px-margin-mobile py-xl print:bg-white print:p-0">
      <div className="mx-auto flex w-full max-w-[52rem] flex-col gap-md">
        <div className="flex items-center justify-between print:hidden">
          <span className="text-label-md text-on-surface-variant">{business.companyName}</span>
          <PrintButton />
        </div>

        {doc.status === "accepted" && (
          <p className="rounded-xl bg-primary-fixed p-md text-body-md text-on-primary-fixed print:hidden">Deze offerte is geaccepteerd door {doc.acceptedByName}. Bedankt!</p>
        )}
        {doc.status === "declined" && <p className="rounded-xl bg-error-container p-md text-body-md text-on-error-container print:hidden">Deze offerte is afgewezen.</p>}
        {expired && <p className="rounded-xl bg-secondary-fixed p-md text-body-md text-on-secondary-fixed print:hidden">Deze offerte is verlopen. Neem contact op voor een nieuwe.</p>}
        {doc.status === "void" && <p className="rounded-xl bg-error-container p-md text-body-md text-on-error-container print:hidden">Deze offerte is vervallen.</p>}

        <DocumentSheet
          kind="quote"
          number={doc.number}
          title={doc.title}
          status={doc.status}
          business={business}
          billTo={doc.billTo}
          jobAddress={doc.jobAddress}
          lines={lines}
          totals={{ subtotalCents: doc.subtotalCents, vatCents: doc.vatCents, totalCents: doc.totalCents, breakdown: doc.vatBreakdown }}
          issuedAt={doc.issuedAt}
          validUntil={doc.validUntil}
          dueAt={doc.dueAt}
          introText={doc.introText}
          footerText={doc.footerText}
        />

        {answerable && <QuoteResponse token={token} />}
      </div>
    </main>
  );
}
