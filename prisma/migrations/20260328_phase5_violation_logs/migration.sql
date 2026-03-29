CREATE TABLE IF NOT EXISTS violation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NULL REFERENCES users(id) ON DELETE SET NULL,
  lead_id text NOT NULL,
  dispute_id text NULL,
  dispute_version_id text NULL,
  bureau text NULL,
  violation_type text NOT NULL,
  law text NOT NULL,
  score integer NOT NULL,
  confidence decimal(5,2) NOT NULL,
  strategy text NOT NULL,
  result_version integer NOT NULL DEFAULT 1,
  account_key text NOT NULL,
  account_name text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_violation_logs_lead_created_at
ON violation_logs (lead_id, created_at);

CREATE INDEX IF NOT EXISTS idx_violation_logs_dispute_created_at
ON violation_logs (dispute_id, created_at);

CREATE INDEX IF NOT EXISTS idx_violation_logs_type_created_at
ON violation_logs (violation_type, created_at);
