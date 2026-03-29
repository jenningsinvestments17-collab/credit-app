create type lead_status as enum (
  'new_lead',
  'consultation_booked',
  'intake_started',
  'intake_completed',
  'needs_documents',
  'ready_for_review',
  'active_client'
);

create type client_account_status as enum ('invited', 'active', 'disabled');
create type booking_status as enum ('not_booked', 'booked', 'completed');
create type consultation_status as enum ('not_scheduled', 'scheduled', 'completed');
create type intake_status as enum ('not_started', 'in_progress', 'completed');
create type intake_step_key as enum (
  'basic_contact',
  'credit_goals',
  'report_readiness',
  'document_upload',
  'review_and_continue'
);
create type intake_step_status as enum ('not_started', 'in_progress', 'completed', 'blocked');
create type report_readiness_status as enum ('unknown', 'not_ready', 'partial', 'ready');
create type document_status as enum ('uploaded', 'processing', 'ready_for_review', 'approved', 'rejected');
create type dispute_status as enum (
  'draft_generated',
  'awaiting_admin_review',
  'approved',
  'final_pdf_generated',
  'awaiting_payment',
  'paid_ready_to_send',
  'sent_to_provider',
  'delivered',
  'failed'
);
create type mailing_status as enum (
  'awaiting_admin_approval',
  'approved_pending_pdf',
  'awaiting_payment',
  'payment_pending',
  'paid_ready_to_send',
  'queued_for_send',
  'sent_to_provider',
  'tracking_pending',
  'tracking_received',
  'delivered',
  'failed'
);
create type contract_status as enum (
  'not_sent',
  'sent',
  'awaiting_signature',
  'partially_signed',
  'signed',
  'voided'
);
create type bureau_type as enum ('Experian', 'Equifax', 'TransUnion');
create type dispute_version_kind as enum ('ai_draft', 'admin_approved', 'mailing_final');
create type defect_code as enum (
  'inaccurate_account_details',
  'duplicate_account_reporting',
  'outdated_derogatory_reporting',
  'balance_payment_inconsistency',
  'missing_dispute_notation',
  'mixed_file_indicator',
  'unverifiable_information'
);
create type mailing_provider_name as enum ('lob', 'click2mail');
create type mailing_provider_status as enum (
  'not_submitted',
  'queued',
  'submitted',
  'accepted',
  'tracking_received',
  'delivered',
  'failed'
);
create type mailing_delivery_status as enum ('pending', 'in_transit', 'delivered', 'returned', 'issue');
create type payment_status as enum ('awaiting_payment', 'payment_pending', 'paid', 'failed', 'refunded');
create type contract_signature_status as enum ('pending', 'signed', 'declined');
create type note_type as enum ('general', 'review', 'mailing', 'contract', 'document', 'ai_review');

create table leads (
  id text primary key,
  full_name text not null,
  email text not null unique,
  phone text,
  source text,
  lead_status lead_status not null default 'new_lead',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table client_accounts (
  id text primary key,
  lead_id text not null references leads(id) on delete cascade,
  email text not null unique,
  password_hash text,
  status client_account_status not null default 'invited',
  invited_at timestamptz,
  activated_at timestamptz,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table bookings (
  id text primary key,
  lead_id text not null references leads(id) on delete cascade,
  booking_status booking_status not null default 'not_booked',
  consultation_status consultation_status not null default 'not_scheduled',
  scheduled_for timestamptz,
  calendly_event_uri text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table intake_sessions (
  id text primary key,
  lead_id text not null references leads(id) on delete cascade,
  intake_status intake_status not null default 'not_started',
  current_step_key intake_step_key,
  resume_route text,
  report_readiness report_readiness_status not null default 'unknown',
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table intake_steps (
  id text primary key,
  intake_session_id text not null references intake_sessions(id) on delete cascade,
  step_key intake_step_key not null,
  step_order integer not null,
  status intake_step_status not null default 'not_started',
  completed_at timestamptz,
  payload_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (intake_session_id, step_key)
);

create table documents (
  id text primary key,
  lead_id text not null references leads(id) on delete cascade,
  intake_session_id text references intake_sessions(id) on delete set null,
  document_key text not null,
  status document_status not null default 'uploaded',
  storage_path text,
  mime_type text,
  original_filename text,
  uploaded_at timestamptz not null default now(),
  reviewed_at timestamptz,
  extracted_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table bureau_reports (
  id text primary key,
  document_id text not null references documents(id) on delete cascade,
  lead_id text not null references leads(id) on delete cascade,
  bureau bureau_type not null,
  parsed_text text,
  normalized_summary text,
  parse_status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table disputes (
  id text primary key,
  lead_id text not null references leads(id) on delete cascade,
  current_version_id text,
  bureau bureau_type not null,
  status dispute_status not null default 'draft_generated',
  mailing_status mailing_status not null default 'awaiting_admin_approval',
  approved_at timestamptz,
  approved_by text,
  ready_to_send_at timestamptz,
  sent_to_provider_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table dispute_versions (
  id text primary key,
  dispute_id text not null references disputes(id) on delete cascade,
  version_number integer not null,
  kind dispute_version_kind not null,
  letter_text text not null,
  summary text not null,
  generated_by text not null,
  approved_at timestamptz,
  pdf_asset_path text,
  pdf_generated_at timestamptz,
  notes_json jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (dispute_id, version_number)
);

alter table disputes
  add constraint fk_disputes_current_version
  foreign key (current_version_id) references dispute_versions(id) deferrable initially deferred;

create table dispute_findings (
  id text primary key,
  dispute_version_id text not null references dispute_versions(id) on delete cascade,
  bureau bureau_type not null,
  account_name text not null,
  account_last_4 text,
  defect_code defect_code not null,
  reason text not null,
  details_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table mailing_payments (
  id text primary key,
  dispute_id text not null references disputes(id) on delete cascade,
  lead_id text not null references leads(id) on delete cascade,
  amount_cents integer not null,
  currency text not null default 'usd',
  status payment_status not null default 'awaiting_payment',
  stripe_payment_intent_id text,
  stripe_checkout_session_id text,
  requested_at timestamptz not null default now(),
  confirmed_at timestamptz,
  failed_at timestamptz,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table mailing_jobs (
  id text primary key,
  dispute_id text not null references disputes(id) on delete cascade,
  lead_id text not null references leads(id) on delete cascade,
  bureau bureau_type not null,
  workflow_status mailing_status not null default 'awaiting_admin_approval',
  provider_status mailing_provider_status not null default 'not_submitted',
  provider_name mailing_provider_name,
  provider_job_id text,
  final_pdf_path text,
  recipient_name text,
  recipient_street_1 text,
  recipient_street_2 text,
  recipient_city text,
  recipient_state text,
  recipient_postal_code text,
  sender_name text,
  sender_street_1 text,
  sender_street_2 text,
  sender_city text,
  sender_state text,
  sender_postal_code text,
  queued_at timestamptz,
  sent_to_provider_at timestamptz,
  mailed_at timestamptz,
  tracking_number text,
  proof_of_mailing_path text,
  delivery_status mailing_delivery_status not null default 'pending',
  delivered_at timestamptz,
  failure_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table mailing_provider_records (
  id text primary key,
  mailing_job_id text not null references mailing_jobs(id) on delete cascade,
  provider_name mailing_provider_name not null,
  provider_job_id text,
  request_payload_json jsonb not null default '{}'::jsonb,
  response_payload_json jsonb not null default '{}'::jsonb,
  status mailing_provider_status not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table contracts (
  id text primary key,
  lead_id text not null references leads(id) on delete cascade,
  contract_key text not null,
  title text not null,
  version text not null,
  status contract_status not null default 'not_sent',
  storage_path text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table contract_signatures (
  id text primary key,
  contract_id text not null references contracts(id) on delete cascade,
  lead_id text not null references leads(id) on delete cascade,
  signer_name text not null,
  signer_email text not null,
  status contract_signature_status not null default 'pending',
  signed_at timestamptz,
  provider_envelope_id text,
  audit_payload_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table domain_events (
  id text primary key,
  type text not null,
  aggregate_type text not null,
  aggregate_id text not null,
  occurred_at timestamptz not null default now(),
  actor_type text not null,
  actor_id text not null,
  payload_json jsonb not null default '{}'::jsonb,
  metadata_json jsonb not null default '{}'::jsonb
);

create table event_processing_log (
  id text primary key,
  event_id text not null references domain_events(id) on delete cascade,
  handler_name text not null,
  status text not null,
  processed_at timestamptz not null default now(),
  notes text
);

create table admin_notes (
  id text primary key,
  lead_id text not null references leads(id) on delete cascade,
  admin_id text,
  note_type note_type not null default 'general',
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_leads_status on leads (lead_status);
create index idx_bookings_lead on bookings (lead_id);
create index idx_intake_sessions_lead on intake_sessions (lead_id);
create index idx_documents_lead on documents (lead_id);
create index idx_documents_key on documents (document_key);
create index idx_bureau_reports_lead_bureau on bureau_reports (lead_id, bureau);
create index idx_disputes_lead_status on disputes (lead_id, status);
create index idx_dispute_versions_dispute on dispute_versions (dispute_id);
create index idx_dispute_findings_version on dispute_findings (dispute_version_id);
create index idx_mailing_jobs_status on mailing_jobs (workflow_status);
create index idx_mailing_jobs_tracking on mailing_jobs (tracking_number);
create index idx_mailing_payments_status on mailing_payments (status);
create index idx_contracts_lead on contracts (lead_id);
create index idx_contract_signatures_contract on contract_signatures (contract_id);
create index idx_domain_events_type on domain_events (type);
create index idx_domain_events_aggregate on domain_events (aggregate_type, aggregate_id);
create index idx_admin_notes_lead on admin_notes (lead_id);
