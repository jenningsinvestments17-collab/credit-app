CREATE TABLE IF NOT EXISTS defect_code_catalog (
  code text PRIMARY KEY,
  title text NOT NULL,
  category text NOT NULL,
  severity text NOT NULL,
  laws text[] NOT NULL,
  description text NOT NULL,
  consumer_harm text NOT NULL,
  dispute_goal text NOT NULL,
  suggested_tone text NOT NULL,
  strategy_level text NOT NULL,
  output_template_key text NOT NULL,
  escalation_ready boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dispute_defect_findings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_version_id text NULL,
  lead_id text NOT NULL,
  bureau text NOT NULL,
  account_key text NOT NULL,
  account_name text NOT NULL,
  account_last4 text NOT NULL,
  defect_code text NOT NULL,
  confidence decimal(5,2) NOT NULL,
  score integer NOT NULL,
  supporting_facts text[] NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dispute_defect_findings_version_created_at
ON dispute_defect_findings (dispute_version_id, created_at);

CREATE INDEX IF NOT EXISTS idx_dispute_defect_findings_lead_created_at
ON dispute_defect_findings (lead_id, created_at);

CREATE INDEX IF NOT EXISTS idx_dispute_defect_findings_code_created_at
ON dispute_defect_findings (defect_code, created_at);
