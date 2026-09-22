-- Fase 0: backfill the new `customers` table from the denormalized
-- customer fields already on appointments/orders, then link both tables to
-- it via customer_id. Idempotent — safe to run more than once.

-- One customer row per (salon_id, phone) seen on a confirmed booking. Name
-- comes from the most recent appointment for that phone number.
INSERT INTO "customers" ("salon_id", "name", "phone", "source", "created_at")
SELECT DISTINCT ON (a."salon_id", a."customer_phone")
  a."salon_id",
  a."customer_name",
  a."customer_phone",
  a."source",
  a."created_at"
FROM "appointments" a
WHERE a."customer_phone" IS NOT NULL AND a."customer_phone" != ''
ORDER BY a."salon_id", a."customer_phone", a."created_at" DESC
ON CONFLICT ("salon_id", "phone") DO NOTHING;

-- Orders can carry a customer_phone the appointments backfill above missed
-- (webshop-only customers who never booked a treatment).
INSERT INTO "customers" ("salon_id", "name", "phone", "email", "source", "created_at")
SELECT DISTINCT ON (o."salon_id", o."customer_phone")
  o."salon_id",
  o."customer_name",
  o."customer_phone",
  o."customer_email",
  'manual',
  o."created_at"
FROM "orders" o
WHERE o."customer_phone" IS NOT NULL AND o."customer_phone" != ''
ORDER BY o."salon_id", o."customer_phone", o."created_at" DESC
ON CONFLICT ("salon_id", "phone") DO NOTHING;

UPDATE "appointments" a
SET "customer_id" = c."id"
FROM "customers" c
WHERE a."customer_id" IS NULL
  AND a."customer_phone" IS NOT NULL
  AND c."salon_id" = a."salon_id"
  AND c."phone" = a."customer_phone";

UPDATE "orders" o
SET "customer_id" = c."id"
FROM "customers" c
WHERE o."customer_id" IS NULL
  AND o."customer_phone" IS NOT NULL
  AND c."salon_id" = o."salon_id"
  AND c."phone" = o."customer_phone";
