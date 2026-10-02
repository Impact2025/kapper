"use client";

import { useMemo, useState } from "react";
import { computeHourlyRate, WORKABLE_HOURS_PER_YEAR } from "@/lib/marketing/hourly-rate";

const eur = (n: number) => "€" + Math.round(n).toLocaleString("nl-NL");
const eur2 = (n: number) => "€" + n.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function NumberField({ id, label, hint, value, onChange }: { id: string; label: string; hint: string; value: number; onChange: (n: number) => void }) {
  return (
    <div>
      <label htmlFor={id} className="mb-xs block font-label-md text-label-md text-on-surface">
        {label}
      </label>
      <div className="flex items-center gap-xs rounded-lg border border-outline-variant bg-surface px-sm py-xs focus-within:border-primary">
        <span aria-hidden="true" className="text-on-surface-variant">€</span>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={0}
          step={500}
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
          className="w-full bg-transparent text-body-md text-on-surface outline-none"
        />
      </div>
      <p className="mt-xs text-label-sm text-on-surface-variant">{hint}</p>
    </div>
  );
}

/**
 * Uurtarief berekenen volgens de methode van de KVK. Alles gebeurt in de
 * browser; er wordt niets opgeslagen of verstuurd. De uitkomst is een
 * minimum: wat je werkelijk rekent hangt ook af van je markt.
 */
export function HourlyRateCalculator() {
  const [costs, setCosts] = useState(30000);
  const [income, setIncome] = useState(60000);
  const [percent, setPercent] = useState(60);

  const result = useMemo(() => computeHourlyRate({ costsPerYear: costs, incomePerYear: income, billablePercent: percent }), [costs, income, percent]);
  const scenarios = useMemo(
    () => [50, 60, 70].map((p) => ({ p, r: computeHourlyRate({ costsPerYear: costs, incomePerYear: income, billablePercent: p }) })),
    [costs, income],
  );

  return (
    <div className="grid grid-cols-1 gap-xl rounded-xl bg-white p-lg soft-shadow md:grid-cols-2 md:p-xl">
      <div className="space-y-lg">
        <NumberField id="kosten" label="Zakelijke kosten per jaar" hint="Auto, gereedschap, verzekeringen, software, telefoon, administratie, certificeringen en een buffer." value={costs} onChange={setCosts} />
        <NumberField id="inkomen" label="Gewenst inkomen per jaar" hint="Inclusief pensioen, arbeidsongeschiktheid en reservering voor belasting en premies." value={income} onChange={setIncome} />
        <div>
          <label htmlFor="declarabel" className="mb-xs block font-label-md text-label-md text-on-surface">
            Declarabele uren
          </label>
          <input id="declarabel" type="range" min={30} max={90} step={5} value={percent} onChange={(e) => setPercent(Number(e.target.value))} className="w-full accent-primary" />
          <p className="mt-xs text-body-md text-on-surface">
            {percent}% van {WORKABLE_HOURS_PER_YEAR.toLocaleString("nl-NL")} uur = {result.billableHours.toLocaleString("nl-NL")} uur per jaar
          </p>
          <p className="mt-xs text-label-sm text-on-surface-variant">Reistijd, offertes, administratie en inkoop factureer je niet. De KVK noemt 50 tot 60% haalbaar voor een startende ondernemer.</p>
        </div>
      </div>

      <div className="flex flex-col justify-between gap-lg rounded-xl bg-primary-fixed p-lg" aria-live="polite">
        <div>
          <p className="font-label-md text-label-md uppercase tracking-wider text-on-primary-fixed-variant">Minimaal uurtarief, exclusief btw</p>
          <p className="mkt-h2 text-display-lg text-on-primary-fixed">{result.rateExVat === null ? "—" : eur2(result.rateExVat)}</p>
          <p className="mt-xs text-body-md text-on-primary-fixed-variant">
            {result.rateInclVat === null ? "" : `${eur2(result.rateInclVat)} inclusief 21% btw, zoals een particulier het ziet.`}
          </p>
          <p className="mt-sm text-body-md text-on-primary-fixed-variant">
            Benodigde omzet per jaar: <strong>{eur(result.revenueNeeded)}</strong>
          </p>
        </div>
        <div>
          <p className="mb-xs font-label-md text-label-md text-on-primary-fixed-variant">Wat als je minder of meer factureert?</p>
          <ul className="flex flex-col gap-xs text-body-md text-on-primary-fixed">
            {scenarios.map(({ p, r }) => (
              <li key={p} className="flex justify-between gap-md">
                <span>{p}% declarabel</span>
                <span className="tabular-nums">{r.rateExVat === null ? "—" : eur2(r.rateExVat)} per uur</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
