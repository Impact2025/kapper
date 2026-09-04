-- Middelburg-norm: legally binding no-show bookings require explicit
-- customer confirmation before the appointment counts as confirmed.

ALTER TYPE "appointment_status" ADD VALUE IF NOT EXISTS 'pending_confirmation' BEFORE 'confirmed';

ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "policy_accepted_at" timestamp with time zone;
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "confirmation_channel" text; -- 'whatsapp_button' | 'sms_link' | 'voice_otp'
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "cancellation_deadline" timestamp with time zone;
