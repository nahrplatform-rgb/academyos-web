-- Hosted objects: only the trusted server may attest provider results. A pending
-- attempt is never permission to issue another provider write.
alter table academy.class_media_items add column provider_protocol boolean not null default false;
create table academy.class_media_variants (
  item_id uuid not null references academy.class_media_items(id) on delete cascade,
  variant text not null check (variant in ('main','thumbnail','part-0','part-1','part-2')),
  digest text not null check (digest ~ '^[0-9a-f]{64}$'),
  bytes bigint not null check (bytes > 0),
  attempt uuid not null,
  state text not null check (state in ('pending','ready','closed','removed')),
  primary key(item_id,variant)
);
alter table academy.class_media_variants enable row level security;
revoke all on academy.class_media_variants from public,anon,authenticated;

create function academy.x25_variant_gate() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
  if new.provider_protocol and old.state='reserved' and new.state='draft' then
    if (select count(*) from academy.class_media_variants v where v.item_id=new.id and v.variant in ('main','thumbnail') and v.state='ready') <> 2
       or exists(select 1 from academy.class_media_variants v where v.item_id=new.id and (v.state='pending' or (v.variant like 'part-%' and v.state='ready'))) then
      raise exception 'Hosted objects not ready' using errcode='55000';
    end if;
  end if;
  if new.provider_protocol and old.state='deleting' and new.state='deleted' and exists(
    select 1 from academy.class_media_variants v where v.item_id=new.id and v.state not in ('closed','removed')
  ) then raise exception 'Hosted objects not removed' using errcode='55000'; end if;
  return new;
end $$;
create trigger x25_variant_gate before update of state on academy.class_media_items
for each row execute function academy.x25_variant_gate();
revoke all on function academy.x25_variant_gate() from public,anon,authenticated;

create function public.x25_variant_v1(a uuid,e uuid,item uuid,phase text,variant text,digest text,bytes bigint,attempt uuid)
returns jsonb language plpgsql security definer set search_path='' set statement_timeout='8s' set lock_timeout='3s' as $$
declare s text; r text; media academy.class_media_items; v academy.class_media_variants; result jsonb; max_bytes bigint;
begin
  perform academy.t4_lock(a);
  s:=academy.verified_subject();
  if phase not in ('init','inspect','begin','complete','close','remove') then raise exception 'Invalid phase' using errcode='22023'; end if;
  r:=academy.x25_role(a,e,s,phase in ('init','begin'));
  select i.* into media from academy.class_media_items i where i.id=item and i.academy_id=a and i.event_id=e for update;
  if not found or (media.created_by<>s and r<>'owner') then raise exception 'Access denied' using errcode='42501'; end if;
  if phase in ('init','begin') and (media.created_by<>s or media.state<>'reserved' or media.expires_at<=academy.x25_now()) then
    raise exception 'Reservation unavailable' using errcode='55000';
  end if;
  if phase in ('init','inspect') then
    if variant is not null or digest is not null or bytes is not null or attempt is not null then raise exception 'Invalid arguments' using errcode='22023'; end if;
    if phase='init' then
      update academy.class_media_items i set provider_protocol=true where i.id=item;
      return jsonb_build_object('id',item,'provider',true);
    end if;
    select coalesce(jsonb_agg(jsonb_build_object('variant',stored.variant,'digest',stored.digest,'bytes',stored.bytes,
      'attempt',stored.attempt,'state',stored.state) order by stored.variant),'[]'::jsonb)
      into result from academy.class_media_variants stored where stored.item_id=item;
    return jsonb_build_object('id',item,'provider',media.provider_protocol,'variants',result);
  end if;
  if not media.provider_protocol or variant not in ('main','thumbnail','part-0','part-1','part-2') or variant is null
    or digest is null or digest !~ '^[0-9a-f]{64}$' or bytes is null or bytes<=0 or attempt is null then
    raise exception 'Invalid variant' using errcode='22023';
  end if;
  max_bytes:=case when variant='main' then 10000000 when variant='thumbnail' then 262144 else 4000000 end;
  if bytes>max_bytes then raise exception 'Variant too large' using errcode='22023'; end if;
  select x.* into v from academy.class_media_variants x where x.item_id=item and x.variant=x25_variant_v1.variant for update;
  if phase='begin' then
    if variant like 'part-%' and exists(select 1 from academy.class_media_variants x where x.item_id=item and x.variant='main' and x.state='ready') then
      if found and v.state='removed' and v.digest=digest and v.bytes=bytes then
        return jsonb_build_object('id',item,'variant',variant,'state',v.state,'attempt',v.attempt,'write',false);
      end if;
      raise exception 'Main already ready' using errcode='55000';
    end if;
    if not found then
      insert into academy.class_media_variants values(item,variant,digest,bytes,attempt,'pending') returning * into v;
      return jsonb_build_object('id',item,'variant',variant,'state',v.state,'attempt',v.attempt,'write',true);
    end if;
    if v.digest<>digest or v.bytes<>bytes then raise exception 'Variant conflict' using errcode='23505'; end if;
    if v.state='closed' then
      if v.attempt=attempt then raise exception 'Attempt already closed' using errcode='23505'; end if;
      update academy.class_media_variants x set attempt=x25_variant_v1.attempt,state='pending' where x.item_id=item and x.variant=x25_variant_v1.variant returning * into v;
      return jsonb_build_object('id',item,'variant',variant,'state',v.state,'attempt',v.attempt,'write',true);
    end if;
    if v.state='removed' then raise exception 'Variant removed' using errcode='55000'; end if;
    return jsonb_build_object('id',item,'variant',variant,'state',v.state,'attempt',v.attempt,'write',false);
  end if;
  if not found or v.digest<>digest or v.bytes<>bytes or v.attempt<>attempt then raise exception 'Attempt mismatch' using errcode='23505'; end if;
  if phase='complete' then
    if v.state='pending' then update academy.class_media_variants x set state='ready' where x.item_id=item and x.variant=x25_variant_v1.variant returning * into v;
    elsif v.state<>'ready' then raise exception 'Attempt not pending' using errcode='55000'; end if;
  elsif phase='close' then
    if v.state='pending' then update academy.class_media_variants x set state='closed' where x.item_id=item and x.variant=x25_variant_v1.variant returning * into v;
    elsif v.state<>'closed' then raise exception 'Attempt not pending' using errcode='55000'; end if;
  else
    if v.state='ready' then update academy.class_media_variants x set state='removed' where x.item_id=item and x.variant=x25_variant_v1.variant returning * into v;
    elsif v.state not in ('closed','removed') then raise exception 'Attempt unresolved' using errcode='55000'; end if;
  end if;
  return jsonb_build_object('id',item,'variant',variant,'state',v.state,'attempt',v.attempt);
end $$;
revoke all on function public.x25_variant_v1(uuid,uuid,uuid,text,text,text,bigint,uuid) from public,anon,authenticated;
grant execute on function public.x25_variant_v1(uuid,uuid,uuid,text,text,text,bigint,uuid) to authenticated;
do $$ declare definition text:=pg_get_functiondef('academy.verified_subject()'::regprocedure); begin
  if position('|x25_query_v1|' in definition)=0 then raise exception 'Gateway anchor missing'; end if;
  execute replace(definition,'|x25_query_v1|','|x25_variant_v1|x25_query_v1|');
end $$;
