CREATE TABLE "mrr_snapshots" (
	"salon_id" uuid NOT NULL,
	"day" date NOT NULL,
	"mrr_cents" integer NOT NULL,
	"plan" "plan" NOT NULL,
	"status" "salon_status" NOT NULL,
	CONSTRAINT "mrr_snapshots_salon_id_day_pk" PRIMARY KEY("salon_id","day")
);
--> statement-breakpoint
CREATE TABLE "salon_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salon_id" uuid NOT NULL,
	"author_id" uuid,
	"author_name" text,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "mrr_snapshots" ADD CONSTRAINT "mrr_snapshots_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salon_notes" ADD CONSTRAINT "salon_notes_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salon_notes" ADD CONSTRAINT "salon_notes_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mrr_snapshots_day_idx" ON "mrr_snapshots" USING btree ("day");--> statement-breakpoint
CREATE INDEX "salon_notes_salon_idx" ON "salon_notes" USING btree ("salon_id","created_at");