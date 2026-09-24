import { publicEnv } from "@/lib/env";
import { DEFAULT_VERTICAL_ID, getVerticalConfig } from "./index";

/**
 * Public origin for a vertical. The default (kapper) vertical honours
 * NEXT_PUBLIC_SITE_URL so local dev and preview deploys keep working; other
 * verticals use their own production domain.
 */
export function siteUrlFor(vertical: string | null | undefined): string {
  const pack = getVerticalConfig(vertical);
  return pack.id === DEFAULT_VERTICAL_ID ? publicEnv.NEXT_PUBLIC_SITE_URL : pack.brand.siteUrl;
}
