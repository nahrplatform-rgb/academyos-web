-- EX-30 Phase 1h: Multi-academy foundation.
-- One global identity can belong to multiple academies.
-- Roles remain academy-scoped. Each academy has its own subscription.

-- User-academy role mapping (many-to-many)
create table if not exists academy.user_academy_roles (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  academy_id uuid not null references academy.academies,
  role text not null check(role in ('owner','manager','coach','guardian')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(subject, academy_id)
);

create index if not exists user_academy_roles_subject
  on academy.user_academy_roles(subject) where active = true;
create index if not exists user_academy_roles_academy
  on academy.user_academy_roles(academy_id) where active = true;

-- Optional organization/chain field on academies
alter table academy.academies
  add column if not exists organization_id uuid;
