-- AI Receptionist tables: conversations, messages, appointments

CREATE TYPE "conversation_channel" AS ENUM ('whatsapp', 'phone');
CREATE TYPE "conversation_status" AS ENUM ('active', 'closed', 'transferred', 'escalated');
CREATE TYPE "message_role" AS ENUM ('user', 'assistant');
CREATE TYPE "appointment_status" AS ENUM ('confirmed', 'completed', 'no_show', 'cancelled');
CREATE TYPE "appointment_source" AS ENUM ('ai_whatsapp', 'ai_phone', 'manual');

CREATE TABLE "conversations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "salon_id" uuid NOT NULL REFERENCES "salons"("id") ON DELETE CASCADE,
  "channel" "conversation_channel" NOT NULL,
  "external_id" text,
  "phone_number" text,
  "customer_name" text,
  "status" "conversation_status" NOT NULL DEFAULT 'active',
  "started_at" timestamp with time zone NOT NULL DEFAULT now(),
  "closed_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE "messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "conversation_id" uuid NOT NULL REFERENCES "conversations"("id") ON DELETE CASCADE,
  "role" "message_role" NOT NULL,
  "content" text NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE "appointments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "salon_id" uuid NOT NULL REFERENCES "salons"("id") ON DELETE CASCADE,
  "conversation_id" uuid REFERENCES "conversations"("id") ON DELETE SET NULL,
  "external_id" text,
  "agenda_provider" text NOT NULL,
  "customer_name" text NOT NULL,
  "customer_phone" text NOT NULL,
  "service_type" text NOT NULL,
  "appointment_time" timestamp with time zone NOT NULL,
  "duration_minutes" integer NOT NULL DEFAULT 30,
  "status" "appointment_status" NOT NULL DEFAULT 'confirmed',
  "source" "appointment_source" NOT NULL,
  "reminder_sent_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX "appointments_salon_time_idx" ON "appointments" ("salon_id", "appointment_time");
CREATE INDEX "appointments_status_idx" ON "appointments" ("status");
