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

const PLAN_LABELS: Record<string, string> = {
  essential: "Essential",
  pro: "Pro",
  elite: "Elite",
};

export function SalonSidebar({
  user,
  salon,
  nav,
}: {
  user: { name: string | null; email: string };
  salon: { name: string; plan: string };
  /** Per-vertical menu (lib/verticals nav) resolved on the server. */
  nav: NavItem[];
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
      <div className="flex items-center justify-between border-b border-outline-variant/30 bg-surface px-margin-mobile py-base md:hidden">
        <div className="dash-h2 text-body-lg">{salon.name}</div>
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
          "flex w-full flex-col border-r border-outline-variant/30 bg-surface-container-lowest md:w-64 md:min-h-screen",
          open ? "block" : "hidden md:flex",
        )}
      >
        <div className="hidden flex-col gap-xs px-md py-lg md:flex">
          <span className="dash-h2 text-body-lg">{salon.name}</span>
          <span className="dash-pill w-fit bg-primary-fixed text-on-primary-fixed">
            {PLAN_LABELS[salon.plan] ?? salon.plan}
          </span>
        </div>

        <nav className="flex flex-1 flex-col gap-[2px] px-sm py-sm">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-sm rounded-xl px-sm py-sm text-label-md font-label-md transition-colors",
                isActive(item.href)
                  ? "bg-primary text-on-primary"
                  : "text-on-surface-variant hover:bg-surface-container",
              )}
            >
              <Icon name={item.icon} className="text-[20px]" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-outline-variant/30 px-sm py-sm">
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
              className="flex w-full items-center gap-sm rounded-xl px-sm py-sm text-label-md font-label-md text-on-surface-variant transition-colors hover:bg-error-container hover:text-on-error-container"
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
