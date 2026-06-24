"use client";

import { Icon } from "@/components/ui/icon";

export default function SalonError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-md py-xl text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-error-container">
        <Icon name="error" filled className="text-[32px] text-on-error-container" />
      </div>
      <div>
        <h2 className="font-headline-md text-headline-md text-on-surface mb-xs">
          Er is iets misgegaan
        </h2>
        <p className="max-w-sm text-body-md text-on-surface-variant">
          Probeer het opnieuw of neem contact op als het probleem aanhoudt.
        </p>
        {error.digest && (
          <p className="mt-xs font-mono text-label-sm text-outline">#{error.digest}</p>
        )}
      </div>
      <button
        onClick={reset}
        className="inline-flex items-center gap-base rounded-full bg-primary px-md py-sm text-label-md font-label-md text-on-primary transition-all hover:opacity-90 active:scale-95"
      >
        <Icon name="refresh" className="text-[18px]" />
        Opnieuw proberen
      </button>
    </div>
  );
}
