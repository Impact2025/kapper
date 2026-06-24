"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";

export function ContactForm() {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  );

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("loading");
    const payload = Object.fromEntries(new FormData(e.currentTarget).entries());
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setState(res.ok ? "done" : "error");
  }

  if (state === "done") {
    return (
      <div className="bg-white rounded-xl soft-shadow p-lg text-center">
        <Icon name="mark_email_read" className="text-primary text-[48px]" />
        <h3 className="font-headline-md text-headline-md mt-sm">Bedankt!</h3>
        <p className="font-body-md text-on-surface-variant mt-xs">
          We nemen zo snel mogelijk contact met je op.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="bg-white rounded-xl soft-shadow p-lg space-y-md">
      {state === "error" && (
        <div className="bg-error-container text-on-error-container rounded-lg p-sm font-label-md text-label-md">
          Er ging iets mis. Probeer het opnieuw.
        </div>
      )}
      <label className="block">
        <span className="font-label-md text-label-md block mb-xs">Naam *</span>
        <input
          name="name"
          required
          className="w-full rounded-lg border border-outline-variant px-md py-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </label>
      <label className="block">
        <span className="font-label-md text-label-md block mb-xs">E-mail *</span>
        <input
          name="email"
          type="email"
          required
          className="w-full rounded-lg border border-outline-variant px-md py-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </label>
      <label className="block">
        <span className="font-label-md text-label-md block mb-xs">Bericht *</span>
        <textarea
          name="message"
          required
          rows={5}
          className="w-full rounded-lg border border-outline-variant px-md py-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
        />
      </label>
      <Button type="submit" size="lg" className="w-full rounded-lg" disabled={state === "loading"}>
        {state === "loading" ? "Versturen…" : "Verstuur bericht"}
      </Button>
    </form>
  );
}
