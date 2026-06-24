import { getCurrentUser } from "@/lib/auth/dal";
import { listCoupons } from "@/lib/coupons/service";
import { PageHeader, Card, EmptyState } from "@/components/admin/ui";
import { CouponForm } from "@/components/admin/coupons/coupon-form";
import { CouponToggle } from "@/components/admin/coupons/coupon-toggle";
import { formatEur } from "@/lib/utils";

function describeValue(type: string, value: number): string {
  if (type === "percent") return `${value}% korting`;
  if (type === "fixed") return `${formatEur(value / 100)} korting`;
  return `${value} trial-dagen`;
}

export default async function CouponsPage() {
  await getCurrentUser();
  const coupons = await listCoupons();
  const dateFmt = new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div>
      <PageHeader title="Coupons" subtitle="Kortingscodes en gratis trials voor je salondeals." />

      <div className="grid grid-cols-1 gap-md lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <h2 className="mb-md font-headline-md text-headline-md text-on-surface">
              Nieuwe coupon
            </h2>
            <CouponForm />
          </Card>
        </div>

        <div className="lg:col-span-2">
          {coupons.length === 0 ? (
            <EmptyState
              icon="sell"
              title="Nog geen coupons"
              description="Maak links een eerste kortingscode aan."
            />
          ) : (
            <Card className="overflow-x-auto p-0">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-outline-variant/40 text-label-sm uppercase tracking-wide text-on-surface-variant">
                    <th className="px-md py-sm font-label-sm">Code</th>
                    <th className="px-md py-sm font-label-sm">Korting</th>
                    <th className="px-md py-sm text-center font-label-sm">Gebruikt</th>
                    <th className="px-md py-sm font-label-sm">Verloopt</th>
                    <th className="px-md py-sm text-right font-label-sm">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((c) => (
                    <tr key={c.id} className="border-b border-outline-variant/20">
                      <td className="px-md py-sm font-mono text-label-md text-on-surface">{c.code}</td>
                      <td className="px-md py-sm text-body-md text-on-surface-variant">
                        {describeValue(c.type, c.value)}
                      </td>
                      <td className="px-md py-sm text-center text-body-md text-on-surface-variant">
                        {c.redeemed}
                        {c.maxRedemptions ? ` / ${c.maxRedemptions}` : ""}
                      </td>
                      <td className="px-md py-sm text-label-sm text-on-surface-variant">
                        {c.expiresAt ? dateFmt.format(c.expiresAt) : "—"}
                      </td>
                      <td className="px-md py-sm text-right">
                        <CouponToggle id={c.id} active={c.active} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
