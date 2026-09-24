"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { helpFor } from "@/lib/help/page-help";

/** Contextuele hulp: per dashboardpagina de artikelen die daar het vaakst nodig zijn. */
export function PageHelp() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const links = helpFor(pathname);
  if (!links.length) return null;

  return (
    <div className="mb-md">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="inline-flex items-center gap-xs rounded-full border border-outline-variant/60 bg-surface-container-lowest px-sm py-[2px] text-label-sm text-on-surface-variant hover:bg-primary/5"
      >
        <Icon name="help" className="text-[16px]" /> Hulp bij deze pagina
        <Icon name={open ? "expand_less" : "expand_more"} className="text-[16px]" />
      </button>
      {open && (
        <div className="mt-xs flex flex-wrap items-center gap-xs rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-sm">
          {links.map((l) => (
            <Link key={l.slug} href={`/help/${l.slug}`} target="_blank" className="rounded-full bg-primary-fixed/50 px-sm py-[2px] text-label-sm text-primary hover:underline">
              {l.title}
            </Link>
          ))}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("support-chat:open"))}
            className="ml-auto inline-flex items-center gap-xs text-label-sm text-primary underline"
          >
            <Icon name="smart_toy" className="text-[16px]" /> Vraag de AI
          </button>
        </div>
      )}
    </div>
  );
}
