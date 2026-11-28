-- Preserve the one-event/device binding, current Owner authority and all keys.
-- A typed, key-free refusal distinguishes binding conflict from access denial.
-- CREATE OR REPLACE retains ownership and existing authenticated-only grants.
do $$
declare definition text;
begin
  select pg_get_functiondef('public.x19_owner_register_key_v1(uuid,uuid,uuid,text,text,uuid,text)'::regprocedure)
    into definition;
  if position('slot.event_id <> ev or slot.device_id <> device or (act=''recover'' and slot.namespace <> ns)' in definition)=0
    or position('actor := academy.m1_owner(a)' in definition)=0 then
    raise exception 'Unexpected register key definition';
  end if;
end
$$;

create or replace function public.x19_owner_register_key_v1(
  a uuid, ev uuid, device uuid, expected_subject text, act text, ns uuid, envelope text
) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s'
as $$
declare
  actor text;
  slot academy.owner_register_keys;
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
  select * into slot from academy.owner_register_keys k
    where k.subject=actor and k.academy_id=a;
  -- Validate the requested preparation target before reporting a binding state.
  -- A foreign/unpublished session remains a real authorization refusal.
  if act='prepare' then
    target := academy.a10_target(a, ev);
    if target.roster_count > 1000 then
      raise exception 'Register exceeds download bound' using errcode='22023';
    end if;
  end if;
  if slot.namespace is not null then
    if slot.event_id <> ev or slot.device_id <> device then
      return jsonb_build_object('error','register_binding_conflict');
    end if;
    if act='recover' and slot.namespace <> ns then
      raise exception 'Access denied' using errcode='42501';
    end if;
  elsif act='recover' then
    raise exception 'Access denied' using errcode='42501';
  end if;

  if act='prepare' then
    if slot.namespace is null then
      insert into academy.owner_register_keys(subject,academy_id,event_id,device_id,namespace,wrapped_key)
        values(actor,a,ev,device,ns,envelope) returning * into slot;
      insert into academy.audit_events(actor,academy_id,action,operation_id)
        values(actor,a,'attendance.local_register_prepared',slot.namespace);
    end if;
  end if;

  return jsonb_build_object('namespace',slot.namespace,'wrapped',slot.wrapped_key,
    'verified_at',floor(extract(epoch from clock_timestamp())*1000)::bigint);
end
$$;
