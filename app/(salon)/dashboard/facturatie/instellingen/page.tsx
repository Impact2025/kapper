import type { Metadata } from "next";
import { requireJobOwner } from "@/lib/jobs/access";
import { formatIban, missingInvoiceFields, parseBusinessProfile } from "@/lib/jobs/business";
import { PageHeader, Card } from "@/components/salon/dash-ui";
import { ActionForm } from "@/components/salon/jobs/action-form";
import { Field, TextLink, inputCls } from "@/components/salon/jobs/ui";
import { saveBusinessProfileAction } from "@/lib/jobs/actions";

export const metadata: Metadata = { title: "Bedrijfsgegevens" };

export default async function BedrijfsgegevensPage() {
  const ctx = await requireJobOwner();
  const p = parseBusinessProfile(ctx.settings, ctx.salonName);
  const missing = missingInvoiceFields(p);

  return (
    <div className="max-w-[52rem]">
      <TextLink href="/dashboard/facturatie" className="text-label-md">
        ← Offertes &amp; facturen
      </TextLink>
      <PageHeader title="Bedrijfsgegevens" subtitle="Deze gegevens staan op je offertes en facturen. Een factuur moet wettelijk je KvK-nummer, btw-nummer en adres bevatten." />

      {missing.length > 0 && (
        <p className="mb-md rounded-lg bg-secondary-fixed/50 px-sm py-xs text-label-md text-on-surface">Nog nodig voor facturen: {missing.join(", ")}.</p>
      )}

      <Card>
        <ActionForm action={saveBusinessProfileAction} submitLabel="Opslaan" submitIcon="save" className="gap-md">
          <div className="grid grid-cols-1 gap-sm sm:grid-cols-2">
            <Field label="Bedrijfsnaam" className="sm:col-span-2">
              <input name="companyName" defaultValue={p.companyName} required className={inputCls} />
            </Field>
            <Field label="Straat + huisnummer" className="sm:col-span-2">
              <input name="street" defaultValue={p.street} className={inputCls} />
            </Field>
            <Field label="Postcode">
              <input name="postalCode" defaultValue={p.postalCode} className={inputCls} placeholder="1234 AB" />
            </Field>
            <Field label="Plaats">
              <input name="city" defaultValue={p.city} className={inputCls} />
            </Field>
            <Field label="KvK-nummer" hint="8 cijfers">
              <input name="kvk" defaultValue={p.kvk} inputMode="numeric" className={inputCls} />
            </Field>
            <Field label="Btw-nummer" hint="bijv. NL123456789B01">
              <input name="vatNumber" defaultValue={p.vatNumber} className={inputCls} />
            </Field>
            <Field label="IBAN" hint="Klanten betalen hierheen, met het factuurnummer als kenmerk." className="sm:col-span-2">
              <input name="iban" defaultValue={p.iban ? formatIban(p.iban) : ""} className={inputCls} placeholder="NL91 ABNA 0417 1643 00" />
            </Field>
            <Field label="E-mail op documenten">
              <input name="email" type="email" defaultValue={p.email} className={inputCls} />
            </Field>
            <Field label="Telefoon op documenten">
              <input name="phone" defaultValue={p.phone} className={inputCls} />
            </Field>
            <Field label="Betaaltermijn (dagen)">
              <input name="paymentTermDays" type="number" min={0} max={120} defaultValue={p.paymentTermDays} className={inputCls} />
            </Field>
            <Field label="Offerte geldig (dagen)">
              <input name="quoteValidDays" type="number" min={1} max={365} defaultValue={p.quoteValidDays} className={inputCls} />
            </Field>
            <Field label="Standaard inleiding op offertes" className="sm:col-span-2">
              <textarea name="quoteIntro" rows={2} defaultValue={p.quoteIntro} className={inputCls} placeholder="Bedankt voor je aanvraag. Hieronder vind je onze offerte." />
            </Field>
            <Field label="Standaardtekst onderaan facturen" className="sm:col-span-2">
              <textarea name="invoiceFooter" rows={2} defaultValue={p.invoiceFooter} className={inputCls} placeholder="Wij verzoeken je het bedrag binnen de betaaltermijn over te maken." />
            </Field>
          </div>
        </ActionForm>
      </Card>
    </div>
  );
}
