import "server-only";
import { and, eq, gte, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import { orderItems, orders } from "@/lib/db/schema";
import { amsterdamDateKey } from "@/lib/salon/timezone";

function csvEscape(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function centsToEuro(cents: number): string {
  return (cents / 100).toFixed(2);
}

/**
 * MVP boekhoudkoppeling: a CSV a salon owner can download and import into
 * Moneybird/Exact/e-Boekhouden — one row per order with the btw already
 * split out per line item's snapshotted vatRatePercent. A native webhook
 * push to a specific bookkeeping package is the natural next step once a
 * salon asks for one; this covers "get my omzet out" for any of them today.
 */
export async function exportOrdersCsv(salonId: string, fromDateKey: string, toDateKey: string): Promise<string> {
  const rows = await db
    .select({
      orderId: orders.id,
      createdAt: orders.createdAt,
      customerName: orders.customerName,
      channel: orders.channel,
      paymentMethod: orders.paymentMethod,
      tipCents: orders.tipCents,
      unitPriceCents: orderItems.unitPriceCents,
      quantity: orderItems.quantity,
      vatRatePercent: orderItems.vatRatePercent,
    })
    .from(orders)
    .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
    .where(
      and(
        eq(orders.salonId, salonId),
        eq(orders.status, "paid"),
        gte(orders.createdAt, new Date(`${fromDateKey}T00:00:00Z`)),
        lte(orders.createdAt, new Date(`${toDateKey}T23:59:59Z`)),
      ),
    );

  interface OrderTotals {
    date: string;
    customerName: string;
    channel: string;
    paymentMethod: string;
    subtotalCents: number;
    vat9Cents: number;
    vat21Cents: number;
    tipCents: number;
  }
  const byOrder = new Map<string, OrderTotals>();

  for (const row of rows) {
    const lineTotal = row.unitPriceCents * row.quantity;
    const exclVat = Math.round(lineTotal / (1 + row.vatRatePercent / 100));
    const vatCents = lineTotal - exclVat;

    const existing = byOrder.get(row.orderId) ?? {
      date: amsterdamDateKey(row.createdAt),
      customerName: row.customerName,
      channel: row.channel,
      paymentMethod: row.paymentMethod ?? "-",
      subtotalCents: 0,
      vat9Cents: 0,
      vat21Cents: 0,
      tipCents: row.tipCents,
    };
    existing.subtotalCents += exclVat;
    if (row.vatRatePercent === 9) existing.vat9Cents += vatCents;
    else if (row.vatRatePercent === 21) existing.vat21Cents += vatCents;
    byOrder.set(row.orderId, existing);
  }

  const header = ["Datum", "Order", "Klant", "Kanaal", "Betaalmethode", "Omzet excl. btw", "Btw 9%", "Btw 21%", "Fooi", "Totaal"];
  const lines = [header.join(",")];
  for (const [orderId, o] of byOrder) {
    const totalCents = o.subtotalCents + o.vat9Cents + o.vat21Cents + o.tipCents;
    lines.push(
      [
        o.date,
        orderId,
        csvEscape(o.customerName),
        o.channel,
        o.paymentMethod,
        centsToEuro(o.subtotalCents),
        centsToEuro(o.vat9Cents),
        centsToEuro(o.vat21Cents),
        centsToEuro(o.tipCents),
        centsToEuro(totalCents),
      ].join(","),
    );
  }
  return lines.join("\n");
}
