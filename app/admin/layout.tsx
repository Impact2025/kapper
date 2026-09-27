import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/dal";
import { Sidebar } from "@/components/admin/sidebar";

export const metadata: Metadata = {
  title: "Salon Cockpit",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Authoritative gate: redirects unauthenticated users to /login and any
  // non-admin (e.g. a salon owner) to /admin, which itself redirects them
  // onward — proxy.ts is optimistic-only, this is what actually enforces it.
  const user = await requireRole("admin");

  return (
    <div className="flex min-h-dvh flex-col bg-surface-container-lowest md:flex-row">
      <Sidebar user={{ name: user.name, email: user.email, role: user.role }} />
      <main className="min-w-0 flex-1 px-margin-mobile pt-md pb-[calc(1.5rem+env(safe-area-inset-bottom))] md:px-lg md:py-lg">{children}</main>
    </div>
  );
}
