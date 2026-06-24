"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import type { ScanResult } from "@/lib/scan/run-scan";

function eur(n: number) {
  return "€" + n.toLocaleString("nl-NL");
}

export function ScanForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(fd.entries());
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Er ging iets mis.");
      setResult(data.result as ScanResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Onbekende fout.");
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    const r = result.revenue;
    return (
      <div className="bg-white rounded-xl soft-shadow p-lg md:p-xl">
        <div className="flex items-center gap-sm mb-md text-primary">
          <Icon name="check_circle" filled />
          <span className="font-label-md text-label-md uppercase tracking-wider">
            Scan voltooid
          </span>
        </div>
        <p className="font-body-lg text-body-lg text-on-surface mb-lg">
          {result.summary}
        </p>

        <div className="bg-surface-container-low rounded-xl p-md mb-lg">
          <div className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
            Geschat gemist maandinkomen
          </div>
          <div className="font-display-lg text-[48px] leading-none text-primary my-xs">
            {eur(r.totalMonthly)}
          </div>
          <div className="font-label-sm text-label-sm text-on-surface-variant">
            ≈ {eur(r.totalYearly)} per jaar
          </div>
        </div>

        <div className="grid grid-cols-2 gap-md mb-lg">
          {[
            { label: "Gemiste oproepen / maand", value: r.missedCallsPerMonth },
            { label: "Herwonnen leads (60%)", value: r.recoveredLeads },
            { label: "Extra boekingen (30%)", value: r.extraBookings },
            { label: "No-show besparing", value: eur(r.noShowSavings) },
          ].map((s) => (
            <div key={s.label} className="border border-outline-variant rounded-lg p-md">
              <div className="font-headline-md text-headline-md text-secondary">
                {s.value}
              </div>
              <div className="font-label-sm text-label-sm text-on-surface-variant">
                {s.label}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-sm mb-lg">
          {result.checks.map((c) => (
            <div key={c.label} className="flex items-start gap-sm">
              <Icon
                name={c.ok ? "check_circle" : "cancel"}
                className={c.ok ? "text-primary" : "text-secondary"}
              />
              <div>
                <p className="font-label-md text-label-md text-on-surface">
                  {c.label}
                </p>
                <p className="font-label-sm text-label-sm text-on-surface-variant">
                  {c.hint}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-primary text-on-primary rounded-xl p-md text-center">
          <p className="font-body-md mb-sm">
            We hebben dit rapport ook naar je e-mail gestuurd. Klaar om deze omzet
            terug te pakken?
          </p>
          <a
            href="/prijzen"
            className="inline-block bg-white text-primary px-xl py-sm rounded-full font-label-md"
          >
            Bekijk de pakketten
          </a>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="bg-white rounded-xl soft-shadow p-lg md:p-xl space-y-md"
    >
      {error && (
        <div className="bg-error-container text-on-error-container rounded-lg p-sm font-label-md text-label-md">
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
        <Field name="salonName" label="Naam van je salon" required placeholder="Salon Sanne" />
        <Field name="city" label="Plaats" placeholder="Amsterdam" />
      </div>
      <Field
        name="url"
        label="Website van je salon"
        required
        placeholder="www.jouwsalon.nl"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
        <Field name="email" type="email" label="E-mailadres" required placeholder="jij@jouwsalon.nl" />
        <Field name="phone" label="Telefoon (optioneel)" placeholder="06 1234 5678" />
      </div>
      <Field
        name="chairs"
        type="number"
        label="Aantal stoelen"
        placeholder="6"
      />
      <Button type="submit" size="lg" className="w-full rounded-lg" disabled={loading}>
        {loading ? (
          <>
            <Icon name="progress_activity" className="animate-spin" />
            Bezig met scannen…
          </>
        ) : (
          <>
            <Icon name="auto_awesome" />
            Start mijn gratis scan
          </>
        )}
      </Button>
      <p className="font-label-sm text-label-sm text-on-surface-variant text-center">
        Geen verplichtingen. Je ontvangt het rapport direct per e-mail.
      </p>
    </form>
  );
}

function Field({
  name,
  label,
  type = "text",
  required,
  placeholder,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="font-label-md text-label-md text-on-surface block mb-xs">
        {label}
        {required && <span className="text-secondary"> *</span>}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-sm font-body-md text-body-md text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
      />
    </label>
  );
}
