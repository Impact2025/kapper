import type { Metadata } from "next";
import { requireSalonOwner } from "@/lib/auth/dal";
import { getSalonWithSubscription } from "@/lib/salon/queries";
import { PageHeader, Card, Badge } from "@/components/admin/ui";
import { Icon } from "@/components/ui/icon";
import { NoShowForm } from "@/components/salon/no-show-form";

export const metadata: Metadata = { title: "No-show beleid" };

export default async function NoShowPage() {
  const user = await requireSalonOwner();
  const salon = await getSalonWithSubscription(user.salonId);

  const raw = (salon?.settings?.noShow as Record<string, unknown>) ?? {};
  const policy = {
    enabled: Boolean(raw.enabled ?? false),
    freeCancelHours: Number(raw.freeCancelHours ?? 24),
    chargePercent: Number(raw.chargePercent ?? 100),
    depositRequired: Boolean(raw.depositRequired ?? false),
    depositCents: Number(raw.depositCents ?? 0),
    reminderHours: (raw.reminderHours as number[] | undefined) ?? [48, 24],
  };

  return (
    <div>
      <PageHeader
        title="No-show beleid"
        subtitle="Bescherm je omzet met een transparant en juridisch sluitend beleid"
        action={
          <Badge tone={policy.enabled ? "success" : "neutral"}>
            {policy.enabled ? "Actief" : "Inactief"}
          </Badge>
        }
      />

      {/* Legal notice */}
      <div className="mb-lg rounded-xl border border-outline-variant/40 bg-secondary-fixed/40 p-md">
        <div className="flex items-start gap-sm">
          <Icon name="gavel" className="mt-0.5 shrink-0 text-[22px] text-secondary" />
          <div>
            <h3 className="mb-xs text-body-md font-medium text-on-surface">
              Juridische vereiste — Middelburg 2023
            </h3>
            <p className="text-label-sm text-on-surface-variant">
              Om no-show kosten te mogen vorderen, moet de klant via een{" "}
              <strong>verplichte checkbox</strong> expliciet akkoord gaan tijdens het online boeken.
              Passieve huisregels (bordje bij de balie, vermelden in nieuwsbrief) bieden
              nul juridische bescherming. KapperAssistent voegt deze checkbox automatisch toe aan
              je boekingsformulier zodra je beleid hieronder activeert.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-md lg:grid-cols-3">
        <div className="lg:col-span-2">
          <NoShowForm policy={policy} />
        </div>

        {/* Live policy preview */}
        <div className="flex flex-col gap-md">
          <Card>
            <h3 className="mb-sm font-headline-md text-headline-md text-on-surface">
              Preview klantbeleid
            </h3>
            <div className="rounded-lg border border-outline-variant/40 bg-surface p-sm text-label-sm text-on-surface-variant space-y-xs">
              <p className="font-medium text-on-surface">Annuleringsbeleid</p>
              <p>
                Afspraken kunnen kosteloos worden geannuleerd tot{" "}
                <strong>{policy.freeCancelHours} uur</strong> voor aanvang.
              </p>
              {policy.chargePercent > 0 && (
                <p>
                  Bij annulering binnen {policy.freeCancelHours} uur of bij no-show wordt{" "}
                  <strong>{policy.chargePercent}%</strong> van de behandelprijs in rekening gebracht.
                </p>
              )}
              {policy.depositRequired && policy.depositCents > 0 && (
                <p>
                  Bij behandelingen boven €60 is een aanbetaling van{" "}
                  <strong>€{(policy.depositCents / 100).toFixed(0)}</strong> vereist.
                </p>
              )}
              <div className="mt-sm flex items-start gap-xs rounded border border-outline-variant/40 p-xs">
                <Icon name="check_box_outline_blank" className="mt-0.5 shrink-0 text-[16px] text-outline" />
                <span className="text-[11px]">
                  Ik ga akkoord met het annuleringsbeleid van de salon.
                </span>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="mb-sm font-headline-md text-headline-md text-on-surface">
              Herinneringstijdstip
            </h3>
            <div className="flex flex-col gap-xs">
              {[48, 24].map((h) => (
                <div key={h} className="flex items-center gap-sm text-label-sm">
                  <Icon
                    name={policy.reminderHours.includes(h) ? "notifications_active" : "notifications_off"}
                    className={`text-[18px] ${policy.reminderHours.includes(h) ? "text-primary" : "text-outline"}`}
                  />
                  <span className={policy.reminderHours.includes(h) ? "text-on-surface" : "text-on-surface-variant"}>
                    {h} uur van tevoren
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="mb-sm font-headline-md text-headline-md text-on-surface">
              ROI bij 4 no-shows/week
            </h3>
            <div className="text-headline-md font-headline-md text-primary">€12.000</div>
            <div className="text-label-sm text-on-surface-variant">
              per jaar beschermd bij gemiddeld €65 per behandeling
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
