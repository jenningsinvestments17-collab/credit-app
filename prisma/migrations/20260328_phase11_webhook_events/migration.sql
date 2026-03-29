CREATE TABLE "webhook_events" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "provider" TEXT NOT NULL,
  "event_id" TEXT UNIQUE,
  "event_type" TEXT NOT NULL,
  "dispute_id" TEXT,
  "lead_id" TEXT,
  "status" TEXT NOT NULL DEFAULT 'received',
  "signature_valid" BOOLEAN NOT NULL DEFAULT false,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "payload" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "error_message" TEXT,
  "received_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  "processed_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW()
);

CREATE INDEX "idx_webhook_events_provider_received_at"
  ON "webhook_events" ("provider", "received_at");

CREATE INDEX "idx_webhook_events_status_received_at"
  ON "webhook_events" ("status", "received_at");

CREATE INDEX "idx_webhook_events_dispute_received_at"
  ON "webhook_events" ("dispute_id", "received_at");
