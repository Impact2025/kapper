import { Badge, EmptyState } from "@/components/admin/ui";
import type { OrderWithItems } from "@/lib/webwinkel/queries";

const STATUS_TONE = {
  pending: "warning",
  paid: "success",
  fulfilled: "primary",
  canceled: "error",
} as const;

const STATUS_LABEL: Record<string, string> = {
  pending: "In afwachting",
  paid: "Betaald",
  fulfilled: "Afgehandeld",
  canceled: "Geannuleerd",
};

function euros(cents: number) {
  return (cents / 100).toLocaleString("nl-NL", { style: "currency", currency: "EUR" });
}

export function OrdersList({ orders }: { orders: OrderWithItems[] }) {
  if (!orders.length) {
    return (
      <EmptyState icon="receipt_long" title="Nog geen bestellingen" description="Zodra klanten via je webwinkel afrekenen, verschijnen bestellingen hier." />
    );
  }

  return (
    <div className="flex flex-col gap-sm">
      {orders.map((o) => (
        <div key={o.id} className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-md soft-shadow">
          <div className="flex flex-wrap items-start justify-between gap-sm">
            <div>
              <div className="flex items-center gap-sm">
                <span className="text-body-md font-medium text-on-surface">{o.customerName}</span>
                <Badge tone={STATUS_TONE[o.status]}>{STATUS_LABEL[o.status] ?? o.status}</Badge>
              </div>
              <div className="text-label-sm text-on-surface-variant">
                {o.customerEmail} · {new Date(o.createdAt).toLocaleDateString("nl-NL")}
              </div>
              <ul className="mt-xs text-label-sm text-on-surface-variant">
                {o.items.map((item, i) => (
                  <li key={i}>
                    {item.quantity}× {item.productName} ({euros(item.unitPriceCents)})
                  </li>
                ))}
              </ul>
            </div>
            <span className="text-label-lg font-label-lg text-on-surface">{euros(o.totalCents)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
