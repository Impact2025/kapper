"use client";

import { useMemo, useState } from "react";
import { saveDocumentAction, sendDocumentAction } from "@/lib/jobs/actions";
import { ActionForm } from "@/components/salon/jobs/action-form";
import { Field, btnOutline, btnPrimary, inputCls } from "@/components/salon/jobs/ui";
import { Icon } from "@/components/ui/icon";
import {
  LINE_KINDS,
  LINE_KIND_LABEL,
  LINE_UNITS,
  VAT_RATES,
  computeDocumentTotals,
  formatMoney,
  lineNetCents,
  type LineKind,
} from "@/lib/jobs/model";

export interface EditorLine {
  kind: LineKind;
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string; // euros, decimal comma or point
  vat: number;
}

export interface CatalogItem {
  name: string;
  priceEuros: number;
  vat: number;
  unit: string;
  kind: LineKind;
}

const toNumber = (v: string) => {
  const n = Number(v.replace(/[€\s]/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};

export function DocumentEditor({
  documentId,
  kind,
  initialLines,
  title,
  introText,
  footerText,
  catalog,
  defaultVat,
  canSend,
}: {
  documentId: string;
  kind: "quote" | "invoice";
  initialLines: EditorLine[];
  title: string;
  introText: string;
  footerText: string;
  catalog: CatalogItem[];
  defaultVat: number;
  canSend: boolean;
}) {
  const [lines, setLines] = useState<EditorLine[]>(initialLines.length ? initialLines : [blank(defaultVat)]);

  const totals = useMemo(
    () =>
      computeDocumentTotals(
        lines
          .filter((l) => l.description.trim())
          .map((l) => ({ quantity: toNumber(l.quantity), unitPriceCents: Math.round(toNumber(l.unitPrice) * 100), vatRatePercent: l.vat })),
      ),
    [lines],
  );

  const payload = JSON.stringify(
    lines
      .filter((l) => l.description.trim())
      .map((l) => ({
        kind: l.kind,
        description: l.description.trim(),
        quantity: toNumber(l.quantity) || 1,
        unit: l.unit,
        unitPriceEuros: toNumber(l.unitPrice),
        vatRatePercent: l.vat,
      })),
  );

  const update = (i: number, patch: Partial<EditorLine>) => setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  return (
    <div className="flex flex-col gap-md">
      <div className="hidden grid-cols-[6.5rem_1fr_4.5rem_5rem_6.5rem_4.5rem_6rem_2rem] gap-xs px-xs text-label-sm text-on-surface-variant lg:grid">
        <span>Soort</span>
        <span>Omschrijving</span>
        <span>Aantal</span>
        <span>Eenheid</span>
        <span>Prijs (€)</span>
        <span>Btw</span>
        <span className="text-right">Totaal</span>
        <span />
      </div>

      {lines.map((l, i) => {
        const net = lineNetCents({ quantity: toNumber(l.quantity), unitPriceCents: Math.round(toNumber(l.unitPrice) * 100) });
        return (
          <div key={i} className="grid grid-cols-2 gap-xs rounded-lg border border-outline-variant/30 p-xs lg:grid-cols-[6.5rem_1fr_4.5rem_5rem_6.5rem_4.5rem_6rem_2rem] lg:items-center lg:border-0 lg:p-0">
            <select value={l.kind} onChange={(e) => update(i, { kind: e.target.value as LineKind })} className={inputCls} aria-label="Soort">
              {LINE_KINDS.map((k) => (
                <option key={k} value={k}>
                  {LINE_KIND_LABEL[k]}
                </option>
              ))}
            </select>
            <input value={l.description} onChange={(e) => update(i, { description: e.target.value })} placeholder="Omschrijving" className={`${inputCls} col-span-2 lg:col-span-1`} aria-label="Omschrijving" />
            <input value={l.quantity} onChange={(e) => update(i, { quantity: e.target.value })} inputMode="decimal" className={inputCls} aria-label="Aantal" />
            <select value={l.unit} onChange={(e) => update(i, { unit: e.target.value })} className={inputCls} aria-label="Eenheid">
              {LINE_UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
            <input value={l.unitPrice} onChange={(e) => update(i, { unitPrice: e.target.value })} inputMode="decimal" placeholder="0,00" className={inputCls} aria-label="Prijs" />
            <select value={l.vat} onChange={(e) => update(i, { vat: Number(e.target.value) })} className={inputCls} aria-label="Btw">
              {VAT_RATES.map((v) => (
                <option key={v} value={v}>
                  {v}%
                </option>
              ))}
            </select>
            <div className="text-right text-body-md tabular-nums text-on-surface">{formatMoney(net)}</div>
            <button type="button" onClick={() => setLines((ls) => (ls.length > 1 ? ls.filter((_, idx) => idx !== i) : [blank(defaultVat)]))} className="justify-self-end text-on-surface-variant hover:text-error" aria-label="Regel verwijderen">
              <Icon name="delete" className="text-[20px]" />
            </button>
          </div>
        );
      })}

      <div className="flex flex-wrap items-center gap-sm">
        <button type="button" onClick={() => setLines((ls) => [...ls, blank(defaultVat)])} className={btnOutline}>
          <Icon name="add" className="text-[18px]" />
          Regel toevoegen
        </button>
        {catalog.length > 0 && (
          <select
            value=""
            onChange={(e) => {
              const item = catalog[Number(e.target.value)];
              if (!item) return;
              setLines((ls) => [
                ...ls.filter((l) => l.description.trim() !== ""),
                { kind: item.kind, description: item.name, quantity: "1", unit: item.unit, unitPrice: String(item.priceEuros).replace(".", ","), vat: item.vat },
              ]);
            }}
            className={`${inputCls} w-auto`}
            aria-label="Uit dienstencatalogus"
          >
            <option value="">+ Uit dienstencatalogus…</option>
            {catalog.map((c, idx) => (
              <option key={`${c.name}-${idx}`} value={idx}>
                {c.name} — {formatMoney(Math.round(c.priceEuros * 100))}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="ml-auto w-full max-w-[22rem] rounded-lg bg-surface-container p-sm text-body-md">
        <Row label="Subtotaal" value={formatMoney(totals.subtotalCents)} />
        {totals.breakdown.map((b) => (
          <Row key={b.ratePercent} label={`Btw ${b.ratePercent}% over ${formatMoney(b.netCents)}`} value={formatMoney(b.vatCents)} muted />
        ))}
        <div className="mt-xs border-t border-outline-variant/40 pt-xs">
          <Row label="Totaal" value={formatMoney(totals.totalCents)} bold />
        </div>
      </div>

      <ActionForm action={saveDocumentAction} submitLabel="Concept opslaan" submitIcon="save" buttonClassName={btnOutline}>
        <input type="hidden" name="documentId" value={documentId} />
        <input type="hidden" name="lines" value={payload} />
        <div className="grid grid-cols-1 gap-sm">
          <Field label="Titel">
            <input name="title" defaultValue={title} className={inputCls} />
          </Field>
          <Field label={kind === "quote" ? "Inleiding (boven de regels)" : "Inleiding"}>
            <textarea name="introText" defaultValue={introText} rows={2} className={inputCls} />
          </Field>
          <Field label={kind === "quote" ? "Voorwaarden / afsluiting" : "Betaalvoorwaarden / afsluiting"}>
            <textarea name="footerText" defaultValue={footerText} rows={2} className={inputCls} />
          </Field>
        </div>
      </ActionForm>

      {canSend && (
        <div className="flex flex-wrap gap-sm border-t border-outline-variant/30 pt-md">
          <ActionForm action={sendDocumentAction} submitLabel={kind === "quote" ? "Verstuur offerte" : "Verstuur factuur"} submitIcon="send" buttonClassName={btnPrimary} confirm="Definitief maken en versturen? Dit kent het nummer toe en kan daarna niet meer worden aangepast.">
            <input type="hidden" name="documentId" value={documentId} />
            <input type="hidden" name="send" value="true" />
            <input type="hidden" name="lines" value={payload} />
          </ActionForm>
          <ActionForm action={sendDocumentAction} submitLabel="Definitief maken zonder versturen" buttonClassName={btnOutline} confirm="Definitief maken? Dit kent het nummer toe en kan daarna niet meer worden aangepast.">
            <input type="hidden" name="documentId" value={documentId} />
            <input type="hidden" name="send" value="false" />
            <input type="hidden" name="lines" value={payload} />
          </ActionForm>
        </div>
      )}
    </div>
  );
}

function blank(vat: number): EditorLine {
  return { kind: "labor", description: "", quantity: "1", unit: "uur", unitPrice: "", vat };
}

function Row({ label, value, muted, bold }: { label: string; value: string; muted?: boolean; bold?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between gap-sm ${muted ? "text-label-md text-on-surface-variant" : ""} ${bold ? "font-label-md text-headline-md text-on-surface" : ""}`}>
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
