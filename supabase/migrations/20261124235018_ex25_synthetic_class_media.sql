-- EX-25 local synthetic class media. Objects stay in a separate private store.
-- A class is one current published occurrence. No media bytes or real consent are stored here.
create table academy.class_media_manager_grants (
  academy_id uuid not null references academy.academies(id),
  event_id uuid not null,
  membership_id uuid not null references academy.memberships(id),
  primary key (academy_id,event_id,membership_id),
  foreign key (event_id) references academy.publication_events(id)
);

create table academy.class_media_items (
  id uuid primary key,
  academy_id uuid not null references academy.academies(id),
  event_id uuid not null,
  created_by text not null,
  state text not null check (state in ('reserved','draft','published','withdrawn','deleting','deleted')),
  depiction_confirmed boolean not null default false,
  version integer not null default 1 check (version > 0),
  reserved_at timestamptz not null,
  expires_at timestamptz,
  deleted_at timestamptz,
  foreign key (event_id) references academy.publication_events(id),
  unique (id,academy_id,event_id)
);
create index class_media_scope on academy.class_media_items(academy_id,event_id,id);
create table academy.class_media_tags (
  item_id uuid not null references academy.class_media_items(id),
  player_id uuid not null references academy.players(id),
  primary key(item_id,player_id)
);
create table academy.class_media_consents (
  item_id uuid not null,
  player_id uuid not null,
  allowed boolean not null,
  recorded_by text not null,
  recorded_at timestamptz not null,
  primary key (item_id,player_id),
  foreign key (item_id,player_id) references academy.class_media_tags(item_id,player_id)
);
create table academy.class_media_operations (
  actor text not null,
  id uuid not null,
  action text not null,
  academy_id uuid not null references academy.academies,
  event_id uuid not null,
  item_id uuid not null,
  fingerprint text not null,
  result jsonb not null,
  created_at timestamptz not null,
  expires_at timestamptz not null,
  primary key(actor,id,action),
  foreign key (event_id) references academy.publication_events(id)
);
create table academy.class_media_audit (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references academy.academies,
  event_id uuid not null,
  item_id uuid not null,
  actor text not null,
  action text not null,
  operation_id uuid not null,
  created_at timestamptz not null,
  expires_at timestamptz not null,
  foreign key (event_id) references academy.publication_events(id)
);
do $$ declare t text; begin
  foreach t in array array['class_media_manager_grants','class_media_items','class_media_tags',
    'class_media_consents','class_media_operations','class_media_audit'] loop
    execute format('alter table academy.%I enable row level security',t);
    execute format('revoke all on academy.%I from public,anon,authenticated',t);
  end loop;
end $$;

-- Test fixtures may replace this clock in their own disposable database only.
create function academy.x25_now() returns timestamptz
language sql volatile security invoker set search_path='' as $$ select clock_timestamp() $$;

create function academy.x25_role(a uuid,e uuid,s text,require_current boolean default true) returns text
language plpgsql stable security invoker set search_path='' as $$
declare result text; current_class boolean;
begin
  select exists(select 1 from academy.publication_events p join academy.publication_heads h
    on h.event_id=p.id and h.academy_id=p.academy_id
    where p.id=e and p.academy_id=a and p.published) into current_class;
  if not exists (
    select 1 from academy.publication_events p
    where p.id=e and p.academy_id=a and
      (not require_current or (p.published and exists(
        select 1 from academy.publication_heads h where h.event_id=p.id and h.academy_id=p.academy_id
      )))
  ) then raise exception 'Class unavailable' using errcode='42501'; end if;
  select case when count(*)=0 then null when bool_or(m.role='owner') then 'owner' else 'manager' end into result
    from academy.memberships m join academy.identities i on i.id=m.identity_id
    where m.academy_id=a and i.clerk_subject=s and m.status='active'
      and (m.role='owner' or (current_class and m.role='manager' and exists(
        select 1 from academy.class_media_manager_grants g
        where g.academy_id=a and g.event_id=e and g.membership_id=m.id
      )));
  if result is null then raise exception 'Access denied' using errcode='42501'; end if;
  return result;
end $$;

create function academy.x25_complete_consent(item uuid) returns boolean
language sql stable security invoker set search_path='' as $$
  select exists(select 1 from academy.class_media_tags t where t.item_id=item)
    and not exists(
      select 1 from academy.class_media_tags t left join academy.class_media_consents c
        on c.item_id=t.item_id and c.player_id=t.player_id
      where t.item_id=item and c.allowed is distinct from true
    )
$$;

create function public.x25_query_v1(a uuid,e uuid,mode text,target uuid default null) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='8s' set lock_timeout='3s' as $$
declare s text; role_name text; item academy.class_media_items; answer jsonb; p academy.publication_events;
begin
  perform academy.t4_lock(a);
  s:=academy.verified_subject();
  role_name:=academy.x25_role(a,e,s,mode not in ('expired','recover'));
  select * into p from academy.publication_events where id=e and academy_id=a;
  if mode='context' then
    if target is not null then raise exception 'Invalid target' using errcode='22023'; end if;
    select jsonb_build_object(
      'role',role_name,'class',jsonb_build_object('id',e,'title',p.projection->>'name','program',p.program_id,'day',p.day),
      'players',case when role_name='owner' then coalesce((select jsonb_agg(jsonb_build_object('id',r.player_id,'name',r.name) order by r.player_id)
        from academy.publication_rosters r join academy.players x on x.id=r.player_id and x.academy_id=a
        where r.event_id=e),'[]'::jsonb) else '[]'::jsonb end,
      'items',coalesce((select jsonb_agg(jsonb_build_object(
        'id',i.id,'state',i.state,
        'depicted',case when role_name='owner' then coalesce((select jsonb_agg(t.player_id order by t.player_id) from academy.class_media_tags t where t.item_id=i.id),'[]'::jsonb) else '[]'::jsonb end,
        'consented',case when role_name='owner' then coalesce((select jsonb_agg(c.player_id order by c.player_id) from academy.class_media_consents c where c.item_id=i.id and c.allowed),'[]'::jsonb) else '[]'::jsonb end,
        'expires',i.expires_at) order by i.reserved_at,i.id)
        from academy.class_media_items i where i.academy_id=a and i.event_id=e
          and (i.state in ('draft','published') or (role_name='owner' and i.state in ('withdrawn','deleting')))
          and (i.expires_at is null or i.expires_at>academy.x25_now())
          and (i.state<>'published' or academy.x25_complete_consent(i.id))),'[]'::jsonb)
    ) into answer;
    return answer;
  elsif mode='expired' then
    if role_name<>'owner' or target is not null then raise exception 'Access denied' using errcode='42501'; end if;
    return coalesce((select jsonb_agg(to_jsonb(q) order by q.id) from (
      select i.id,i.state,(select o.id from academy.class_media_operations o
        where o.item_id=i.id and o.action='delete_start' order by o.created_at desc limit 1) operation
      from academy.class_media_items i
      where i.academy_id=a and i.event_id=e and i.state in ('reserved','draft','published','withdrawn','deleting')
        and (i.state='deleting' or i.expires_at<=academy.x25_now()) order by i.id limit 10
    ) q),'[]'::jsonb);
  elsif mode='recover' then
    if target is null then raise exception 'Invalid target' using errcode='22023'; end if;
    perform pg_advisory_xact_lock(hashtextextended('class-media-op:'||s||':'||target::text,0));
    select i.* into item from academy.class_media_items i
      where i.academy_id=a and i.event_id=e and
        ((i.id=target and i.created_by=s) or exists(
          select 1 from academy.class_media_operations o
          where o.actor=s and o.id=target and o.item_id=i.id and o.academy_id=a and o.event_id=e));
    if not found then return jsonb_build_object('missing',true); end if;
    return jsonb_build_object('id',item.id,'state',item.state);
  elsif mode in ('read','upload') then
    if target is null then raise exception 'Invalid target' using errcode='22023'; end if;
    select * into item from academy.class_media_items i where i.id=target and i.academy_id=a and i.event_id=e;
    if not found or item.expires_at<=academy.x25_now() or
       (mode='upload' and (item.state<>'reserved' or item.created_by<>s)) or
       (mode='read' and (item.state not in ('draft','published') or
         (item.state='published' and not academy.x25_complete_consent(item.id)))) then
      raise exception 'Access denied' using errcode='42501';
    end if;
    return jsonb_build_object('id',item.id,'state',item.state);
  end if;
  raise exception 'Invalid mode' using errcode='22023';
end $$;

create function public.x25_command_v1(a uuid,e uuid,op uuid,act text,payload jsonb) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='8s' set lock_timeout='3s' as $$
declare s text; role_name text; target uuid; player uuid; permitted boolean; previous academy.class_media_operations;
        item academy.class_media_items; fingerprint text; result jsonb; players uuid[];
begin
  perform academy.t4_lock(a);
  s:=academy.verified_subject();
  role_name:=academy.x25_role(a,e,s,act not in ('delete_start','delete_finish'));
  if op is null or act not in ('reserve','finalize','tag','consent','publish','withdraw','delete_start','delete_finish')
     or jsonb_typeof(payload)<>'object' then raise exception 'Invalid command' using errcode='22023'; end if;
  if act not in ('reserve','finalize') and role_name<>'owner' then raise exception 'Access denied' using errcode='42501'; end if;
  target:=case when act='reserve' then op else (payload->>'item')::uuid end;
  if target is null then raise exception 'Invalid target' using errcode='22023'; end if;
  perform pg_advisory_xact_lock(hashtextextended('class-media-op:'||s||':'||op::text,0));
  fingerprint:=encode(extensions.digest(jsonb_build_array(a,e,act,payload)::text,'sha256'),'hex');
  select * into previous from academy.class_media_operations where actor=s and id=op and action=act;
  if found then
    if previous.academy_id<>a or previous.event_id<>e or previous.fingerprint<>fingerprint then
      raise exception 'Original operation changed' using errcode='23505';
    end if;
    return previous.result;
  end if;
  if exists(select 1 from academy.class_media_operations o where o.actor=s and o.id=op and
    (o.academy_id<>a or o.event_id<>e or o.item_id<>target
     or (o.action<>act and not ((o.action='reserve' and act='finalize') or
       (o.action='delete_start' and act='delete_finish'))))) then
    raise exception 'Original operation changed' using errcode='23505';
  end if;
  if act='reserve' then
    if payload<>'{}'::jsonb then raise exception 'Invalid reservation' using errcode='22023'; end if;
    insert into academy.class_media_items(id,academy_id,event_id,created_by,state,reserved_at,expires_at)
      values(op,a,e,s,'reserved',academy.x25_now(),academy.x25_now()+interval '24 hours') returning * into item;
  else
    select * into item from academy.class_media_items where id=target and academy_id=a and event_id=e for update;
    if not found then raise exception 'Access denied' using errcode='42501'; end if;
    if act='finalize' then
      if payload-array['item']<>'{}'::jsonb or item.state<>'reserved' or item.created_by<>s or item.expires_at<=academy.x25_now() then
        raise exception 'Reservation unavailable' using errcode='PT409';
      end if;
      update academy.class_media_items set state='draft',expires_at=academy.x25_now()+interval '168 hours' where id=target returning * into item;
    elsif act='tag' then
      if payload-array['item','players','confirmed']<>'{}'::jsonb or payload->'confirmed'<>'true'::jsonb
         or jsonb_typeof(payload->'players')<>'array' or jsonb_array_length(payload->'players') not between 1 and 100
         or item.state not in ('draft','withdrawn') or item.expires_at<=academy.x25_now() then
        raise exception 'Invalid tags' using errcode='22023';
      end if;
      select array_agg(value::uuid) into players from jsonb_array_elements_text(payload->'players');
      if cardinality(players)<>(select count(distinct x) from unnest(players) x) or exists(
        select 1 from unnest(players) x where not exists(
          select 1 from academy.publication_rosters r join academy.players p on p.id=r.player_id and p.academy_id=a
          where r.event_id=e and r.player_id=x)) then raise exception 'Roster mismatch' using errcode='42501'; end if;
      delete from academy.class_media_consents where item_id=target;
      delete from academy.class_media_tags where item_id=target;
      insert into academy.class_media_tags select target,x from unnest(players) x;
      update academy.class_media_items set depiction_confirmed=true,version=version+1 where id=target returning * into item;
    elsif act='consent' then
      if payload-array['item','player','allowed']<>'{}'::jsonb or jsonb_typeof(payload->'allowed')<>'boolean'
         or item.state not in ('draft','published','withdrawn') or item.expires_at<=academy.x25_now() then
        raise exception 'Invalid consent' using errcode='22023';
      end if;
      player:=(payload->>'player')::uuid; permitted:=(payload->>'allowed')::boolean;
      if not exists(select 1 from academy.class_media_tags where item_id=target and player_id=player) then
        raise exception 'Player unavailable' using errcode='42501';
      end if;
      insert into academy.class_media_consents values(target,player,permitted,s,academy.x25_now())
        on conflict(item_id,player_id) do update set allowed=excluded.allowed,recorded_by=s,recorded_at=excluded.recorded_at;
      if not permitted and item.state='published' then
        update academy.class_media_items set state='withdrawn',version=version+1 where id=target returning * into item;
      end if;
    elsif act='publish' then
      if payload-array['item']<>'{}'::jsonb or item.state not in ('draft','withdrawn')
         or item.expires_at<=academy.x25_now() or not item.depiction_confirmed or not academy.x25_complete_consent(target) then
        raise exception 'Consent required' using errcode='PT412';
      end if;
      update academy.class_media_items set state='published',expires_at=academy.x25_now()+interval '720 hours',
        version=version+1 where id=target returning * into item;
    elsif act='withdraw' then
      if payload-array['item']<>'{}'::jsonb or item.state<>'published' then raise exception 'Not published' using errcode='PT409'; end if;
      update academy.class_media_items set state='withdrawn',version=version+1 where id=target returning * into item;
    elsif act='delete_start' then
      if payload-array['item']<>'{}'::jsonb or item.state='deleted' then raise exception 'Already deleted' using errcode='PT409'; end if;
      update academy.class_media_items set state='deleting',version=version+1 where id=target returning * into item;
    else
      if payload-array['item']<>'{}'::jsonb or item.state<>'deleting' or not exists(
        select 1 from academy.class_media_operations where actor=s and id=op and action='delete_start' and item_id=target) then
        raise exception 'Deletion unavailable' using errcode='PT409';
      end if;
      -- The caller invokes this only after both private variants are confirmed absent.
      delete from academy.class_media_consents where item_id=target;
      delete from academy.class_media_tags where item_id=target;
      update academy.class_media_items set state='deleted',deleted_at=academy.x25_now(),version=version+1 where id=target returning * into item;
    end if;
  end if;
  result:=jsonb_build_object('id',item.id,'state',item.state);
  insert into academy.class_media_operations values(s,op,act,a,e,item.id,fingerprint,result,academy.x25_now(),academy.x25_now()+interval '2160 hours');
  insert into academy.class_media_audit(academy_id,event_id,item_id,actor,action,operation_id,created_at,expires_at)
    values(a,e,item.id,s,act,op,academy.x25_now(),academy.x25_now()+interval '2160 hours');
  return result;
end $$;

-- Bounded, explicitly invoked synthetic retention maintenance. Preserve receipts
-- for an unfinished deletion so the same operation remains recoverable.
create function public.x25_purge_receipts_v1(a uuid,e uuid) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='8s' set lock_timeout='3s' as $$
declare s text; deleted_operations integer; deleted_audit integer; deleted_items integer; more boolean;
begin
  perform academy.t4_lock(a);
  s:=academy.verified_subject();
  if academy.x25_role(a,e,s,false)<>'owner' then raise exception 'Access denied' using errcode='42501'; end if;

  with expired as (
    select o.actor,o.id,o.action from academy.class_media_operations o
    where o.academy_id=a and o.event_id=e and o.expires_at<=academy.x25_now()
      and not exists (select 1 from academy.class_media_items i
        where i.id=o.item_id and i.state='deleting' and o.action='delete_start')
    order by o.expires_at,o.actor,o.id,o.action limit 10
  )
  delete from academy.class_media_operations o using expired x
    where o.actor=x.actor and o.id=x.id and o.action=x.action;
  get diagnostics deleted_operations=row_count;

  with expired as (
    select h.id from academy.class_media_audit h
    where h.academy_id=a and h.event_id=e and h.expires_at<=academy.x25_now()
    order by h.expires_at,h.id limit 10
  )
  delete from academy.class_media_audit h using expired x where h.id=x.id;
  get diagnostics deleted_audit=row_count;

  with expired as (
    select i.id from academy.class_media_items i
    where i.academy_id=a and i.event_id=e and i.state='deleted'
      and i.deleted_at+interval '2160 hours'<=academy.x25_now()
      and not exists(select 1 from academy.class_media_operations o where o.item_id=i.id)
      and not exists(select 1 from academy.class_media_audit h where h.item_id=i.id)
    order by i.deleted_at,i.id limit 10
  )
  delete from academy.class_media_items i using expired x where i.id=x.id;
  get diagnostics deleted_items=row_count;
  select exists(
    select 1 from academy.class_media_operations o
    where o.academy_id=a and o.event_id=e and o.expires_at<=academy.x25_now()
      and not exists(select 1 from academy.class_media_items i
        where i.id=o.item_id and i.state='deleting' and o.action='delete_start')
    union all
    select 1 from academy.class_media_audit h
    where h.academy_id=a and h.event_id=e and h.expires_at<=academy.x25_now()
    union all
    select 1 from academy.class_media_items i
    where i.academy_id=a and i.event_id=e and i.state='deleted'
      and i.deleted_at+interval '2160 hours'<=academy.x25_now()
      and not exists(select 1 from academy.class_media_operations o where o.item_id=i.id)
      and not exists(select 1 from academy.class_media_audit h where h.item_id=i.id)
  ) into more;
  return jsonb_build_object('operations',deleted_operations,'audit',deleted_audit,'items',deleted_items,'more',more);
end $$;

do $$ declare entry record; begin
  for entry in select n.nspname,f.oid::regprocedure signature from pg_proc f join pg_namespace n on n.oid=f.pronamespace
    where n.nspname in ('academy','public') and f.proname in ('x25_now','x25_role','x25_complete_consent','x25_query_v1','x25_command_v1','x25_purge_receipts_v1') loop
    execute format('revoke all on function %s from public,anon,authenticated',entry.signature);
    if entry.nspname='public' then execute format('grant execute on function %s to authenticated',entry.signature); end if;
  end loop;
end $$;
do $$ declare definition text:=pg_get_functiondef('academy.verified_subject()'::regprocedure); begin
  if strpos(definition,'|support_list_tickets_v1|')=0 then raise exception 'Missing EX-24 gateway anchor'; end if;
  execute replace(definition,'|support_list_tickets_v1|','|x25_query_v1|x25_command_v1|x25_purge_receipts_v1|support_list_tickets_v1|');
end $$;
