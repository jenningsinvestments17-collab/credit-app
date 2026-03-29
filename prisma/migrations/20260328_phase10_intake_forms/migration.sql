CREATE TABLE IF NOT EXISTS intake_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  current_step text NOT NULL DEFAULT 'profile',
  profile_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  disclosures_accepted_at timestamptz NULL,
  contracts_accepted_at timestamptz NULL,
  review_completed_at timestamptz NULL,
  last_saved_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_intake_forms_current_step_updated_at
  ON intake_forms(current_step, updated_at DESC);
