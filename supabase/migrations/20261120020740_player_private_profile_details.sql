create table academy.player_private_details (
  player_id uuid primary key references academy.players,
  academy_id uuid not null references academy.academies,
  version integer not null check (version > 0),
  legacy_id text,
  address text,
  school_name text,
  national_id text,
  medical_notes text
);
alter table academy.player_private_details enable row level security;
revoke all on academy.player_private_details from public, anon, authenticated;
create unique index player_private_legacy_id on academy.player_private_details
  (academy_id, lower(legacy_id)) where legacy_id is not null;

create function public.i2_find_member_v1(a uuid, id_kind text, reference text) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s' as $$
declare s text := academy.i2_owner(a); player uuid;
  query text := regexp_replace(reference,'^[[:space:]]+|[[:space:]]+$','','g');
begin
  if query is null or length(query) not between 1 and 80 then
    raise exception 'Invalid member reference' using errcode='22023';
  end if;
  if id_kind='generated' and query ~ '^[1-9][0-9]{0,18}$' then
    if query::numeric > 9223372036854775807 then
      raise exception 'Invalid member number' using errcode='22023';
    end if;
    select id into player from academy.players
      where academy_id=a and academy_member_number=query::bigint;
  elsif id_kind='existing' then
    select d.player_id into player from academy.player_private_details d
      where d.academy_id=a and lower(d.legacy_id)=lower(query);
  else
    raise exception 'Invalid member reference' using errcode='22023';
  end if;
  return jsonb_build_object('player_id',player);
end $$;

create function public.i2_private_profile_v1(a uuid, player uuid, reveal_id boolean default false) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s' as $$
declare s text := academy.i2_owner(a); result jsonb;
begin
  select jsonb_build_object('version', coalesce(d.version,0), 'legacyId',d.legacy_id,
    'address',d.address, 'schoolName',d.school_name, 'medicalNotes',d.medical_notes,
    'nationalIdPresent', d.national_id is not null)
    || case when reveal_id is true then jsonb_build_object('nationalId',d.national_id) else '{}'::jsonb end
  into result
  from academy.players p left join academy.player_private_details d on d.player_id=p.id and d.academy_id=p.academy_id
  where p.id=player and p.academy_id=a;
  if result is null then raise exception 'Access denied' using errcode='42501'; end if;
  return result;
end $$;

create function public.i2_save_private_profile_v1(a uuid, player uuid, op uuid, expected_version integer, changes jsonb) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s' as $$
declare s text := academy.i2_owner(a); old academy.people_operations;
  d academy.player_private_details; changed jsonb := '{}'::jsonb; item record; value text;
  fingerprint text; result jsonb;
begin
  if op is null or expected_version is null or expected_version<0 or expected_version>=2147483647
    or jsonb_typeof(changes) is distinct from 'object' or changes='{}'::jsonb then
    raise exception 'Invalid profile changes' using errcode='22023';
  end if;
  for item in select * from jsonb_each(changes) loop
    if item.key not in ('legacyId','address','schoolName','nationalId','medicalNotes')
      or jsonb_typeof(item.value) not in ('string','null') then
      raise exception 'Invalid profile changes' using errcode='22023';
    end if;
    value := nullif(regexp_replace(item.value #>> '{}','^[[:space:]]+|[[:space:]]+$','','g'),'');
    if length(value) > (case item.key when 'legacyId' then 80 when 'nationalId' then 80
      when 'schoolName' then 160 when 'address' then 300 else 500 end) then
      raise exception 'Invalid profile changes' using errcode='22023';
    end if;
    changed := changed || jsonb_build_object(item.key,value);
  end loop;
  -- The digest covers the exact intent without retaining private field values in receipts.
  fingerprint := encode(extensions.digest(jsonb_build_array('private-profile-v1',a,player,expected_version,changed)::text,'sha256'),'hex');
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
  select * into d from academy.player_private_details where player_id=player and academy_id=a;
  if coalesce(d.version,0)<>expected_version then raise exception 'Profile changed' using errcode='23505'; end if;
  insert into academy.player_private_details as details
    (player_id,academy_id,version,legacy_id,address,school_name,national_id,medical_notes)
  values (player,a,expected_version+1,
    case when changed?'legacyId' then changed->>'legacyId' else d.legacy_id end,
    case when changed?'address' then changed->>'address' else d.address end,
    case when changed?'schoolName' then changed->>'schoolName' else d.school_name end,
    case when changed?'nationalId' then changed->>'nationalId' else d.national_id end,
    case when changed?'medicalNotes' then changed->>'medicalNotes' else d.medical_notes end)
  on conflict (player_id) do update set version=excluded.version,legacy_id=excluded.legacy_id,
    address=excluded.address,school_name=excluded.school_name,national_id=excluded.national_id,
    medical_notes=excluded.medical_notes;
  result := jsonb_build_object('player_id',player,'private_profile_version',expected_version+1);
  insert into academy.people_operations(actor,id,academy_id,fingerprint,result) values(s,op,a,fingerprint,result);
  insert into academy.audit_events(actor,academy_id,action,operation_id,details) values(s,a,'player.private_profile_edit',op,result);
  return result;
exception when unique_violation then
  raise exception 'Profile or reference conflict' using errcode='23505';
end $$;

revoke all on function public.i2_find_member_v1(uuid,text,text), public.i2_private_profile_v1(uuid,uuid,boolean),
  public.i2_save_private_profile_v1(uuid,uuid,uuid,integer,jsonb) from public, anon, authenticated;
grant execute on function public.i2_find_member_v1(uuid,text,text), public.i2_private_profile_v1(uuid,uuid,boolean),
  public.i2_save_private_profile_v1(uuid,uuid,uuid,integer,jsonb) to authenticated;

do $$
declare definition text := pg_get_functiondef('academy.verified_subject()'::regprocedure);
begin
  if position('|i2_register_v1|' in definition)=0 or position('|i2_private_profile_v1|' in definition)>0 then
    raise exception 'Unexpected People profile attestation boundary';
  end if;
  execute replace(definition,'|i2_register_v1|','|i2_find_member_v1|i2_private_profile_v1|i2_save_private_profile_v1|i2_register_v1|');
end $$;
