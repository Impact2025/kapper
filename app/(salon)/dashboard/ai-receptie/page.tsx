import type { Metadata } from "next";
import Link from "next/link";
import { requireSalonOwner } from "@/lib/auth/dal";
import { getSalonWithSubscription } from "@/lib/salon/queries";
import { getSalonMetrics } from "@/lib/salon/metrics";
import { PageHeader, Card, StatCard, Badge } from "@/components/admin/ui";
import { Icon } from "@/components/ui/icon";

export const metadata: Metadata = { title: "AI-Receptie" };

export default async function AiReceptiePage() {
  const user = await requireSalonOwner();
  const [salon, metrics] = await Promise.all([
    getSalonWithSubscription(user.salonId),
    getSalonMetrics(user.salonId),
  ]);

  const ai = (salon?.settings?.ai as Record<string, unknown>) ?? {};

  const channels = [
    {
      label: "WhatsApp",
      icon: "chat",
      active: !!ai.whatsappEnabled,
      description: "Automatisch beantwoorden via WhatsApp Business API",
      stat: metrics.whatsappMessages,
      statLabel: "berichten (30d)",
    },
    {
      label: "Telefoon",
      icon: "phone",
      active: !!ai.phoneEnabled,
      description: "AI-receptionist neemt inkomende gesprekken aan (<800ms latentie)",
      stat: metrics.callsHandled,
      statLabel: "gesprekken (30d)",
    },
  ];

  const totalActive = channels.filter((c) => c.active).length;
  const isDemo = metrics.isDemo;

  const RULES = [
    {
      icon: "check_circle",
      tone: "primary",
      label: "Standaard boekingen",
      desc: "Afspraken inplannen, wijzigen en annuleren",
    },
    {
      icon: "check_circle",
      tone: "primary",
      label: "FAQ beantwoorden",
      desc: "Openingstijden, prijzen, diensten — strikt op basis van jouw agenda",
    },
    {
      icon: "check_circle",
      tone: "primary",
      label: "Herinneringen versturen",
      desc: "24u en 48u voor de afspraak via SMS/WhatsApp",
    },
    {
      icon: "swap_horiz",
      tone: "secondary",
      label: "Complexe vragen escaleren",
      desc: "Kleurcorrecties, klachten en VIP-klanten worden direct doorgestuurd naar jou",
    },
    {
      icon: "block",
      tone: "outline",
      label: "Nooit hallucineren",
      desc: "AI biedt uitsluitend slots aan die live uit jouw agenda komen — nooit zelf bedenken",
    },
  ] as const;

  return (
    <div>
      <PageHeader
        title="AI-Receptie"
        subtitle={`${totalActive} van ${channels.length} kanalen actief`}
        action={
          <Link
            href="/dashboard/integraties"
            className="inline-flex items-center gap-base rounded-full bg-primary px-md py-sm text-label-md font-label-md text-on-primary transition-all hover:opacity-90 active:scale-95 soft-shadow"
          >
            <Icon name="settings" className="text-[18px]" />
            Kanalen instellen
          </Link>
        }
      />

      {isDemo && (
        <div className="mb-md flex items-center gap-sm rounded-xl border border-outline-variant/40 bg-surface-container px-md py-sm text-label-md text-on-surface-variant">
          <Icon name="auto_awesome" className="text-[18px] text-primary shrink-0" />
          Voorbeeldcijfers — worden vervangen door echte data zodra je assistent actief is.
        </div>
      )}

      {/* Top stats */}
      <div className="mb-lg grid grid-cols-1 gap-md sm:grid-cols-3">
        <StatCard
          label="Afgehandeld (30d)"
          value={String(metrics.callsHandled + metrics.whatsappMessages)}
          icon="support_agent"
          hint="gesprekken & berichten"
        />
        <StatCard
          label="Boekingen via AI (30d)"
          value={String(metrics.bookingsMade)}
          icon="event_available"
          hint="direct geboekt"
        />
        <StatCard
          label="No-shows voorkomen (30d)"
          value={String(metrics.noShowsPrevented)}
          icon="event_busy"
          hint="via herinneringen"
        />
      </div>

      {/* Channel cards */}
      <div className="mb-lg grid grid-cols-1 gap-md md:grid-cols-2">
        {channels.map((ch) => (
          <Card key={ch.label} className="flex flex-col gap-md">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-fixed text-on-primary-fixed">
                  <Icon name={ch.icon} className="text-[22px]" />
                </div>
                <div>
                  <div className="font-headline-md text-headline-md text-on-surface">{ch.label}</div>
                  <div className="text-label-sm text-on-surface-variant">{ch.description}</div>
                </div>
              </div>
              <Badge tone={ch.active ? "success" : "neutral"}>
                {ch.active ? "Actief" : "Inactief"}
              </Badge>
            </div>

            <div className="flex items-center gap-sm rounded-lg bg-surface-container p-sm">
              <Icon name="bar_chart" className="text-[20px] text-on-surface-variant" />
              <span className="font-headline-md text-headline-md text-on-surface">{ch.stat}</span>
              <span className="text-label-sm text-on-surface-variant">{ch.statLabel}</span>
            </div>

            {!ch.active && (
              <Link
                href="/dashboard/integraties"
                className="flex items-center justify-center gap-sm rounded-lg border border-outline-variant/40 py-sm text-label-md font-label-md text-primary transition-colors hover:bg-primary/5"
              >
                <Icon name="cable" className="text-[18px]" />
                Koppelen
              </Link>
            )}
          </Card>
        ))}
      </div>

      {/* Behavior rules */}
      <Card>
        <h2 className="mb-md font-headline-md text-headline-md text-on-surface">
          AI-gedragsregels
        </h2>
        <div className="flex flex-col gap-sm">
          {RULES.map((rule) => (
            <div key={rule.label} className="flex items-start gap-sm">
              <Icon
                name={rule.icon}
                filled
                className={`mt-0.5 text-[20px] ${
                  rule.tone === "primary"
                    ? "text-primary"
                    : rule.tone === "secondary"
                      ? "text-secondary"
                      : "text-outline"
                }`}
              />
              <div>
                <div className="text-body-md font-medium text-on-surface">{rule.label}</div>
                <div className="text-label-sm text-on-surface-variant">{rule.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-md rounded-lg bg-primary-fixed/50 px-sm py-sm text-label-sm text-on-primary-fixed">
          Vereist door EU AI Act (aug. 2026): de assistent identificeert zichzelf altijd als AI en
          biedt altijd de optie om naar een mens doorverbonden te worden.
        </div>
      </Card>
    </div>
  );
}
