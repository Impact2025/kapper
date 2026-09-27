"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { logout } from "@/lib/auth/actions";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  adminOnly?: boolean;
}

const NAV: NavItem[] = [
  { href: "/admin", label: "Overzicht", icon: "dashboard" },
  { href: "/admin/klanten", label: "Klanten", icon: "storefront" },
  { href: "/admin/crm", label: "CRM & Leads", icon: "groups" },
  { href: "/admin/blog", label: "Blog & SEO", icon: "article" },
  { href: "/admin/nieuwsbrief", label: "Nieuwsbrief", icon: "campaign" },
  { href: "/admin/support", label: "Support", icon: "support_agent" },
  { href: "/admin/coupons", label: "Coupons", icon: "sell" },
  { href: "/admin/billing", label: "Abonnementen", icon: "credit_card" },
  { href: "/admin/reports", label: "Rapporten", icon: "monitoring" },
  { href: "/admin/ai-verbruik", label: "AI-verbruik & marge", icon: "token" },
  { href: "/admin/logboek", label: "Logboek", icon: "history" },
];

export function Sidebar({ user }: { user: { name: string | null; email: string; role: string } }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const mobile = window.matchMedia("(max-width: 767px)").matches;
    const prev = document.body.style.overflow;
    if (mobile) document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function isActive(href: string) {
    return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
  }

  return (
    <>
      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-outline-variant/40 bg-surface/95 px-margin-mobile pt-safe backdrop-blur md:hidden">
        <Link href="/admin" className="font-headline-md text-headline-md font-bold text-primary">
          KapperAssistent
        </Link>
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Menu sluiten" : "Menu openen"}
          aria-expanded={open}
          className="tap-target -mr-sm flex items-center justify-center text-primary"
        >
          <Icon name={open ? "close" : "menu"} />
        </button>
      </div>

      {open && <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setOpen(false)} aria-hidden="true" />}

      <aside
        className={cn(
          "flex flex-col border-r border-outline-variant/40 bg-surface-container-low md:static md:min-h-dvh md:w-64 md:translate-x-0",
          "fixed inset-y-0 right-0 z-50 w-[min(20rem,88vw)] overflow-y-auto overscroll-contain pt-safe pb-safe shadow-2xl transition-transform duration-300 md:z-auto md:overflow-visible md:pt-0 md:pb-0 md:shadow-none",
          open ? "translate-x-0" : "translate-x-full md:translate-x-0",
        )}
      >
        <div className="hidden items-center gap-xs px-md py-md md:flex">
          <span className="font-headline-md text-headline-md font-bold text-primary">
            KapperAssistent
          </span>
        </div>

        <nav className="flex flex-1 flex-col gap-xs px-sm py-sm">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "tap-target flex items-center gap-sm rounded-lg px-sm py-sm text-label-md font-label-md transition-colors",
                isActive(item.href)
                  ? "bg-primary text-on-primary"
                  : "text-on-surface-variant hover:bg-primary/5 hover:text-primary",
              )}
            >
              <Icon name={item.icon} className="text-[20px]" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-outline-variant/40 px-sm py-sm">
          <div className="px-sm py-xs">
            <div className="truncate text-label-md font-label-md text-on-surface">
              {user.name ?? user.email}
            </div>
            <div className="truncate text-label-sm text-on-surface-variant">{user.email}</div>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="tap-target flex w-full items-center gap-sm rounded-lg px-sm py-sm text-label-md font-label-md text-on-surface-variant transition-colors hover:bg-error-container hover:text-on-error-container"
            >
              <Icon name="logout" className="text-[20px]" />
              Uitloggen
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
