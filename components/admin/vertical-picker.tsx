import Link from "next/link";

/**
 * Dev/preview-only: kies met welke assistent je inlogt. Wordt alleen getoond
 * op hosts die geen live vertical claimen (localhost, previews), nooit op een
 * productiedomein. Puur cosmetisch — na het inloggen volgt het dashboard de
 * vertical van de salon zelf.
 */
export function VerticalPicker({
  current,
  options,
  basePath = "/login",
}: {
  current: string;
  options: { id: string; label: string }[];
  basePath?: string;
}) {
  return (
    <nav aria-label="Kies assistent" className="mt-md flex flex-wrap items-center justify-center gap-xs">
      {options.map((o) => (
        <Link
          key={o.id}
          href={`${basePath}?vertical=${o.id}`}
          aria-current={o.id === current ? "page" : undefined}
          className={
            o.id === current
              ? "rounded-full bg-primary px-sm py-base text-label-sm text-on-primary"
              : "rounded-full border border-outline-variant px-sm py-base text-label-sm text-on-surface-variant hover:bg-surface-container"
          }
        >
          {o.label}
        </Link>
      ))}
    </nav>
  );
}
