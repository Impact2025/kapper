ALTER TABLE "leads" ADD COLUMN "opt_out_token" text DEFAULT gen_random_uuid()::text NOT NULL;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "opted_out_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_opt_out_token_unique" UNIQUE("opt_out_token");