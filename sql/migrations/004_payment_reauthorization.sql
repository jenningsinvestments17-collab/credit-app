-- Extend mailing payment lifecycle for re-authorization and capture-safe service completion.

alter type payment_status add value if not exists 'payment_not_collected';
alter type payment_status add value if not exists 'authorized';
alter type payment_status add value if not exists 'authorization_expired';
alter type payment_status add value if not exists 'payment_required';
alter type payment_status add value if not exists 'payment_failed';
alter type payment_status add value if not exists 'ready_to_capture';
alter type payment_status add value if not exists 'captured';

alter table mailing_payments
  add column if not exists checkout_url text,
  add column if not exists update_payment_method_url text,
  add column if not exists payment_method_last_4 text,
  add column if not exists authorized_at timestamptz,
  add column if not exists authorization_expires_at timestamptz,
  add column if not exists captured_at timestamptz,
  add column if not exists retry_count integer not null default 0,
  add column if not exists last_retry_at timestamptz,
  add column if not exists last_failure_reason text,
  add column if not exists client_action_required boolean not null default false;
