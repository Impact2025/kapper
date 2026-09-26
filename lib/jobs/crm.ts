import "server-only";
import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { customers } from "@/lib/db/schema";
import { assets, customerAddresses, jobDocuments, serviceContracts } from "@/lib/db/schema-jobs";
import { findCustomerByPhone, upsertCustomerByPhone } from "@/lib/customers/queries";
import { listJobs } from "@/lib/jobs/queries";
import { normalizePostalCode, type CustomerType } from "@/lib/jobs/model";

/* ------------------------------ tenant guards ------------------------------ */
/** Ids from a form are untrusted: a crafted POST can carry another salon's
 * klant/adres/installatie. Every write that links to one checks ownership. */
async function customerInSalon(salonId: string, customerId: string) {
  const [c] = await db
    .select({ id: customers.id })
    .from(customers)
    .where(and(eq(customers.id, customerId), eq(customers.salonId, salonId)))
    .limit(1);
  return !!c;
}

/** The address id if it belongs to this salon's klant, else null. */
async function ownedAddressId(salonId: string, customerId: string, addressId: string | null | undefined) {
  if (!addressId) return null;
  const [a] = await db
    .select({ id: customerAddresses.id })
    .from(customerAddresses)
    .where(and(eq(customerAddresses.id, addressId), eq(customerAddresses.salonId, salonId), eq(customerAddresses.customerId, customerId)))
    .limit(1);
  return a?.id ?? null;
}

/** The asset id if it belongs to this salon's klant, else null. */
async function ownedAssetId(salonId: string, customerId: string, assetId: string | null | undefined) {
  if (!assetId) return null;
  const [a] = await db
    .select({ id: assets.id })
    .from(assets)
    .where(and(eq(assets.id, assetId), eq(assets.salonId, salonId), eq(assets.customerId, customerId)))
    .limit(1);
  return a?.id ?? null;
}

/* ------------------------------ customers ------------------------------ */
/** Klus-CRM customer search: naam, bedrijf, telefoon, e-mail én adres
 * (straat/postcode/plaats) — a plumber often only knows "die man op de
 * Zeestraat". */
export async function searchJobCustomers(salonId: string, query: string, limit = 60) {
  const q = query.trim();
  const base = db.select().from(customers);
  if (!q) {
    return base.where(eq(customers.salonId, salonId)).orderBy(desc(customers.updatedAt)).limit(limit);
  }
  const like = `%${q}%`;
  return base
    .where(
      and(
        eq(customers.salonId, salonId),
        or(
          ilike(customers.name, like),
          ilike(customers.companyName, like),
          ilike(customers.phone, like),
          ilike(customers.email, like),
          sql`exists (select 1 from ${customerAddresses} a where a.customer_id = ${customers.id} and (a.street ilike ${like} or a.postal_code ilike ${like} or a.city ilike ${like}))`,
        ),
      ),
    )
    .orderBy(desc(customers.updatedAt))
    .limit(limit);
}

export interface NewJobCustomer {
  salonId: string;
  name: string;
  phone: string;
  email?: string | null;
  companyName?: string | null;
  customerType?: CustomerType;
  notes?: string | null;
  source?: "ai_whatsapp" | "ai_phone" | "manual";
}

/** Find-or-create by phone, then fill the klus-CRM fields without
 * overwriting what the owner already entered. */
export async function upsertJobCustomer(input: NewJobCustomer) {
  const existing = await findCustomerByPhone(input.salonId, input.phone);
  const customer = await upsertCustomerByPhone({
    salonId: input.salonId,
    phone: input.phone,
    name: input.name,
    email: input.email ?? null,
    source: input.source ?? "manual",
  });
  const patch: Partial<typeof customers.$inferInsert> = {};
  if (input.companyName && !customer.companyName) patch.companyName = input.companyName;
  if (input.customerType && (!existing || customer.customerType === "private")) patch.customerType = input.customerType;
  if (input.notes && !customer.notes) patch.notes = input.notes;
  if (input.email && !customer.email) patch.email = input.email;
  if (Object.keys(patch).length) {
    const [updated] = await db.update(customers).set(patch).where(eq(customers.id, customer.id)).returning();
    return { customer: updated ?? customer, created: !existing };
  }
  return { customer, created: !existing };
}

export async function getCustomer360(salonId: string, customerId: string) {
  const [customer] = await db
    .select()
    .from(customers)
    .where(and(eq(customers.id, customerId), eq(customers.salonId, salonId)))
    .limit(1);
  if (!customer) return null;

  const [addresses, customerAssets, contracts, customerJobs, docs] = await Promise.all([
    db
      .select()
      .from(customerAddresses)
      .where(and(eq(customerAddresses.salonId, salonId), eq(customerAddresses.customerId, customerId)))
      .orderBy(asc(customerAddresses.createdAt)),
    db
      .select()
      .from(assets)
      .where(and(eq(assets.salonId, salonId), eq(assets.customerId, customerId)))
      .orderBy(asc(assets.createdAt)),
    db
      .select()
      .from(serviceContracts)
      .where(and(eq(serviceContracts.salonId, salonId), eq(serviceContracts.customerId, customerId)))
      .orderBy(asc(serviceContracts.nextDueAt)),
    listJobs(salonId, { customerId, limit: 100 }),
    db
      .select({
        id: jobDocuments.id,
        kind: jobDocuments.kind,
        number: jobDocuments.number,
        status: jobDocuments.status,
        totalCents: jobDocuments.totalCents,
        dueAt: jobDocuments.dueAt,
        jobId: jobDocuments.jobId,
        issuedAt: jobDocuments.issuedAt,
        createdAt: jobDocuments.createdAt,
      })
      .from(jobDocuments)
      .where(and(eq(jobDocuments.salonId, salonId), eq(jobDocuments.customerId, customerId)))
      .orderBy(desc(jobDocuments.createdAt)),
  ]);

  const invoices = docs.filter((d) => d.kind === "invoice");
  const lifetimePaidCents = invoices.filter((d) => d.status === "paid").reduce((s, d) => s + d.totalCents, 0);
  const openCents = invoices.filter((d) => d.status === "sent").reduce((s, d) => s + d.totalCents, 0);

  return {
    customer,
    addresses,
    assets: customerAssets,
    contracts,
    jobs: customerJobs,
    documents: docs,
    lifetimePaidCents,
    openCents,
  };
}

/* ------------------------------ addresses ------------------------------ */
export interface AddressInput {
  salonId: string;
  customerId: string;
  label?: string | null;
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  accessNotes?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
  isBilling?: boolean;
}

export async function createAddress(input: AddressInput) {
  const postalCode = normalizePostalCode(input.postalCode);
  if (!postalCode) return { error: "Ongeldige postcode (bijv. 1234 AB)." as const };
  if (!(await customerInSalon(input.salonId, input.customerId))) return { error: "Klant niet gevonden." as const };
  const [row] = await db
    .insert(customerAddresses)
    .values({
      salonId: input.salonId,
      customerId: input.customerId,
      label: input.label?.trim() || null,
      street: input.street.trim(),
      houseNumber: input.houseNumber.trim(),
      postalCode,
      city: input.city.trim(),
      accessNotes: input.accessNotes?.trim() || null,
      contactName: input.contactName?.trim() || null,
      contactPhone: input.contactPhone?.trim() || null,
      isBilling: input.isBilling ?? false,
    })
    .returning();
  return { ok: true as const, address: row! };
}

export async function deleteAddress(salonId: string, addressId: string) {
  await db
    .delete(customerAddresses)
    .where(and(eq(customerAddresses.id, addressId), eq(customerAddresses.salonId, salonId)));
}

export async function listAddressesForCustomer(salonId: string, customerId: string) {
  return db
    .select()
    .from(customerAddresses)
    .where(and(eq(customerAddresses.salonId, salonId), eq(customerAddresses.customerId, customerId)))
    .orderBy(asc(customerAddresses.createdAt));
}

/* ------------------------------ assets ------------------------------ */
export interface AssetInput {
  salonId: string;
  customerId: string;
  addressId?: string | null;
  kind: string;
  brand?: string | null;
  model?: string | null;
  serialNumber?: string | null;
  installedAt?: Date | null;
  warrantyUntil?: Date | null;
  lastServiceAt?: Date | null;
  nextServiceDue?: Date | null;
  notes?: string | null;
}

export async function createAsset(input: AssetInput) {
  if (!(await customerInSalon(input.salonId, input.customerId))) return { error: "Klant niet gevonden." as const };
  const addressId = await ownedAddressId(input.salonId, input.customerId, input.addressId);
  const [row] = await db
    .insert(assets)
    .values({
      salonId: input.salonId,
      customerId: input.customerId,
      addressId,
      kind: input.kind,
      brand: input.brand?.trim() || null,
      model: input.model?.trim() || null,
      serialNumber: input.serialNumber?.trim() || null,
      installedAt: input.installedAt ?? null,
      warrantyUntil: input.warrantyUntil ?? null,
      lastServiceAt: input.lastServiceAt ?? null,
      nextServiceDue: input.nextServiceDue ?? null,
      notes: input.notes?.trim() || null,
    })
    .returning();
  return { ok: true as const, asset: row! };
}

export async function deleteAsset(salonId: string, assetId: string) {
  await db.delete(assets).where(and(eq(assets.id, assetId), eq(assets.salonId, salonId)));
}

/** Installaties whose onderhoud is due within `days` (default 60), soonest first. */
export async function listAssetsDueForService(salonId: string, days = 60) {
  const until = new Date(Date.now() + days * 24 * 3600_000);
  return db
    .select({
      id: assets.id,
      kind: assets.kind,
      brand: assets.brand,
      model: assets.model,
      nextServiceDue: assets.nextServiceDue,
      lastServiceAt: assets.lastServiceAt,
      customerId: assets.customerId,
      customerName: customers.name,
      customerCompany: customers.companyName,
      addressId: assets.addressId,
    })
    .from(assets)
    .innerJoin(customers, eq(assets.customerId, customers.id))
    .where(and(eq(assets.salonId, salonId), eq(assets.active, true), sql`${assets.nextServiceDue} is not null and ${assets.nextServiceDue} < ${until}`))
    .orderBy(asc(assets.nextServiceDue));
}

/* ------------------------------ contracts ------------------------------ */
export interface ContractInput {
  salonId: string;
  customerId: string;
  addressId?: string | null;
  assetId?: string | null;
  name: string;
  jobCategory: string;
  priceCents: number;
  vatRatePercent: number;
  intervalMonths: number;
  /** First beurt is due on this date. */
  firstDueAt: Date;
  leadDays?: number;
  notes?: string | null;
}

export async function createContract(input: ContractInput) {
  if (!(await customerInSalon(input.salonId, input.customerId))) return { error: "Klant niet gevonden." as const };
  const [addressId, assetId] = await Promise.all([
    ownedAddressId(input.salonId, input.customerId, input.addressId),
    ownedAssetId(input.salonId, input.customerId, input.assetId),
  ]);
  const [row] = await db
    .insert(serviceContracts)
    .values({
      salonId: input.salonId,
      customerId: input.customerId,
      addressId,
      assetId,
      name: input.name.trim(),
      jobCategory: input.jobCategory,
      priceCents: input.priceCents,
      vatRatePercent: input.vatRatePercent,
      intervalMonths: input.intervalMonths,
      startsOn: input.firstDueAt,
      nextDueAt: input.firstDueAt,
      leadDays: input.leadDays ?? 30,
      notes: input.notes?.trim() || null,
    })
    .returning();
  if (assetId) {
    await db
      .update(assets)
      .set({ nextServiceDue: input.firstDueAt })
      .where(and(eq(assets.id, assetId), eq(assets.salonId, input.salonId)));
  }
  return { ok: true as const, contract: row! };
}

export async function setContractStatus(salonId: string, contractId: string, status: "active" | "paused" | "ended") {
  await db
    .update(serviceContracts)
    .set({ status })
    .where(and(eq(serviceContracts.id, contractId), eq(serviceContracts.salonId, salonId)));
}

export async function listContracts(salonId: string) {
  return db
    .select({
      id: serviceContracts.id,
      name: serviceContracts.name,
      status: serviceContracts.status,
      intervalMonths: serviceContracts.intervalMonths,
      nextDueAt: serviceContracts.nextDueAt,
      priceCents: serviceContracts.priceCents,
      vatRatePercent: serviceContracts.vatRatePercent,
      customerId: serviceContracts.customerId,
      customerName: customers.name,
      customerCompany: customers.companyName,
      assetId: serviceContracts.assetId,
      addressId: serviceContracts.addressId,
    })
    .from(serviceContracts)
    .innerJoin(customers, eq(serviceContracts.customerId, customers.id))
    .where(eq(serviceContracts.salonId, salonId))
    .orderBy(asc(serviceContracts.nextDueAt));
}
