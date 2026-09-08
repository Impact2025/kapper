"use client";

import { useActionState, useRef, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { createProduct, updateProduct } from "@/lib/webwinkel/actions";
import { Icon } from "@/components/ui/icon";

const inputCls =
  "w-full rounded-lg border border-outline-variant bg-surface px-sm py-sm text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary";
const labelCls = "text-label-sm font-label-sm text-on-surface-variant";

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-base rounded-full bg-primary px-md py-sm text-label-md font-label-md text-on-primary transition-all hover:opacity-90 active:scale-95 soft-shadow disabled:opacity-50"
    >
      <Icon name={pending ? "refresh" : "save"} className={pending ? "text-[18px] animate-spin" : "text-[18px]"} />
      {pending ? pendingLabel : label}
    </button>
  );
}

export interface EditableProduct {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  category: string | null;
  priceCents: number;
  imageUrl: string | null;
  stockQuantity: number;
  lowStockThreshold: number;
  active: boolean;
}

export function ProductForm({ product, onSaved }: { product?: EditableProduct; onSaved?: () => void }) {
  const action = product ? updateProduct : createProduct;
  const [state, formAction] = useActionState(action, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      if (!product) formRef.current?.reset();
      onSaved?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-sm">
      {product && <input type="hidden" name="id" value={product.id} />}

      <div>
        <label className={labelCls}>Naam</label>
        <input name="name" required maxLength={200} defaultValue={product?.name} className={inputCls} />
      </div>

      <div className="grid grid-cols-2 gap-sm">
        <div>
          <label className={labelCls}>Prijs (€)</label>
          <input
            type="number"
            name="priceEuros"
            step="0.01"
            min="0"
            required
            defaultValue={product ? product.priceCents / 100 : undefined}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Categorie</label>
          <input name="category" maxLength={100} defaultValue={product?.category ?? ""} className={inputCls} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-sm">
        <div>
          <label className={labelCls}>SKU</label>
          <input name="sku" maxLength={100} defaultValue={product?.sku ?? ""} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Afbeelding-URL</label>
          <input name="imageUrl" maxLength={2000} defaultValue={product?.imageUrl ?? ""} className={inputCls} />
        </div>
      </div>

      {!product && (
        <div className="grid grid-cols-2 gap-sm">
          <div>
            <label className={labelCls}>Startvoorraad</label>
            <input type="number" name="stockQuantity" min="0" defaultValue={0} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Lage-voorraaddrempel</label>
            <input type="number" name="lowStockThreshold" min="0" defaultValue={5} className={inputCls} />
          </div>
        </div>
      )}
      {product && (
        <div>
          <label className={labelCls}>Lage-voorraaddrempel</label>
          <input type="number" name="lowStockThreshold" min="0" defaultValue={product.lowStockThreshold} className={inputCls} />
        </div>
      )}

      <div>
        <label className={labelCls}>Omschrijving</label>
        <textarea name="description" maxLength={2000} rows={2} defaultValue={product?.description ?? ""} className={inputCls} />
      </div>

      {product && (
        <label className="flex cursor-pointer items-center gap-sm">
          <input type="checkbox" name="active" value="true" defaultChecked={product.active} className="h-4 w-4 rounded border-outline-variant accent-primary" />
          <span className="text-body-md text-on-surface">Actief in de webwinkel</span>
        </label>
      )}

      <div className="flex items-center gap-md">
        <SubmitButton label={product ? "Opslaan" : "Product toevoegen"} pendingLabel="Bezig…" />
        {state?.success && (
          <span className="flex items-center gap-xs text-label-md text-primary">
            <Icon name="check_circle" filled className="text-[18px]" /> Opgeslagen
          </span>
        )}
        {state?.error && (
          <span className="flex items-center gap-xs text-label-md text-error">
            <Icon name="error" filled className="text-[18px]" /> {state.error}
          </span>
        )}
      </div>
    </form>
  );
}
