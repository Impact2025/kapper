import { Icon } from "@/components/ui/icon";

/** Plain GET form — works without JavaScript and keeps results server-rendered. */
export function HelpSearchForm({ defaultValue, autoFocus }: { defaultValue?: string; autoFocus?: boolean }) {
  return (
    <form action="/help" method="get" role="search" className="relative w-full">
      <Icon name="search" className="pointer-events-none absolute left-md top-1/2 -translate-y-1/2 text-[22px] text-on-surface-variant" />
      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
        autoFocus={autoFocus}
        placeholder="Zoek in het hulpcentrum, bijvoorbeeld “opzeggen” of “agenda koppelen”"
        aria-label="Zoek in het hulpcentrum"
        maxLength={120}
        className="w-full rounded-full border border-outline-variant bg-white py-md pl-[52px] pr-[120px] text-body-md text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
      <button
        type="submit"
        className="absolute right-xs top-1/2 -translate-y-1/2 rounded-full bg-primary px-md py-xs text-label-md font-label-md text-on-primary transition-all hover:opacity-90 active:scale-95"
      >
        Zoeken
      </button>
    </form>
  );
}
