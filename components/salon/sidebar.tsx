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
}

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Overzicht", icon: "dashboard" },
  { href: "/dashboard/ai-receptie", label: "AI-Receptie", icon: "smart_toy" },
  { href: "/dashboard/afspraken", label: "Afspraken", icon: "calendar_month" },
  { href: "/dashboard/no-show", label: "No-show beleid", icon: "event_busy" },
  { href: "/dashboard/integraties", label: "Integraties", icon: "cable" },
  { href: "/dashboard/abonnement", label: "Abonnement", icon: "credit_card" },
];

const PLAN_LABELS: Record<string, string> = {
  essential: "Essential",
  pro: "Pro",
  elite: "Elite",
};

export function SalonSidebar({
  user,
  salon,
}: {
  user: { name: string | null; email: string };
  salon: { name: string; plan: string };
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function isActive(href: string) {
    return href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(href);
  }

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-outline-variant/40 bg-surface px-margin-mobile py-base md:hidden">
        <div className="font-headline-md text-headline-md font-bold text-on-surface">
          {salon.name}
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
          className="text-primary"
        >
          <Icon name={open ? "close" : "menu"} />
        </button>
      </div>

      <aside
        className={cn(
          "flex w-full flex-col border-r border-outline-variant/40 bg-surface-container-low md:w-64 md:min-h-screen",
          open ? "block" : "hidden md:flex",
        )}
      >
        <div className="hidden flex-col gap-xs px-md py-md md:flex">
          <span className="font-headline-md text-headline-md font-bold text-on-surface">
            {salon.name}
          </span>
          <span className="text-label-sm text-primary font-label-sm">
            {PLAN_LABELS[salon.plan] ?? salon.plan}
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
          <div className="flex items-center gap-sm px-sm py-xs">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-label-md font-label-md text-on-primary">
              {(user.name ?? user.email)
                .split(" ")
                .slice(0, 2)
                .map((w) => w[0]?.toUpperCase() ?? "")
                .join("")}
            </div>
            <div className="min-w-0">
              <div className="truncate text-label-md font-label-md text-on-surface">
                {user.name ?? user.email}
              </div>
              <div className="truncate text-label-sm text-on-surface-variant">{user.email}</div>
            </div>
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
