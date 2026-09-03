import type { Metadata } from "next";
import { requireSalonOwner } from "@/lib/auth/dal";
import { getPraktijkData } from "@/lib/salon/praktijk-queries";
import { PageHeader } from "@/components/admin/ui";
import { PraktijkTabs } from "@/components/salon/praktijk-tabs";

export const metadata: Metadata = { title: "Praktijk" };

export default async function PraktijkPage() {
  const user = await requireSalonOwner();
  const data = await getPraktijkData(user.salonId);

  return (
    <div>
      <PageHeader
        title="Praktijk"
        subtitle="Locaties, behandelingen, team en kennisbank — hier leert je AI-receptioniste wat ze mag zeggen en boeken."
      />
      <PraktijkTabs data={data} />
    </div>
  );
}
