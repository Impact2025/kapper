CREATE TYPE "public"."order_channel" AS ENUM('webshop', 'pos');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('cash', 'pin', 'card');--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "customer_email" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "treatment_id" uuid;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "vat_rate_percent" integer DEFAULT 21 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "channel" "order_channel" DEFAULT 'webshop' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_method" "payment_method";--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "tip_cents" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "vat_rate_percent" integer DEFAULT 21 NOT NULL;--> statement-breakpoint
ALTER TABLE "treatments" ADD COLUMN "vat_rate_percent" integer DEFAULT 9 NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_treatment_id_treatments_id_fk" FOREIGN KEY ("treatment_id") REFERENCES "public"."treatments"("id") ON DELETE set null ON UPDATE no action;