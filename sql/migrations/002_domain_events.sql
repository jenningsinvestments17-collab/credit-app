create table if not exists domain_events (
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

create table if not exists event_processing_log (
  id text primary key,
  event_id text not null references domain_events(id) on delete cascade,
  handler_name text not null,
  status text not null,
  processed_at timestamptz not null default now(),
  notes text
);

create index if not exists idx_domain_events_type on domain_events (type);
create index if not exists idx_domain_events_aggregate on domain_events (aggregate_type, aggregate_id);
