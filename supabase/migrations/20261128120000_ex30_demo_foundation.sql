-- EX-30 Phase 1g: Demo foundation.
-- Isolated fictional demos with secure invitation links.
-- No real child data, no real invitations, no real payments, no real outbound messages.

create table if not exists academy.platform_demo_prospects (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text,
  phone text,
  created_by text not null,
  created_at timestamptz not null default now()
);

create table if not exists academy.platform_demo_invitations (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references academy.platform_demo_prospects,
  academy_id uuid not null references academy.academies,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  used_by text,
  created_by text not null,
  created_at timestamptz not null default now(),
  check(expires_at > created_at)
);

create index if not exists platform_demo_invitations_token
  on academy.platform_demo_invitations(token_hash) where used_at is null;

create table if not exists academy.platform_demo_lifecycle (
  academy_id uuid primary key references academy.academies,
  account_type text not null default 'demo' check(account_type = 'demo'),
  seeded_at timestamptz not null default now(),
  last_active_at timestamptz not null default now(),
  held_at timestamptz,
  deleted_at timestamptz,
  converted_at timestamptz,
  converted_academy_id uuid references academy.academies
);

-- Demo account type on academies (for distinguishing demo from free)
alter table academy.academies
  add column if not exists account_type text not null default 'free'
    check(account_type in ('demo','free','paid'));
