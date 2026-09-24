import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { requireJobOwner } from "@/lib/jobs/access";
import { db } from "@/lib/db";
import { customers } from "@/lib/db/schema";
import { customerAddresses } from "@/lib/db/schema-jobs";
import { listActiveStaff } from "@/lib/jobs/queries";
import { formatAddressLine } from "@/lib/jobs/model";
import { PageHeader, Card } from "@/components/salon/dash-ui";
import { NewJobForm, type FormCustomer } from "@/components/salon/jobs/new-job-form";
import { capitalize } from "@/lib/jobs/labels";

export const metadata: Metadata = { title: "Nieuwe klus" };

export default async function NieuweKlusPage({ searchParams }: { searchParams: Promise<{ customerId?: string }> }) {
  const { customerId } = await searchParams;
  const ctx = await requireJobOwner();

  const [rows, addressRows, staff] = await Promise.all([
    db.select().from(customers).where(eq(customers.salonId, ctx.salonId)).orderBy(desc(customers.updatedAt)).limit(500),
    db.select().from(customerAddresses).where(eq(customerAddresses.salonId, ctx.salonId)).limit(3000),
    listActiveStaff(ctx.salonId),
  ]);

  const byCustomer = new Map<string, FormCustomer["addresses"]>();
  for (const a of addressRows) {
    const list = byCustomer.get(a.customerId) ?? [];
    list.push({ id: a.id, label: a.label, line: formatAddressLine(a) });
    byCustomer.set(a.customerId, list);
  }
  const formCustomers: FormCustomer[] = rows.map((c) => ({
    id: c.id,
    name: c.name,
    companyName: c.companyName,
    phone: c.phone,
    addresses: byCustomer.get(c.id) ?? [],
  }));

  return (
    <div>
      <PageHeader title={`Nieuwe ${ctx.pack.terms.treatment}`} subtitle="Leg een aanvraag vast — je kunt hem daarna inplannen, een offerte maken en factureren." />
      <Card className="max-w-[56rem]">
        <NewJobForm
          customers={formCustomers}
          staff={staff}
          categories={ctx.pack.jobCategories.map((c) => ({ key: c.key, label: c.label, urgent: c.urgent, estimatedMinutes: c.estimatedMinutes }))}
          noun={capitalize(ctx.pack.terms.treatment).toLowerCase()}
          initialCustomerId={customerId}
        />
      </Card>
    </div>
  );
}
