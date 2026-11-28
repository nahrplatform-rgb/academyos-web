-- Keep the approved one-event authority and canonical work in one transaction.
create function academy.x20_register_scope(a uuid,ev uuid,device uuid,ns uuid,expected_subject text)
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
  if not found then raise exception 'Access denied' using errcode='42501'; end if;
end
$$;

create function public.x20_register_download_v1(a uuid,ev uuid,act text,previous jsonb,expected text,after_id uuid,
  device uuid,ns uuid,expected_subject text)
returns jsonb language plpgsql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s' as $$
begin
  perform academy.x20_register_scope(a,ev,device,ns,expected_subject);
  begin
    return public.x17_register_download_v1(a,ev,act,previous,expected,after_id);
  exception when insufficient_privilege then
    return '{"error":"withdrawn"}'::jsonb;
  end;
end
$$;

create function public.x20_register_dispatch_v1(a uuid,ev uuid,marks jsonb,captured_at timestamptz,op uuid,
  device uuid,ns uuid,expected_subject text)
returns jsonb language plpgsql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s' as $$
begin
  perform academy.x20_register_scope(a,ev,device,ns,expected_subject);
  begin
    perform academy.a10_target(a,ev);
  exception when insufficient_privilege then
    return '{"error":"withdrawn"}'::jsonb;
  end;
  begin
    return public.a10_register_v1(a,ev,marks,captured_at,op);
  exception when insufficient_privilege then
    -- The registered Owner still has access. A player is no longer eligible.
    return '{"error":"conflict"}'::jsonb;
  end;
end
$$;

revoke all on function academy.x20_register_scope(uuid,uuid,uuid,uuid,text) from public,anon,authenticated;
revoke all on function public.x17_register_download_v1(uuid,uuid,text,jsonb,text,uuid),
  public.x18_owner_register_dispatch_v1(uuid,uuid,jsonb,timestamptz,uuid,text) from public,anon,authenticated;
revoke all on function public.x20_register_download_v1(uuid,uuid,text,jsonb,text,uuid,uuid,uuid,text),
  public.x20_register_dispatch_v1(uuid,uuid,jsonb,timestamptz,uuid,uuid,uuid,text) from public,anon,authenticated;
do $$begin
  if to_regrole('service_role') is not null then
    execute 'revoke all on function academy.x20_register_scope(uuid,uuid,uuid,uuid,text),
      public.x17_register_download_v1(uuid,uuid,text,jsonb,text,uuid),
      public.x18_owner_register_dispatch_v1(uuid,uuid,jsonb,timestamptz,uuid,text),
      public.x20_register_download_v1(uuid,uuid,text,jsonb,text,uuid,uuid,uuid,text),
      public.x20_register_dispatch_v1(uuid,uuid,jsonb,timestamptz,uuid,uuid,uuid,text) from service_role';
  end if;
end$$;
grant execute on function public.x20_register_download_v1(uuid,uuid,text,jsonb,text,uuid,uuid,uuid,text),
  public.x20_register_dispatch_v1(uuid,uuid,jsonb,timestamptz,uuid,uuid,uuid,text) to authenticated;

do $$
declare definition text;
begin
  select pg_get_functiondef('academy.verified_subject()'::regprocedure) into definition;
  if position('|x17_register_download_v1' in definition)=0
    or position('|x18_owner_register_dispatch_v1' in definition)=0
    or position('|x20_register_download_v1' in definition)>0 then
    raise exception 'Unexpected signed gateway definition';
  end if;
  execute replace(replace(definition,'|x17_register_download_v1','|x20_register_download_v1'),
    '|x18_owner_register_dispatch_v1','|x20_register_dispatch_v1');
end
$$;
