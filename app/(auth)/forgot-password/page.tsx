"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordReset, type ResetResult } from "@/lib/auth/reset";

const initial: ResetResult = { ok: false };

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState(
    async (_prev: ResetResult, formData: FormData) => {
      const email = formData.get("email") as string;
      return requestPasswordReset(email);
    },
    initial,
  );

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-container-low px-margin-mobile py-xl">
      <div className="w-full max-w-[28rem]">
        <div className="mb-lg text-center">
          <Link href="/" className="font-headline-md text-headline-md font-bold text-primary">
            KapperAssistent
          </Link>
          <p className="mt-xs text-body-md text-on-surface-variant">Wachtwoord vergeten</p>
        </div>

        <div className="glass-card rounded-xl p-lg">
          {state.ok ? (
            <div className="text-center">
              <p className="text-body-md text-on-surface mb-md">
                Als dit e-mailadres bij ons bekend is, ontvang je binnen enkele minuten een link om
                je wachtwoord opnieuw in te stellen.
              </p>
              <Link
                href="/login"
                className="text-label-md text-primary hover:underline"
              >
                ← Terug naar inloggen
              </Link>
            </div>
          ) : (
            <form action={action} className="flex flex-col gap-md">
              <div className="flex flex-col gap-xs">
                <label
                  htmlFor="email"
                  className="text-label-md font-label-md text-on-surface-variant"
                >
                  E-mailadres
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="rounded-lg border border-outline-variant bg-surface-container-lowest px-sm py-sm text-body-md outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="jij@salon.nl"
                />
              </div>

              {state.error && (
                <div
                  role="alert"
                  className="rounded-lg bg-error-container px-sm py-xs text-label-md text-on-error-container"
                >
                  {state.error}
                </div>
              )}

              <button
                type="submit"
                disabled={pending}
                className="mt-xs inline-flex items-center justify-center gap-base rounded-full bg-primary px-xl py-sm text-label-md font-label-md text-on-primary transition-all hover:opacity-90 active:scale-95 disabled:opacity-60 soft-shadow"
              >
                {pending ? "Bezig…" : "Stuur resetlink"}
              </button>
            </form>
          )}
        </div>

        <p className="mt-md text-center text-label-sm text-on-surface-variant">
          <Link href="/login" className="text-primary hover:underline">
            ← Terug naar inloggen
          </Link>
        </p>
      </div>
    </main>
  );
}
