"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";

/** 1–5 sterren na oplossen. Alleen zichtbaar voor de klant op de private ticketlink. */
export function CsatForm({ token, existingScore }: { token: string; existingScore: number | null }) {
  const [score, setScore] = useState<number | null>(existingScore);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [done, setDone] = useState(existingScore != null);
  const [error, setError] = useState(false);

  async function send() {
    if (!score) return;
    setError(false);
    const res = await fetch("/api/support/csat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, score, comment: comment || null }),
    }).catch(() => null);
    if (res?.ok) setDone(true);
    else setError(true);
  }

  if (done) {
    return (
      <div className="rounded-xl bg-primary-fixed/40 p-md text-center text-body-md text-on-surface">
        Bedankt voor je beoordeling{score ? ` (${score}/5)` : ""}!
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-outline-variant/50 bg-white p-md">
      <p className="mb-sm text-label-md font-label-md text-on-surface">Hoe tevreden ben je over de geboden hulp?</p>
      <div className="mb-sm flex gap-xs" role="radiogroup" aria-label="Beoordeling">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={score === n}
            aria-label={`${n} van 5`}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setScore(n)}
            className="text-[32px] leading-none"
          >
            <Icon name="star" filled={(hover || score || 0) >= n} className={(hover || score || 0) >= n ? "text-secondary" : "text-outline-variant"} />
          </button>
        ))}
      </div>
      {score && (
        <>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            maxLength={1000}
            placeholder="Optioneel: wat kon beter?"
            className="mb-sm w-full resize-none rounded-lg border border-outline-variant px-md py-sm text-body-md outline-none focus:border-primary"
          />
          <button type="button" onClick={send} className="rounded-full bg-primary px-md py-xs text-label-md font-label-md text-on-primary">
            Versturen
          </button>
          {error && <p className="mt-xs text-label-sm text-error">Versturen mislukt.</p>}
        </>
      )}
    </div>
  );
}
