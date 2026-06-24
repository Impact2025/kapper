import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/dal";
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
  // Authoritative gate: redirects to /login when unauthenticated.
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-screen flex-col bg-surface-container-lowest md:flex-row">
      <Sidebar user={{ name: user.name, email: user.email, role: user.role }} />
      <main className="flex-1 px-margin-mobile py-md md:px-lg md:py-lg">{children}</main>
    </div>
  );
}
