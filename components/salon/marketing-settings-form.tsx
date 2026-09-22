"use client";

import { useActionState } from "react";
import { updateMarketingSettings } from "@/lib/marketing/actions";
import { Icon } from "@/components/ui/icon";

interface Settings {
  reviewRequestsEnabled: boolean;
  googleReviewLink: string;
  retentionEnabled: boolean;
}

const inputCls =
  "w-full rounded-lg border border-outline-variant bg-surface px-sm py-xs text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary";

export function MarketingSettingsForm({ settings }: { settings: Settings }) {
  const [state, action, pending] = useActionState(updateMarketingSettings, undefined);

  return (
    <form action={action} className="flex flex-col gap-md">
      <div className="dash-card p-md">
        <div className="mb-sm flex items-center justify-between">
          <div>
            <h3 className="text-body-md font-medium text-on-surface">Automatische review-verzoeken</h3>
            <p className="mt-xs text-label-sm text-on-surface-variant">
              2 uur na een afspraak stuurt de AI een WhatsApp-bericht met je reviewlink.
            </p>
          </div>
          <label className="relative inline-flex shrink-0 cursor-pointer items-center">
            <input type="checkbox" name="reviewRequestsEnabled" value="true" defaultChecked={settings.reviewRequestsEnabled} className="peer sr-only" />
            <span className="block h-6 w-11 rounded-full bg-surface-container-highest transition-colors duration-200 peer-checked:bg-primary" />
            <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 peer-checked:translate-x-5" />
          </label>
        </div>
        <input
          type="url"
          name="googleReviewLink"
          defaultValue={settings.googleReviewLink}
          placeholder="https://g.page/r/.../review"
          className={inputCls}
        />
        <p className="mt-xs text-label-sm text-on-surface-variant">
          Je Google Bedrijfsprofiel-reviewlink (of Salonized-reviewlink).
        </p>
      </div>

      <div className="dash-card p-md">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-body-md font-medium text-on-surface">Client ReConnect</h3>
            <p className="mt-xs text-label-sm text-on-surface-variant">
              Klanten die langer wegblijven dan hun eigen gemiddelde interval krijgen automatisch een
              heractiveringsbericht — alleen klanten met marketing-opt-in.
            </p>
          </div>
          <label className="relative inline-flex shrink-0 cursor-pointer items-center">
            <input type="checkbox" name="retentionEnabled" value="true" defaultChecked={settings.retentionEnabled} className="peer sr-only" />
            <span className="block h-6 w-11 rounded-full bg-surface-container-highest transition-colors duration-200 peer-checked:bg-primary" />
            <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 peer-checked:translate-x-5" />
          </label>
        </div>
      </div>

      <div className="flex items-center gap-md">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-base rounded-full bg-primary px-md py-sm text-label-md font-label-md text-on-primary transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
        >
          <Icon name={pending ? "refresh" : "save"} className={`text-[18px] ${pending ? "animate-spin" : ""}`} />
          Opslaan
        </button>
        {state?.success && (
          <span className="flex items-center gap-xs text-label-md text-primary">
            <Icon name="check_circle" filled className="text-[18px]" />
            Opgeslagen
          </span>
        )}
        {state?.error && <span className="text-label-md text-error">{state.error}</span>}
      </div>
    </form>
  );
}
