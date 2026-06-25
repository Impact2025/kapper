"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/#hoe-het-werkt", label: "Hoe het werkt" },
  { href: "/diensten", label: "Diensten" },
  { href: "/prijzen", label: "Prijzen" },
  { href: "/over-ons", label: "Over Ons" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="bg-surface/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
      <nav className="flex justify-between items-center w-full px-margin-mobile md:px-xl py-base max-w-container-max mx-auto">
        <Link href="/" className="flex items-center gap-xs">
          <span className="font-headline-md text-headline-md font-bold text-primary">
            KapperAssistent
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-md">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-sm">
          <Link
            href="/login"
            className="hidden sm:inline-flex font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors"
          >
            Inloggen
          </Link>
          <ButtonLink href="/scan" size="sm" className="hidden sm:inline-flex">
            Gratis AI-scan
          </ButtonLink>
          <button
            className="md:hidden text-primary"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            <Icon name={open ? "close" : "menu"} />
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <div
        className={cn(
          "md:hidden overflow-hidden transition-all duration-300 border-t border-outline-variant/40",
          open ? "max-h-96" : "max-h-0",
        )}
      >
        <div className="px-margin-mobile py-md flex flex-col gap-sm bg-surface/95">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="font-label-md text-label-md text-on-surface-variant py-xs"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="font-label-md text-label-md text-on-surface-variant py-xs"
          >
            Inloggen
          </Link>
          <ButtonLink href="/scan" className="mt-xs">
            Gratis AI-scan
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}
