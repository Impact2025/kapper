"use client";

import { useState } from "react";
import { useActionState } from "react";
import { deleteProduct, adjustStock } from "@/lib/webwinkel/actions";
import { Badge, EmptyState } from "@/components/admin/ui";
import { Icon } from "@/components/ui/icon";
import { ProductForm, type EditableProduct } from "@/components/salon/webwinkel/product-form";

function euros(cents: number) {
  return (cents / 100).toLocaleString("nl-NL", { style: "currency", currency: "EUR" });
}

function DeleteButton({ productId }: { productId: string }) {
  const [, action] = useActionState(deleteProduct, undefined);
  return (
    <form action={action}>
      <input type="hidden" name="id" value={productId} />
      <button type="submit" className="rounded-full p-xs text-on-surface-variant hover:bg-error-container hover:text-on-error-container" aria-label="Verwijderen">
        <Icon name="delete" className="text-[18px]" />
      </button>
    </form>
  );
}

function StockAdjustForm({ productId }: { productId: string }) {
  const [state, action, pending] = useActionState(adjustStock, undefined);
  return (
    <form action={action} className="flex items-center gap-xs">
      <input type="hidden" name="productId" value={productId} />
      <input
        type="number"
        name="delta"
        placeholder="+/- aantal"
        required
        className="w-24 rounded-lg border border-outline-variant bg-surface px-xs py-1 text-label-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
      />
      <input type="hidden" name="reason" value="Handmatige aanpassing" />
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-surface-container-high px-sm py-1 text-label-sm font-label-sm text-on-surface-variant transition-colors hover:bg-primary hover:text-on-primary disabled:opacity-50"
      >
        Bijwerken
      </button>
      {state?.error && <span className="text-label-sm text-error">{state.error}</span>}
    </form>
  );
}

export function ProductList({ products }: { products: EditableProduct[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);

  if (!products.length) {
    return (
      <EmptyState
        icon="inventory_2"
        title="Nog geen producten"
        description="Voeg je eerste product toe om te beginnen met verkopen via je webwinkel."
      />
    );
  }

  return (
    <div className="flex flex-col gap-sm">
      {products.map((p) => (
        <div key={p.id} className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-md soft-shadow">
          <div className="flex flex-wrap items-center justify-between gap-sm">
            <div className="min-w-0">
              <div className="flex items-center gap-sm">
                <span className="text-body-md font-medium text-on-surface">{p.name}</span>
                {!p.active && <Badge tone="neutral">Inactief</Badge>}
                {p.stockQuantity <= p.lowStockThreshold && (
                  <Badge tone="warning">Lage voorraad</Badge>
                )}
              </div>
              <div className="text-label-sm text-on-surface-variant">
                {euros(p.priceCents)} · voorraad: {p.stockQuantity} {p.category ? `· ${p.category}` : ""}
              </div>
            </div>
            <div className="flex items-center gap-sm">
              <StockAdjustForm productId={p.id} />
              <button
                onClick={() => setEditingId(editingId === p.id ? null : p.id)}
                className="rounded-full p-xs text-on-surface-variant hover:bg-primary/10 hover:text-primary"
                aria-label="Bewerken"
              >
                <Icon name="edit" className="text-[18px]" />
              </button>
              <DeleteButton productId={p.id} />
            </div>
          </div>
          {editingId === p.id && (
            <div className="mt-sm border-t border-outline-variant/40 pt-sm">
              <ProductForm product={p} onSaved={() => setEditingId(null)} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
