export const CAMPAIGN_STATUS = {
  draft: { label: "Concept", tone: "neutral" },
  scheduled: { label: "Ingepland", tone: "primary" },
  sending: { label: "Wordt verzonden", tone: "warning" },
  sent: { label: "Verzonden", tone: "success" },
} as const;

export function campaignStatus(status: string) {
  return CAMPAIGN_STATUS[status as keyof typeof CAMPAIGN_STATUS] ?? CAMPAIGN_STATUS.draft;
}

export const SUBSCRIBER_STATUS = {
  subscribed: { label: "Aangemeld", tone: "success" },
  pending: { label: "Wacht op bevestiging", tone: "primary" },
  unsubscribed: { label: "Afgemeld", tone: "neutral" },
  bounced: { label: "Bounce", tone: "error" },
  complained: { label: "Spammelding", tone: "error" },
} as const;

export const pct = (part: number, whole: number) => (whole ? `${Math.round((part / whole) * 100)}%` : "—");
