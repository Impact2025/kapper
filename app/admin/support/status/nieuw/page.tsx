import Link from "next/link";
import { requireRole } from "@/lib/auth/dal";
import { PageHeader } from "@/components/admin/ui";
import { IncidentForm } from "@/components/support/incident-form";

export default async function NewIncidentPage() {
  await requireRole("admin");
  return (
    <div>
      <Link href="/admin/support/status" className="mb-md inline-block text-label-md text-on-surface-variant hover:text-primary">
        ← Storingen
      </Link>
      <PageHeader title="Nieuwe melding" subtitle="Wordt direct openbaar op /status. Schrijf voor salon-eigenaren, niet voor techneuten." />
      <IncidentForm />
    </div>
  );
}
