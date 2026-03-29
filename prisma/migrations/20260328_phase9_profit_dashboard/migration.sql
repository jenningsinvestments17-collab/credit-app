CREATE TYPE "DashboardPaymentStatus" AS ENUM (
  'payment_required',
  'authorized',
  'authorization_expired',
  'payment_failed',
  'captured'
);

CREATE TABLE "dashboard_payments" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID,
  "lead_id" TEXT NOT NULL,
  "dispute_id" TEXT NOT NULL,
  "amount_cents" INTEGER NOT NULL,
  "currency" TEXT NOT NULL,
  "status" "DashboardPaymentStatus" NOT NULL,
  "requested_at" TIMESTAMPTZ(6) NOT NULL,
  "authorized_at" TIMESTAMPTZ(6),
  "captured_at" TIMESTAMPTZ(6),
  "service_rendered_at" TIMESTAMPTZ(6),
  "last_failure_reason" TEXT,
  "checkout_session_id" TEXT,
  "payment_intent_id" TEXT,
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "dashboard_payments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "dashboard_payments_dispute_id_key"
  ON "dashboard_payments"("dispute_id");

CREATE INDEX "idx_dashboard_payments_status_requested_at"
  ON "dashboard_payments"("status", "requested_at");

CREATE INDEX "idx_dashboard_payments_captured_at"
  ON "dashboard_payments"("captured_at");

CREATE INDEX "idx_dashboard_payments_user_status"
  ON "dashboard_payments"("user_id", "status");

ALTER TABLE "dashboard_payments"
  ADD CONSTRAINT "dashboard_payments_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
