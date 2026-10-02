import type { VerticalPack } from "@/lib/verticals";

/** The free uurtarief-calculator is offered on every live job vertical's site. */
export function hasHourlyRateTool(pack: Pick<VerticalPack, "archetype" | "live">): boolean {
  return pack.archetype === "job" && pack.live;
}

export const HOURLY_RATE_TOOL_PATH = "/tools/uurtarief-calculator";
