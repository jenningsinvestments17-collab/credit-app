CREATE TABLE "dispute_scores" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "dispute_version_id" TEXT,
  "lead_id" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "total_score" INTEGER NOT NULL,
  "high_severity_count" INTEGER NOT NULL,
  "critical_count" INTEGER NOT NULL,
  "classification" TEXT NOT NULL,
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "dispute_scores_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "escalation_flags" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "dispute_version_id" TEXT,
  "lead_id" TEXT NOT NULL,
  "tier" TEXT NOT NULL,
  "flag_type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "weight" INTEGER NOT NULL,
  "tone" TEXT NOT NULL,
  "include_statutes" BOOLEAN NOT NULL DEFAULT false,
  "claim_preservation" BOOLEAN NOT NULL DEFAULT false,
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "escalation_flags_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_dispute_scores_version_created_at"
  ON "dispute_scores"("dispute_version_id", "created_at");

CREATE INDEX "idx_dispute_scores_lead_created_at"
  ON "dispute_scores"("lead_id", "created_at");

CREATE INDEX "idx_dispute_scores_classification_created_at"
  ON "dispute_scores"("classification", "created_at");

CREATE INDEX "idx_escalation_flags_version_created_at"
  ON "escalation_flags"("dispute_version_id", "created_at");

CREATE INDEX "idx_escalation_flags_lead_created_at"
  ON "escalation_flags"("lead_id", "created_at");

CREATE INDEX "idx_escalation_flags_tier_created_at"
  ON "escalation_flags"("tier", "created_at");

CREATE INDEX "idx_escalation_flags_type_created_at"
  ON "escalation_flags"("flag_type", "created_at");
