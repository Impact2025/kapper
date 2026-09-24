import type { Metadata } from "next";
import { requireSalonOwner } from "@/lib/auth/dal";
import { getSalonWithSubscription } from "@/lib/salon/queries";
import { getPraktijkData } from "@/lib/salon/praktijk-queries";
import { getVerticalConfig } from "@/lib/verticals";
import { PageHeader, Card } from "@/components/salon/dash-ui";
import { PraktijkTabs } from "@/components/salon/praktijk-tabs";
import { ActionForm } from "@/components/salon/jobs/action-form";
import { btnOutline } from "@/components/salon/jobs/ui";
import { seedServiceTemplatesAction } from "@/lib/jobs/actions";

export const metadata: Metadata = { title: "Praktijk" };

export default async function PraktijkPage() {
  const user = await requireSalonOwner();
  const [data, salon] = await Promise.all([getPraktijkData(user.salonId), getSalonWithSubscription(user.salonId)]);
  const pack = getVerticalConfig(salon?.vertical);
  const isJob = pack.archetype === "job";

  return (
    <div>
      <PageHeader
        title={isJob ? "Diensten & team" : "Praktijk"}
        subtitle={
          isJob
            ? `Vestigingen, diensten en tarieven, ${pack.terms.practitionerPlural} en kennisbank — hier leert je AI-receptionist wat ze mag zeggen en inplannen.`
            : "Locaties, behandelingen, team en kennisbank — hier leert je AI-receptioniste wat ze mag zeggen en boeken."
        }
      />
      {isJob && data.treatments.length === 0 && pack.serviceTemplates.length > 0 && (
        <Card tint="primary" className="mb-md">
          <h2 className="dash-h2 mb-xs text-headline-md text-on-surface">Snel starten</h2>
          <p className="mb-sm text-body-md text-on-surface-variant">
            Voeg een voorbeeldcatalogus toe ({pack.serviceTemplates.map((t) => t.name).slice(0, 3).join(", ")}…) en pas de tarieven daarna aan de jouwe aan.
          </p>
          <ActionForm action={seedServiceTemplatesAction} submitLabel="Voorbeelddiensten toevoegen" submitIcon="auto_fix_high" buttonClassName={btnOutline} />
        </Card>
      )}
      <PraktijkTabs data={data} variant={isJob ? "job" : "appointment"} />
    </div>
  );
}
