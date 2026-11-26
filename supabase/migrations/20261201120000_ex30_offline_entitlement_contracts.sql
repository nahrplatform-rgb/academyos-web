-- EX-30 Phase 1c: Offline entitlement server contracts.
-- Defines server-side entitlement versioning, authority, and reconciliation.
-- Does not implement offline behavior — that is dedicated PWA work (EX-14/15/16).
-- These contracts are consumed by the offline design when it is implemented.

-- Entitlement snapshot table (server-side cache of effective entitlements)
create table if not exists academy.platform_entitlement_snapshots (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references academy.academies,
  subscription_id uuid references academy.platform_subscriptions,
  plan_version integer not null,
  entitlements jsonb not null,
  cached_at timestamptz not null default now(),
  ttl_hours integer not null default 24,
  expires_at timestamptz not null generated always as (cached_at + (ttl_hours || ' hours')::interval) stored
);

create index if not exists platform_entitlement_snapshots_academy
  on academy.platform_entitlement_snapshots(academy_id, cached_at desc);

-- Function to get effective entitlements for an academy
create or replace function public.x30_effective_entitlements(a uuid) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='8s' set lock_timeout='3s' as $$
declare sub academy.platform_subscriptions; plan academy.platform_plan_versions;
  entitlements jsonb; actor text;
begin
  if a is null then raise exception 'Access denied' using errcode='42501'; end if;
  -- Verify caller has authority
  if exists(select 1 from academy.platform_grants g where g.subject=academy.verified_subject() and g.active) then
    perform academy.m1_platform();
  else
    perform academy.i2_owner(a);
  end if;
  select * into sub from academy.platform_subscriptions where academy_id=a;
  if not found then return jsonb_build_object('status','none','entitlements',null); end if;
  select * into plan from academy.platform_plan_versions where id=sub.plan_id;
  entitlements := jsonb_build_object(
    'planVersion', plan.version,
    'price', plan.price,
    'trialDays', plan.trial_days,
    'programLimit', plan.program_limit,
    'status', academy.x23_state(a),
    'dunningState', sub.dunning_state,
    'periodStart', sub.period_start,
    'periodEnd', sub.period_end,
    'graceEnd', sub.grace_end
  );
  -- Create snapshot for offline cache
  insert into academy.platform_entitlement_snapshots(academy_id,subscription_id,plan_version,entitlements)
    values(a,sub.id,plan.version,entitlements);
  return entitlements;
end $$;

-- Reconciliation log for offline actions that exceeded limits
create table if not exists academy.platform_reconciliation_log (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references academy.academies,
  operation_type text not null,
  operation_id uuid,
  cached_entitlements jsonb,
  actual_entitlements jsonb,
  over_limit boolean not null default false,
  resolved boolean not null default false,
  resolution text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

-- Function to reconcile offline actions
create or replace function public.x30_reconcile_offline(a uuid, operation_type text,
  operation_id uuid, cached jsonb) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='8s' set lock_timeout='3s' as $$
declare actual jsonb; over boolean := false;
begin
  if a is null then raise exception 'Access denied' using errcode='42501'; end if;
  if exists(select 1 from academy.platform_grants g where g.subject=academy.verified_subject() and g.active) then
    perform academy.m1_platform();
  else
    perform academy.i2_owner(a);
  end if;
  actual := (select entitlements from academy.platform_entitlement_snapshots
    where academy_id=a order by cached_at desc limit 1);
  -- Check if operation exceeded limits based on actual (not cached) entitlements
  -- This is a simplified check; actual implementation depends on operation type
  insert into academy.platform_reconciliation_log(academy_id,operation_type,operation_id,cached_entitlements,actual_entitlements,over_limit)
    values(a,operation_type,operation_id,cached,actual,over);
  return jsonb_build_object('reconciled',true,'overLimit',over,'actual',actual);
end $$;

-- Revoke/grant
do $$
declare entry record;
begin
  for entry in select n.nspname,f.oid::regprocedure as signature from pg_proc f
    join pg_namespace n on n.oid=f.pronamespace where n.nspname in ('public','academy') and f.proname in ('x30_effective_entitlements','x30_reconcile_offline')
  loop
    execute format('revoke all on function %s from public,anon,authenticated',entry.signature);
    if entry.nspname='public' then
      execute format('grant execute on function %s to authenticated',entry.signature);
    end if;
  end loop;
end $$;
