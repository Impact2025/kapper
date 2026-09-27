import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/dal";
import { outreachAudience, MAX_PER_SEND } from "@/lib/crm/outreach";
import { LEAD_STAGES, LEAD_STAGE_LABELS, type LeadStage } from "@/lib/crm/constants";
import { listVerticals, getVerticalConfig, isVerticalId, DEFAULT_VERTICAL_ID } from "@/lib/verticals";
import { siteUrlFor } from "@/lib/verticals/site-url";
import { PageHeader, Card } from "@/components/admin/ui";
import { Icon } from "@/components/ui/icon";
import { OutreachComposer } from "@/components/admin/crm/outreach-composer";

/** Stages you can target; customers and lost leads are never mailed. */
const TARGET_STAGES = LEAD_STAGES.filter((s) => s !== "customer" && s !== "lost");

export default async function OutreachPage({
  searchParams,
}: {
  searchParams: Promise<{ vertical?: string; stage?: string | string[]; alle?: string }>;
}) {
  await getCurrentUser();
  const params = await searchParams;
  const vertical = isVerticalId(params.vertical) ? params.vertical : DEFAULT_VERTICAL_ID;
  const rawStages = ([] as string[]).concat(params.stage ?? []);
  const stages: LeadStage[] = rawStages.length
    ? TARGET_STAGES.filter((s) => rawStages.includes(s))
    : ["new"];
  const onlyNeverEmailed = params.alle !== "1";

  const recipients = await outreachAudience({ vertical, stages, onlyNeverEmailed });
  const brand = getVerticalConfig(vertical).brand;

  return (
    <div>
      <Link
        href={`/admin/crm?vertical=${vertical}`}
        className="mb-md inline-flex items-center gap-xs text-label-md text-on-surface-variant hover:text-primary"
      >
        <Icon name="arrow_back" className="text-[18px]" /> Terug naar leads
      </Link>
      <PageHeader
        title="Outreach-mail"
        subtitle={`Eén mail naar een selectie leads, verstuurd als ${brand.name} met afmeldlink. Maximaal ${MAX_PER_SEND} per keer.`}
      />

      <Card className="mb-md">
        <form method="get" className="flex flex-wrap items-end gap-md">
          <label className="flex flex-col gap-xs text-label-md text-on-surface-variant">
            Vak
            <select
              name="vertical"
              defaultValue={vertical}
              className="rounded-full border border-outline-variant bg-surface-container-lowest px-md py-xs text-label-md outline-none focus:border-primary"
            >
              {listVerticals().map((v) => (
                <option key={v.id} value={v.id}>
                  {v.brand.name}
                </option>
              ))}
            </select>
          </label>
          <fieldset className="flex flex-col gap-xs text-label-md text-on-surface-variant">
            <legend className="mb-xs">Fase</legend>
            <div className="flex flex-wrap gap-sm">
              {TARGET_STAGES.map((s) => (
                <label key={s} className="inline-flex items-center gap-xs text-on-surface">
                  <input type="checkbox" name="stage" value={s} defaultChecked={stages.includes(s)} />
                  {LEAD_STAGE_LABELS[s]}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="inline-flex items-center gap-xs text-label-md text-on-surface">
            <input type="checkbox" name="alle" value="1" defaultChecked={!onlyNeverEmailed} />
            Ook leads die al eerder gemaild zijn
          </label>
          <button
            type="submit"
            className="rounded-full border-2 border-primary px-md py-xs text-label-md font-label-md text-primary transition-all hover:bg-primary/5"
          >
            Selectie laden
          </button>
        </form>
      </Card>

      <OutreachComposer
        key={`${vertical}-${stages.join(",")}-${onlyNeverEmailed}`}
        vertical={vertical}
        brandName={brand.name}
        siteUrl={siteUrlFor(vertical)}
        onlyNeverEmailed={onlyNeverEmailed}
        maxPerSend={MAX_PER_SEND}
        recipients={recipients.map((r) => ({
          id: r.id,
          name: r.salonName,
          email: r.email,
          city: r.city,
          stage: LEAD_STAGE_LABELS[r.stage],
          emailsSent: r.emailsSent,
          skip: r.skip,
        }))}
      />
    </div>
  );
}
