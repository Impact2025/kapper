import Link from "next/link";
import { inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { customerAddresses } from "@/lib/db/schema-jobs";
import type { JobContext } from "@/lib/jobs/access";
import { getCustomer360, searchJobCustomers } from "@/lib/jobs/crm";
import { assetKindLabeler, categoryLabeler } from "@/lib/jobs/labels";
import {
  CUSTOMER_TYPE_LABEL,
  DOCUMENT_KIND_LABEL,
  INVOICE_STATUS_LABEL,
  QUOTE_STATUS_LABEL,
  customerDisplayName,
  formatAddressLine,
  formatMoney,
  type CustomerType,
  type DocumentKind,
} from "@/lib/jobs/model";
import { PageHeader, Card, StatCard, Badge, EmptyState, AdminLink } from "@/components/salon/dash-ui";
import { Icon } from "@/components/ui/icon";
import { PriorityBadge, StatusBadge, TextLink, btnOutline, fmtDate, fmtDateTime, inputCls } from "@/components/salon/jobs/ui";
import { AddressForm, AssetForm, ContractForm, Disclosure, EditCustomerForm, NewCustomerForm } from "@/components/salon/jobs/crm-forms";
import { InlineActionButton } from "@/components/salon/jobs/action-form";
import { deleteAddressAction, deleteAssetAction, setContractStatusAction } from "@/lib/jobs/actions";
import { PurgeCustomerButton } from "@/components/salon/purge-customer-button";
import { notFound } from "next/navigation";

/* ============================ lijst ============================ */
export async function JobCustomersView({ ctx, q }: { ctx: JobContext; q: string }) {
  const customers = await searchJobCustomers(ctx.salonId, q);
  const addresses = customers.length
    ? await db.select().from(customerAddresses).where(inArray(customerAddresses.customerId, customers.map((c) => c.id)))
    : [];
  const firstAddress = new Map<string, string>();
  const count = new Map<string, number>();
  for (const a of addresses) {
    if (!firstAddress.has(a.customerId)) firstAddress.set(a.customerId, `${a.city}`);
    count.set(a.customerId, (count.get(a.customerId) ?? 0) + 1);
  }

  return (
    <div>
      <PageHeader title="Klanten" subtitle="Alle klanten met hun adressen, installaties en klushistorie." />
      <Card className="mb-lg">
        <form method="get" className="flex flex-wrap gap-sm">
          <input type="search" name="q" defaultValue={q} placeholder="Zoek op naam, bedrijf, telefoon, e-mail of adres…" className={`${inputCls} max-w-[32rem]`} />
          <button type="submit" className={btnOutline}>
            Zoeken
          </button>
        </form>
        <Disclosure label="Nieuwe klant" icon="person_add">
          <NewCustomerForm />
        </Disclosure>
      </Card>

      {customers.length === 0 ? (
        <EmptyState
          icon="group"
          title={q ? "Niemand gevonden" : "Nog geen klanten"}
          description={q ? "Probeer een andere zoekterm." : "Klanten verschijnen automatisch zodra de AI een aanvraag vastlegt, of maak er zelf een aan."}
        />
      ) : (
        <Card className="p-0">
          <div className="divide-y divide-outline-variant/30">
            {customers.map((c) => (
              <Link key={c.id} href={`/dashboard/klanten/${c.id}`} className="flex flex-col gap-xs px-md py-sm transition-colors hover:bg-primary/5 md:flex-row md:items-center md:gap-md">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-body-md text-on-surface">{customerDisplayName(c)}</div>
                  <div className="truncate text-label-sm text-on-surface-variant">
                    {c.phone}
                    {c.email ? ` · ${c.email}` : ""}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-sm text-label-sm text-on-surface-variant">
                  {c.customerType !== "private" && <Badge>{CUSTOMER_TYPE_LABEL[c.customerType as CustomerType] ?? c.customerType}</Badge>}
                  {firstAddress.get(c.id) && (
                    <span className="inline-flex items-center gap-xs">
                      <Icon name="location_on" className="text-[16px]" />
                      {firstAddress.get(c.id)}
                      {(count.get(c.id) ?? 0) > 1 ? ` +${(count.get(c.id) ?? 1) - 1}` : ""}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

/* ============================ 360° klant ============================ */
export async function JobCustomerDetailView({ ctx, customerId }: { ctx: JobContext; customerId: string }) {
  const data = await getCustomer360(ctx.salonId, customerId);
  if (!data) notFound();
  const { customer, addresses, assets, contracts, jobs, documents, lifetimePaidCents, openCents } = data;

  const catLabel = categoryLabeler(ctx.pack);
  const assetLabel = assetKindLabeler(ctx.pack);
  const addressLines = addresses.map((a) => ({ id: a.id, line: formatAddressLine(a) }));
  const assetOptions = assets.map((a) => ({ id: a.id, label: [assetLabel(a.kind), a.brand, a.model].filter(Boolean).join(" ") }));
  const phone = customer.phone;
  const waHref = `https://wa.me/${phone.replace(/[^\d]/g, "").replace(/^0/, "31")}`;
  const now = new Date();

  return (
    <div className="flex flex-col gap-lg">
      <div>
        <TextLink href="/dashboard/klanten" className="text-label-md">
          ← Alle klanten
        </TextLink>
        <div className="mt-xs flex flex-wrap items-center gap-sm">
          <h1 className="dash-h1 text-headline-lg">{customerDisplayName(customer)}</h1>
          <Badge>{CUSTOMER_TYPE_LABEL[customer.customerType as CustomerType] ?? customer.customerType}</Badge>
          {customer.blockedFromOnlineBooking && <Badge tone="error">Geblokkeerd voor online boeken</Badge>}
        </div>
        <div className="mt-sm flex flex-wrap items-center gap-md text-body-md">
          <a href={`tel:${phone}`} className="inline-flex items-center gap-xs text-primary hover:underline">
            <Icon name="call" className="text-[18px]" />
            {phone}
          </a>
          <a href={waHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-xs text-primary hover:underline">
            <Icon name="chat" className="text-[18px]" />
            WhatsApp
          </a>
          {customer.email && (
            <a href={`mailto:${customer.email}`} className="inline-flex items-center gap-xs text-primary hover:underline">
              <Icon name="mail" className="text-[18px]" />
              {customer.email}
            </a>
          )}
          <AdminLink href={`/dashboard/klussen/nieuw?customerId=${customer.id}`} className="ml-auto">
            <Icon name="add" className="text-[18px]" />
            Nieuwe {ctx.pack.terms.treatment}
          </AdminLink>
        </div>
        {customer.notes && <p className="mt-sm whitespace-pre-line rounded-lg bg-surface-container px-sm py-xs text-body-md text-on-surface-variant">{customer.notes}</p>}
      </div>

      <div className="grid grid-cols-2 gap-md xl:grid-cols-4">
        <StatCard label="Klussen" value={String(jobs.length)} icon="construction" />
        <StatCard label="Totaal betaald" value={formatMoney(lifetimePaidCents)} icon="payments" />
        <StatCard label="Openstaand" value={formatMoney(openCents)} icon="hourglass_top" tint={openCents ? "secondary" : "plain"} />
        <StatCard label="Adressen" value={String(addresses.length)} icon="home_pin" />
      </div>

      <div className="grid grid-cols-1 gap-lg lg:grid-cols-3">
        <div className="flex flex-col gap-lg lg:col-span-2">
          {/* Klushistorie */}
          <Card>
            <h2 className="dash-h2 mb-sm text-headline-md">Klushistorie</h2>
            {jobs.length === 0 ? (
              <p className="text-body-md text-on-surface-variant">Nog geen klussen voor deze klant.</p>
            ) : (
              <div className="divide-y divide-outline-variant/30">
                {jobs.map((j) => (
                  <Link key={j.id} href={`/dashboard/klussen/${j.id}`} className="flex flex-wrap items-center gap-sm py-xs hover:bg-primary/5">
                    <span className="w-24 text-label-md font-label-md">{j.number}</span>
                    <span className="min-w-0 flex-1 truncate text-body-md">{j.title}</span>
                    <span className="text-label-sm text-on-surface-variant">{catLabel(j.category)}</span>
                    <PriorityBadge priority={j.priority} />
                    <StatusBadge status={j.status} />
                    <span className="w-28 text-right text-label-sm text-on-surface-variant">{fmtDate(j.scheduledStart ?? j.createdAt)}</span>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          {/* Documenten */}
          {documents.length > 0 && (
            <Card>
              <h2 className="dash-h2 mb-sm text-headline-md">Offertes &amp; facturen</h2>
              <div className="divide-y divide-outline-variant/30">
                {documents.map((d) => (
                  <Link key={d.id} href={`/dashboard/facturatie/${d.id}`} className="flex flex-wrap items-center gap-sm py-xs hover:bg-primary/5">
                    <span className="w-28 text-label-md font-label-md">{DOCUMENT_KIND_LABEL[d.kind as DocumentKind]}</span>
                    <span className="min-w-0 flex-1 text-body-md">{d.number.startsWith("CONCEPT") ? "Concept" : d.number}</span>
                    <span className="text-label-md">{formatMoney(d.totalCents)}</span>
                    <Badge tone={d.status === "paid" || d.status === "accepted" ? "success" : d.status === "sent" && d.dueAt && d.dueAt < now ? "error" : "neutral"}>
                      {d.kind === "quote"
                        ? QUOTE_STATUS_LABEL[d.status as keyof typeof QUOTE_STATUS_LABEL] ?? d.status
                        : INVOICE_STATUS_LABEL[d.status as keyof typeof INVOICE_STATUS_LABEL] ?? d.status}
                    </Badge>
                  </Link>
                ))}
              </div>
            </Card>
          )}

          {/* Installaties */}
          {ctx.pack.features.assets && (
            <Card>
              <h2 className="dash-h2 mb-sm text-headline-md">Installaties</h2>
              {!ctx.can.assets ? (
                <p className="text-body-md text-on-surface-variant">
                  Het installatiepaspoort is onderdeel van Pro. <Link className="text-primary hover:underline" href="/dashboard/abonnement">Upgrade</Link>
                </p>
              ) : (
                <>
                  {assets.length === 0 ? (
                    <p className="text-body-md text-on-surface-variant">Nog geen installaties vastgelegd.</p>
                  ) : (
                    <div className="flex flex-col gap-xs">
                      {assets.map((a) => {
                        const overdue = a.nextServiceDue && a.nextServiceDue < now;
                        return (
                          <div key={a.id} className="flex flex-wrap items-center gap-sm rounded-lg border border-outline-variant/40 px-sm py-xs">
                            <div className="min-w-0 flex-1">
                              <div className="text-body-md text-on-surface">
                                {assetLabel(a.kind)} {[a.brand, a.model].filter(Boolean).join(" ")}
                              </div>
                              <div className="text-label-sm text-on-surface-variant">
                                {a.serialNumber ? `SN ${a.serialNumber} · ` : ""}
                                Geplaatst {fmtDate(a.installedAt)} · onderhoud {fmtDate(a.lastServiceAt)} → {fmtDate(a.nextServiceDue)}
                                {a.warrantyUntil ? ` · garantie tot ${fmtDate(a.warrantyUntil)}` : ""}
                              </div>
                            </div>
                            {overdue && <Badge tone="warning">Onderhoud nodig</Badge>}
                            <InlineActionButton action={deleteAssetAction} fields={{ assetId: a.id, customerId: customer.id }} label="Verwijder" icon="delete" confirm="Deze installatie verwijderen?" />
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <Disclosure label="Installatie toevoegen" icon="add">
                    <AssetForm customerId={customer.id} kinds={ctx.pack.assetKinds.map((k) => ({ key: k.key, label: k.label }))} addresses={addressLines} />
                  </Disclosure>
                </>
              )}
            </Card>
          )}

          {/* Contracten */}
          {ctx.pack.features.contracts && (
            <Card>
              <h2 className="dash-h2 mb-sm text-headline-md">Onderhoudscontracten</h2>
              {!ctx.can.contracts ? (
                <p className="text-body-md text-on-surface-variant">
                  Onderhoudscontracten zijn onderdeel van Pro. <Link className="text-primary hover:underline" href="/dashboard/abonnement">Upgrade</Link>
                </p>
              ) : (
                <>
                  {contracts.length === 0 ? (
                    <p className="text-body-md text-on-surface-variant">Geen contracten. Met een contract ontstaat de klus en de herinnering automatisch.</p>
                  ) : (
                    <div className="flex flex-col gap-xs">
                      {contracts.map((c) => (
                        <div key={c.id} className="flex flex-wrap items-center gap-sm rounded-lg border border-outline-variant/40 px-sm py-xs">
                          <div className="min-w-0 flex-1">
                            <div className="text-body-md text-on-surface">{c.name}</div>
                            <div className="text-label-sm text-on-surface-variant">
                              Elke {c.intervalMonths} mnd · {formatMoney(c.priceCents)} · volgende beurt {fmtDate(c.nextDueAt)}
                            </div>
                          </div>
                          <Badge tone={c.status === "active" ? "success" : "neutral"}>{c.status === "active" ? "Actief" : c.status === "paused" ? "Gepauzeerd" : "Beëindigd"}</Badge>
                          <InlineActionButton action={setContractStatusAction} fields={{ contractId: c.id, status: c.status === "active" ? "paused" : "active" }} label={c.status === "active" ? "Pauzeer" : "Activeer"} />
                        </div>
                      ))}
                    </div>
                  )}
                  <Disclosure label="Contract toevoegen" icon="event_repeat">
                    <ContractForm
                      customerId={customer.id}
                      categories={ctx.pack.jobCategories.map((c) => ({ key: c.key, label: c.label }))}
                      assets={assetOptions}
                      addresses={addressLines}
                      defaultVat={ctx.pack.vatRates.treatment}
                    />
                  </Disclosure>
                </>
              )}
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-lg">
          {/* Adressen */}
          <Card>
            <h2 className="dash-h2 mb-sm text-headline-md">Adressen</h2>
            {addresses.length === 0 ? (
              <p className="text-body-md text-on-surface-variant">Nog geen adres — voeg het klusadres toe.</p>
            ) : (
              <div className="flex flex-col gap-xs">
                {addresses.map((a) => (
                  <div key={a.id} className="rounded-lg border border-outline-variant/40 px-sm py-xs">
                    <div className="flex items-start justify-between gap-sm">
                      <div className="text-body-md text-on-surface">
                        {a.label && <strong>{a.label}: </strong>}
                        {formatAddressLine(a)}
                        {a.isBilling && <Badge tone="primary">Factuuradres</Badge>}
                      </div>
                      <InlineActionButton action={deleteAddressAction} fields={{ addressId: a.id, customerId: customer.id }} label="Verwijder" confirm="Dit adres verwijderen?" />
                    </div>
                    {a.accessNotes && <div className="text-label-sm text-on-surface-variant">Toegang: {a.accessNotes}</div>}
                    {a.contactName && (
                      <div className="text-label-sm text-on-surface-variant">
                        Contact: {a.contactName}
                        {a.contactPhone ? ` · ${a.contactPhone}` : ""}
                      </div>
                    )}
                    <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formatAddressLine(a))}`} target="_blank" rel="noreferrer" className="text-label-sm text-primary hover:underline">
                      Route
                    </a>
                  </div>
                ))}
              </div>
            )}
            <Disclosure label="Adres toevoegen" icon="add_location">
              <AddressForm customerId={customer.id} />
            </Disclosure>
          </Card>

          <Card>
            <h2 className="dash-h2 mb-sm text-headline-md">Gegevens</h2>
            <EditCustomerForm customer={customer} />
            <p className="mt-sm text-label-sm text-on-surface-variant">Klant sinds {fmtDateTime(customer.createdAt)}</p>
          </Card>

          <Card>
            <h2 className="dash-h2 mb-sm text-headline-md">Privacy</h2>
            <PurgeCustomerButton customerId={customer.id} customerName={customer.name} />
          </Card>
        </div>
      </div>
    </div>
  );
}
