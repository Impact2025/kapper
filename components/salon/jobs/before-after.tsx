"use client";

import { useState } from "react";
import Image from "next/image";

/**
 * Voor/na-vergelijker: sleep de schuif om de foto van vóór het werk te
 * vergelijken met het resultaat. Voor de klant én als bewijs bij een
 * opleverbespreking.
 */
export function BeforeAfter({ before, after, caption }: { before: string; after: string; caption?: string | null }) {
  const [pos, setPos] = useState(50);
  return (
    <figure>
      <div className="relative aspect-[4/3] w-full select-none overflow-hidden rounded-xl bg-surface-container">
        <Image src={after} alt="Na het werk" fill sizes="(min-width: 1024px) 40rem, 100vw" className="object-cover" />
        <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
          <Image src={before} alt="Voor het werk" fill sizes="(min-width: 1024px) 40rem, 100vw" className="object-cover" />
        </div>
        <span className="absolute left-sm top-sm rounded-full bg-black/60 px-sm py-[2px] text-label-sm text-white">Voor</span>
        <span className="absolute right-sm top-sm rounded-full bg-black/60 px-sm py-[2px] text-label-sm text-white">Na</span>
        <div className="pointer-events-none absolute inset-y-0 w-[3px] -translate-x-1/2 bg-white shadow" style={{ left: `${pos}%` }} />
        <input
          type="range"
          min={0}
          max={100}
          value={pos}
          onChange={(e) => setPos(Number(e.target.value))}
          aria-label="Vergelijk voor en na"
          className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
        />
      </div>
      {caption && <figcaption className="mt-xs text-label-sm text-on-surface-variant">{caption}</figcaption>}
    </figure>
  );
}
