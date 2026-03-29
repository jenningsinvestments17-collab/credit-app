create table if not exists disputes (
  id text primary key,
  lead_id text not null,
  bureau text not null,
  current_version_id text not null,
  workflow_status text not null,
  approved_at timestamptz,
  approved_by text,
  paid_at timestamptz,
  ready_to_send_at timestamptz,
  sent_to_provider_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists dispute_versions (
  id text primary key,
  dispute_id text not null references disputes(id) on delete cascade,
  version_number integer not null,
  kind text not null,
  letter_text text not null,
  summary text not null,
  findings_json jsonb not null default '[]'::jsonb,
  generated_by text not null,
  approved_at timestamptz,
  pdf_asset_path text,
  pdf_generated_at timestamptz,
  notes_json jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists mailing_jobs (
  id text primary key,
  dispute_id text not null references disputes(id) on delete cascade,
  lead_id text not null,
  bureau text not null,
  workflow_status text not null,
  provider_status text not null,
  queued_at timestamptz,
  sent_to_provider_at timestamptz,
  tracking_number text,
  proof_of_mailing_path text,
  delivery_status text not null,
  delivered_at timestamptz,
  failure_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists mailing_events (
  id text primary key,
  dispute_id text not null references disputes(id) on delete cascade,
  mailing_job_id text references mailing_jobs(id) on delete set null,
  event_type text not null,
  occurred_at timestamptz not null default now(),
  actor text not null,
  notes text,
  metadata_json jsonb not null default '{}'::jsonb
);

create table if not exists payment_records (
  id text primary key,
  dispute_id text not null references disputes(id) on delete cascade,
  lead_id text not null,
  amount_cents integer not null,
  currency text not null default 'usd',
  status text not null,
  stripe_payment_intent_id text,
  stripe_checkout_session_id text,
  requested_at timestamptz not null default now(),
  confirmed_at timestamptz,
  failed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_disputes_lead_id on disputes (lead_id);
create index if not exists idx_mailing_jobs_workflow_status on mailing_jobs (workflow_status);
create index if not exists idx_payment_records_status on payment_records (status);
