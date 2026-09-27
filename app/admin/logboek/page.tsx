import { requireRole } from "@/lib/auth/dal";
import { listAuditLog } from "@/lib/admin/audit";
import { PageHeader, Card, Badge, EmptyState } from "@/components/admin/ui";

const ACTION_LABELS: Record<string, string> = {
  "lead.stage": "Leadfase gewijzigd",
  "lead.email": "E-mail naar lead",
  "coupon.create": "Coupon aangemaakt",
  "coupon.activate": "Coupon geactiveerd",
  "coupon.deactivate": "Coupon gedeactiveerd",
  "post.publish": "Blog gepubliceerd",
  "post.unpublish": "Blog teruggezet naar concept",
  "post.delete": "Blog verwijderd",
  "ticket.status": "Ticketstatus gewijzigd",
  "ticket.assign": "Ticket toegewezen",
  "incident.create": "Storing gemeld",
  "incident.update": "Storing bijgewerkt",
  "article.save": "Helpartikel opgeslagen",
  "article.reset": "Helpartikel teruggezet",
};

export default async function AuditLogPage() {
  await requireRole("admin");
  const rows = await listAuditLog(200);
  const dt = new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Amsterdam",
  });

  return (
    <div>
      <PageHeader title="Logboek" subtitle="Wie deed wat in het beheer — de laatste 200 acties." />
      {rows.length === 0 ? (
        <EmptyState icon="history" title="Nog geen acties vastgelegd" description="Wijzigingen in CRM, coupons, blog, support en status verschijnen hier." />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-label-md">
            <thead className="text-label-sm uppercase tracking-wide text-on-surface-variant">
              <tr className="border-b border-outline-variant/40">
                <th className="py-xs pr-sm">Wanneer</th>
                <th className="py-xs pr-sm">Wie</th>
                <th className="py-xs pr-sm">Actie</th>
                <th className="py-xs pr-sm">Doel</th>
                <th className="py-xs">Details</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-outline-variant/20 align-top last:border-0">
                  <td className="whitespace-nowrap py-xs pr-sm tabular-nums text-on-surface-variant">{dt.format(r.createdAt)}</td>
                  <td className="py-xs pr-sm text-on-surface">{r.actorEmail}</td>
                  <td className="py-xs pr-sm">
                    <Badge tone={r.action.endsWith(".delete") ? "error" : "neutral"}>{ACTION_LABELS[r.action] ?? r.action}</Badge>
                  </td>
                  <td className="py-xs pr-sm text-on-surface-variant">
                    {r.targetType ? `${r.targetType} ${r.targetId?.slice(0, 12) ?? ""}` : "—"}
                  </td>
                  <td className="py-xs font-mono text-label-sm text-on-surface-variant">
                    {Object.keys(r.meta).length ? JSON.stringify(r.meta) : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
