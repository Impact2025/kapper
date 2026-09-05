-- Intelligent Double-Booking (Pro): optional phase minutes for treatments
-- with a processing/inwerktijd window (e.g. hair color) where the stylist
-- is free for another client. durationMinutes stays the total/fallback
-- duration for treatments without a phase breakdown.

ALTER TABLE "treatments" ADD COLUMN IF NOT EXISTS "application_minutes" integer;
ALTER TABLE "treatments" ADD COLUMN IF NOT EXISTS "processing_minutes" integer;
ALTER TABLE "treatments" ADD COLUMN IF NOT EXISTS "finishing_minutes" integer;
