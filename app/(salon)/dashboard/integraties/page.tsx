import type { Metadata } from "next";
import { requireSalonOwner } from "@/lib/auth/dal";
import { getSalonWithSubscription } from "@/lib/salon/queries";
import { PageHeader, Card, Badge } from "@/components/admin/ui";
import { Icon } from "@/components/ui/icon";
import { IntegratiesForm } from "@/components/salon/integraties-form";

export const metadata: Metadata = { title: "Integraties" };

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default async function IntegratiesPage() {
  const user = await requireSalonOwner();
  const salon = await getSalonWithSubscription(user.salonId);

  const ai = (salon?.settings?.ai as Record<string, unknown>) ?? {};

  // Show placeholder if key is stored (encrypted) — never expose raw value to client
  const hasKey = (v: unknown) => (typeof v === "string" && v.length > 0 ? "••••••••" : "");

  const integrations = {
    agendaProvider: salon?.agendaProvider ?? "",
    agendaApiKey: hasKey(ai.agendaApiKey),
    watiApiKey: hasKey(ai.watiApiKey),
    vapiApiKey: hasKey(ai.vapiApiKey),
    phoneNumber: (ai.phoneNumber as string | null) ?? "",
  };

  const statusItems = [
    {
      label: "Agenda",
      icon: "calendar_month",
      active: !!salon?.agendaProvider,
      value: salon?.agendaProvider ? capitalize(salon.agendaProvider) : "Niet gekoppeld",
    },
    {
      label: "WhatsApp",
      icon: "chat",
      active: !!ai.whatsappEnabled,
      value: ai.whatsappEnabled ? "Actief" : "Niet gekoppeld",
    },
    {
      label: "Telefoon",
      icon: "phone",
      active: !!ai.phoneEnabled,
      value: ai.phoneEnabled ? `${ai.phoneNumber}` : "Niet gekoppeld",
    },
  ];

  return (
    <div>
      <PageHeader
        title="Integraties"
        subtitle="Koppel je agenda en communicatiekanalen aan de AI-assistent"
      />

      {/* Status overview */}
      <div className="mb-lg grid grid-cols-1 gap-md sm:grid-cols-3">
        {statusItems.map((item) => (
          <Card key={item.label} className="flex items-start gap-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-fixed text-on-primary-fixed shrink-0">
              <Icon name={item.icon} className="text-[22px]" />
            </div>
            <div className="min-w-0">
              <div className="text-label-sm uppercase tracking-wide text-on-surface-variant">
                {item.label}
              </div>
              <div className="truncate text-body-md font-medium text-on-surface">{item.value}</div>
              <Badge tone={item.active ? "success" : "neutral"}>
                {item.active ? "Verbonden" : "Niet verbonden"}
              </Badge>
            </div>
          </Card>
        ))}
      </div>

      <IntegratiesForm integrations={integrations} />

      {/* Compliance */}
      <Card className="mt-md">
        <div className="flex items-start gap-sm">
          <Icon name="security" className="mt-0.5 shrink-0 text-[22px] text-primary" />
          <div>
            <h3 className="mb-xs text-body-md font-medium text-on-surface">AVG-compliance</h3>
            <ul className="flex flex-col gap-xs text-label-sm text-on-surface-variant">
              <li>• API-sleutels worden versleuteld opgeslagen en nooit met derden gedeeld</li>
              <li>• Klantdata verlaat de EU-grens niet via onze integraties</li>
              <li>
                • WhatsApp Business API (niet de gratis app) — enige AVG-conforme optie; de gratis
                versie vereist verplichte upload van je volledige contactenlijst naar Meta
              </li>
              <li>• Stem- en chatdata worden max. 30 dagen bewaard, daarna automatisch verwijderd</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
