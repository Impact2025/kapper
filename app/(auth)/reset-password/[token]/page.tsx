import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { applyPasswordReset, validateResetToken } from "@/lib/auth/reset";
import { createSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wachtwoord instellen",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const email = await validateResetToken(token);
  if (!email) notFound();

  async function submit(formData: FormData) {
    "use server";
    const password = formData.get("password") as string;
    const result = await applyPasswordReset(token, password);
    if (!result.ok) return;

    // Auto-login after password set
    const rows = await db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.email, email!))
      .limit(1);

    if (rows[0]) {
      await createSession({ userId: rows[0].id, role: rows[0].role });
    }
    redirect(rows[0]?.role === "admin" ? "/admin" : "/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-container-low px-margin-mobile py-xl">
      <div className="w-full max-w-[28rem]">
        <div className="mb-lg text-center">
          <Link href="/" className="font-headline-md text-headline-md font-bold text-primary">
            KapperAssistent
          </Link>
          <p className="mt-xs text-body-md text-on-surface-variant">Nieuw wachtwoord instellen</p>
        </div>

        <div className="glass-card rounded-xl p-lg">
          <form action={submit} className="flex flex-col gap-md">
            <div className="flex flex-col gap-xs">
              <label
                htmlFor="password"
                className="text-label-md font-label-md text-on-surface-variant"
              >
                Nieuw wachtwoord
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className="rounded-lg border border-outline-variant bg-surface-container-lowest px-sm py-sm text-body-md outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="Minimaal 8 tekens, 1 hoofdletter, 1 cijfer"
              />
            </div>

            <p className="text-label-sm text-on-surface-variant">
              Minimaal 8 tekens, één hoofdletter en één cijfer.
            </p>

            <button
              type="submit"
              className="mt-xs inline-flex items-center justify-center gap-base rounded-full bg-primary px-xl py-sm text-label-md font-label-md text-on-primary transition-all hover:opacity-90 active:scale-95 soft-shadow"
            >
              Wachtwoord opslaan en inloggen
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
