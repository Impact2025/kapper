"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";

export function ArticleFeedback({ slug }: { slug: string }) {
  const [state, setState] = useState<"idle" | "yes" | "no" | "sent">("idle");
  const [comment, setComment] = useState("");

  async function send(helpful: boolean, text?: string) {
    try {
      await fetch("/api/help/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "article", slug, helpful, comment: text || null }),
      });
    } catch {
      // Feedback is best-effort; never block the reader.
    }
  }

  if (state === "yes" || state === "sent") {
    return (
      <div className="rounded-xl bg-primary-fixed/40 p-md text-center text-body-md text-on-surface">
        <Icon name="favorite" className="mr-xs align-middle text-primary" filled /> Bedankt voor je feedback!
      </div>
    );
  }

  if (state === "no") {
    return (
      <div className="rounded-xl border border-outline-variant/50 bg-white p-md">
        <p className="mb-sm text-label-md font-label-md text-on-surface">Jammer. Wat ontbrak er?</p>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          maxLength={500}
          className="w-full resize-none rounded-lg border border-outline-variant px-md py-sm text-body-md outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          placeholder="Optioneel: vertel ons wat je zocht"
        />
        <div className="mt-sm flex flex-wrap items-center gap-sm">
          <button
            type="button"
            onClick={async () => {
              await send(false, comment.trim());
              setState("sent");
            }}
            className="rounded-full bg-primary px-md py-xs text-label-md font-label-md text-on-primary"
          >
            Verstuur
          </button>
          <Link href="/contact" className="text-label-md text-primary underline">
            Of stel je vraag aan ons team
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-sm rounded-xl border border-outline-variant/50 bg-white p-md">
      <span className="text-label-md font-label-md text-on-surface">Was dit artikel nuttig?</span>
      <div className="flex gap-xs">
        <button
          type="button"
          onClick={async () => {
            setState("yes");
            await send(true);
          }}
          className="inline-flex items-center gap-xs rounded-full border border-outline-variant px-md py-xs text-label-md hover:bg-primary/5"
        >
          <Icon name="thumb_up" className="text-[18px]" /> Ja
        </button>
        <button
          type="button"
          onClick={() => setState("no")}
          className="inline-flex items-center gap-xs rounded-full border border-outline-variant px-md py-xs text-label-md hover:bg-primary/5"
        >
          <Icon name="thumb_down" className="text-[18px]" /> Nee
        </button>
      </div>
    </div>
  );
}
