import type { CSSProperties } from "react";
import type { VerticalTheme } from "./types";

/** Maps a pack's theme onto the Tailwind `@theme` colour variables in
 * app/globals.css. A pack without a theme keeps the default palette. Inline
 * custom properties on a wrapper element cascade to every semantic token
 * (`bg-primary`, `text-on-primary-fixed`, ...) beneath it. */
const VAR_BY_KEY: Record<keyof VerticalTheme, string> = {
  primary: "--color-primary",
  onPrimary: "--color-on-primary",
  primaryContainer: "--color-primary-container",
  onPrimaryContainer: "--color-on-primary-container",
  primaryFixed: "--color-primary-fixed",
  primaryFixedDim: "--color-primary-fixed-dim",
  onPrimaryFixed: "--color-on-primary-fixed",
  onPrimaryFixedVariant: "--color-on-primary-fixed-variant",
  inversePrimary: "--color-inverse-primary",
};

export function themeStyle(theme: VerticalTheme | undefined): CSSProperties | undefined {
  if (!theme) return undefined;
  const style: Record<string, string> = {};
  for (const key of Object.keys(VAR_BY_KEY) as (keyof VerticalTheme)[]) {
    style[VAR_BY_KEY[key]] = theme[key];
  }
  return style as CSSProperties;
}
