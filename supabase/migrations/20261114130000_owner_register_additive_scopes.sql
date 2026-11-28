-- Add scopes without replacing the approved legacy registration or its keys.
create table academy.owner_register_keys_v2 (
  subject text not null,
  academy_id uuid not null references academy.academies,
  event_id uuid not null references academy.publication_events,
  device_id uuid not null,
  namespace uuid not null unique,
  wrapped_key text not null check (wrapped_key ~ '^[A-Za-z0-9_-]{80}$'),
  primary key (subject, academy_id, event_id, device_id)
);
create index owner_register_keys_v2_academy on academy.owner_register_keys_v2(academy_id);
create index owner_register_keys_v2_event on academy.owner_register_keys_v2(event_id);
alter table academy.owner_register_keys_v2 enable row level security;
revoke all on academy.owner_register_keys_v2 from public, anon, authenticated;

create function public.x23_owner_register_key_v2(
  a uuid, ev uuid, device uuid, expected_subject text, act text, ns uuid, envelope text
) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s'
as $$
declare
  actor text;
  legacy academy.owner_register_keys;
  slot academy.owner_register_keys_v2;
  target academy.publication_events;
begin
  if a is null or ev is null or device is null or ns is null
    or act is null or act not in ('prepare','recover')
    or (act='prepare' and (envelope is null or envelope !~ '^[A-Za-z0-9_-]{80}$'))
    or (act='recover' and envelope is not null) then
    raise exception 'Invalid register key request' using errcode='22023';
  end if;
  if academy.verified_subject() is distinct from expected_subject then
    raise exception 'Access denied' using errcode='42501';
  end if;
  perform academy.t4_lock(a);
  actor := academy.m1_owner(a);
  if act='prepare' then
    target := academy.a10_target(a,ev);
    if target.roster_count>1000 then
      raise exception 'Register exceeds download bound' using errcode='22023';
    end if;
  end if;
  select * into legacy from academy.owner_register_keys k
    where k.subject=actor and k.academy_id=a and k.event_id=ev and k.device_id=device;
  select * into slot from academy.owner_register_keys_v2 k
    where k.subject=actor and k.academy_id=a and k.event_id=ev and k.device_id=device;
  if act='recover' then
    -- Explicit namespace selects the original even if an older client later
    -- registered a separate legacy envelope for the same tuple.
    if slot.namespace=ns then
      return jsonb_build_object('namespace',slot.namespace,'wrapped',slot.wrapped_key,
        'verified_at',floor(extract(epoch from clock_timestamp())*1000)::bigint);
    elsif legacy.namespace=ns then
      return jsonb_build_object('namespace',legacy.namespace,'wrapped',legacy.wrapped_key,
        'verified_at',floor(extract(epoch from clock_timestamp())*1000)::bigint);
    end if;
    raise exception 'Access denied' using errcode='42501';
  end if;
  if slot.namespace is not null then
    return jsonb_build_object('namespace',slot.namespace,'wrapped',slot.wrapped_key,
      'verified_at',floor(extract(epoch from clock_timestamp())*1000)::bigint);
  end if;
  if legacy.namespace is not null then
    return jsonb_build_object('namespace',legacy.namespace,'wrapped',legacy.wrapped_key,
      'verified_at',floor(extract(epoch from clock_timestamp())*1000)::bigint);
  end if;
  if exists(select 1 from academy.owner_register_keys where namespace=ns) then
    raise exception 'Invalid register namespace' using errcode='22023';
  end if;
  insert into academy.owner_register_keys_v2(subject,academy_id,event_id,device_id,namespace,wrapped_key)
    values(actor,a,ev,device,ns,envelope) returning * into slot;
  insert into academy.audit_events(actor,academy_id,action,operation_id,details)
    values(actor,a,'attendance.local_register_scope_prepared',slot.namespace,
      jsonb_build_object('event_id',ev,'device_id',device,'scope_version',2));
  return jsonb_build_object('namespace',slot.namespace,'wrapped',slot.wrapped_key,
    'verified_at',floor(extract(epoch from clock_timestamp())*1000)::bigint);
end
$$;
revoke all on function public.x23_owner_register_key_v2(uuid,uuid,uuid,text,text,uuid,text)
  from public,anon,authenticated;
grant execute on function public.x23_owner_register_key_v2(uuid,uuid,uuid,text,text,uuid,text)
  to authenticated;
do $$ begin
  if exists(select 1 from pg_roles where rolname='service_role') then
    revoke all on academy.owner_register_keys_v2 from service_role;
    revoke all on function public.x23_owner_register_key_v2(uuid,uuid,uuid,text,text,uuid,text) from service_role;
  end if;
end $$;

-- Both registries still require one exact current Owner/event/device/namespace.
create or replace function academy.x20_register_scope(a uuid,ev uuid,device uuid,ns uuid,expected_subject text)
returns void language plpgsql security invoker set search_path='' as $$
declare actor text:=academy.verified_subject();
begin
  if actor is distinct from expected_subject then
    raise exception 'Access denied' using errcode='42501';
  end if;
  perform academy.t4_lock(a);
  perform academy.m1_owner(a);
  perform 1 from academy.owner_register_keys k
    where k.subject=actor and k.academy_id=a and k.event_id=ev and k.device_id=device and k.namespace=ns
    for share;
  if found then return; end if;
  perform 1 from academy.owner_register_keys_v2 k
    where k.subject=actor and k.academy_id=a and k.event_id=ev and k.device_id=device and k.namespace=ns
    for share;
  if not found then raise exception 'Access denied' using errcode='42501'; end if;
end
$$;
do $$ declare definition text; begin
  select pg_get_functiondef('academy.verified_subject()'::regprocedure) into definition;
  if position('|x19_owner_register_key_v1' in definition)=0
    or position('|x23_owner_register_key_v2' in definition)>0 then
    raise exception 'Unexpected signed gateway definition';
  end if;
  execute replace(definition,'|x19_owner_register_key_v1',
    '|x23_owner_register_key_v2|x19_owner_register_key_v1');
end $$;
