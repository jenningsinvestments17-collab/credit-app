DO $$ BEGIN
  CREATE TYPE "AnalyticsEventType" AS ENUM (
    'intake_started',
    'account_created',
    'documents_uploaded',
    'ai_generated',
    'dispute_approved',
    'payment_completed',
    'mail_sent'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "FunnelStage" AS ENUM (
    'account_created',
    'intake_started',
    'documents_uploaded',
    'ai_generated',
    'dispute_approved',
    'payment_completed',
    'mail_sent'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "funnel_stage" "FunnelStage",
  ADD COLUMN IF NOT EXISTS "funnel_updated_at" TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS "idx_users_funnel_stage" ON "users" ("funnel_stage");

CREATE TABLE IF NOT EXISTS "analytics_events" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "event_type" "AnalyticsEventType" NOT NULL,
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_analytics_events_user_created_at"
  ON "analytics_events" ("user_id", "created_at");

CREATE INDEX IF NOT EXISTS "idx_analytics_events_type_created_at"
  ON "analytics_events" ("event_type", "created_at");
