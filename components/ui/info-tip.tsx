"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

/**
 * Klein "i"-knopje met uitleg. Opent bij hover, focus én tik (telefoon), sluit
 * met Escape of een tik ernaast. Toegankelijk: de knop verwijst via
 * aria-describedby naar de tekst.
 */
export function InfoTip({ text, label = "Uitleg", className }: { text: string; label?: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  return (
    <span
      ref={ref}
      className={cn("relative inline-flex align-middle", className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label={label}
        aria-describedby={open ? id : undefined}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="flex h-5 w-5 items-center justify-center rounded-full text-on-surface-variant/70 transition-colors hover:bg-primary/10 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
      >
        <Icon name="info" className="text-[16px]" />
      </button>
      {open && (
        <span
          role="tooltip"
          id={id}
          className="absolute left-1/2 top-full z-50 mt-xs w-64 max-w-[80vw] -translate-x-1/2 rounded-xl border border-outline-variant/40 bg-inverse-surface px-sm py-xs text-left text-label-sm font-normal normal-case leading-snug tracking-normal text-inverse-on-surface shadow-lg"
        >
          {text}
        </span>
      )}
    </span>
  );
}
