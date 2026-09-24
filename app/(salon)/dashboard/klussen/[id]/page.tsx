import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { requireJobOwner } from "@/lib/jobs/access";
import { getJobDetail, listActiveStaff } from "@/lib/jobs/queries";
import { toAmsterdamLocalInput } from "@/lib/jobs/datetime";
import {
  DOCUMENT_KIND_LABEL,
  INVOICE_STATUS_LABEL,
  JOB_SOURCE_LABEL,
  QUOTE_STATUS_LABEL,
  checklistProgress,
  customerDisplayName,
  formatMoney,
  type DocumentKind,
  type JobSource,
} from "@/lib/jobs/model";
import { assetKindLabeler, categoryLabeler } from "@/lib/jobs/labels";
import { fieldsForCategory } from "@/lib/jobs/fields";
import { Badge, Card } from "@/components/salon/dash-ui";
import { Icon } from "@/components/ui/icon";
import { PriorityBadge, StatusBadge, TextLink, fmtDate, fmtDateTime } from "@/components/salon/jobs/ui";
import {
  ChecklistPanel,
  CreateDocumentButtons,
  DetailsForm,
  NoteForm,
  PhotoUploader,
  SchedulePanel,
  SignOffForm,
  StatusActions,
} from "@/components/salon/jobs/job-panels";

export const metadata: Metadata = { title: "Klus" };

const PHOTO_KIND: Record<string, string> = { before: "Voor", during: "Tijdens", after: "Na", issue: "Probleem" };

export default async function KlusDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireJobOwner();
  const [detail, staff] = await Promise.all([getJobDetail(ctx.salonId, id), listActiveStaff(ctx.salonId)]);
  if (!detail) notFound();

  const { job, customer, address, asset, contract, events, photos, documents } = detail;
  const catLabel = categoryLabeler(ctx.pack);
  const assetLabel = assetKindLabeler(ctx.pack);
  const progress = checklistProgress(job.checklist);
  const addressLine = job.addressLine;
  const mapsHref = addressLine ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressLine)}` : null;
  const phone = customer?.phone ?? null;
  const waHref = phone ? `https://wa.me/${phone.replace(/[^\d]/g, "").replace(/^0/, "31")}` : null;
  const closed = ["paid", "cancelled"].includes(job.status);

  return (
    <div className="flex flex-col gap-lg">
      {/* ------------ header ------------ */}
      <div>
        <TextLink href="/dashboard/klussen" className="text-label-md">
          ← Alle {ctx.pack.terms.treatmentPlural}
        </TextLink>
        <div className="mt-xs flex flex-wrap items-center gap-sm">
          <span className="dash-eyebrow">{job.number}</span>
          <StatusBadge status={job.status} />
          <PriorityBadge priority={job.priority} />
          <Badge>{catLabel(job.category)}</Badge>
          <Badge>{JOB_SOURCE_LABEL[job.source as JobSource] ?? job.source}</Badge>
        </div>
        <h1 className="dash-h1 mt-xs text-headline-lg">{job.title}</h1>
        <div className="mt-sm flex flex-wrap items-center gap-md text-body-md text-on-surface-variant">
          {customer && (
            <TextLink href={`/dashboard/klanten/${customer.id}`} className="inline-flex items-center gap-xs">
              <Icon name="person" className="text-[18px]" />
              {customerDisplayName(customer)}
            </TextLink>
          )}
          {phone && (
            <a href={`tel:${phone}`} className="inline-flex items-center gap-xs text-primary hover:underline">
              <Icon name="call" className="text-[18px]" />
              {phone}
            </a>
          )}
          {waHref && (
            <a href={waHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-xs text-primary hover:underline">
              <Icon name="chat" className="text-[18px]" />
              WhatsApp
            </a>
          )}
          {mapsHref && (
            <a href={mapsHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-xs text-primary hover:underline">
              <Icon name="location_on" className="text-[18px]" />
              {addressLine}
            </a>
          )}
        </div>
        {address?.accessNotes && (
          <p className="mt-sm inline-flex items-center gap-xs rounded-lg bg-secondary-fixed/50 px-sm py-xs text-label-md text-on-surface">
            <Icon name="key" className="text-[18px]" />
            Toegang: {address.accessNotes}
          </p>
        )}
        {address?.contactName && (
          <p className="mt-xs text-label-md text-on-surface-variant">
            Ter plaatse: {address.contactName}
            {address.contactPhone ? ` · ${address.contactPhone}` : ""}
          </p>
        )}
        <div className="mt-md">
          <StatusActions jobId={job.id} status={job.status} hasSchedule={!!job.scheduledStart} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-lg lg:grid-cols-3">
        {/* ------------ left ------------ */}
        <div className="flex flex-col gap-lg lg:col-span-2">
          {job.description && (
            <Card>
              <h2 className="dash-h2 mb-xs text-headline-md">Aanvraag</h2>
              <p className="whitespace-pre-line text-body-md text-on-surface">{job.description}</p>
            </Card>
          )}

          <Card>
            <div className="mb-sm flex items-center justify-between">
              <h2 className="dash-h2 text-headline-md">Checklist</h2>
              {progress.total > 0 && (
                <span className="text-label-md text-on-surface-variant">
                  {progress.done}/{progress.total}
                </span>
              )}
            </div>
            <ChecklistPanel jobId={job.id} items={job.checklist} />
          </Card>

          <Card>
            <h2 className="dash-h2 mb-sm text-headline-md">Foto&rsquo;s</h2>
            {photos.length > 0 && (
              <div className="mb-md grid grid-cols-2 gap-sm sm:grid-cols-4">
                {photos.map((p) => (
                  <a key={p.id} href={p.blobUrl} target="_blank" rel="noreferrer" className="group relative block overflow-hidden rounded-lg">
                    <Image src={p.blobUrl} alt={p.caption ?? PHOTO_KIND[p.kind] ?? "Foto"} width={240} height={240} className="aspect-square w-full object-cover" />
                    <span className="absolute left-xs top-xs rounded-full bg-black/60 px-sm py-[2px] text-label-sm text-white">{PHOTO_KIND[p.kind] ?? p.kind}</span>
                    {p.caption && <span className="absolute inset-x-0 bottom-0 bg-black/50 px-xs py-[2px] text-label-sm text-white">{p.caption}</span>}
                  </a>
                ))}
              </div>
            )}
            <PhotoUploader jobId={job.id} />
          </Card>

          <Card>
            <h2 className="dash-h2 mb-sm text-headline-md">Gegevens &amp; werkverslag</h2>
            <DetailsForm
              job={{
                id: job.id,
                title: job.title,
                description: job.description,
                category: job.category,
                priority: job.priority,
                assignedStaffId: job.assignedStaffId,
                workSummary: job.workSummary,
                internalNotes: job.internalNotes,
              }}
              categories={ctx.pack.jobCategories.map((c) => ({ key: c.key, label: c.label }))}
              staff={staff}
              fields={fieldsForCategory(ctx.pack, job.category)}
              details={job.details}
            />
            <p className="mt-sm text-label-sm text-on-surface-variant">
              <Link href={`/dashboard/klussen/${job.id}/werkbon`} className="text-primary hover:underline">
                Werkbon afdrukken →
              </Link>
            </p>
          </Card>

          <Card>
            <h2 className="dash-h2 mb-sm text-headline-md">Tijdlijn</h2>
            <div className="mb-md">
              <NoteForm jobId={job.id} />
            </div>
            <ol className="flex flex-col gap-sm border-l border-outline-variant/40 pl-md">
              {events.map((e) => (
                <li key={e.id} className="relative">
                  <span className="absolute -left-[1.4rem] top-[0.35rem] h-2 w-2 rounded-full bg-primary" />
                  <div className="text-body-md text-on-surface">{e.message}</div>
                  <div className="text-label-sm text-on-surface-variant">{fmtDateTime(e.createdAt)}</div>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        {/* ------------ right ------------ */}
        <div className="flex flex-col gap-lg">
          <Card>
            <h2 className="dash-h2 mb-sm text-headline-md">Planning</h2>
            {job.scheduledStart && (
              <p className="mb-sm text-body-md text-on-surface">
                <Icon name="event" className="mr-xs align-middle text-[18px] text-primary" />
                {fmtDateTime(job.scheduledStart)} · {job.estimatedMinutes} min
                {detail.staff ? ` · ${detail.staff.name}` : ""}
              </p>
            )}
            {closed ? (
              <p className="text-body-md text-on-surface-variant">Deze klus is afgesloten.</p>
            ) : (
              <SchedulePanel
                jobId={job.id}
                scheduledStartInput={toAmsterdamLocalInput(job.scheduledStart)}
                staffId={job.assignedStaffId}
                minutes={job.estimatedMinutes}
                staff={staff}
                isScheduled={!!job.scheduledStart}
              />
            )}
          </Card>

          <Card>
            <h2 className="dash-h2 mb-sm text-headline-md">Offerte &amp; factuur</h2>
            {documents.length > 0 && (
              <ul className="mb-md flex flex-col gap-xs">
                {documents.map((d) => (
                  <li key={d.id}>
                    <Link href={`/dashboard/facturatie/${d.id}`} className="flex items-center justify-between gap-sm rounded-lg border border-outline-variant/40 px-sm py-xs hover:bg-primary/5">
                      <span className="text-body-md">
                        {DOCUMENT_KIND_LABEL[d.kind as DocumentKind]} {d.number.startsWith("CONCEPT") ? "(concept)" : d.number}
                      </span>
                      <span className="flex items-center gap-xs text-label-md">
                        {formatMoney(d.totalCents)}
                        <Badge tone={d.status === "paid" || d.status === "accepted" ? "success" : d.status === "declined" || d.status === "void" ? "error" : "neutral"}>
                          {d.kind === "quote"
                            ? QUOTE_STATUS_LABEL[d.status as keyof typeof QUOTE_STATUS_LABEL] ?? d.status
                            : INVOICE_STATUS_LABEL[d.status as keyof typeof INVOICE_STATUS_LABEL] ?? d.status}
                        </Badge>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <CreateDocumentButtons jobId={job.id} canQuotes={ctx.can.quotes} />
          </Card>

          {(asset || contract) && (
            <Card>
              <h2 className="dash-h2 mb-sm text-headline-md">Installatie</h2>
              {asset && (
                <div className="text-body-md text-on-surface">
                  <div className="font-label-md">{assetLabel(asset.kind)}</div>
                  <div className="text-on-surface-variant">
                    {[asset.brand, asset.model].filter(Boolean).join(" ") || "—"}
                    {asset.serialNumber ? ` · SN ${asset.serialNumber}` : ""}
                  </div>
                  <div className="mt-xs text-label-md text-on-surface-variant">
                    Laatste onderhoud: {fmtDate(asset.lastServiceAt)} · Volgende: {fmtDate(asset.nextServiceDue)}
                  </div>
                </div>
              )}
              {contract && (
                <p className="mt-sm text-label-md text-on-surface-variant">
                  Contract: {contract.name} (elke {contract.intervalMonths} mnd)
                </p>
              )}
            </Card>
          )}

          {["completed", "invoiced", "paid"].includes(job.status) && (
            <Card>
              <h2 className="dash-h2 mb-sm text-headline-md">Oplevering</h2>
              {job.signedAt ? (
                <p className="text-body-md text-on-surface">
                  <Icon name="verified" filled className="mr-xs align-middle text-[18px] text-primary" />
                  Akkoord van {job.signedByName} op {fmtDate(job.signedAt)}
                  {job.warrantyUntil ? ` · garantie tot ${fmtDate(job.warrantyUntil)}` : ""}
                </p>
              ) : (
                <SignOffForm jobId={job.id} />
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
