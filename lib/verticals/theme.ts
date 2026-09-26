import type { CSSProperties } from "react";
import type { VerticalTheme } from "./types";

/** Maps a pack's theme onto the Tailwind `@theme` colour variables in
 * app/globals.css. A pack without a theme keeps the default palette. Inline
 * custom properties on a wrapper element cascade to every semantic token
 * (`bg-primary`, `text-on-primary-fixed`, ...) beneath it. */
type RequiredThemeKey = Exclude<keyof VerticalTheme, "surface" | "surfaceContainerLow" | "surfaceContainer">;

const VAR_BY_KEY: Record<RequiredThemeKey, string> = {
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

/** Optional neutral-surface overrides — only set when a pack overrides them. */
const OPTIONAL_VAR_BY_KEY: Partial<Record<keyof VerticalTheme, string>> = {
  surface: "--color-surface",
  surfaceContainerLow: "--color-surface-container-low",
  surfaceContainer: "--color-surface-container",
};

export function themeStyle(theme: VerticalTheme | undefined): CSSProperties | undefined {
  if (!theme) return undefined;
  const style: Record<string, string> = {};
  for (const key of Object.keys(VAR_BY_KEY) as RequiredThemeKey[]) {
    style[VAR_BY_KEY[key]] = theme[key];
  }
  for (const key of Object.keys(OPTIONAL_VAR_BY_KEY) as (keyof VerticalTheme)[]) {
    const value = theme[key];
    if (value) style[OPTIONAL_VAR_BY_KEY[key]!] = value;
  }
  return style as CSSProperties;
}
