export const LEAD_STAGES = ["new", "qualified", "pilot", "customer", "lost"] as const;
export type LeadStage = (typeof LEAD_STAGES)[number];

export const LEAD_STAGE_LABELS: Record<LeadStage, string> = {
  new: "Nieuw",
  qualified: "Gekwalificeerd",
  pilot: "Pilot",
  customer: "Klant",
  lost: "Verloren",
};

export const LEAD_STAGE_TONES: Record<
  LeadStage,
  "neutral" | "primary" | "success" | "warning" | "error"
> = {
  new: "primary",
  qualified: "neutral",
  pilot: "warning",
  customer: "success",
  lost: "error",
};

export const ACTIVITY_TYPES = [
  "note",
  "email",
  "call",
  "stage_change",
  "scan",
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export const ACTIVITY_LABELS: Record<ActivityType, string> = {
  note: "Notitie",
  email: "E-mail",
  call: "Telefoon",
  stage_change: "Fasewijziging",
  scan: "Scan",
};

export const ACTIVITY_ICONS: Record<ActivityType, string> = {
  note: "sticky_note_2",
  email: "mail",
  call: "call",
  stage_change: "swap_horiz",
  scan: "radar",
};
