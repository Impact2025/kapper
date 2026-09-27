import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getHandoverByLink } from "@/lib/jobs/handover";
import { BeforeAfter } from "@/components/salon/jobs/before-after";
import { checklistProgress } from "@/lib/jobs/model";

export const metadata: Metadata = { title: "Oplevering", robots: { index: false, follow: false } };
// Private link and photos of someone's home — never cache or index.
export const dynamic = "force-dynamic";

const DATE = new Intl.DateTimeFormat("nl-NL", { timeZone: "Europe/Amsterdam", day: "numeric", month: "long", year: "numeric" });

export default async function HandoverPage({ params }: { params: Promise<{ jobId: string; sig: string }> }) {
  const { jobId, sig } = await params;
  const found = await getHandoverByLink(jobId, sig);
  if (!found) notFound();
  const { job, photos, business } = found;

  const before = photos.find((p) => p.kind === "before");
  const after = [...photos].reverse().find((p) => p.kind === "after");
  const others = photos.filter((p) => p.id !== before?.id && p.id !== after?.id);
  const progress = checklistProgress(job.checklist);

  return (
    <main className="min-h-dvh bg-surface-container-low px-margin-mobile py-xl">
      <div className="mx-auto flex w-full max-w-[44rem] flex-col gap-md">
        <header>
          <div className="text-label-md text-on-surface-variant">{business.companyName}</div>
          <h1 className="dash-h2 text-headline-lg text-on-surface">{job.title}</h1>
          <p className="text-body-md text-on-surface-variant">
            {[job.addressLine, job.completedAt ? `afgerond op ${DATE.format(job.completedAt)}` : null].filter(Boolean).join(" · ")}
          </p>
        </header>

        {before && after && (
          <section className="rounded-xl bg-surface p-md">
            <BeforeAfter before={before.blobUrl} after={after.blobUrl} caption="Sleep om voor en na te vergelijken" />
          </section>
        )}

        {job.workSummary && (
          <section className="rounded-xl bg-surface p-md">
            <h2 className="dash-h2 mb-xs text-headline-md">Wat we gedaan hebben</h2>
            <p className="whitespace-pre-line text-body-md text-on-surface">{job.workSummary}</p>
          </section>
        )}

        {progress.total > 0 && (
          <section className="rounded-xl bg-surface p-md">
            <h2 className="dash-h2 mb-xs text-headline-md">Checklist</h2>
            <ul className="flex flex-col gap-xs">
              {job.checklist.map((c) => (
                <li key={c.id} className={`text-body-md ${c.done ? "text-on-surface" : "text-on-surface-variant line-through"}`}>
                  {c.done ? "✓" : "○"} {c.label}
                </li>
              ))}
            </ul>
          </section>
        )}

        {others.length > 0 && (
          <section className="grid grid-cols-2 gap-sm sm:grid-cols-3">
            {others.map((p) => (
              <a key={p.id} href={p.blobUrl} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg">
                <Image src={p.blobUrl} alt={p.caption ?? "Foto van het werk"} width={320} height={320} className="aspect-square w-full object-cover" />
              </a>
            ))}
          </section>
        )}

        <footer className="rounded-xl bg-surface p-md text-body-md text-on-surface-variant">
          {job.signedByName && <p>Opgeleverd en akkoord bevonden door {job.signedByName}.</p>}
          {job.warrantyUntil && <p>Garantie tot {DATE.format(job.warrantyUntil)}.</p>}
          <p className="mt-xs">
            Vragen? Neem contact op met {business.companyName}
            {business.phone ? ` via ${business.phone}` : ""}
            {business.email ? ` of ${business.email}` : ""}.
          </p>
        </footer>
      </div>
    </main>
  );
}
