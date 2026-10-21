-- Foundation only. No client grants, membership provisioning or role policies yet.
create schema if not exists academy;
revoke all on schema academy from public, anon, authenticated;
create table academy.identities (
 id uuid primary key default gen_random_uuid(),
 clerk_subject text not null unique,
 created_at timestamptz not null default now()
);
create table academy.academies (
 id uuid primary key default gen_random_uuid(),
 name text not null check(length(trim(name)) > 0),
 created_at timestamptz not null default now()
);
create table academy.memberships (
 id uuid primary key default gen_random_uuid(),
 identity_id uuid not null references academy.identities(id),
 academy_id uuid not null references academy.academies(id),
 role text not null check(role in ('owner','manager','trainer','guardian','player')),
 status text not null default 'invited' check(status in ('invited','active','suspended','ended')),
 created_at timestamptz not null default now(),
 unique(identity_id,academy_id,role)
);
alter table academy.identities enable row level security;
alter table academy.academies enable row level security;
alter table academy.memberships enable row level security;
revoke all on all tables in schema academy from public, anon, authenticated;
-- Platform administration is intentionally not a tenant membership role.
-- No policies means deny by default. Later reviewed migrations grant explicit operations.
