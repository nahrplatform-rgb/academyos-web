create table academy.player_private_photos (
  player_id uuid primary key references academy.players,
  version integer not null check (version > 0),
  image bytea check (octet_length(image) between 4 and 20000)
);
alter table academy.player_private_photos enable row level security;
revoke all on academy.player_private_photos from public, anon, authenticated;

create function public.i2_private_photo_v1(a uuid, player uuid) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s' as $$
declare s text := academy.i2_owner(a); result jsonb;
begin
  select jsonb_build_object('version',coalesce(photo.version,0),'image',encode(photo.image,'base64'))
    into result from academy.players p
    left join academy.player_private_photos photo on photo.player_id=p.id
    where p.id=player and p.academy_id=a;
  if result is null then raise exception 'Access denied' using errcode='42501'; end if;
  return result;
end $$;

create function public.i2_save_private_photo_v1(a uuid, player uuid, op uuid, expected_version integer, photo_base64 text) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s' as $$
declare s text := academy.i2_owner(a); old academy.people_operations;
  version_now integer; image_bytes bytea; fingerprint text; result jsonb;
begin
  if op is null or expected_version is null or expected_version<0 or expected_version>=2147483647
    or length(photo_base64)>26668 then
    raise exception 'Invalid photo' using errcode='22023';
  end if;
  if photo_base64 is not null then
    image_bytes := decode(photo_base64,'base64');
    if octet_length(image_bytes) not between 4 and 20000
      or substring(image_bytes for 3) <> decode('ffd8ff','hex') then
      raise exception 'Invalid photo' using errcode='22023';
    end if;
  end if;
  fingerprint := encode(extensions.digest(jsonb_build_array('private-photo-v1',a,player,expected_version,
    encode(extensions.digest(image_bytes,'sha256'),'hex'))::text,'sha256'),'hex');
  perform pg_advisory_xact_lock(hashtextextended('people-op:'||s||op::text,0));
  select * into old from academy.people_operations where actor=s and id=op;
  if found then
    if old.academy_id<>a or old.fingerprint is distinct from fingerprint then
      raise exception 'Operation conflict' using errcode='23505';
    end if;
    return old.result;
  end if;
  perform 1 from academy.players where id=player and academy_id=a for update;
  if not found then raise exception 'Access denied' using errcode='42501'; end if;
  select version into version_now from academy.player_private_photos where player_id=player;
  if coalesce(version_now,0)<>expected_version then raise exception 'Photo changed' using errcode='23505'; end if;
  insert into academy.player_private_photos(player_id,version,image)
    values(player,expected_version+1,image_bytes)
    on conflict(player_id) do update set version=excluded.version,image=excluded.image;
  result := jsonb_build_object('player_id', player, 'private_photo_version', expected_version+1);
  insert into academy.people_operations(actor,id,academy_id,fingerprint,result) values(s,op,a,fingerprint,result);
  insert into academy.audit_events(actor,academy_id,action,operation_id,details) values(s,a,'player.private_photo_edit',op,result);
  return result;
end $$;

revoke all on function public.i2_private_photo_v1(uuid,uuid),
  public.i2_save_private_photo_v1(uuid,uuid,uuid,integer,text) from public, anon, authenticated;
grant execute on function public.i2_private_photo_v1(uuid,uuid),
  public.i2_save_private_photo_v1(uuid,uuid,uuid,integer,text) to authenticated;

do $$
declare definition text := pg_get_functiondef('academy.verified_subject()'::regprocedure);
begin
  if position('|i2_private_profile_v1|' in definition)=0 or position('|i2_private_photo_v1|' in definition)>0 then
    raise exception 'Unexpected People photo attestation boundary';
  end if;
  execute replace(definition,'|i2_private_profile_v1|','|i2_private_photo_v1|i2_save_private_photo_v1|i2_private_profile_v1|');
end $$;
