-- EX-30 Phase 1g follow-up: synthetic demo invitation delivery.
-- This is a local/provider-neutral boundary. It never sends email.

create table if not exists academy.platform_demo_deliveries (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null unique references academy.platform_demo_invitations,
  prospect_id uuid not null references academy.platform_demo_prospects,
  academy_id uuid not null references academy.academies,
  channel text not null default 'synthetic_email' check(channel = 'synthetic_email'),
  status text not null default 'queued' check(status in ('queued','sent','failed','lost','recovered')),
  attempts integer not null default 0 check(attempts >= 0),
  provider_message_id text,
  failure_code text,
  last_operation_id uuid,
  result jsonb,
  created_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists platform_demo_deliveries_status
  on academy.platform_demo_deliveries(status, updated_at);

create or replace function academy.x30_queue_demo_delivery() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  insert into academy.platform_demo_deliveries(invitation_id,prospect_id,academy_id,created_by)
  values(new.id,new.prospect_id,new.academy_id,new.created_by)
  on conflict (invitation_id) do nothing;
  return new;
end $$;

drop trigger if exists x30_queue_demo_delivery on academy.platform_demo_invitations;
create trigger x30_queue_demo_delivery after insert on academy.platform_demo_invitations
  for each row execute function academy.x30_queue_demo_delivery();

create or replace function public.x30_prepare_demo_delivery(p_invitation_id uuid) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='8s' set lock_timeout='3s' as $$
declare subject_id text; row academy.platform_demo_deliveries;
begin
  subject_id := academy.m1_platform();
  select * into row from academy.platform_demo_deliveries
    where invitation_id=p_invitation_id for update;
  if not found then raise exception 'Invitation delivery not found' using errcode='22023'; end if;
  if row.status in ('sent','recovered') then
    return jsonb_build_object('id',row.id,'invitationId',row.invitation_id,'status',row.status,
      'attempts',row.attempts,'channel',row.channel);
  end if;
  update academy.platform_demo_deliveries
    set status='queued', failure_code=null, updated_at=now()
    where id=row.id;
  return jsonb_build_object('id',row.id,'invitationId',row.invitation_id,'status','queued',
    'attempts',row.attempts,'channel',row.channel);
end $$;

create or replace function public.x30_set_demo_delivery(
  p_invitation_id uuid, p_status text, p_operation_id uuid,
  p_provider_message_id text default null, p_failure_code text default null
) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='8s' set lock_timeout='3s' as $$
declare subject_id text; row academy.platform_demo_deliveries; output jsonb;
begin
  subject_id := academy.m1_platform();
  if p_status not in ('sent','failed','lost','recovered') then
    raise exception 'Invalid delivery status' using errcode='22023';
  end if;
  select * into row from academy.platform_demo_deliveries
    where invitation_id=p_invitation_id for update;
  if not found then raise exception 'Invitation delivery not found' using errcode='22023'; end if;
  if row.last_operation_id = p_operation_id and row.result is not null then return row.result; end if;
  if p_status='recovered' and row.status <> 'lost' then
    raise exception 'Only a lost delivery can be recovered' using errcode='P0001';
  end if;
  if p_status='sent' and row.status in ('failed','lost') then
    raise exception 'A failed or lost delivery must be recovered' using errcode='P0001';
  end if;
  output := jsonb_build_object('id',row.id,'invitationId',row.invitation_id,'status',p_status,
    'attempts',row.attempts + case when p_status in ('sent','recovered') then 1 else 0 end,
    'channel',row.channel,'providerMessageId',p_provider_message_id);
  update academy.platform_demo_deliveries
    set status=p_status,
        attempts=attempts + case when p_status in ('sent','recovered') then 1 else 0 end,
        provider_message_id=coalesce(p_provider_message_id,provider_message_id),
        failure_code=p_failure_code,
        last_operation_id=p_operation_id,
        result=output,
        updated_at=now()
    where id=row.id;
  return output;
end $$;

do $$
declare entry record;
begin
  for entry in select n.nspname,f.oid::regprocedure as signature from pg_proc f
    join pg_namespace n on n.oid=f.pronamespace
    where n.nspname in ('public','academy') and f.proname in ('x30_prepare_demo_delivery','x30_set_demo_delivery')
  loop
    execute format('revoke all on function %s from public,anon,authenticated',entry.signature);
    if entry.nspname='public' then execute format('grant execute on function %s to authenticated',entry.signature); end if;
  end loop;
end $$;
