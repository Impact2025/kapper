import type { Metadata } from "next";
import Link from "next/link";
import { requireSalonOwner } from "@/lib/auth/dal";
import { PageHeader } from "@/components/salon/dash-ui";
import { TicketForm } from "@/components/support/ticket-form";

export const metadata: Metadata = { title: "Nieuw ticket" };

export default async function NewSalonTicketPage({
  searchParams,
}: {
  searchParams: Promise<{ categorie?: string; onderwerp?: string }>;
}) {
  await requireSalonOwner();
  const { categorie, onderwerp } = await searchParams;

  return (
    <div className="max-w-2xl">
      <Link href="/dashboard/support" className="mb-md inline-block text-label-md text-on-surface-variant hover:text-primary">
        ← Support
      </Link>
      <PageHeader title="Nieuw ticket" subtitle="We reageren op basis van je plan. Je volgt alles hier in je dashboard." />
      <TicketForm knownUser audience="salon" defaultCategory={categorie} defaultSubject={onderwerp?.slice(0, 200)} />
    </div>
  );
}
