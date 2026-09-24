import "server-only";
import { and, eq, isNull, lt, ne, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { customers, salons } from "@/lib/db/schema";
import { assets, customerAddresses, jobDocuments, serviceContracts } from "@/lib/db/schema-jobs";
import { getVerticalConfig } from "@/lib/verticals";
import { createJob } from "@/lib/jobs/lifecycle";
import { notifyCustomer } from "@/lib/jobs/notify";
import { brandFor, shell } from "@/lib/mail/templates";
import { captureError } from "@/lib/observability";
import { addDays, contractNeedsGeneration, formatAddressLine } from "@/lib/jobs/model";
import { jobCapabilities } from "@/lib/jobs/access";

const NL_DATE = new Intl.DateTimeFormat("nl-NL", { timeZone: "Europe/Amsterdam", day: "numeric", month: "long", year: "numeric" });

export interface ContractRunSummary {
  generated: number;
  notified: number;
  skipped: number;
}

/**
 * Daily: for every active onderhoudscontract whose next beurt is within its
 * lead window, create the klus (source "contract", linked to contract +
 * installatie) and tell the klant it's coming up. Idempotent per due date via
 * `lastGeneratedForDue`, so a re-run — or an overlapping cron — never creates
 * a second klus for the same beurt.
 */
export async function generateDueContractJobs(now: Date = new Date()): Promise<ContractRunSummary> {
  const candidates = await db
    .select()
    .from(serviceContracts)
    .where(and(eq(serviceContracts.status, "active"), lt(serviceContracts.nextDueAt, addDays(now, 130))))
    .limit(500);

  const summary: ContractRunSummary = { generated: 0, notified: 0, skipped: 0 };

  for (const contract of candidates) {
    if (!contractNeedsGeneration(contract, now)) {
      summary.skipped++;
      continue;
    }
    try {
      const [salon] = await db.select().from(salons).where(eq(salons.id, contract.salonId)).limit(1);
      if (!salon || salon.status === "canceled") {
        summary.skipped++;
        continue;
      }
      const pack = getVerticalConfig(salon.vertical);
      // Contracts are a Pro capability — a downgraded salon stops generating.
      if (!jobCapabilities(salon.plan, pack).contracts) {
        summary.skipped++;
        continue;
      }

      // Claim the beurt first (conditional update) so a concurrent run can't
      // double-generate; only the run that flips it proceeds.
      const claimed = await db
        .update(serviceContracts)
        .set({ lastGeneratedForDue: contract.nextDueAt })
        .where(
          and(
            eq(serviceContracts.id, contract.id),
            eq(serviceContracts.nextDueAt, contract.nextDueAt),
            eq(serviceContracts.status, "active"),
            or(isNull(serviceContracts.lastGeneratedForDue), ne(serviceContracts.lastGeneratedForDue, contract.nextDueAt)),
          ),
        )
        .returning({ id: serviceContracts.id });
      if (!claimed.length) {
        summary.skipped++;
        continue;
      }

      const [customer] = await db.select().from(customers).where(eq(customers.id, contract.customerId)).limit(1);
      const [asset] = contract.assetId ? await db.select().from(assets).where(eq(assets.id, contract.assetId)).limit(1) : [];
      const [address] = contract.addressId
        ? await db.select().from(customerAddresses).where(eq(customerAddresses.id, contract.addressId)).limit(1)
        : [];

      const assetKind = asset ? pack.assetKinds.find((k) => k.key === asset.kind) : null;
      const assetLabel = asset ? [assetKind?.label ?? "installatie", asset.brand].filter(Boolean).join(" ") : contract.name;
      const dueLabel = NL_DATE.format(contract.nextDueAt);

      await createJob({
        salonId: contract.salonId,
        pack,
        customerId: contract.customerId,
        addressId: contract.addressId,
        addressLine: address ? formatAddressLine(address) : null,
        assetId: contract.assetId,
        contractId: contract.id,
        title: `${contract.name} — ${dueLabel}`,
        description: `Onderhoudsbeurt volgens contract "${contract.name}" (elke ${contract.intervalMonths} maanden).`,
        category: contract.jobCategory,
        priority: "normal",
        source: "contract",
        createdMessage: `Automatisch aangemaakt vanuit contract "${contract.name}"`,
      });
      summary.generated++;

      if (customer) {
        const first = customer.name.split(" ")[0] || "";
        const text = pack.messages.maintenanceDue({ salonName: salon.name, firstName: first, assetLabel, dueDate: dueLabel });
        const html = shell(
          `Onderhoud ${assetLabel}`,
          `<p style="font-size:16px;line-height:1.6;margin:0 0 16px;">${text.replace(/</g, "&lt;")}</p>`,
          brandFor(salon.vertical),
        );
        const res = await notifyCustomer({
          salon,
          phone: customer.phone,
          email: customer.email,
          text,
          emailSubject: `Onderhoud ${assetLabel} — ${salon.name}`,
          emailHtml: html,
        });
        if (res.whatsapp || res.email) summary.notified++;
      }
    } catch (err) {
      captureError("jobs/contract-generate", err);
      summary.skipped++;
    }
  }
  return summary;
}

/** Sent quotes past their validity date become "expired". */
export async function expireOldQuotes(now: Date = new Date()): Promise<number> {
  const rows = await db
    .update(jobDocuments)
    .set({ status: "expired" })
    .where(and(eq(jobDocuments.kind, "quote"), eq(jobDocuments.status, "sent"), lt(jobDocuments.validUntil, now)))
    .returning({ id: jobDocuments.id });
  return rows.length;
}
