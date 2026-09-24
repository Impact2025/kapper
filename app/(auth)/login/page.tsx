import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { LoginForm } from "@/components/admin/login-form";
import { verticalForHost } from "@/lib/verticals";
import { themeStyle } from "@/lib/verticals/theme";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Inloggen", robots: { index: false, follow: false } };
}

export default async function LoginPage() {
  // Log in on your own trade's domain (loodgietersassistent.nl, ...): brand
  // and support address follow the host. The session cookie is per-host, and
  // the dashboard itself themes on the salon's own vertical.
  const pack = verticalForHost((await headers()).get("host"));
  const { brand } = pack;
  return (
    <main style={themeStyle(pack.theme)} className="flex min-h-screen items-center justify-center bg-surface-container-low px-margin-mobile py-xl">
      <div className="w-full max-w-[28rem]">
        <div className="mb-lg text-center">
          <Link
            href="/"
            className="font-headline-md text-headline-md font-bold text-primary"
          >
            {brand.name}
          </Link>
          <p className="mt-xs text-body-md text-on-surface-variant">
            {pack.archetype === "job" ? "Log in op je bedrijfscockpit" : "Salon Cockpit — log in om verder te gaan"}
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
          <a href={`mailto:${brand.supportEmail}`} className="text-primary hover:underline">
            {brand.supportEmail}
          </a>
        </p>
      </div>
    </main>
  );
}
