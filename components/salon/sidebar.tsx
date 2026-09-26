"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { logout } from "@/lib/auth/actions";
import { cn } from "@/lib/utils";
import { NAV_GROUP_LABEL, NAV_GROUP_ORDER, type NavGroup } from "@/lib/verticals/nav";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  group?: NavGroup;
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

  // Sluit de lade bij navigatie en Escape; vergrendel de achtergrond-scroll terwijl hij open is.
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

  // Sections in fixed order; the flat `nav` order still drives the mobile tabs.
  const sections: { group?: NavGroup; items: NavItem[] }[] = [
    { items: nav.filter((n) => !n.group) },
    ...NAV_GROUP_ORDER.map((group) => ({ group, items: nav.filter((n) => n.group === group) })),
  ].filter((sec) => sec.items.length > 0);

  const tabs = nav.slice(0, 4);
  const moreActive = !tabs.some((t) => isActive(t.href)) && nav.some((n) => isActive(n.href));

  function isActive(href: string) {
    return href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(href);
  }

  return (
    <>
      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-outline-variant/30 bg-surface/95 px-margin-mobile pt-safe backdrop-blur md:hidden">
        <div className="dash-h2 truncate py-sm text-body-lg">{salon.name}</div>
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Menu sluiten" : "Menu openen"}
          aria-expanded={open}
          className="tap-target -mr-sm flex items-center justify-center text-primary"
        >
          <Icon name={open ? "close" : "menu"} />
        </button>
      </div>

      {/* Mobile: achtergrond achter de lade */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "flex flex-col border-r border-outline-variant/30 bg-surface-container-lowest md:static md:min-h-dvh md:w-64 md:translate-x-0",
          // mobiel: lade van rechts over de pagina, met safe-area
          "fixed inset-y-0 right-0 z-50 w-[min(20rem,88vw)] overflow-y-auto overscroll-contain pt-safe pb-safe shadow-2xl transition-transform duration-300 md:z-auto md:overflow-visible md:pt-0 md:pb-0 md:shadow-none",
          open ? "translate-x-0" : "translate-x-full md:translate-x-0",
        )}
      >
        <div className="hidden flex-col gap-xs px-md py-lg md:flex">
          <span className="dash-h2 text-body-lg">{salon.name}</span>
          <span className="dash-pill w-fit bg-primary-fixed text-on-primary-fixed">
            {PLAN_LABELS[salon.plan] ?? salon.plan}
          </span>
        </div>

        <nav aria-label="Menu" className="flex flex-1 flex-col gap-[2px] px-sm py-sm">
          {sections.map((section) => (
            <div key={section.group ?? "top"} className="flex flex-col gap-[2px]">
              {section.group && (
                <div className="dash-eyebrow px-sm pb-xs pt-md text-on-surface-variant/80">{NAV_GROUP_LABEL[section.group]}</div>
              )}
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={cn(
                    "tap-target flex items-center gap-sm rounded-xl px-sm py-sm text-label-md font-label-md transition-colors",
                    isActive(item.href)
                      ? "bg-primary text-on-primary"
                      : "text-on-surface-variant hover:bg-surface-container",
                  )}
                >
                  <Icon name={item.icon} className="text-[20px]" />
                  {item.label}
                </Link>
              ))}
            </div>
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
              className="tap-target flex w-full items-center gap-sm rounded-xl px-sm py-sm text-label-md font-label-md text-on-surface-variant transition-colors hover:bg-error-container hover:text-on-error-container"
            >
              <Icon name="logout" className="text-[20px]" />
              Uitloggen
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile: tabbalk onderin (duim-bereik), rest via "Meer" */}
      <nav
        aria-label="Hoofdnavigatie"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-outline-variant/30 bg-surface/95 pb-safe backdrop-blur md:hidden"
      >
        {tabs.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-[56px] flex-col items-center justify-center gap-[2px] px-1 text-[11px] font-semibold leading-tight active:bg-surface-container",
                active ? "text-primary" : "text-on-surface-variant",
              )}
            >
              <Icon name={item.icon} filled={active} className="text-[24px]" />
              <span className="max-w-full truncate">{item.label.split(" & ")[0]}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Meer menu-items"
          className={cn(
            "flex min-h-[56px] flex-col items-center justify-center gap-[2px] px-1 text-[11px] font-semibold leading-tight active:bg-surface-container",
            moreActive ? "text-primary" : "text-on-surface-variant",
          )}
        >
          <Icon name="more_horiz" filled={moreActive} className="text-[24px]" />
          <span>Meer</span>
        </button>
      </nav>
    </>
  );
}
