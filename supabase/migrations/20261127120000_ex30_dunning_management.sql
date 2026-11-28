-- EX-30 Phase 1d: Dunning management and failed-payment recovery.
-- Adds dunning state tracking, retry schedule, and audit trail.
-- Does not change existing agreement, invoice, claim, or settlement rows.

-- Dunning state on subscriptions
alter table academy.platform_subscriptions
  add column if not exists dunning_state text not null default 'none'
    check(dunning_state in ('none','grace','read_only','retention','archived')),
  add column if not exists dunning_started_on date,
  add column if not exists retry_count integer not null default 0,
  add column if not exists last_retry_on date,
  add column if not exists next_retry_on date;

-- Dunning event log
create table if not exists academy.platform_dunning_events (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references academy.academies,
  subscription_id uuid not null references academy.platform_subscriptions,
  invoice_id uuid references academy.platform_invoices,
  event_type text not null check(event_type in (
    'payment_failed','retry_scheduled','retry_attempted','retry_succeeded',
    'grace_started','grace_ending','read_only_started','retention_started',
    'retention_ending','archived','recovered','chargeback_received',
    'chargeback_resolved','payment_method_updated')),
  event_day date not null,
  details jsonb not null default '{}',
  actor text not null,
  created_at timestamptz not null default now()
);

create index if not exists platform_dunning_events_academy_day
  on academy.platform_dunning_events(academy_id, event_day desc);

-- Dunning state transition function
create or replace function academy.x30_dunning_transition(a uuid, new_state text) returns void
language plpgsql volatile security invoker set search_path='' as $$
declare sub academy.platform_subscriptions;
begin
  select * into sub from academy.platform_subscriptions where academy_id=a for update;
  if not found then raise exception 'No subscription' using errcode='22023'; end if;
  if new_state not in ('none','grace','read_only','retention','archived') then
    raise exception 'Invalid dunning state' using errcode='22023';
  end if;
  update academy.platform_subscriptions
    set dunning_state = new_state,
        dunning_started_on = case when new_state='grace' and dunning_started_on is null then academy.x23_local_day(a) else dunning_started_on end
    where academy_id = a;
end $$;

-- Record dunning event
create or replace function academy.x30_dunning_event(a uuid, event_type text, details jsonb default '{}') returns uuid
language plpgsql volatile security invoker set search_path='' as $$
declare sub academy.platform_subscriptions; created uuid:=gen_random_uuid(); actor text;
begin
  select * into sub from academy.platform_subscriptions where academy_id=a;
  if not found then raise exception 'No subscription' using errcode='22023'; end if;
  actor := academy.verified_subject();
  insert into academy.platform_dunning_events(id,academy_id,subscription_id,event_type,event_day,details,actor)
    values(created,a,sub.id,event_type,academy.x23_local_day(a),details,actor);
  return created;
end $$;

-- Dunning state in context view
-- (extended by the migration that patches x23_context_v1)
do $migration$
declare definition text := pg_get_functiondef('public.x23_context_v1(uuid,text)'::regprocedure);
old_sub text := '''graceEnd'',sub.grace_end,''status'',academy.x23_state(a)';
begin
  if strpos(definition,old_sub)=0 then
    raise exception 'Unexpected context projection for dunning extension';
  end if;
  execute replace(definition,old_sub,
    '''graceEnd'',sub.grace_end,''status'',academy.x23_state(a),''dunningState'',sub.dunning_state,''dunningStarted'',sub.dunning_started_on,''retryCount'',sub.retry_count');
end
$migration$;

-- Revoke/grant
do $$
declare entry record;
begin
  for entry in select n.nspname,f.oid::regprocedure as signature from pg_proc f
    join pg_namespace n on n.oid=f.pronamespace where n.nspname in ('public','academy') and f.proname in ('x30_dunning_transition','x30_dunning_event')
  loop
    execute format('revoke all on function %s from public,anon,authenticated',entry.signature);
    if entry.nspname='public' then
      execute format('grant execute on function %s to authenticated',entry.signature);
    end if;
  end loop;
end $$;
