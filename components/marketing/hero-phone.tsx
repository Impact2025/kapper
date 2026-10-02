import { Icon } from "@/components/ui/icon";
import type { HeroPhoneData } from "@/lib/verticals/types";

/**
 * Static phone mockup of the app's home screen for the hero. Real HTML (crisp
 * text, no baked-in image background) driven by demo data from the pack.
 */
export function HeroPhone({ data }: { data: HeroPhoneData }) {
  return (
    <div
      className="relative mx-auto w-[17.5rem] shrink-0 rounded-[2.5rem] border-[7px] border-stone-900 bg-white text-stone-900 shadow-2xl sm:w-[19rem] lg:rotate-[2deg]"
      role="img"
      aria-label={`Voorbeeld van de app: ${data.urgentTitle}`}
    >
      <div className="overflow-hidden rounded-[2rem]">
        <div className="bg-surface-container px-4 pb-3 pt-7">
          <div className="flex items-center justify-between">
            <span className="text-base font-semibold">{data.company}</span>
            <Icon name="menu" className="text-[20px] text-primary" />
          </div>
        </div>
        <div className="px-4 pb-4 pt-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-600">{data.date}</p>
          <p className="mt-1 text-2xl font-semibold leading-tight">{data.greeting}</p>
          <p className="mt-1 text-[13px] leading-snug text-stone-700">{data.summary}</p>
          <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-[13px] font-semibold text-white">
            <Icon name="add" className="text-[16px]" /> Nieuwe klus
          </div>
        </div>
        <div className="border-y border-red-200 bg-red-50 px-4 py-3">
          <p className="mb-2 flex items-center gap-1.5 text-base font-semibold">
            <Icon name="emergency" className="text-[18px] text-red-700" /> {data.urgentTitle}
          </p>
          <ul className="divide-y divide-red-200">
            {data.urgent.map((u) => (
              <li key={u.title} className="flex items-center gap-2 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold">{u.title}</p>
                  <p className="truncate text-[12px] text-stone-600">{u.who}</p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    u.statusTone === "new" ? "bg-primary text-white" : "bg-green-200 text-green-950"
                  }`}
                >
                  {u.status}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-red-700 px-2.5 py-1 text-[12px] font-semibold text-white">
                  <Icon name="call" className="text-[13px]" /> Bel
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex justify-between bg-surface-container px-3 py-2">
          {data.tabs.map((t, i) => (
            <div key={t.label} className={`flex flex-col items-center gap-0.5 text-[10px] ${i === 0 ? "text-primary" : "text-stone-700"}`}>
              <Icon name={t.icon} className="text-[20px]" />
              {t.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
