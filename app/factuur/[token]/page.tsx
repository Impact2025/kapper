import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDocumentByToken } from "@/lib/jobs/documents";
import { DocumentSheet } from "@/components/jobs/document-sheet";
import { PrintButton } from "@/components/jobs/quote-response";

export const metadata: Metadata = { title: "Factuur", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PublicInvoicePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const found = await getDocumentByToken(token);
  if (!found || found.doc.kind !== "invoice") notFound();
  const { doc, lines, business } = found;

  return (
    <main className="min-h-screen bg-surface-container-low px-margin-mobile py-xl print:bg-white print:p-0">
      <div className="mx-auto flex w-full max-w-[52rem] flex-col gap-md">
        <div className="flex items-center justify-between print:hidden">
          <span className="text-label-md text-on-surface-variant">{business.companyName}</span>
          <PrintButton />
        </div>
        <DocumentSheet
          kind="invoice"
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
          paid={doc.status === "paid"}
        />
      </div>
    </main>
  );
}
