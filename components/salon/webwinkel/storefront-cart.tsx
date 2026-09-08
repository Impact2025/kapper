"use client";

import { useState, useTransition } from "react";
import { createProductCheckout } from "@/lib/webwinkel/checkout";
import { Icon } from "@/components/ui/icon";
import type { Product } from "@/lib/webwinkel/queries";

function euros(cents: number) {
  return (cents / 100).toLocaleString("nl-NL", { style: "currency", currency: "EUR" });
}

export function StorefrontCart({ slug, products }: { slug: string; products: Product[] }) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const cart = Object.entries(quantities).filter(([, qty]) => qty > 0);
  const byId = new Map(products.map((p) => [p.id, p]));
  const totalCents = cart.reduce((sum, [id, qty]) => sum + (byId.get(id)?.priceCents ?? 0) * qty, 0);

  function setQty(productId: string, qty: number) {
    setQuantities((prev) => ({ ...prev, [productId]: Math.max(0, qty) }));
  }

  function checkout() {
    setError(null);
    if (!cart.length) return setError("Je winkelmandje is leeg.");
    if (!customerName.trim()) return setError("Vul je naam in.");
    if (!customerEmail.trim()) return setError("Vul je e-mailadres in.");

    startTransition(async () => {
      const result = await createProductCheckout({
        slug,
        customerName,
        customerEmail,
        customerPhone,
        cart: cart.map(([productId, quantity]) => ({ productId, quantity })),
      });
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="grid gap-lg md:grid-cols-3">
      <div className="flex flex-col gap-sm md:col-span-2">
        {products.map((p) => (
          <div key={p.id} className="flex items-center gap-md rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-md soft-shadow">
            {p.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.imageUrl} alt={p.name} className="h-16 w-16 rounded-lg object-cover" />
            )}
            <div className="min-w-0 flex-1">
              <div className="text-body-md font-medium text-on-surface">{p.name}</div>
              {p.description && <div className="text-label-sm text-on-surface-variant">{p.description}</div>}
              <div className="text-label-md font-label-md text-primary">{euros(p.priceCents)}</div>
            </div>
            <div className="flex items-center gap-xs">
              <button
                onClick={() => setQty(p.id, (quantities[p.id] ?? 0) - 1)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant hover:bg-primary hover:text-on-primary"
              >
                <Icon name="remove" className="text-[16px]" />
              </button>
              <span className="w-6 text-center text-body-md text-on-surface">{quantities[p.id] ?? 0}</span>
              <button
                onClick={() => setQty(p.id, Math.min(p.stockQuantity, (quantities[p.id] ?? 0) + 1))}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant hover:bg-primary hover:text-on-primary"
              >
                <Icon name="add" className="text-[16px]" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-md soft-shadow">
        <h3 className="mb-sm text-body-md font-medium text-on-surface">Winkelmandje</h3>
        <div className="mb-sm flex items-center justify-between text-body-md text-on-surface">
          <span>Totaal</span>
          <span className="font-medium">{euros(totalCents)}</span>
        </div>

        <div className="flex flex-col gap-sm">
          <input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Naam"
            className="w-full rounded-lg border border-outline-variant bg-surface px-sm py-sm text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            placeholder="E-mailadres"
            type="email"
            className="w-full rounded-lg border border-outline-variant bg-surface px-sm py-sm text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            placeholder="Telefoonnummer (optioneel)"
            className="w-full rounded-lg border border-outline-variant bg-surface px-sm py-sm text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <button
          onClick={checkout}
          disabled={pending}
          className="mt-sm inline-flex w-full items-center justify-center gap-base rounded-full bg-primary px-md py-sm text-label-md font-label-md text-on-primary transition-all hover:opacity-90 active:scale-95 soft-shadow disabled:opacity-50"
        >
          <Icon name={pending ? "refresh" : "shopping_cart_checkout"} className={pending ? "text-[18px] animate-spin" : "text-[18px]"} />
          {pending ? "Bezig…" : "Afrekenen"}
        </button>

        {error && <p className="mt-sm text-label-sm text-error">{error}</p>}
      </div>
    </div>
  );
}
