"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { ButtonLink } from "@/components/ui/button";

function eur(n: number) {
  return "€" + Math.round(n).toLocaleString("nl-NL");
}

/**
 * Puur rekenmodel, client-side, geen API of database nodig. De uitkomst is
 * een schatting op basis van wat de klant zelf invult — geen marktcijfer dat
 * ergens vandaan komt, dus geen bron nodig en geen claim die ooit achterhaald raakt.
 */
export function NoShowCalculator() {
  const [afspraken, setAfspraken] = useState(120);
  const [percentage, setPercentage] = useState(8);
  const [prijs, setPrijs] = useState(45);

  const { misgelopen, perJaar, voorkomen } = useMemo(() => {
    const noShows = (afspraken * percentage) / 100;
    const misgelopenOmzet = noShows * prijs;
    // Herinneringen en no-show-beleid voorkomen zelden alle no-shows; een
    // voorzichtige aanname van twee derde houdt de schatting geloofwaardig.
    const voorkomenOmzet = misgelopenOmzet * 0.65;
    return { misgelopen: misgelopenOmzet, perJaar: misgelopenOmzet * 12, voorkomen: voorkomenOmzet };
  }, [afspraken, percentage, prijs]);

  return (
    <div className="bg-white rounded-xl soft-shadow p-lg md:p-xl grid grid-cols-1 md:grid-cols-2 gap-xl">
      <div className="space-y-lg">
        <div>
          <label className="block font-label-md text-label-md text-on-surface-variant mb-xs">
            Afspraken per maand
          </label>
          <input
            type="range"
            min={20}
            max={500}
            step={5}
            value={afspraken}
            onChange={(e) => setAfspraken(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="font-body-md text-body-md text-on-surface mt-xs">{afspraken} afspraken</div>
        </div>
        <div>
          <label className="block font-label-md text-label-md text-on-surface-variant mb-xs">
            Percentage no-shows en te laat afgezegd
          </label>
          <input
            type="range"
            min={1}
            max={30}
            step={1}
            value={percentage}
            onChange={(e) => setPercentage(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="font-body-md text-body-md text-on-surface mt-xs">{percentage}%</div>
        </div>
        <div>
          <label className="block font-label-md text-label-md text-on-surface-variant mb-xs">
            Gemiddelde prijs per afspraak
          </label>
          <input
            type="range"
            min={15}
            max={150}
            step={5}
            value={prijs}
            onChange={(e) => setPrijs(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="font-body-md text-body-md text-on-surface mt-xs">{eur(prijs)}</div>
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Vul je eigen cijfers in. De uitkomst is een schatting op basis van wat je hierboven invult, geen
          gemiddelde uit de markt.
        </p>
      </div>

      <div className="bg-surface-container-low rounded-xl p-lg flex flex-col justify-center gap-md">
        <div>
          <div className="font-label-md text-label-md text-on-surface-variant">Geschatte misgelopen omzet</div>
          <div className="font-display-md text-display-md text-error">{eur(misgelopen)} <span className="font-body-md text-body-md text-on-surface-variant">/ maand</span></div>
          <div className="font-body-sm text-body-sm text-on-surface-variant mt-xs">{eur(perJaar)} per jaar</div>
        </div>
        <div className="border-t border-outline-variant pt-md">
          <div className="font-label-md text-label-md text-on-surface-variant">Wat herinneringen en beleid kunnen voorkomen</div>
          <div className="font-display-sm text-display-sm text-primary">{eur(voorkomen)} <span className="font-body-md text-body-md text-on-surface-variant">/ maand</span></div>
          <div className="font-body-sm text-body-sm text-on-surface-variant mt-xs">
            Uitgangspunt: automatische herinneringen en een helder no-show beleid voorkomen niet alle
            no-shows, maar wel een deel ervan.
          </div>
        </div>
        <div className="pt-sm">
          <ButtonLink href="/scan" size="lg" className="w-full rounded-lg text-center">
            <Icon name="calculate" className="mr-xs" /> Doe de gratis AI &amp; SEO-scan
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
