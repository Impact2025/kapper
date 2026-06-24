"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/lib/auth/actions";

const initial: LoginState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(login, initial);

  return (
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
          autoComplete="email"
          required
          className="rounded-lg border border-outline-variant bg-surface-container-lowest px-sm py-sm text-body-md outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          placeholder="jij@salon.nl"
        />
        {state.fieldErrors?.email && (
          <p className="text-label-sm text-error">{state.fieldErrors.email[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-xs">
        <label
          htmlFor="password"
          className="text-label-md font-label-md text-on-surface-variant"
        >
          Wachtwoord
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="rounded-lg border border-outline-variant bg-surface-container-lowest px-sm py-sm text-body-md outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          placeholder="••••••••"
        />
        {state.fieldErrors?.password && (
          <p className="text-label-sm text-error">{state.fieldErrors.password[0]}</p>
        )}
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
        {pending ? "Bezig met inloggen…" : "Inloggen"}
      </button>
    </form>
  );
}
