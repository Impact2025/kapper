import type { Metadata } from "next";
import Link from "next/link";
import { requireSalonOwner } from "@/lib/auth/dal";
import { getSalonWithSubscription } from "@/lib/salon/queries";
import { getSalonMetrics } from "@/lib/salon/metrics";
import { PageHeader, Card, StatCard, Badge } from "@/components/admin/ui";
import { Icon } from "@/components/ui/icon";
import { formatEur } from "@/lib/utils";
import { OnboardingWizard } from "@/components/salon/onboarding-wizard";

export const metadata: Metadata = { title: "Overzicht" };

export default async function DashboardPage() {
  const user = await requireSalonOwner();
  const [salon, metrics] = await Promise.all([
    getSalonWithSubscription(user.salonId),
    getSalonMetrics(user.salonId),
  ]);

  const ai = (salon?.settings?.ai as Record<string, unknown>) ?? {};
  const noShow = (salon?.settings?.noShow as Record<string, unknown>) ?? {};

  const onboardingSteps = [
    { label: "Agenda gekoppeld", done: !!salon?.agendaProvider, href: "/dashboard/integraties" },
    { label: "No-show beleid ingesteld", done: !!noShow.enabled, href: "/dashboard/no-show" },
    { label: "WhatsApp actief", done: !!ai.whatsappEnabled, href: "/dashboard/integraties" },
    { label: "Telefonische receptie actief", done: !!ai.phoneEnabled, href: "/dashboard/integraties" },
  ];
  const completedSteps = onboardingSteps.filter((s) => s.done).length;
  const showOnboarding = completedSteps < onboardingSteps.length;

  const wizardSteps = [
    {
      title: "Agenda koppelen",
      description: "Verbind Salonized, Phorest, Treatwell of Acuity. De AI boekt alleen in jouw agenda en hallucineert nooit beschikbaarheid.",
      time: "5 minuten",
      icon: "calendar_month",
      href: "/dashboard/integraties",
      cta: "Agenda koppelen",
      done: !!salon?.agendaProvider,
    },
    {
      title: "No-show beleid instellen",
      description: "Stel in hoe laat klanten gratis mogen annuleren en of je een aanbetaling wilt. De AI informeert klanten automatisch.",
      time: "3 minuten",
      icon: "event_busy",
      href: "/dashboard/no-show",
      cta: "Beleid instellen",
      done: !!noShow.enabled,
    },
    {
      title: "WhatsApp activeren",
      description: "Voer je WATI API-sleutel in. Daarna handelt de AI alle WhatsApp-berichten af — 24/7, onder 800ms reactietijd.",
      time: "5 minuten",
      icon: "chat",
      href: "/dashboard/integraties",
      cta: "WhatsApp koppelen",
      done: !!ai.whatsappEnabled,
    },
    {
      title: "Telefonische receptie activeren",
      description: "Voer je zakelijke telefoonnummer en Vapi-sleutel in. De AI neemt gesprekken aan en plant direct afspraken.",
      time: "5 minuten",
      icon: "phone",
      href: "/dashboard/integraties",
      cta: "Telefoon activeren",
      done: !!ai.phoneEnabled,
    },
  ];

  const deltaHint = (delta: number) =>
    delta > 0 ? `+${delta}% vs vorige maand` : delta < 0 ? `${delta}% vs vorige maand` : "Gelijk aan vorige maand";

  return (
    <div>
      <OnboardingWizard steps={wizardSteps} salonId={user.salonId} />
      <PageHeader
        title={`Welkom terug, ${user.name?.split(" ")[0] ?? "kapper"}`}
        subtitle={`${salon?.name ?? "Jouw salon"} · Afgelopen 30 dagen`}
      />

      {/* Onboarding checklist */}
      {showOnboarding && (
        <div className="mb-lg rounded-xl border border-secondary/30 bg-secondary-fixed/40 p-md">
          <div className="mb-sm flex items-center gap-sm">
            <Icon name="checklist" className="text-[22px] text-secondary" />
            <h2 className="font-headline-md text-headline-md text-on-surface">
              Stel je assistent in ({completedSteps}/{onboardingSteps.length})
            </h2>
          </div>
          <div className="flex flex-col gap-xs">
            {onboardingSteps.map((step) => (
              <div key={step.label} className="flex items-center gap-sm">
                <Icon
                  name={step.done ? "check_circle" : "radio_button_unchecked"}
                  filled={step.done}
                  className={`text-[20px] ${step.done ? "text-primary" : "text-outline"}`}
                />
                <span className={`text-body-md ${step.done ? "text-on-surface-variant line-through" : "text-on-surface"}`}>
                  {step.label}
                </span>
                {!step.done && (
                  <Link href={step.href} className="ml-auto text-label-sm text-primary hover:underline">
                    Instellen →
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Demo banner */}
      {metrics.isDemo && (
        <div className="mb-md flex items-center gap-sm rounded-xl border border-outline-variant/40 bg-surface-container px-md py-sm text-label-md text-on-surface-variant">
          <Icon name="auto_awesome" className="text-[18px] text-primary shrink-0" />
          Dit zijn voorbeeldcijfers. Zodra je AI-assistent actief is, zie je hier jouw echte data.
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-md sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Gesprekken afgehandeld"
          value={String(metrics.callsHandled)}
          icon="headset_mic"
          hint={deltaHint(metrics.callsHandledDelta)}
        />
        <StatCard
          label="Boekingen via AI"
          value={String(metrics.bookingsMade)}
          icon="event_available"
          hint={deltaHint(metrics.bookingsMadeDelta)}
        />
        <StatCard
          label="No-shows voorkomen"
          value={String(metrics.noShowsPrevented)}
          icon="event_busy"
          hint="via herinneringen"
        />
        <StatCard
          label="Beschermde omzet"
          value={formatEur(metrics.protectedRevenueCents / 100)}
          icon="savings"
          hint="geschatte gemiste omzet"
        />
      </div>

      <div className="mt-lg grid grid-cols-1 gap-md lg:grid-cols-2">
        {/* AI-receptie status */}
        <Card>
          <div className="mb-md flex items-center justify-between">
            <h2 className="font-headline-md text-headline-md text-on-surface">AI-Receptie</h2>
            <Link href="/dashboard/ai-receptie" className="text-label-md font-label-md text-primary hover:underline">
              Beheer →
            </Link>
          </div>
          <div className="flex flex-col gap-sm">
            <ChannelRow label="WhatsApp" icon="chat" active={!!ai.whatsappEnabled} href="/dashboard/integraties" />
            <ChannelRow label="Telefoon" icon="phone" active={!!ai.phoneEnabled} href="/dashboard/integraties" />
            <ChannelRow label="Web Widget" icon="language" active={false} href="/dashboard/integraties" comingSoon />
          </div>
        </Card>

        {/* Quick links */}
        <Card>
          <h2 className="mb-md font-headline-md text-headline-md text-on-surface">Snel naar</h2>
          <div className="flex flex-col gap-xs">
            <QuickLink href="/dashboard/gesprekken" icon="forum" label="Gesprekken bekijken" />
            <QuickLink href="/dashboard/afspraken" icon="calendar_month" label="Afspraken bekijken" />
            <QuickLink href="/dashboard/no-show" icon="event_busy" label="No-show beleid instellen" />
            <QuickLink href="/dashboard/integraties" icon="cable" label="Integraties beheren" />
            <QuickLink href="/dashboard/abonnement" icon="credit_card" label="Abonnement inzien" />
          </div>
        </Card>
      </div>
    </div>
  );
}

function ChannelRow({
  label,
  icon,
  active,
  href,
  comingSoon,
}: {
  label: string;
  icon: string;
  active: boolean;
  href: string;
  comingSoon?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-outline-variant/40 px-sm py-sm">
      <div className="flex items-center gap-sm">
        <Icon name={icon} className="text-[20px] text-on-surface-variant" />
        <span className="text-body-md text-on-surface">{label}</span>
      </div>
      {comingSoon ? (
        <span className="text-label-sm text-on-surface-variant">Binnenkort</span>
      ) : active ? (
        <div className="flex items-center gap-xs">
          <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
          <span className="text-label-sm text-primary">Actief</span>
        </div>
      ) : (
        <Link href={href} className="text-label-sm text-secondary hover:underline">
          Instellen
        </Link>
      )}
    </div>
  );
}

function QuickLink({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-sm rounded-lg border border-outline-variant/40 px-sm py-sm text-body-md text-on-surface transition-colors hover:bg-primary/5 hover:text-primary"
    >
      <Icon name={icon} className="text-[20px]" />
      {label}
    </Link>
  );
}
