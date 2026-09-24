"use client";

import { useMemo, useState } from "react";
import { createJobAction } from "@/lib/jobs/actions";
import { ActionForm } from "@/components/salon/jobs/action-form";
import { Field, inputCls, labelCls } from "@/components/salon/jobs/ui";
import { CUSTOMER_TYPE_LABEL, CUSTOMER_TYPES, JOB_PRIORITY_LABEL, JOB_PRIORITIES } from "@/lib/jobs/model";

export interface FormCustomer {
  id: string;
  name: string;
  companyName: string | null;
  phone: string;
  addresses: { id: string; label: string | null; line: string }[];
}

export interface FormCategory {
  key: string;
  label: string;
  urgent: boolean;
  estimatedMinutes: number;
}

export function NewJobForm({
  customers,
  staff,
  categories,
  noun,
  initialCustomerId,
}: {
  customers: FormCustomer[];
  staff: { id: string; name: string }[];
  categories: FormCategory[];
  noun: string;
  initialCustomerId?: string;
}) {
  const [mode, setMode] = useState<"existing" | "new">(initialCustomerId || customers.length ? "existing" : "new");
  const [query, setQuery] = useState("");
  const [customerId, setCustomerId] = useState(initialCustomerId ?? "");
  const [addressId, setAddressId] = useState("");
  const [category, setCategory] = useState(categories[0]?.key ?? "overig");

  const selected = customers.find((c) => c.id === customerId);
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? customers.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            (c.companyName ?? "").toLowerCase().includes(q) ||
            c.phone.includes(q) ||
            c.addresses.some((a) => a.line.toLowerCase().includes(q)),
        )
      : customers;
    return list.slice(0, 40);
  }, [customers, query]);

  const cat = categories.find((c) => c.key === category);

  return (
    <ActionForm action={createJobAction} submitLabel={`${noun.charAt(0).toUpperCase()}${noun.slice(1)} aanmaken`} submitIcon="add" className="gap-lg">
      {/* ---- klant ---- */}
      <fieldset className="flex flex-col gap-sm">
        <legend className="dash-h2 mb-xs text-headline-md text-on-surface">Klant</legend>
        <div className="flex gap-sm">
          {(["existing", "new"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded-full px-md py-xs text-label-md font-label-md ${mode === m ? "bg-primary text-on-primary" : "border border-outline-variant text-on-surface-variant"}`}
            >
              {m === "existing" ? "Bestaande klant" : "Nieuwe klant"}
            </button>
          ))}
        </div>

        {mode === "existing" ? (
          <>
            <input type="hidden" name="customerId" value={customerId} />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Zoek op naam, bedrijf, telefoon of adres…"
              className={inputCls}
            />
            <div className="max-h-56 overflow-auto rounded-lg border border-outline-variant/40">
              {matches.length === 0 && <p className="p-sm text-label-md text-on-surface-variant">Geen klanten gevonden — kies &ldquo;Nieuwe klant&rdquo;.</p>}
              {matches.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setCustomerId(c.id);
                    setAddressId(c.addresses[0]?.id ?? "");
                  }}
                  className={`flex w-full flex-col items-start px-sm py-xs text-left hover:bg-primary/5 ${c.id === customerId ? "bg-primary-fixed/60" : ""}`}
                >
                  <span className="text-body-md text-on-surface">{c.companyName ? `${c.companyName} (${c.name})` : c.name}</span>
                  <span className="text-label-sm text-on-surface-variant">
                    {c.phone}
                    {c.addresses[0] ? ` · ${c.addresses[0].line}` : ""}
                  </span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 gap-sm sm:grid-cols-2">
            <Field label="Naam *">
              <input name="newName" className={inputCls} autoComplete="off" />
            </Field>
            <Field label="Telefoon *">
              <input name="newPhone" className={inputCls} inputMode="tel" placeholder="06 12345678" />
            </Field>
            <Field label="E-mail">
              <input name="newEmail" type="email" className={inputCls} />
            </Field>
            <Field label="Bedrijf">
              <input name="newCompany" className={inputCls} placeholder="alleen bij zakelijke klant" />
            </Field>
            <Field label="Soort klant">
              <select name="newType" defaultValue="private" className={inputCls}>
                {CUSTOMER_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {CUSTOMER_TYPE_LABEL[t]}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        )}
      </fieldset>

      {/* ---- adres ---- */}
      <fieldset className="flex flex-col gap-sm">
        <legend className="dash-h2 mb-xs text-headline-md text-on-surface">Klusadres</legend>
        {mode === "existing" && selected && selected.addresses.length > 0 && (
          <div className="flex flex-col gap-xs">
            {selected.addresses.map((a) => (
              <label key={a.id} className="flex items-center gap-sm rounded-lg border border-outline-variant/40 px-sm py-xs">
                <input type="radio" name="addressId" value={a.id} checked={addressId === a.id} onChange={() => setAddressId(a.id)} />
                <span className="text-body-md">
                  {a.label ? <strong>{a.label}: </strong> : null}
                  {a.line}
                </span>
              </label>
            ))}
            <label className="flex items-center gap-sm rounded-lg border border-outline-variant/40 px-sm py-xs">
              <input type="radio" name="addressId" value="" checked={addressId === ""} onChange={() => setAddressId("")} />
              <span className="text-body-md">Ander adres…</span>
            </label>
          </div>
        )}
        {(mode === "new" || !selected || selected.addresses.length === 0 || addressId === "") && (
          <div className="grid grid-cols-1 gap-sm sm:grid-cols-4">
            <Field label="Straat" className="sm:col-span-2">
              <input name="street" className={inputCls} />
            </Field>
            <Field label="Huisnr.">
              <input name="houseNumber" className={inputCls} />
            </Field>
            <Field label="Postcode">
              <input name="postalCode" className={inputCls} placeholder="1234 AB" />
            </Field>
            <Field label="Plaats" className="sm:col-span-2">
              <input name="city" className={inputCls} />
            </Field>
            <Field label="Toegang / parkeren" className="sm:col-span-2" hint="Sleutelkluis, bel bij buren, parkeren op de stoep…">
              <input name="accessNotes" className={inputCls} />
            </Field>
          </div>
        )}
      </fieldset>

      {/* ---- klus ---- */}
      <fieldset className="flex flex-col gap-sm">
        <legend className="dash-h2 mb-xs text-headline-md text-on-surface">Wat moet er gebeuren?</legend>
        <div className="grid grid-cols-1 gap-sm sm:grid-cols-2">
          <Field label="Categorie">
            <select name="category" value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
              {categories.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                  {c.urgent ? " (spoed)" : ""}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Prioriteit" hint={cat?.urgent ? "Deze categorie wordt standaard als spoed gezien." : "Leeg = automatisch (herkent ook spoedwoorden)."}>
            <select name="priority" defaultValue="" className={inputCls}>
              <option value="">Automatisch</option>
              {JOB_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {JOB_PRIORITY_LABEL[p]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Titel *" className="sm:col-span-2">
            <input name="title" className={inputCls} placeholder="bv. Lekkende kraan keuken" />
          </Field>
          <Field label="Omschrijving" className="sm:col-span-2">
            <textarea name="description" rows={3} className={inputCls} />
          </Field>
        </div>
      </fieldset>

      {/* ---- planning ---- */}
      <fieldset className="flex flex-col gap-sm">
        <legend className="dash-h2 mb-xs text-headline-md text-on-surface">Inplannen (optioneel)</legend>
        <div className="grid grid-cols-1 gap-sm sm:grid-cols-3">
          <Field label="Datum en tijd">
            <input type="datetime-local" name="scheduledStart" className={inputCls} />
          </Field>
          <Field label="Monteur">
            <select name="staffId" defaultValue="" className={inputCls}>
              <option value="">— Nog niet toegewezen —</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Duur (minuten)">
            <input type="number" name="estimatedMinutes" min={15} step={15} defaultValue={cat?.estimatedMinutes ?? 60} key={category} className={inputCls} />
          </Field>
        </div>
        <span className={labelCls}>Laat je datum leeg, dan komt de klus in &ldquo;Te plannen&rdquo;.</span>
      </fieldset>
    </ActionForm>
  );
}
