-- Inactive EX-09 key boundary. Only application-wrapped key material reaches PostgreSQL.
create table academy.owner_register_keys (
  subject text not null,
  academy_id uuid not null references academy.academies,
  event_id uuid not null references academy.publication_events,
  device_id uuid not null,
  namespace uuid not null unique,
  wrapped_key text not null check (wrapped_key ~ '^[A-Za-z0-9_-]{80}$'),
  primary key (subject, academy_id)
);
alter table academy.owner_register_keys enable row level security;
revoke all on academy.owner_register_keys from public, anon, authenticated;

create function public.x19_owner_register_key_v1(
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
  if found then
    if slot.event_id <> ev or slot.device_id <> device or (act='recover' and slot.namespace <> ns) then
      raise exception 'Access denied' using errcode='42501';
    end if;
  elsif act='recover' then
    raise exception 'Access denied' using errcode='42501';
  end if;

  if act='prepare' then
    target := academy.a10_target(a, ev);
    if target.roster_count > 1000 then
      raise exception 'Register exceeds download bound' using errcode='22023';
    end if;
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
revoke all on function public.x19_owner_register_key_v1(uuid,uuid,uuid,text,text,uuid,text)
  from public, anon, authenticated;
do $$begin
  if to_regrole('service_role') is not null then
    execute 'revoke all on academy.owner_register_keys from service_role';
    execute 'revoke all on function public.x19_owner_register_key_v1(uuid,uuid,uuid,text,text,uuid,text) from service_role';
  end if;
end$$;
grant execute on function public.x19_owner_register_key_v1(uuid,uuid,uuid,text,text,uuid,text) to authenticated;

do $$
declare definition text;
begin
  select pg_get_functiondef('academy.verified_subject()'::regprocedure) into definition;
  if position('|x18_owner_register_dispatch_v1' in definition)=0
    or position('|x19_owner_register_key_v1' in definition)>0 then
    raise exception 'Unexpected signed gateway definition';
  end if;
  execute replace(definition, '|x18_owner_register_dispatch_v1',
    '|x19_owner_register_key_v1|x18_owner_register_dispatch_v1');
end
$$;
