"use client";

import { useState } from "react";
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
  { href: "/admin/crm", label: "CRM & Leads", icon: "groups" },
  { href: "/admin/blog", label: "Blog & SEO", icon: "article" },
  { href: "/admin/coupons", label: "Coupons", icon: "sell" },
  { href: "/admin/billing", label: "Abonnementen", icon: "credit_card" },
  { href: "/admin/reports", label: "Rapporten", icon: "monitoring" },
];

export function Sidebar({ user }: { user: { name: string | null; email: string; role: string } }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function isActive(href: string) {
    return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
  }

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-outline-variant/40 bg-surface px-margin-mobile py-base md:hidden">
        <Link href="/admin" className="font-headline-md text-headline-md font-bold text-primary">
          KapperAssistent
        </Link>
        <button onClick={() => setOpen((v) => !v)} aria-label="Menu" className="text-primary">
          <Icon name={open ? "close" : "menu"} />
        </button>
      </div>

      <aside
        className={cn(
          "flex w-full flex-col border-r border-outline-variant/40 bg-surface-container-low md:w-64 md:min-h-screen",
          open ? "block" : "hidden md:flex",
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
                "flex items-center gap-sm rounded-lg px-sm py-sm text-label-md font-label-md transition-colors",
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
              className="flex w-full items-center gap-sm rounded-lg px-sm py-sm text-label-md font-label-md text-on-surface-variant transition-colors hover:bg-error-container hover:text-on-error-container"
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
