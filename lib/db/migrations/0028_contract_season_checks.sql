ALTER TABLE "service_contracts" DROP CONSTRAINT IF EXISTS "service_contracts_interval_weeks_chk";--> statement-breakpoint
ALTER TABLE "service_contracts" ADD CONSTRAINT "service_contracts_interval_weeks_chk" CHECK ("service_contracts"."interval_weeks" IS NULL OR "service_contracts"."interval_weeks" BETWEEN 1 AND 52);--> statement-breakpoint
ALTER TABLE "service_contracts" DROP CONSTRAINT IF EXISTS "service_contracts_season_chk";--> statement-breakpoint
ALTER TABLE "service_contracts" ADD CONSTRAINT "service_contracts_season_chk" CHECK (("service_contracts"."season_start_month" IS NULL AND "service_contracts"."season_end_month" IS NULL) OR ("service_contracts"."season_start_month" BETWEEN 1 AND 12 AND "service_contracts"."season_end_month" BETWEEN 1 AND 12));
