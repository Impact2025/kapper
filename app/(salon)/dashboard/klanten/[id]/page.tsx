import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSalonOwner } from "@/lib/auth/dal";
import { getCurrentUser } from "@/lib/auth/dal";
import { getCustomer } from "@/lib/customers/queries";
import { listAppointmentsForCustomer } from "@/lib/salon/appointments";
import { listTreatmentCards, listHealthRecords } from "@/lib/dossier/queries";
import { amsterdamDateKey, amsterdamTimeKey } from "@/lib/salon/timezone";
import { Card, Badge } from "@/components/salon/dash-ui";
import { Icon } from "@/components/ui/icon";
import { TreatmentCardForm } from "@/components/salon/treatment-card-form";
import { HealthRecordForm } from "@/components/salon/health-record-form";
import { PurgeCustomerButton } from "@/components/salon/purge-customer-button";

export const metadata: Metadata = { title: "Klantdossier" };

function fmtDate(date: Date) {
  return date.toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Amsterdam" });
}

function fmtDateTime(date: Date) {
  return `${amsterdamDateKey(date)} · ${amsterdamTimeKey(date)}`;
}

export default async function KlantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireSalonOwner();
  const currentUser = await getCurrentUser(); // canAccessHealthRecords flag

  const customer = await getCustomer(user.salonId, id);
  if (!customer) notFound();

  const [appointmentHistory, treatmentCards, healthRecords] = await Promise.all([
    listAppointmentsForCustomer(user.salonId, id),
    listTreatmentCards(user.salonId, id),
    currentUser.canAccessHealthRecords ? listHealthRecords(user.salonId, id) : Promise.resolve([]),
  ]);

  const now = new Date();
  const upcoming = appointmentHistory.filter((a) => a.appointmentTime >= now).reverse();
  const past = appointmentHistory.filter((a) => a.appointmentTime < now);

  return (
    <div className="max-w-3xl">
      <Link
        href="/dashboard/klanten"
        className="mb-md inline-flex items-center gap-xs text-label-md text-on-surface-variant hover:text-primary"
      >
        <Icon name="arrow_back" className="text-[18px]" />
        Terug naar klanten
      </Link>

      {/* Header */}
      <div className="mb-lg flex items-start gap-md rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-md">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-label-lg font-label-md text-on-primary-fixed">
          {customer.name
            .split(" ")
            .slice(0, 2)
            .map((w) => w[0]?.toUpperCase() ?? "")
            .join("")}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-sm">
            <h1 className="dash-h2 text-headline-md text-on-surface">{customer.name}</h1>
            {customer.blockedFromOnlineBooking && <Badge tone="error">Geblokkeerd voor online boeken</Badge>}
            {!customer.blockedFromOnlineBooking && customer.noShowCount > 0 && (
              <Badge tone="warning">{customer.noShowCount} no-show{customer.noShowCount === 1 ? "" : "s"}</Badge>
            )}
          </div>
          <div className="mt-xs flex flex-wrap gap-md text-label-sm text-on-surface-variant">
            <span className="flex items-center gap-xs">
              <Icon name="call" className="text-[16px]" />
              {customer.phone}
            </span>
            {customer.email && (
              <span className="flex items-center gap-xs">
                <Icon name="mail" className="text-[16px]" />
                {customer.email}
              </span>
            )}
            <span className="flex items-center gap-xs">
              <Icon name="event" className="text-[16px]" />
              Klant sinds {fmtDate(customer.createdAt)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-lg">
        {/* Aankomend */}
        {upcoming.length > 0 && (
          <Card>
            <h2 className="mb-sm dash-h2 text-headline-md text-on-surface">Aankomende afspraken</h2>
            <div className="flex flex-col divide-y divide-outline-variant/30">
              {upcoming.map((a) => (
                <div key={a.id} className="flex items-center justify-between py-sm">
                  <div>
                    <div className="text-body-md text-on-surface">{a.serviceType}</div>
                    <div className="text-label-sm text-on-surface-variant">
                      {fmtDateTime(a.appointmentTime)} · {a.durationMinutes} min
                      {a.staffName ? ` · ${a.staffName}` : ""}
                    </div>
                  </div>
                  <Badge tone={a.status === "confirmed" ? "success" : "neutral"}>{a.status}</Badge>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Behandelkaarten */}
        <Card>
          <h2 className="mb-sm dash-h2 text-headline-md text-on-surface">Behandelkaarten</h2>
          {treatmentCards.length === 0 ? (
            <p className="mb-md text-body-md text-on-surface-variant">Nog geen behandelkaarten vastgelegd.</p>
          ) : (
            <div className="mb-md flex flex-col divide-y divide-outline-variant/30">
              {treatmentCards.map((card) => (
                <div key={card.id} className="py-sm">
                  <div className="flex flex-wrap gap-sm text-label-sm text-on-surface-variant">
                    <span>{fmtDate(card.createdAt)}</span>
                    {typeof card.details.colorFormula === "string" && card.details.colorFormula && (
                      <span>· {card.details.colorFormula}</span>
                    )}
                    {typeof card.details.technique === "string" && card.details.technique && (
                      <span>· {card.details.technique}</span>
                    )}
                  </div>
                  {card.notes && <p className="mt-xs text-body-md text-on-surface">{card.notes}</p>}
                </div>
              ))}
            </div>
          )}
          <TreatmentCardForm customerId={customer.id} />
        </Card>

        {/* Gezondheidsgegevens (Artikel 9 AVG) */}
        {currentUser.canAccessHealthRecords ? (
          <Card>
            <div className="mb-sm flex items-center gap-xs">
              <Icon name="medical_information" className="text-[20px] text-secondary" />
              <h2 className="dash-h2 text-headline-md text-on-surface">Gezondheidsgegevens</h2>
              <Badge tone="warning">Artikel 9 AVG</Badge>
            </div>
            {healthRecords.length === 0 ? (
              <p className="mb-md text-body-md text-on-surface-variant">Geen medische gegevens vastgelegd.</p>
            ) : (
              <div className="mb-md flex flex-col divide-y divide-outline-variant/30">
                {healthRecords.map((rec) => (
                  <div key={rec.id} className="py-sm text-body-md text-on-surface">
                    {rec.allergies && <p>Allergieën: {rec.allergies}</p>}
                    {rec.scalpCondition && <p>Hoofdhuid: {rec.scalpCondition}</p>}
                    {rec.patchTestResult && (
                      <p>
                        Patch-test: {rec.patchTestResult}
                        {rec.patchTestAt ? ` (${fmtDate(rec.patchTestAt)})` : ""}
                      </p>
                    )}
                    <p className="mt-xs text-label-sm text-on-surface-variant">
                      Toestemming gegeven op {fmtDate(rec.consentGivenAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
            <HealthRecordForm customerId={customer.id} />
          </Card>
        ) : (
          <Card className="flex items-center gap-sm">
            <Icon name="lock" className="text-[20px] text-on-surface-variant" />
            <p className="text-body-md text-on-surface-variant">
              Je account heeft geen toegang tot medische gegevens (Artikel 9 AVG) van deze klant.
            </p>
          </Card>
        )}

        {/* Historie */}
        <Card>
          <h2 className="mb-sm dash-h2 text-headline-md text-on-surface">Eerdere afspraken</h2>
          {past.length === 0 ? (
            <p className="text-body-md text-on-surface-variant">Nog geen afspraakhistorie.</p>
          ) : (
            <div className="flex flex-col divide-y divide-outline-variant/30">
              {past.map((a) => (
                <div key={a.id} className="flex items-center justify-between py-sm">
                  <div>
                    <div className="text-body-md text-on-surface">{a.serviceType}</div>
                    <div className="text-label-sm text-on-surface-variant">
                      {fmtDateTime(a.appointmentTime)}
                      {a.staffName ? ` · ${a.staffName}` : ""}
                    </div>
                  </div>
                  <Badge tone={a.status === "no_show" ? "error" : "neutral"}>{a.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Artikel 17 AVG recht op vergetelheid */}
        <div className="pt-md">
          <PurgeCustomerButton customerId={customer.id} customerName={customer.name} />
        </div>
      </div>
    </div>
  );
}
