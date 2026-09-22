"use client";

import { useMemo, useState } from "react";
import { useActionState } from "react";
import { createPosSaleAction } from "@/lib/pos/actions";
import { Icon } from "@/components/ui/icon";

interface SellableItem {
  id: string;
  name: string;
  priceCents: number;
}

interface CartLine {
  kind: "treatment" | "product";
  id: string;
  name: string;
  priceCents: number;
  quantity: number;
}

function euro(cents: number): string {
  return `€${(cents / 100).toFixed(2)}`;
}

export function KassaCart({
  treatments,
  products,
}: {
  treatments: SellableItem[];
  products: SellableItem[];
}) {
  const [state, action, pending] = useActionState(createPosSaleAction, undefined);
  const [lines, setLines] = useState<CartLine[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "pin" | "card">("pin");
  const [tipEuros, setTipEuros] = useState("");

  function addLine(kind: "treatment" | "product", item: SellableItem) {
    setLines((prev) => {
      const existing = prev.find((l) => l.kind === kind && l.id === item.id);
      if (existing) {
        return prev.map((l) => (l === existing ? { ...l, quantity: l.quantity + 1 } : l));
      }
      return [...prev, { kind, id: item.id, name: item.name, priceCents: item.priceCents, quantity: 1 }];
    });
  }

  function removeLine(kind: "treatment" | "product", id: string) {
    setLines((prev) => prev.filter((l) => !(l.kind === kind && l.id === id)));
  }

  const totalCents = useMemo(
    () => lines.reduce((sum, l) => sum + l.priceCents * l.quantity, 0) + Math.round((Number(tipEuros) || 0) * 100),
    [lines, tipEuros],
  );

  if (state?.success) {
    return (
      <div className="rounded-xl border border-outline-variant/40 bg-surface p-md text-center">
        <p className="text-body-md text-on-surface">Verkoop geregistreerd.</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-sm text-label-sm text-primary hover:underline"
        >
          Nieuwe verkoop
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-md lg:grid-cols-2">
      <div className="flex flex-col gap-sm">
        <h3 className="text-body-md font-medium text-on-surface">Behandelingen</h3>
        <div className="flex flex-wrap gap-xs">
          {treatments.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => addLine("treatment", t)}
              className="rounded-lg border border-outline-variant/40 bg-surface px-sm py-xs text-label-sm text-on-surface hover:border-primary"
            >
              {t.name} · {euro(t.priceCents)}
            </button>
          ))}
        </div>
        <h3 className="mt-sm text-body-md font-medium text-on-surface">Producten</h3>
        <div className="flex flex-wrap gap-xs">
          {products.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => addLine("product", p)}
              className="rounded-lg border border-outline-variant/40 bg-surface px-sm py-xs text-label-sm text-on-surface hover:border-primary"
            >
              {p.name} · {euro(p.priceCents)}
            </button>
          ))}
        </div>
      </div>

      <form action={action} className="flex flex-col gap-sm rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-md">
        <input type="hidden" name="items" value={JSON.stringify(lines.map(({ kind, id, quantity }) => ({ kind, id, quantity })))} />

        <div className="flex flex-col gap-xs">
          {lines.length === 0 && <p className="text-label-sm text-on-surface-variant">Nog niets toegevoegd.</p>}
          {lines.map((l) => (
            <div key={`${l.kind}-${l.id}`} className="flex items-center justify-between gap-sm text-label-sm">
              <span>
                {l.quantity}× {l.name}
              </span>
              <div className="flex items-center gap-sm">
                <span>{euro(l.priceCents * l.quantity)}</span>
                <button type="button" onClick={() => removeLine(l.kind, l.id)} aria-label="Verwijder">
                  <Icon name="close" className="text-[16px] text-on-surface-variant" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <input
          name="customerName"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="Naam klant (optioneel)"
          className="rounded-lg border border-outline-variant bg-surface px-sm py-xs text-body-md text-on-surface"
        />
        <input
          name="customerPhone"
          value={customerPhone}
          onChange={(e) => setCustomerPhone(e.target.value)}
          placeholder="Telefoon (optioneel)"
          className="rounded-lg border border-outline-variant bg-surface px-sm py-xs text-body-md text-on-surface"
        />
        <div className="flex items-center gap-sm">
          <select
            name="paymentMethod"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as "cash" | "pin" | "card")}
            className="rounded-lg border border-outline-variant bg-surface px-sm py-xs text-body-md text-on-surface"
          >
            <option value="pin">Pin</option>
            <option value="cash">Contant</option>
            <option value="card">Kaart</option>
          </select>
          <input
            name="tipEuros"
            value={tipEuros}
            onChange={(e) => setTipEuros(e.target.value)}
            placeholder="Fooi €"
            inputMode="decimal"
            className="w-24 rounded-lg border border-outline-variant bg-surface px-sm py-xs text-body-md text-on-surface"
          />
        </div>

        <div className="flex items-center justify-between border-t border-outline-variant/40 pt-sm text-body-md font-medium text-on-surface">
          <span>Totaal</span>
          <span>{euro(totalCents)}</span>
        </div>

        {state?.error && <p className="text-label-sm text-error">{state.error}</p>}

        <button
          type="submit"
          disabled={pending || lines.length === 0}
          className="rounded-lg bg-primary px-md py-sm text-label-md font-medium text-on-primary disabled:opacity-50"
        >
          {pending ? "Bezig..." : "Afrekenen"}
        </button>
      </form>
    </div>
  );
}
