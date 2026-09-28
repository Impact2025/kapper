"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import type { ScanResult } from "@/lib/scan/run-scan";
import type { ScanProfile } from "@/lib/scan/profiles";

function eur(n: number) {
  return "€" + n.toLocaleString("nl-NL");
}

type FormProfile = Pick<
  ScanProfile,
  "vertical" | "sizeLabel" | "sizeDefault" | "sizeMax" | "nameLabel" | "namePlaceholder" | "urlLabel" | "urlPlaceholder" | "emailPlaceholder"
>;

export function ScanForm({ profile }: { profile: FormProfile }) {
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
            { label: `Herwonnen leads (${Math.round((r.recoveryRate ?? 0.6) * 100)}%)`, value: r.recoveredLeads },
            { label: `${r.bookingsLabel ?? "Extra boekingen"} (${Math.round((r.conversionRate ?? 0.3) * 100)}%)`, value: r.extraBookings },
            { label: r.savingsLabel ?? "No-show besparing", value: eur(r.noShowSavings) },
          ].map((s) => (
            <div key={s.label} className="border border-outline-variant rounded-lg p-md">
              <div className="mkt-h3 text-headline-md text-secondary">
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
          <Link
            href="/prijzen"
            className="inline-block bg-white text-primary px-xl py-sm rounded-full font-label-md"
          >
            Bekijk de pakketten
          </Link>
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
      <input type="hidden" name="vertical" value={profile.vertical} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
        <Field name="salonName" label={profile.nameLabel} required placeholder={profile.namePlaceholder} />
        <Field name="city" label="Plaats" placeholder="Amsterdam" />
      </div>
      <Field
        name="url"
        label={profile.urlLabel}
        required
        placeholder={profile.urlPlaceholder}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
        <Field name="email" type="email" label="E-mailadres" required placeholder={profile.emailPlaceholder} />
        <Field name="phone" label="Telefoon (optioneel)" placeholder="06 1234 5678" />
      </div>
      <Field
        name="size"
        type="number"
        label={profile.sizeLabel}
        placeholder={String(profile.sizeDefault)}
        min={1}
        max={profile.sizeMax}
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
  min,
  max,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  min?: number;
  max?: number;
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
        min={min}
        max={max}
        className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-sm font-body-md text-body-md text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
      />
    </label>
  );
}
