-- Connected synthetic-trial correction of an existing Owner-selected player.
alter table academy.players drop constraint players_version_check;
alter table academy.players add constraint players_version_check check (version > 0);

-- Revisions stay monotonic after the last player leaves a name. A nonzero
-- revision checks freshness, while actual matching players determine confirmation.
do $$
declare definition text := pg_get_functiondef('academy.i2_register_player(uuid,uuid,uuid,text,text,bigint,boolean,text)'::regprocedure);
begin
 if position('(rev>0 and not different_person)' in definition)=0 then
  raise exception 'Unexpected Player registration duplicate review';
 end if;
 execute replace(definition,'(rev>0 and not different_person)',
   '(not different_person and exists (select 1 from academy.players where academy_id=a and normalized_name=n))');
end $$;

create function public.i2_correct_player_names_v1(
 a uuid, player uuid, op uuid, expected_version integer, display_name text,
 alternate_name text, reviewed_revision bigint, different_person boolean
) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s' as $$
declare
 actor_id text := academy.i2_owner(a);
 normalized text := academy.i2_normalize(display_name);
 display_value text := trim(regexp_replace(display_name,'[[:space:]]+',' ','g'));
 alternate_value text := nullif(trim(regexp_replace(alternate_name,'[[:space:]]+',' ','g')),'');
 target academy.players;
 original academy.people_operations;
 fingerprint_value text;
 reviewed_now bigint;
 name_lock text;
 result jsonb;
begin
 if player is null or op is null or expected_version is null or expected_version not between 1 and 2147483646
  or normalized is null or length(normalized) not between 1 and 160 or length(display_name)>160
  or length(alternate_name)>160
  or (alternate_value is not null and length(academy.i2_normalize(alternate_value)) not between 1 and 160)
  or reviewed_revision is null or reviewed_revision not between 0 and 9007199254740991
  or different_person is null then
  raise exception 'Invalid correction' using errcode='22023';
 end if;

 fingerprint_value:=encode(extensions.digest(jsonb_build_array('name correction',a,player,expected_version,
   display_value,alternate_value,reviewed_revision,different_person)::text,'sha256'),'hex');
 perform pg_advisory_xact_lock(hashtextextended('people-op:'||actor_id||op::text,0));
 select * into original from academy.people_operations where actor=actor_id and id=op;
 if found then
  if original.academy_id<>a or original.fingerprint is distinct from fingerprint_value then
   raise exception 'Operation conflict' using errcode='23505';
  end if;
  return original.result;
 end if;

 select p.* into target from academy.players p where p.id=player and p.academy_id=a for update;
 if not found then raise exception 'Access denied' using errcode='42501';end if;
 if target.version<>expected_version then raise exception 'Player changed' using errcode='PT409';end if;
 if target.display_name=display_value and target.alternate_name is not distinct from alternate_value then
  raise exception 'No name changes' using errcode='22023';
 end if;

 for name_lock in select n from unnest(array[target.normalized_name,normalized]) as names(n) group by n order by n
 loop
  perform pg_advisory_xact_lock(hashtextextended('people-name:'||a::text||':'||name_lock,0));
 end loop;
 select revision into reviewed_now from academy.player_name_revisions
 where academy_id=a and normalized_name=normalized;
 if coalesce(reviewed_now,0)<>reviewed_revision or (not different_person and exists (
  select 1 from academy.players p where p.academy_id=a and p.normalized_name=normalized and p.id<>player
 )) then raise exception 'Review required' using errcode='PT412';end if;

 update academy.players p set display_name=display_value, normalized_name=normalized,
  alternate_name=alternate_value, version=expected_version+1 where p.id=player and p.academy_id=a;
 if target.display_name<>display_value then
  insert into academy.player_name_revisions(academy_id,normalized_name,revision)
   select a,n,1 from unnest(array[target.normalized_name,normalized]) as names(n) group by n order by n
  on conflict(academy_id,normalized_name) do update set revision=academy.player_name_revisions.revision+1;
 end if;
 result:=jsonb_build_object('player_id',player,'name_version',expected_version+1);
 insert into academy.people_operations(actor,id,academy_id,fingerprint,result) values(actor_id,op,a,fingerprint_value,result);
 insert into academy.audit_events(actor,academy_id,action,operation_id,details) values(actor_id,a,'player.names.correct',op,result);
 return result;
end $$;

revoke all on function public.i2_correct_player_names_v1(uuid,uuid,uuid,integer,text,text,bigint,boolean)
 from public,anon,authenticated;
grant execute on function public.i2_correct_player_names_v1(uuid,uuid,uuid,integer,text,text,bigint,boolean)
 to authenticated;

do $$
declare definition text := pg_get_functiondef('academy.verified_subject()'::regprocedure);
begin
 if position('|i2_register_v1|' in definition)=0 or position('|i2_correct_player_names_v1|' in definition)>0 then
  raise exception 'Unexpected Player correction attestation boundary';
 end if;
 execute replace(definition,'|i2_register_v1|','|i2_correct_player_names_v1|i2_register_v1|');
end $$;
