import type { Metadata } from "next";
import { headers } from "next/headers";
import { ForgotPasswordForm } from "@/components/admin/forgot-password-form";
import { isUnclaimedHost, verticalForLogin } from "@/lib/verticals";
import { themeStyle } from "@/lib/verticals/theme";

export const metadata: Metadata = { title: "Wachtwoord vergeten", robots: { index: false, follow: false } };

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ vertical?: string | string[] }> }) {
  const host = (await headers()).get("host");
  const { vertical } = await searchParams;
  const pack = verticalForLogin(host, Array.isArray(vertical) ? vertical[0] : vertical);
  return (
    <div style={themeStyle(pack.theme)}>
      <ForgotPasswordForm
        brandName={pack.brand.name}
        emailPlaceholder={pack.archetype === "job" ? "jij@bedrijf.nl" : "jij@salon.nl"}
        loginHref={isUnclaimedHost(host) ? `/login?vertical=${pack.id}` : "/login"}
      />
    </div>
  );
}
