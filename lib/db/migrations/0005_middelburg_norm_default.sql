-- Split from 0004: a just-added enum value can't be referenced (e.g. as a
-- column DEFAULT) inside the same transaction that adds it in Postgres.

ALTER TABLE "appointments" ALTER COLUMN "status" SET DEFAULT 'pending_confirmation';
