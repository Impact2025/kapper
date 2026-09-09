import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Our design-system colors and type-scale tokens (see app/globals.css @theme)
// share the `text-` prefix (e.g. text-primary vs text-label-md). tailwind-merge's
// default heuristics don't know these custom names, so without this config it
// mis-groups them into the same slot and silently drops one — e.g. `text-primary
// text-label-md` collapses to just `text-label-md`, leaving no text color set.
const colorTokens = [
  "primary", "on-primary", "primary-container", "on-primary-container",
  "primary-fixed", "primary-fixed-dim", "on-primary-fixed", "on-primary-fixed-variant",
  "secondary", "on-secondary", "secondary-container", "on-secondary-container",
  "secondary-fixed", "secondary-fixed-dim", "on-secondary-fixed", "on-secondary-fixed-variant",
  "tertiary", "on-tertiary", "tertiary-container", "on-tertiary-container",
  "tertiary-fixed", "tertiary-fixed-dim", "on-tertiary-fixed", "on-tertiary-fixed-variant",
  "error", "on-error", "error-container", "on-error-container",
  "background", "on-background", "surface", "on-surface", "surface-variant", "on-surface-variant",
  "surface-bright", "surface-dim", "surface-container-lowest", "surface-container-low",
  "surface-container", "surface-container-high", "surface-container-highest",
  "outline", "outline-variant", "inverse-surface", "inverse-on-surface", "inverse-primary", "surface-tint",
];

const fontSizeTokens = [
  "body-md", "body-lg", "label-md", "label-sm",
  "headline-md", "headline-lg", "headline-lg-mobile", "display-lg",
];

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "text-color": colorTokens.map((t) => `text-${t}`),
      "font-size": fontSizeTokens.map((t) => `text-${t}`),
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a number as EUR currency (nl-NL). */
export function formatEur(amount: number): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Slugify a string for URLs (Dutch-friendly). */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}
