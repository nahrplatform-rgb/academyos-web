-- Approved connected Owner profile and archive/restore trial.
alter table academy.players add column archived_at timestamptz;
alter table academy.player_private_details
  add column date_of_birth date,
  add column primary_phone text,
  add column emergency_name text,
  add column emergency_phone text,
  add constraint player_private_emergency_pair check ((emergency_name is null) = (emergency_phone is null));

create index players_archived_cursor on academy.players(academy_id,id) where archived_at is not null;
create index date_rosters_player_commitments on academy.date_rosters(academy_id,player_id,program_id,local_date);
create index publication_rosters_player_commitments on academy.publication_rosters(player_id,event_id);

create or replace function public.i2_people_v1(a uuid, after_id uuid default null, query text default '') returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s' as $$
declare s text:=academy.i2_owner(a); q text:=academy.i2_normalize(query); items jsonb; ctx jsonb; more boolean;begin
 if q is null or length(q)>160 or length(q)=1 then raise exception 'Invalid search' using errcode='22023';end if;
 select jsonb_build_object('academy_id',a,'academy_name',x.name,'branch_id',b.id,'branch_name',b.name) into ctx
 from academy.academies x join academy.initial_setup z on z.academy_id=x.id join academy.branches b on b.id=z.branch_id where x.id=a;
 select coalesce(jsonb_agg(to_jsonb(r)),'[]') into items from (
 select p.id,p.display_name,p.branch_id,b.name branch_name,p.created_at from academy.players p join academy.branches b on b.id=p.branch_id
 where p.academy_id=a and p.archived_at is null and (after_id is null or p.id>after_id) and (q='' or starts_with(p.normalized_name,q)
   or starts_with(academy.i2_normalize(p.alternate_name),q)) order by p.id limit 26) r;
 more:=jsonb_array_length(items)>25;if more then items:=items-25;end if;
 return ctx||jsonb_build_object('items',items,'more',more);
end $$;

create function public.i2_archived_people_v1(a uuid, after_id uuid default null, query text default '') returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s' as $$
declare s text:=academy.i2_owner(a); q text:=academy.i2_normalize(query); items jsonb; ctx jsonb; more boolean;begin
 if q is null or length(q)>160 or length(q)=1 then raise exception 'Invalid search' using errcode='22023';end if;
 select jsonb_build_object('academy_id',a,'academy_name',x.name,'branch_id',b.id,'branch_name',b.name) into ctx
 from academy.academies x join academy.initial_setup z on z.academy_id=x.id join academy.branches b on b.id=z.branch_id where x.id=a;
 select coalesce(jsonb_agg(to_jsonb(r)),'[]') into items from (
 select p.id,p.display_name,p.branch_id,b.name branch_name,p.created_at from academy.players p join academy.branches b on b.id=p.branch_id
 where p.academy_id=a and p.archived_at is not null and (after_id is null or p.id>after_id) and (q='' or starts_with(p.normalized_name,q)
   or starts_with(academy.i2_normalize(p.alternate_name),q)) order by p.id limit 26) r;
 more:=jsonb_array_length(items)>25;if more then items:=items-25;end if;
 return ctx||jsonb_build_object('items',items,'more',more);
end $$;

create or replace function public.i2_profile_v1(a uuid, player uuid) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s' as $$
declare s text:=academy.i2_owner(a); r jsonb;begin
 select jsonb_build_object('id',p.id,'display_name',p.display_name,'branch_name',b.name,
   'contact_email',p.contact_email,'version',p.version,'created_at',p.created_at,
   'academy_member_number',p.academy_member_number::text,'archived',p.archived_at is not null)
  || case when p.alternate_name is null then '{}'::jsonb
     else jsonb_build_object('alternate_name',p.alternate_name) end into r
 from academy.players p join academy.branches b on b.id=p.branch_id where p.academy_id=a and p.id=player;
 if r is null then raise exception 'Access denied' using errcode='42501';end if;return r;
end $$;

create function public.i2_private_profile_v2(a uuid, player uuid, reveal_id boolean default false) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s' as $$
declare s text := academy.i2_owner(a); result jsonb;
begin
  select jsonb_build_object('version', coalesce(d.version,0), 'legacyId',d.legacy_id,
    'address',d.address, 'schoolName',d.school_name, 'medicalNotes',d.medical_notes,
    'nationalIdPresent', d.national_id is not null,
    'dateOfBirth',d.date_of_birth,'primaryPhone',d.primary_phone,
    'emergencyName',d.emergency_name,'emergencyPhone',d.emergency_phone)
    || case when reveal_id is true then jsonb_build_object('nationalId',d.national_id) else '{}'::jsonb end
  into result
  from academy.players p left join academy.player_private_details d on d.player_id=p.id and d.academy_id=p.academy_id
  where p.id=player and p.academy_id=a;
  if result is null then raise exception 'Access denied' using errcode='42501'; end if;
  return result;
end $$;

create function public.i2_save_private_profile_v2(a uuid, player uuid, op uuid, expected_version integer, changes jsonb) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s' as $$
declare s text := academy.i2_owner(a); old academy.people_operations;
  d academy.player_private_details; changed jsonb := '{}'::jsonb; item record; value text;
  fingerprint text; result jsonb; birth_date date; emergency_name text; emergency_phone text;
begin
  if op is null or expected_version is null or expected_version<0 or expected_version>=2147483647
    or jsonb_typeof(changes) is distinct from 'object' or changes='{}'::jsonb then
    raise exception 'Invalid profile changes' using errcode='22023';
  end if;
  for item in select * from jsonb_each(changes) loop
    if item.key not in ('legacyId','address','schoolName','nationalId','medicalNotes','dateOfBirth','primaryPhone','emergencyName','emergencyPhone')
      or jsonb_typeof(item.value) not in ('string','null') then
      raise exception 'Invalid profile changes' using errcode='22023';
    end if;
    value := nullif(regexp_replace(item.value #>> '{}','^[[:space:]]+|[[:space:]]+$','','g'),'');
    if length(value) > (case item.key when 'legacyId' then 80 when 'nationalId' then 80
      when 'schoolName' then 160 when 'address' then 300 when 'dateOfBirth' then 10
      when 'primaryPhone' then 40 when 'emergencyPhone' then 40 when 'emergencyName' then 160 else 500 end) then
      raise exception 'Invalid profile changes' using errcode='22023';
    end if;
    if value is not null and item.key in ('primaryPhone','emergencyPhone') then
      value := translate(value,'٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹','01234567890123456789');
      if value !~ '^\+?[0-9() .-]+$' or length(regexp_replace(value,'[^0-9]','','g')) not between 7 and 15 then
        raise exception 'Invalid contact phone' using errcode='22023';
      end if;
    end if;
    if value is not null and item.key='dateOfBirth' then
      if value !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' or not pg_input_is_valid(value,'date') then
        raise exception 'Invalid date of birth' using errcode='22023';
      end if;
      if value::date > (now() at time zone 'UTC')::date then
        raise exception 'Invalid date of birth' using errcode='22023';
      end if;
    end if;
    changed := changed || jsonb_build_object(item.key,value);
  end loop;
  -- The digest covers the exact intent without retaining private field values in receipts.
  fingerprint := encode(extensions.digest(jsonb_build_array('private-profile-v2',a,player,expected_version,changed)::text,'sha256'),'hex');
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
  birth_date := case when changed?'dateOfBirth' then (changed->>'dateOfBirth')::date else d.date_of_birth end;
  emergency_name := case when changed?'emergencyName' then changed->>'emergencyName' else d.emergency_name end;
  emergency_phone := case when changed?'emergencyPhone' then changed->>'emergencyPhone' else d.emergency_phone end;
  if (emergency_name is null) <> (emergency_phone is null) then
    raise exception 'Emergency contact requires both name and phone' using errcode='22023';
  end if;
  insert into academy.player_private_details as details
    (player_id,academy_id,version,legacy_id,address,school_name,national_id,medical_notes,date_of_birth,primary_phone,emergency_name,emergency_phone)
  values (player,a,expected_version+1,
    case when changed?'legacyId' then changed->>'legacyId' else d.legacy_id end,
    case when changed?'address' then changed->>'address' else d.address end,
    case when changed?'schoolName' then changed->>'schoolName' else d.school_name end,
    case when changed?'nationalId' then changed->>'nationalId' else d.national_id end,
    case when changed?'medicalNotes' then changed->>'medicalNotes' else d.medical_notes end,
    birth_date,case when changed?'primaryPhone' then changed->>'primaryPhone' else d.primary_phone end,
    emergency_name,emergency_phone)
  on conflict (player_id) do update set version=excluded.version,legacy_id=excluded.legacy_id,
    address=excluded.address,school_name=excluded.school_name,national_id=excluded.national_id,
    medical_notes=excluded.medical_notes,date_of_birth=excluded.date_of_birth,
    primary_phone=excluded.primary_phone,emergency_name=excluded.emergency_name,emergency_phone=excluded.emergency_phone;
  result := jsonb_build_object('player_id',player,'private_profile_version',expected_version+1);
  insert into academy.people_operations(actor,id,academy_id,fingerprint,result) values(s,op,a,fingerprint,result);
  insert into academy.audit_events(actor,academy_id,action,operation_id,details) values(s,a,'player.private_profile_edit',op,result);
  return result;
exception when unique_violation then
  raise exception 'Profile or reference conflict' using errcode='23505';
end $$;


-- Serialize archive with roster writers. The row lock also covers direct
-- inserts from planning and publication paths using the roster triggers below.
create function public.i2_set_player_archived_v1(a uuid, player uuid, op uuid, expected_version integer, archived boolean)
returns jsonb language plpgsql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s' as $$
declare actor_id text; target academy.players; original academy.people_operations;
  fingerprint text; result jsonb;
begin
  perform academy.t4_lock(a);
  actor_id := academy.i2_owner(a);
  if player is null or op is null or expected_version is null or expected_version not between 1 and 2147483646
     or archived is null then raise exception 'Invalid player change' using errcode='22023'; end if;
  fingerprint := encode(extensions.digest(jsonb_build_array('player archive',a,player,expected_version,archived)::text,'sha256'),'hex');
  perform pg_advisory_xact_lock(hashtextextended('people-op:'||actor_id||op::text,0));
  select * into original from academy.people_operations where actor=actor_id and id=op;
  if found then
    if original.academy_id<>a or original.fingerprint is distinct from fingerprint then
      raise exception 'Operation conflict' using errcode='23505';
    end if;
    return original.result;
  end if;
  select p.* into target from academy.players p where p.id=player and p.academy_id=a for update;
  if not found then raise exception 'Access denied' using errcode='42501'; end if;
  if target.version<>expected_version or (target.archived_at is not null)=archived then
    raise exception 'Player changed' using errcode='PT409';
  end if;
  if archived and (
    exists (select 1 from academy.date_rosters r join academy.training_dates d
      on d.program_id=r.program_id and d.local_date=r.local_date and d.academy_id=r.academy_id
      where r.academy_id=a and r.player_id=player and not d.canceled and d.ends_at>statement_timestamp())
    or exists (select 1 from academy.publication_rosters r join academy.publication_events e on e.id=r.event_id
      join academy.publication_heads h on h.event_id=e.id
      where e.academy_id=a and r.player_id=player and e.published and e.ends_at>statement_timestamp())
  ) then return jsonb_build_object('player_id',player,'commitments',true); end if;

  update academy.players p set archived_at=case when archived then statement_timestamp() end,
    version=expected_version+1 where p.id=player and p.academy_id=a;
  result := jsonb_build_object('player_id',player,'lifecycle_version',expected_version+1,'archived',archived);
  insert into academy.people_operations(actor,id,academy_id,fingerprint,result) values(actor_id,op,a,fingerprint,result);
  insert into academy.audit_events(actor,academy_id,action,operation_id,details)
    values(actor_id,a,case when archived then 'player.archive' else 'player.restore' end,op,result);
  return result;
end $$;

create function academy.require_active_roster_player() returns trigger
language plpgsql security invoker set search_path='' as $$
declare target_academy uuid;
begin
  if tg_table_name='publication_rosters' then
    select academy_id into target_academy from academy.publication_events where id=new.event_id;
  else
    target_academy := new.academy_id;
  end if;
  perform 1 from academy.players
    where id=new.player_id and academy_id=target_academy and archived_at is null for share;
  if not found then raise exception 'Player is unavailable for selection' using errcode='42501'; end if;
  return new;
end $$;
revoke all on function academy.require_active_roster_player() from public, anon, authenticated;
create trigger active_player_roster before insert or update of player_id,academy_id on academy.date_rosters
  for each row execute function academy.require_active_roster_player();
create trigger active_player_proposal before insert or update of player_id,academy_id on academy.program_plan_players
  for each row execute function academy.require_active_roster_player();
create trigger active_player_publication before insert or update of player_id,event_id on academy.publication_rosters
  for each row execute function academy.require_active_roster_player();

-- Only the active directory projection changes. Historical roster joins use players.
create or replace view academy.x21_people_rows with (security_invoker=true) as
  select p.academy_id,p.id,p.display_name,p.branch_id,b.name branch_name
  from academy.players p join academy.branches b on b.id=p.branch_id and b.academy_id=p.academy_id
  where p.archived_at is null;
drop trigger x21_update on academy.players;
create trigger x21_update after update on academy.players referencing old table as x21_old_rows new table as x21_new_rows
  for each statement execute function academy.x21_revise('people','academy_id','academy_id,id,display_name,branch_id,archived_at');

do $$
declare definition text := pg_get_functiondef('public.q6_candidates_v1(uuid,uuid,date,text,text,uuid)'::regprocedure);
begin
  if position('from academy.players x where x.academy_id=a and x.branch_id=' in definition)=0 then
    raise exception 'Unexpected planning player picker';
  end if;
  execute replace(definition,'from academy.players x where x.academy_id=a and x.branch_id=',
    'from academy.players x where x.academy_id=a and x.archived_at is null and x.branch_id=');
end $$;

revoke all on function public.i2_archived_people_v1(uuid,uuid,text), public.i2_private_profile_v2(uuid,uuid,boolean),
  public.i2_save_private_profile_v2(uuid,uuid,uuid,integer,jsonb), public.i2_set_player_archived_v1(uuid,uuid,uuid,integer,boolean)
  from public,anon,authenticated;
grant execute on function public.i2_archived_people_v1(uuid,uuid,text), public.i2_private_profile_v2(uuid,uuid,boolean),
  public.i2_save_private_profile_v2(uuid,uuid,uuid,integer,jsonb), public.i2_set_player_archived_v1(uuid,uuid,uuid,integer,boolean)
  to authenticated;

do $$
declare definition text := pg_get_functiondef('academy.verified_subject()'::regprocedure);
begin
  if position('|i2_register_v1|' in definition)=0 or position('|i2_archived_people_v1|' in definition)>0 then
    raise exception 'Unexpected player lifecycle attestation boundary';
  end if;
  execute replace(definition,'|i2_register_v1|',
    '|i2_archived_people_v1|i2_private_profile_v2|i2_save_private_profile_v2|i2_set_player_archived_v1|i2_register_v1|');
end $$;
