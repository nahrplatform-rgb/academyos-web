-- Inactive EX-03 entry. Keep current Owner and canonical attendance in one transaction.
create function public.x18_owner_register_dispatch_v1(
  a uuid, ev uuid, marks jsonb, captured_at timestamptz, op uuid, expected_subject text
) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s'
as $$
declare
  actor text;
begin
  actor := academy.verified_subject();
  if actor is distinct from expected_subject then
    raise exception 'Access denied' using errcode='42501';
  end if;
  perform academy.t4_lock(a);
  perform academy.m1_owner(a);
  return public.a10_register_v1(a, ev, marks, captured_at, op);
end
$$;

revoke all on function public.x18_owner_register_dispatch_v1(uuid,uuid,jsonb,timestamptz,uuid,text)
  from public, anon, authenticated;
grant execute on function public.x18_owner_register_dispatch_v1(uuid,uuid,jsonb,timestamptz,uuid,text)
  to authenticated;

-- Extend the exact signed POST allowlist while preserving the existing online target.
do $$
declare definition text;
begin
  select pg_get_functiondef('academy.verified_subject()'::regprocedure) into definition;
  if position('|a10_register_v1' in definition)=0
     or position('|x18_owner_register_dispatch_v1' in definition)>0 then
    raise exception 'Unexpected attendance gateway definition';
  end if;
  execute replace(definition, '|a10_register_v1', '|x18_owner_register_dispatch_v1|a10_register_v1');
end
$$;
