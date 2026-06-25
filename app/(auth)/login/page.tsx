import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = {
  title: "Inloggen",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-container-low px-margin-mobile py-xl">
      <div className="w-full max-w-[28rem]">
        <div className="mb-lg text-center">
          <Link
            href="/"
            className="font-headline-md text-headline-md font-bold text-primary"
          >
            KapperAssistent
          </Link>
          <p className="mt-xs text-body-md text-on-surface-variant">
            Salon Cockpit — log in om verder te gaan
          </p>
        </div>

        <div className="glass-card rounded-xl p-lg">
          <LoginForm />
        </div>

        <p className="mt-md text-center text-label-sm text-on-surface-variant">
          <Link href="/forgot-password" className="text-primary hover:underline">
            Wachtwoord vergeten?
          </Link>
          {" · "}
          Vragen? Mail{" "}
          <a href="mailto:support@kappersassistent.nl" className="text-primary hover:underline">
            support@kappersassistent.nl
          </a>
        </p>
      </div>
    </main>
  );
}
