"use client";

import { useActionState, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { Card, Badge, EmptyState } from "@/components/admin/ui";
import type { PraktijkData } from "@/lib/salon/praktijk-queries";
import type { ActionState } from "@/lib/salon/actions";
import {
  addLocation,
  deleteLocation,
  addTreatment,
  deleteTreatment,
  addStaff,
  deleteStaff,
  updateStaffAssignments,
  addKnowledgeEntry,
  deleteKnowledgeEntry,
} from "@/lib/salon/praktijk-actions";

const inputCls =
  "w-full rounded-lg border border-outline-variant bg-surface px-sm py-sm text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary";
const labelCls = "mb-xs block text-label-sm text-on-surface-variant";
const cardCls = "rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-md soft-shadow";

const TABS = [
  { id: "locaties", label: "Locaties", icon: "storefront" },
  { id: "behandelingen", label: "Behandelingen", icon: "spa" },
  { id: "team", label: "Team", icon: "groups" },
  { id: "kennisbank", label: "Kennisbank", icon: "menu_book" },
] as const;
type TabId = (typeof TABS)[number]["id"];

function hoursSummary(workingHours: Record<string, [number, number] | null>): string {
  const weekday = workingHours.mon;
  const sat = workingHours.sat;
  const base = weekday ? `ma–vr ${weekday[0]}–${weekday[1]}` : "ma–vr gesloten";
  return sat ? `${base}, za ${sat[0]}–${sat[1]}` : `${base}, za gesloten`;
}

function SubmitButton({ label, pending }: { label: string; pending: boolean }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-base rounded-full bg-primary px-md py-sm text-label-md font-label-md text-on-primary transition-all hover:opacity-90 active:scale-95 soft-shadow disabled:opacity-50"
    >
      <Icon name={pending ? "refresh" : "add"} className={pending ? "animate-spin text-[18px]" : "text-[18px]"} />
      {label}
    </button>
  );
}

type DeleteAction = (prev: ActionState | undefined, fd: FormData) => Promise<ActionState>;

function DeleteForm({ action, id }: { action: DeleteAction; id: string }) {
  // `action` is a useActionState-shaped server action (prevState, formData);
  // a plain <form action> only ever calls it with (formData), so bind the
  // prevState slot away rather than mismatching the two arguments.
  const boundAction = action.bind(null, undefined) as (fd: FormData) => void;
  return (
    <form action={boundAction}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        aria-label="Verwijderen"
        className="rounded-lg p-xs text-on-surface-variant transition-colors hover:bg-error-container hover:text-on-error-container"
      >
        <Icon name="delete" className="text-[18px]" />
      </button>
    </form>
  );
}

export function PraktijkTabs({ data }: { data: PraktijkData }) {
  const [tab, setTab] = useState<TabId>("locaties");

  return (
    <div>
      <div className="mb-md flex gap-xs overflow-x-auto rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-[4px]">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex shrink-0 items-center gap-sm rounded-lg px-md py-sm text-label-md font-label-md transition-colors ${
              tab === t.id ? "bg-primary text-on-primary" : "text-on-surface-variant hover:bg-primary/5"
            }`}
          >
            <Icon name={t.icon} className="text-[18px]" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "locaties" && <LocatiesTab data={data} />}
      {tab === "behandelingen" && <BehandelingenTab data={data} />}
      {tab === "team" && <TeamTab data={data} />}
      {tab === "kennisbank" && <KennisbankTab data={data} />}
    </div>
  );
}

function LocatiesTab({ data }: { data: PraktijkData }) {
  const [state, action, pending] = useActionState(addLocation, undefined);

  return (
    <div className="flex flex-col gap-md">
      {data.locations.length === 0 ? (
        <EmptyState icon="storefront" title="Nog geen vestigingen" description="Voeg je eerste locatie toe — de AI vraagt hier automatisch naar zodra er meer dan één is." />
      ) : (
        <div className="grid grid-cols-1 gap-sm sm:grid-cols-2">
          {data.locations.map((loc) => (
            <Card key={loc.id} className="flex items-start justify-between gap-sm">
              <div className="min-w-0">
                <div className="text-body-md font-medium text-on-surface">{loc.name}</div>
                {(loc.city || loc.address) && (
                  <div className="text-label-sm text-on-surface-variant">{[loc.address, loc.city].filter(Boolean).join(", ")}</div>
                )}
                <div className="mt-xs text-label-sm text-on-surface-variant">{hoursSummary(loc.workingHours)}</div>
              </div>
              <DeleteForm action={deleteLocation} id={loc.id} />
            </Card>
          ))}
        </div>
      )}

      <div className={cardCls}>
        <h3 className="mb-md text-body-md font-medium text-on-surface">Nieuwe locatie</h3>
        <form action={action} className="flex flex-col gap-sm">
          <div className="grid grid-cols-1 gap-sm sm:grid-cols-2">
            <div>
              <label className={labelCls}>Naam</label>
              <input name="name" required placeholder="Huidzorg Clinics Den Bosch" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Stad</label>
              <input name="city" placeholder="'s-Hertogenbosch" className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Adres</label>
            <input name="address" placeholder="Hinthamerstraat 12" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-sm sm:grid-cols-3">
            <div>
              <label className={labelCls}>Open vanaf</label>
              <select name="openHour" defaultValue="9" className={inputCls}>
                {Array.from({ length: 15 }, (_, i) => i + 6).map((h) => (
                  <option key={h} value={h}>{h}:00</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Open tot</label>
              <select name="closeHour" defaultValue="18" className={inputCls}>
                {Array.from({ length: 15 }, (_, i) => i + 10).map((h) => (
                  <option key={h} value={h}>{h}:00</option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-sm pt-lg text-label-md text-on-surface-variant">
              <input type="checkbox" name="saturdayOpen" value="true" className="h-4 w-4" />
              Ook zaterdag open
            </label>
          </div>
          <div className="flex items-center gap-md">
            <SubmitButton label="Locatie toevoegen" pending={pending} />
            {state?.error && <span className="text-label-sm text-error">{state.error}</span>}
          </div>
        </form>
      </div>
    </div>
  );
}

function BehandelingenTab({ data }: { data: PraktijkData }) {
  const [state, action, pending] = useActionState(addTreatment, undefined);

  return (
    <div className="flex flex-col gap-md">
      {data.treatments.length === 0 ? (
        <EmptyState icon="spa" title="Nog geen behandelingen" description="Voeg behandelingen toe met prijs, duur, voorbereiding en nazorg — dit is de kennisbron waar de AI klanten mee adviseert." />
      ) : (
        <div className="grid grid-cols-1 gap-sm sm:grid-cols-2">
          {data.treatments.map((t) => (
            <Card key={t.id} className="flex flex-col gap-xs">
              <div className="flex items-start justify-between gap-sm">
                <div className="min-w-0">
                  <div className="text-body-md font-medium text-on-surface">{t.name}</div>
                  <div className="text-label-sm text-on-surface-variant">
                    {t.category ? `${t.category} · ` : ""}
                    {t.durationMinutes} min · €{(t.priceCents / 100).toFixed(2)}
                  </div>
                </div>
                <DeleteForm action={deleteTreatment} id={t.id} />
              </div>
              {t.prepInfo && <div className="text-label-sm text-on-surface-variant">Voorbereiding: {t.prepInfo}</div>}
              {t.aftercareInfo && <div className="text-label-sm text-on-surface-variant">Nazorg: {t.aftercareInfo}</div>}
            </Card>
          ))}
        </div>
      )}

      <div className={cardCls}>
        <h3 className="mb-md text-body-md font-medium text-on-surface">Nieuwe behandeling</h3>
        <form action={action} className="flex flex-col gap-sm">
          <div className="grid grid-cols-1 gap-sm sm:grid-cols-2">
            <div>
              <label className={labelCls}>Naam</label>
              <input name="name" required placeholder="Chemisch peeling" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Categorie</label>
              <input name="category" placeholder="Peeling" className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-sm">
            <div>
              <label className={labelCls}>Duur (min)</label>
              <input name="durationMinutes" type="number" min={5} max={480} defaultValue={30} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Prijs (€)</label>
              <input name="priceEuros" type="number" min={0} step={0.5} defaultValue={0} className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Omschrijving</label>
            <textarea name="description" rows={2} className={inputCls} />
          </div>
          <div className="grid grid-cols-1 gap-sm sm:grid-cols-2">
            <div>
              <label className={labelCls}>Voorbereiding</label>
              <textarea name="prepInfo" rows={2} placeholder="Stop met retinol 5 dagen vooraf..." className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Nazorg</label>
              <textarea name="aftercareInfo" rows={2} placeholder="SPF50 verplicht..." className={inputCls} />
            </div>
          </div>
          <div className="flex items-center gap-md">
            <SubmitButton label="Behandeling toevoegen" pending={pending} />
            {state?.error && <span className="text-label-sm text-error">{state.error}</span>}
          </div>
        </form>
      </div>
    </div>
  );
}

function TeamTab({ data }: { data: PraktijkData }) {
  const [addState, addAction, addPending] = useActionState(addStaff, undefined);

  return (
    <div className="flex flex-col gap-md">
      {data.staff.length === 0 ? (
        <EmptyState icon="groups" title="Nog geen team" description="Voeg behandelaars toe en geef aan welke locaties en behandelingen ze mogen doen — de AI biedt nooit een slot aan dat hier niet is toegestaan." />
      ) : (
        <div className="flex flex-col gap-sm">
          {data.staff.map((member) => (
            <StaffCard key={member.id} member={member} data={data} />
          ))}
        </div>
      )}

      <div className={cardCls}>
        <h3 className="mb-md text-body-md font-medium text-on-surface">Nieuwe behandelaar</h3>
        <form action={addAction} className="flex flex-col gap-sm">
          <div className="grid grid-cols-1 gap-sm sm:grid-cols-2">
            <div>
              <label className={labelCls}>Naam</label>
              <input name="name" required placeholder="Sanne de Groot" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Rol</label>
              <input name="role" placeholder="Huidtherapeut" className={inputCls} />
            </div>
          </div>
          <div className="flex items-center gap-md">
            <SubmitButton label="Behandelaar toevoegen" pending={addPending} />
            {addState?.error && <span className="text-label-sm text-error">{addState.error}</span>}
          </div>
        </form>
      </div>
    </div>
  );
}

function StaffCard({ member, data }: { member: PraktijkData["staff"][number]; data: PraktijkData }) {
  const [state, action, pending] = useActionState(updateStaffAssignments, undefined);

  return (
    <Card className="flex flex-col gap-sm">
      <div className="flex items-start justify-between gap-sm">
        <div>
          <div className="text-body-md font-medium text-on-surface">{member.name}</div>
          {member.role && <Badge>{member.role}</Badge>}
        </div>
        <DeleteForm action={deleteStaff} id={member.id} />
      </div>

      <form action={action} className="flex flex-col gap-sm">
        <input type="hidden" name="staffId" value={member.id} />
        {data.locations.length > 0 && (
          <div>
            <div className={labelCls}>Vestigingen</div>
            <div className="flex flex-wrap gap-sm">
              {data.locations.map((loc) => (
                <label key={loc.id} className="flex items-center gap-xs text-label-md text-on-surface">
                  <input type="checkbox" name="locationIds" value={loc.id} defaultChecked={member.locationIds.includes(loc.id)} className="h-4 w-4" />
                  {loc.name}
                </label>
              ))}
            </div>
          </div>
        )}
        {data.treatments.length > 0 && (
          <div>
            <div className={labelCls}>Mag behandelen</div>
            <div className="flex flex-wrap gap-sm">
              {data.treatments.map((t) => (
                <label key={t.id} className="flex items-center gap-xs text-label-md text-on-surface">
                  <input type="checkbox" name="treatmentIds" value={t.id} defaultChecked={member.treatmentIds.includes(t.id)} className="h-4 w-4" />
                  {t.name}
                </label>
              ))}
            </div>
          </div>
        )}
        {(data.locations.length > 0 || data.treatments.length > 0) && (
          <div className="flex items-center gap-md">
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center gap-base rounded-lg border border-outline-variant px-sm py-xs text-label-sm font-label-md text-on-surface transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
            >
              <Icon name={pending ? "refresh" : "check"} className={pending ? "animate-spin text-[16px]" : "text-[16px]"} />
              Bijwerken
            </button>
            {state?.error && <span className="text-label-sm text-error">{state.error}</span>}
          </div>
        )}
      </form>
    </Card>
  );
}

function KennisbankTab({ data }: { data: PraktijkData }) {
  const [state, action, pending] = useActionState(addKnowledgeEntry, undefined);

  return (
    <div className="flex flex-col gap-md">
      {data.knowledgeEntries.length === 0 ? (
        <EmptyState icon="menu_book" title="Nog geen kennisbank" description="Voeg protocollen, beleid en veelgestelde vragen toe — de AI gebruikt dit letterlijk als bron bij het beantwoorden van vragen." />
      ) : (
        <div className="flex flex-col gap-sm">
          {data.knowledgeEntries.map((entry) => (
            <Card key={entry.id} className="flex items-start justify-between gap-sm">
              <div className="min-w-0">
                <div className="flex items-center gap-sm">
                  <span className="text-body-md font-medium text-on-surface">{entry.title}</span>
                  {entry.category && <Badge>{entry.category}</Badge>}
                </div>
                <p className="mt-xs whitespace-pre-wrap text-label-sm text-on-surface-variant">{entry.content}</p>
              </div>
              <DeleteForm action={deleteKnowledgeEntry} id={entry.id} />
            </Card>
          ))}
        </div>
      )}

      <div className={cardCls}>
        <h3 className="mb-md text-body-md font-medium text-on-surface">Nieuw kennisbank-item</h3>
        <form action={action} className="flex flex-col gap-sm">
          <div className="grid grid-cols-1 gap-sm sm:grid-cols-2">
            <div>
              <label className={labelCls}>Titel</label>
              <input name="title" required placeholder="Acnebeleid" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Categorie</label>
              <input name="category" placeholder="Protocol" className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Inhoud</label>
            <textarea name="content" required rows={4} placeholder="Beschrijf het protocol, beleid of antwoord..." className={inputCls} />
          </div>
          <div className="flex items-center gap-md">
            <SubmitButton label="Toevoegen aan kennisbank" pending={pending} />
            {state?.error && <span className="text-label-sm text-error">{state.error}</span>}
          </div>
        </form>
      </div>
    </div>
  );
}
