import { z } from "zod";

/**
 * Pure audience segmentation. A segment is an AND of optional filters; an
 * empty filter list means "no restriction on that field". Only subscribers
 * with status "subscribed" are ever eligible — that rule is not optional.
 */

export const SUBSCRIBER_SOURCES = ["formulier", "klant", "handmatig", "import"] as const;
export const SALON_STATUSES = ["trial", "active", "past_due", "canceled"] as const;

export const segmentSchema = z.object({
  sources: z.array(z.enum(SUBSCRIBER_SOURCES)).default([]),
  verticals: z.array(z.string()).default([]),
  /** Only applies to subscribers linked to a salon; prospects never match a non-empty list. */
  salonStatuses: z.array(z.enum(SALON_STATUSES)).default([]),
  tags: z.array(z.string()).default([]),
});

export type Segment = z.infer<typeof segmentSchema>;

export function parseSegment(raw: unknown): Segment {
  const parsed = segmentSchema.safeParse(raw ?? {});
  return parsed.success ? parsed.data : segmentSchema.parse({});
}

export interface SegmentCandidate {
  status: string;
  source: string;
  vertical: string | null;
  salonStatus: string | null;
  tags: string[];
}

export function matchesSegment(s: SegmentCandidate, seg: Segment): boolean {
  if (s.status !== "subscribed") return false;
  if (seg.sources.length && !seg.sources.includes(s.source as (typeof SUBSCRIBER_SOURCES)[number])) return false;
  if (seg.verticals.length && !(s.vertical && seg.verticals.includes(s.vertical))) return false;
  if (seg.salonStatuses.length && !(s.salonStatus && seg.salonStatuses.includes(s.salonStatus as (typeof SALON_STATUSES)[number]))) return false;
  if (seg.tags.length && !seg.tags.some((t) => s.tags.includes(t))) return false;
  return true;
}

/** Deterministic A/B split: stable per subscriber, ~50/50. */
export function abVariant(subscriberId: string, hasB: boolean): "A" | "B" {
  if (!hasB) return "A";
  let h = 0;
  for (let i = 0; i < subscriberId.length; i++) h = (h * 31 + subscriberId.charCodeAt(i)) >>> 0;
  return h % 2 === 0 ? "A" : "B";
}

export function describeSegment(seg: Segment, labels: { vertical: (v: string) => string }): string {
  const parts: string[] = [];
  if (seg.sources.length) parts.push(`bron: ${seg.sources.join(", ")}`);
  if (seg.verticals.length) parts.push(`vak: ${seg.verticals.map(labels.vertical).join(", ")}`);
  if (seg.salonStatuses.length) parts.push(`klantstatus: ${seg.salonStatuses.join(", ")}`);
  if (seg.tags.length) parts.push(`tags: ${seg.tags.join(", ")}`);
  return parts.length ? parts.join(" · ") : "Alle abonnees";
}
