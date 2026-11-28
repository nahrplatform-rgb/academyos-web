-- Gallery discovery uses the same current published event and class grant as object reads.
create function academy.x25_gallery(a uuid, s text, after_event uuid) returns jsonb
language plpgsql stable security invoker set search_path='' as $$
declare
  owner_access boolean;
  manager_membership uuid;
  items jsonb;
begin
  select exists(select 1 from academy.memberships m join academy.identities i on i.id=m.identity_id
    where m.academy_id=a and i.clerk_subject=s and m.status='active' and m.role='owner') into owner_access;
  if not owner_access then
    select m.id into manager_membership from academy.memberships m join academy.identities i on i.id=m.identity_id
      where m.academy_id=a and i.clerk_subject=s and m.status='active' and m.role='manager';
    if manager_membership is null or not exists(
      select 1 from academy.class_media_manager_grants g
      join academy.publication_heads h on h.academy_id=g.academy_id and h.event_id=g.event_id
      join academy.publication_events p on p.id=h.event_id and p.academy_id=h.academy_id
      where g.academy_id=a and g.membership_id=manager_membership and p.published
    ) then raise exception 'Access denied' using errcode='42501'; end if;
  end if;

  select coalesce(jsonb_agg(to_jsonb(c) order by c.id), '[]'::jsonb) into items
  from (
    select p.id, p.day, left(p.projection->>'name', 160) as title
    from academy.publication_heads h join academy.publication_events p on p.id=h.event_id
    where h.academy_id=a and p.academy_id=a and p.published
      and (after_event is null or p.id>after_event)
      and (owner_access or exists(select 1 from academy.class_media_manager_grants g
        where g.academy_id=a and g.event_id=p.id and g.membership_id=manager_membership))
    order by p.id limit 31
  ) c;
  return jsonb_build_object('role',case when owner_access then 'owner' else 'manager' end,
    'classes',items - 30, 'more',jsonb_array_length(items)>30);
end $$;
revoke all on function academy.x25_gallery(uuid,text,uuid) from public,anon,authenticated;

-- Keep the existing gateway, receipt fingerprints and state names for old clients.
-- New private saves keep the seven-day draft lifetime. Existing publications
-- keep their consent checks and expiry. Withdrawing either state fences both variants.
do $$
declare
  query_definition text := pg_get_functiondef('public.x25_query_v1(uuid,uuid,text,uuid)'::regprocedure);
  command_definition text := pg_get_functiondef('public.x25_command_v1(uuid,uuid,uuid,text,jsonb)'::regprocedure);
  query_anchor constant text := '  role_name:=academy.x25_role(a,e,s,mode not in';
  withdraw_anchor constant text := $match$item.state<>'published' then raise exception 'Not published'$match$;
begin
  if position(query_anchor in query_definition)=0 or position(withdraw_anchor in command_definition)=0 then
    raise exception 'Unexpected EX-25 routine definition';
  end if;
  execute replace(query_definition,query_anchor,
    '  if mode=''gallery'' then return academy.x25_gallery(a,s,target); end if;' || chr(10) || query_anchor);
  execute replace(command_definition,withdraw_anchor,
    $match$item.state not in ('draft','published') then raise exception 'Photo unavailable'$match$);
end $$;
