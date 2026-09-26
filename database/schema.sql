-- BOS-CP01-A schema candidate.
-- This file is a schema artifact, not yet a Supabase migration-history entry.

create extension if not exists pgcrypto;

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  source text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists contacts_email_unique
  on public.contacts (lower(email));

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts(id),
  service_code text not null,
  problem_summary text not null,
  budget_range text,
  deadline text,
  source text not null,
  status text not null default 'NEW',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint valid_lead_status check (
    status in ('NEW', 'QUALIFIED', 'CONTACTED', 'PROPOSAL', 'WON', 'LOST')
  )
);

create table if not exists public.lead_events (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id),
  event_type text not null,
  source text not null,
  request_id text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create table if not exists public.consents (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts(id),
  purpose text not null,
  granted boolean not null,
  source text not null,
  captured_at timestamptz not null default now()
);

create table if not exists public.idempotency_keys (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  idempotency_key text not null,
  response jsonb,
  created_at timestamptz not null default now(),
  unique (provider, idempotency_key)
);

create table if not exists public.provider_deliveries (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  operation text not null,
  entity_type text not null,
  entity_id uuid not null,
  provider_reference text,
  status text not null default 'PENDING',
  attempt_count integer not null default 0 check (attempt_count >= 0),
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint provider_delivery_status check (
    status in ('PENDING', 'SUCCESS', 'FAILED', 'RETRY_PENDING', 'DEAD')
  )
);

alter table public.contacts enable row level security;
alter table public.leads enable row level security;
alter table public.lead_events enable row level security;
alter table public.consents enable row level security;
alter table public.idempotency_keys enable row level security;
alter table public.provider_deliveries enable row level security;

-- No anon/authenticated policies are created in CP01-A.
-- Privileged writes are intended to come only from the server-side gateway.
