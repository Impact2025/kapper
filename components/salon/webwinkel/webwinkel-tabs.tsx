"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/admin/ui";
import { ProductForm, type EditableProduct } from "@/components/salon/webwinkel/product-form";
import { ProductList } from "@/components/salon/webwinkel/product-list";
import { OrdersList } from "@/components/salon/webwinkel/orders-list";
import { InventoryAiPanel, type ReorderSuggestion } from "@/components/salon/webwinkel/inventory-ai-panel";
import type { OrderWithItems } from "@/lib/webwinkel/queries";

const TABS = [
  { id: "producten", label: "Producten" },
  { id: "voorraad-ai", label: "Voorraad & AI" },
  { id: "bestellingen", label: "Bestellingen" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function WebwinkelTabs({
  products,
  orders,
  reorderSuggestions,
}: {
  products: EditableProduct[];
  orders: OrderWithItems[];
  reorderSuggestions: ReorderSuggestion[];
}) {
  const [tab, setTab] = useState<TabId>("producten");

  return (
    <div>
      <div className="mb-md flex gap-xs border-b border-outline-variant/40">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "px-md py-sm text-label-md font-label-md transition-colors",
              tab === t.id
                ? "border-b-2 border-primary text-primary"
                : "text-on-surface-variant hover:text-primary",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "producten" && (
        <div className="flex flex-col gap-md">
          <Card>
            <h3 className="mb-sm text-body-md font-medium text-on-surface">Nieuw product</h3>
            <ProductForm />
          </Card>
          <ProductList products={products} />
        </div>
      )}

      {tab === "voorraad-ai" && <InventoryAiPanel suggestions={reorderSuggestions} />}

      {tab === "bestellingen" && <OrdersList orders={orders} />}
    </div>
  );
}
