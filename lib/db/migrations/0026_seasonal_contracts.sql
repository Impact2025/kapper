ALTER TABLE "service_contracts" ADD COLUMN IF NOT EXISTS "interval_weeks" integer;--> statement-breakpoint
ALTER TABLE "service_contracts" ADD COLUMN IF NOT EXISTS "season_start_month" integer;--> statement-breakpoint
ALTER TABLE "service_contracts" ADD COLUMN IF NOT EXISTS "season_end_month" integer;
