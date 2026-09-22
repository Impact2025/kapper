ALTER TYPE "public"."appointment_status" ADD VALUE 'pending_deposit' BEFORE 'pending_confirmation';--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "deposit_amount_cents" integer;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "stripe_deposit_session_id" text;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "deposit_paid_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "no_show_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "blocked_from_online_booking" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_stripe_deposit_session_id_unique" UNIQUE("stripe_deposit_session_id");