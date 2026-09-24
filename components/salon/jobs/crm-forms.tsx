"use client";

import { useState } from "react";
import {
  addAddressAction,
  addAssetAction,
  createContractAction,
  createCustomerAction,
  updateCustomerAction,
} from "@/lib/jobs/actions";
import { ActionForm } from "@/components/salon/jobs/action-form";
import { Field, btnOutline, inputCls } from "@/components/salon/jobs/ui";
import { CUSTOMER_TYPES, CUSTOMER_TYPE_LABEL, VAT_RATES } from "@/lib/jobs/model";
import { Icon } from "@/components/ui/icon";

/** A collapsible "+ add" section so the customer page stays scannable. */
export function Disclosure({ label, icon = "add", children }: { label: string; icon?: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-sm">
      <button type="button" onClick={() => setOpen((o) => !o)} className={btnOutline}>
        <Icon name={open ? "close" : icon} className="text-[18px]" />
        {open ? "Sluiten" : label}
      </button>
      {open && <div className="mt-sm rounded-lg border border-outline-variant/40 bg-surface p-sm">{children}</div>}
    </div>
  );
}

/* ------------------------------ klant ------------------------------ */
export function NewCustomerForm() {
  return (
    <ActionForm action={createCustomerAction} submitLabel="Klant aanmaken" submitIcon="person_add">
      <div className="grid grid-cols-1 gap-sm sm:grid-cols-2">
        <Field label="Naam *">
          <input name="name" required className={inputCls} />
        </Field>
        <Field label="Telefoon *">
          <input name="phone" required inputMode="tel" className={inputCls} placeholder="06 12345678" />
        </Field>
        <Field label="E-mail">
          <input name="email" type="email" className={inputCls} />
        </Field>
        <Field label="Bedrijf">
          <input name="companyName" className={inputCls} />
        </Field>
        <Field label="Soort klant">
          <select name="customerType" defaultValue="private" className={inputCls}>
            {CUSTOMER_TYPES.map((t) => (
              <option key={t} value={t}>
                {CUSTOMER_TYPE_LABEL[t]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Notities" className="sm:col-span-2">
          <textarea name="notes" rows={2} className={inputCls} />
        </Field>
      </div>
    </ActionForm>
  );
}

export function EditCustomerForm({
  customer,
}: {
  customer: { id: string; name: string; email: string | null; companyName: string | null; notes: string | null; customerType: string };
}) {
  return (
    <ActionForm action={updateCustomerAction} submitLabel="Opslaan" submitIcon="save" successText="Opgeslagen.">
      <input type="hidden" name="customerId" value={customer.id} />
      <div className="grid grid-cols-1 gap-sm sm:grid-cols-2">
        <Field label="Naam">
          <input name="name" defaultValue={customer.name} className={inputCls} />
        </Field>
        <Field label="E-mail">
          <input name="email" type="email" defaultValue={customer.email ?? ""} className={inputCls} />
        </Field>
        <Field label="Bedrijf">
          <input name="companyName" defaultValue={customer.companyName ?? ""} className={inputCls} />
        </Field>
        <Field label="Soort klant">
          <select name="customerType" defaultValue={customer.customerType} className={inputCls}>
            {CUSTOMER_TYPES.map((t) => (
              <option key={t} value={t}>
                {CUSTOMER_TYPE_LABEL[t]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Notities" className="sm:col-span-2">
          <textarea name="notes" defaultValue={customer.notes ?? ""} rows={2} className={inputCls} />
        </Field>
      </div>
    </ActionForm>
  );
}

/* ------------------------------ adres ------------------------------ */
export function AddressForm({ customerId }: { customerId: string }) {
  return (
    <ActionForm action={addAddressAction} submitLabel="Adres toevoegen" submitIcon="add_location" resetOnSuccess>
      <input type="hidden" name="customerId" value={customerId} />
      <div className="grid grid-cols-1 gap-sm sm:grid-cols-4">
        <Field label="Naam van het adres" className="sm:col-span-4" hint="bv. Thuis, Verhuurpand Zeestraat, Kantoor">
          <input name="label" className={inputCls} />
        </Field>
        <Field label="Straat" className="sm:col-span-2">
          <input name="street" required className={inputCls} />
        </Field>
        <Field label="Huisnr.">
          <input name="houseNumber" required className={inputCls} />
        </Field>
        <Field label="Postcode">
          <input name="postalCode" required className={inputCls} placeholder="1234 AB" />
        </Field>
        <Field label="Plaats" className="sm:col-span-2">
          <input name="city" required className={inputCls} />
        </Field>
        <Field label="Toegang / parkeren" className="sm:col-span-2">
          <input name="accessNotes" className={inputCls} placeholder="Sleutelkluis 4821, bel bij buren…" />
        </Field>
        <Field label="Contact ter plaatse (huurder/beheerder)" className="sm:col-span-2">
          <input name="contactName" className={inputCls} />
        </Field>
        <Field label="Telefoon contact" className="sm:col-span-2">
          <input name="contactPhone" className={inputCls} />
        </Field>
        <label className="flex items-center gap-xs text-label-md text-on-surface sm:col-span-4">
          <input type="checkbox" name="isBilling" /> Factuuradres
        </label>
      </div>
    </ActionForm>
  );
}

/* ------------------------------ installatie ------------------------------ */
export function AssetForm({
  customerId,
  kinds,
  addresses,
}: {
  customerId: string;
  kinds: { key: string; label: string }[];
  addresses: { id: string; line: string }[];
}) {
  return (
    <ActionForm action={addAssetAction} submitLabel="Installatie toevoegen" submitIcon="add" resetOnSuccess>
      <input type="hidden" name="customerId" value={customerId} />
      <div className="grid grid-cols-1 gap-sm sm:grid-cols-3">
        <Field label="Soort">
          <select name="kind" className={inputCls}>
            {kinds.map((k) => (
              <option key={k.key} value={k.key}>
                {k.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Merk">
          <input name="brand" className={inputCls} placeholder="bv. Remeha" />
        </Field>
        <Field label="Type / model">
          <input name="model" className={inputCls} placeholder="bv. Avanta 28c" />
        </Field>
        <Field label="Serienummer">
          <input name="serialNumber" className={inputCls} />
        </Field>
        <Field label="Adres" className="sm:col-span-2">
          <select name="addressId" defaultValue="" className={inputCls}>
            <option value="">— Geen —</option>
            {addresses.map((a) => (
              <option key={a.id} value={a.id}>
                {a.line}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Geplaatst op">
          <input name="installedAt" type="date" className={inputCls} />
        </Field>
        <Field label="Laatste onderhoud">
          <input name="lastServiceAt" type="date" className={inputCls} />
        </Field>
        <Field label="Garantie tot">
          <input name="warrantyUntil" type="date" className={inputCls} />
        </Field>
        <Field label="Volgend onderhoud" hint="Leeg = automatisch op basis van het type." className="sm:col-span-3">
          <input name="nextServiceDue" type="date" className={inputCls} />
        </Field>
      </div>
    </ActionForm>
  );
}

/* ------------------------------ contract ------------------------------ */
export function ContractForm({
  customerId,
  categories,
  assets,
  addresses,
  defaultVat,
}: {
  customerId: string;
  categories: { key: string; label: string }[];
  assets: { id: string; label: string }[];
  addresses: { id: string; line: string }[];
  defaultVat: number;
}) {
  return (
    <ActionForm action={createContractAction} submitLabel="Contract aanmaken" submitIcon="event_repeat" resetOnSuccess>
      <input type="hidden" name="customerId" value={customerId} />
      <div className="grid grid-cols-1 gap-sm sm:grid-cols-3">
        <Field label="Naam" className="sm:col-span-2">
          <input name="name" required className={inputCls} placeholder="Jaarlijks cv-onderhoud" />
        </Field>
        <Field label="Soort werk">
          <select name="jobCategory" className={inputCls}>
            {categories.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Elke … maanden">
          <input name="intervalMonths" type="number" min={1} max={120} defaultValue={12} className={inputCls} />
        </Field>
        <Field label="Eerste beurt op">
          <input name="firstDueAt" type="date" required className={inputCls} />
        </Field>
        <Field label="Prijs per beurt (€)">
          <input name="priceEuros" inputMode="decimal" defaultValue="0" className={inputCls} />
        </Field>
        <Field label="Btw">
          <select name="vatRatePercent" defaultValue={defaultVat} className={inputCls}>
            {VAT_RATES.map((v) => (
              <option key={v} value={v}>
                {v}%
              </option>
            ))}
          </select>
        </Field>
        <Field label="Installatie">
          <select name="assetId" defaultValue="" className={inputCls}>
            <option value="">— Geen —</option>
            {assets.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Adres">
          <select name="addressId" defaultValue="" className={inputCls}>
            <option value="">— Geen —</option>
            {addresses.map((a) => (
              <option key={a.id} value={a.id}>
                {a.line}
              </option>
            ))}
          </select>
        </Field>
      </div>
    </ActionForm>
  );
}
