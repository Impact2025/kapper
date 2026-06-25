"use client";

import { useActionState } from "react";
import { updateIntegrations } from "@/lib/salon/actions";
import { Icon } from "@/components/ui/icon";

const AGENDA_PROVIDERS = [
  { value: "", label: "Selecteer je salonssoftware" },
  { value: "salonized", label: "Salonized" },
  { value: "phorest", label: "Phorest" },
  { value: "treatwell", label: "Treatwell" },
  { value: "acuity", label: "Acuity Scheduling" },
];

interface Integrations {
  agendaProvider: string;
  agendaApiKey: string;
  watiApiKey: string;
  vapiApiKey: string;
  phoneNumber: string;
}

const inputCls =
  "w-full rounded-lg border border-outline-variant bg-surface px-sm py-sm text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary";

const cardCls =
  "rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-md soft-shadow";

export function IntegratiesForm({ integrations }: { integrations: Integrations }) {
  const [state, action, pending] = useActionState(updateIntegrations, undefined);

  return (
    <form action={action} className="flex flex-col gap-md">
      {/* Agenda */}
      <div className={cardCls}>
        <h3 className="mb-xs flex items-center gap-sm text-body-md font-medium text-on-surface">
          <Icon name="calendar_month" className="text-[20px] text-primary" />
          Agenda koppeling
        </h3>
        <p className="mb-md text-label-sm text-on-surface-variant">
          De AI boekt uitsluitend via jouw salonssoftware — jouw agenda blijft de enige bron van
          waarheid.
        </p>
        <div className="flex flex-col gap-sm">
          <div>
            <label className="mb-xs block text-label-sm text-on-surface-variant">
              Salonssoftware
            </label>
            <select
              name="agendaProvider"
              defaultValue={integrations.agendaProvider}
              className={inputCls}
            >
              {AGENDA_PROVIDERS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-xs block text-label-sm text-on-surface-variant">
              API-sleutel
            </label>
            <input
              type="password"
              name="agendaApiKey"
              defaultValue={integrations.agendaApiKey}
              placeholder="sk_live_…"
              autoComplete="off"
              className={inputCls}
            />
            <p className="mt-xs text-label-sm text-on-surface-variant">
              Te vinden in de instellingen van je salonssoftware onder Integraties / API.
            </p>
          </div>
        </div>
      </div>

      {/* WhatsApp */}
      <div className={cardCls}>
        <h3 className="mb-xs flex items-center gap-sm text-body-md font-medium text-on-surface">
          <Icon name="chat" className="text-[20px] text-primary" />
          WhatsApp Business API
        </h3>
        <p className="mb-md text-label-sm text-on-surface-variant">
          Via WATI (aanbevolen) — omzeilt de complexe Meta Business-verificatie en is
          AVG-compliant. De gratis WhatsApp Business App is niet toegestaan.
        </p>
        <div>
          <label className="mb-xs block text-label-sm text-on-surface-variant">
            WATI API-sleutel
          </label>
          <input
            type="password"
            name="watiApiKey"
            defaultValue={integrations.watiApiKey}
            placeholder="ey…"
            autoComplete="off"
            className={inputCls}
          />
        </div>
      </div>

      {/* Phone */}
      <div className={cardCls}>
        <h3 className="mb-xs flex items-center gap-sm text-body-md font-medium text-on-surface">
          <Icon name="phone" className="text-[20px] text-primary" />
          Telefonische AI-receptionist
        </h3>
        <p className="mb-md text-label-sm text-on-surface-variant">
          De AI neemt inkomende gesprekken aan en plant direct een afspraak in. Latentie onder 800ms
          — klanten merken geen verschil. Beschikbaar in Pro en Elite.
        </p>
        <div className="flex flex-col gap-sm">
          <div>
            <label className="mb-xs block text-label-sm text-on-surface-variant">
              Zakelijk telefoonnummer
            </label>
            <input
              type="tel"
              name="phoneNumber"
              defaultValue={integrations.phoneNumber}
              placeholder="+31 20 123 4567"
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-xs block text-label-sm text-on-surface-variant">
              Vapi API-sleutel
            </label>
            <input
              type="password"
              name="vapiApiKey"
              defaultValue={integrations.vapiApiKey}
              placeholder="vapi_…"
              autoComplete="off"
              className={inputCls}
            />
            <p className="mt-xs text-label-sm text-on-surface-variant">
              Te vinden in je Vapi-dashboard onder API Keys.
            </p>
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center gap-md">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-base rounded-full bg-primary px-md py-sm text-label-md font-label-md text-on-primary transition-all hover:opacity-90 active:scale-95 soft-shadow disabled:opacity-50"
        >
          {pending ? (
            <>
              <Icon name="refresh" className="text-[18px] animate-spin" />
              Opslaan…
            </>
          ) : (
            <>
              <Icon name="save" className="text-[18px]" />
              Integraties opslaan
            </>
          )}
        </button>

        {state?.success && (
          <div className="flex items-center gap-xs text-label-md text-primary">
            <Icon name="check_circle" filled className="text-[18px]" />
            Opgeslagen
          </div>
        )}

        {state?.error && (
          <div className="flex items-center gap-xs text-label-md text-error">
            <Icon name="error" filled className="text-[18px]" />
            {state.error}
          </div>
        )}
      </div>
    </form>
  );
}
