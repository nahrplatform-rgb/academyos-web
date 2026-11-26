-- EX-30: Benefit migration system.
-- Explicit benefit migrations (not auto-inheritance) for plan version upgrades.
-- Each benefit increase is an explicit, recorded migration.

create table if not exists academy.platform_benefit_migrations (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references academy.academies,
  from_version integer not null,
  to_version integer not null,
  benefit text not null,
  migrated_at timestamptz not null default now(),
  migrated_by text not null,
  unique(academy_id, from_version, to_version, benefit)
);

create index if not exists platform_benefit_migrations_academy
  on academy.platform_benefit_migrations(academy_id, migrated_at desc);

-- Function to apply a benefit migration
create or replace function public.x30_apply_benefit_migration(
  p_academy_id uuid, p_from_version integer, p_to_version integer, p_benefit text
) returns uuid
language plpgsql security definer set search_path='' set statement_timeout='8s' set lock_timeout='3s' as $$
declare subject_id text; migration_id uuid;
begin
  subject_id := academy.m1_platform();
  migration_id := gen_random_uuid();
  insert into academy.platform_benefit_migrations(id,academy_id,from_version,to_version,benefit,migrated_by)
    values(migration_id,p_academy_id,p_from_version,p_to_version,p_benefit,subject_id)
    on conflict (academy_id,from_version,to_version,benefit) do nothing;
  return migration_id;
end $$;

-- Function to get benefit migrations for an academy
create or replace function public.x30_benefit_migrations(p_academy_id uuid) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='8s' set lock_timeout='3s' as $$
declare result jsonb;
begin
  if p_academy_id is null then raise exception 'Access denied' using errcode='42501'; end if;
  if exists(select 1 from academy.platform_grants g where g.subject=academy.verified_subject() and g.active) then
    perform academy.m1_platform();
  else
    perform academy.i2_owner(p_academy_id);
  end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',m.id,'fromVersion',m.from_version,'toVersion',m.to_version,
    'benefit',m.benefit,'migratedAt',m.migrated_at)), '[]'::jsonb)
    into result
    from academy.platform_benefit_migrations m where m.academy_id=p_academy_id;
  return result;
end $$;

-- Revoke/grant
do $$
declare entry record;
begin
  for entry in select n.nspname,f.oid::regprocedure as signature from pg_proc f
    join pg_namespace n on n.oid=f.pronamespace where n.nspname in ('public','academy') and f.proname in ('x30_apply_benefit_migration','x30_benefit_migrations')
  loop
    execute format('revoke all on function %s from public,anon,authenticated',entry.signature);
    if entry.nspname='public' then
      execute format('grant execute on function %s to authenticated',entry.signature);
    end if;
  end loop;
end $$;
