import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/dal";
import { getSalonWithSubscription } from "@/lib/salon/queries";
import { SalonSidebar } from "@/components/salon/sidebar";

export const metadata: Metadata = {
  title: { default: "Mijn KapperAssistent", template: "%s — KapperAssistent" },
  robots: { index: false, follow: false },
};

export default async function SalonLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (user.role !== "owner") redirect("/admin");

  const salon = user.salonId ? await getSalonWithSubscription(user.salonId) : null;

  return (
    <div className="flex min-h-screen flex-col bg-surface-container-lowest md:flex-row">
      <SalonSidebar
        user={{ name: user.name, email: user.email }}
        salon={{ name: salon?.name ?? "Mijn Salon", plan: salon?.plan ?? "essential" }}
      />
      <main className="flex-1 px-margin-mobile py-md md:px-lg md:py-lg">{children}</main>
    </div>
  );
}
