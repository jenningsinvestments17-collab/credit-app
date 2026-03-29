CREATE TABLE "escalation_history" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "dispute_id" TEXT NOT NULL,
  "dispute_version_id" TEXT,
  "lead_id" TEXT NOT NULL,
  "from_stage" TEXT,
  "to_stage" TEXT NOT NULL,
  "actor_type" TEXT NOT NULL,
  "actor_id" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "override_applied" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "escalation_history_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "claim_packets" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "dispute_id" TEXT NOT NULL,
  "dispute_version_id" TEXT,
  "lead_id" TEXT NOT NULL,
  "stage" TEXT NOT NULL,
  "case_summary" TEXT NOT NULL,
  "violation_summary" TEXT NOT NULL,
  "timeline" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "evidence_list" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "neutral_legal_mapping" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "requested_outcome" TEXT NOT NULL,
  "escalation_letter" TEXT NOT NULL,
  "claim_packet_text" TEXT NOT NULL,
  "claim_packet_pdf_path" TEXT,
  "export_bundle_path" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "claim_packets_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_escalation_history_dispute_created_at"
  ON "escalation_history"("dispute_id", "created_at");

CREATE INDEX "idx_escalation_history_lead_created_at"
  ON "escalation_history"("lead_id", "created_at");

CREATE INDEX "idx_escalation_history_stage_created_at"
  ON "escalation_history"("to_stage", "created_at");

CREATE INDEX "idx_claim_packets_dispute_created_at"
  ON "claim_packets"("dispute_id", "created_at");

CREATE INDEX "idx_claim_packets_lead_created_at"
  ON "claim_packets"("lead_id", "created_at");

CREATE INDEX "idx_claim_packets_stage_created_at"
  ON "claim_packets"("stage", "created_at");
