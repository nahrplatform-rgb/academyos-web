-- Accepted attendance redesign. Additive: no marks, memberships or settings seeded.
-- Existing academy lock serializes publication, roster, appointment and attendance changes.
create function public.a10_register_v1(a uuid,ev uuid,marks jsonb,captured_at timestamptz,op uuid)
returns jsonb language plpgsql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s' as $$
declare e academy.publication_events;s text;own boolean;old academy.attendance_operations;
 canonical jsonb;fp text;item jsonb;player uuid;n integer;result jsonb;
begin
 perform academy.t4_lock(a);e:=academy.a10_target(a,ev);s:=academy.verified_subject();own:=academy.a10_owner(a,s);
 if op is null or captured_at is null or not isfinite(captured_at) or jsonb_typeof(marks) is distinct from 'array' then raise exception 'Invalid register' using errcode='22023';end if;
 n:=jsonb_array_length(marks);
 if n<1 or n>1000 or octet_length(marks::text)>131072 then raise exception 'Invalid register size' using errcode='22023';end if;
 for item in select value from jsonb_array_elements(marks) loop
  if jsonb_typeof(item) is distinct from 'object' or not (item ?& array['player','status','version']) or item-array['player','status','version']<>'{}'::jsonb
   or jsonb_typeof(item->'player') is distinct from 'string' or (item->>'player')!~*'^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$'
   or jsonb_typeof(item->'status') is distinct from 'string' or (item->>'status')not in('present','absent') or item->'version' is distinct from '0'::jsonb then
   raise exception 'Invalid register mark' using errcode='22023';end if;
 end loop;
 if (select count(distinct (value->>'player')::uuid) from jsonb_array_elements(marks))<>n then raise exception 'Duplicate register player' using errcode='22023';end if;
 select jsonb_agg(jsonb_build_object('player',(value->>'player')::uuid,'status',value->>'status','version',0)order by (value->>'player')::uuid) into canonical from jsonb_array_elements(marks);
 perform pg_advisory_xact_lock(hashtextextended('attendance-op:'||s||':'||op,0));
 fp:=encode(extensions.digest(jsonb_build_object('kind','register','event',ev,'marks',canonical,'captured_at',captured_at)::text,'sha256'),'hex');
 select *into old from academy.attendance_operations where actor=s and id=op;
 if found then if old.academy_id<>a or old.event_id<>ev or old.fingerprint is distinct from fp then return '{"error":"conflict"}';end if;return old.result;end if;
 if clock_timestamp()<e.starts_at or clock_timestamp()>e.ends_at+interval '24 hours' then return '{"error":"window_closed"}';end if;
 -- Validate the entire set before any writes. Saved marks are correction-only even for Owner.
 for item in select value from jsonb_array_elements(canonical) loop
  player:=(item->>'player')::uuid;
  perform 1 from academy.players p join academy.publication_rosters r on r.player_id=p.id where r.event_id=ev and r.player_id=player and p.academy_id=a and p.branch_id=e.branch_id for share of p;
  if not found then raise exception 'Access denied' using errcode='42501';end if;
  if exists(select 1 from academy.attendance_marks m where m.academy_id=a and m.program_id=e.program_id and m.day=e.day and m.player_id=player) then return '{"error":"stale"}';end if;
 end loop;
 for item in select value from jsonb_array_elements(canonical) loop
  player:=(item->>'player')::uuid;
  insert into academy.attendance_marks(academy_id,program_id,day,player_id,event_id,status,version)values(a,e.program_id,e.day,player,ev,item->>'status',1);
  insert into academy.attendance_history(id,academy_id,event_id,program_id,day,player_id,actor,actor_role,before_status,status,version,reason,captured_at)
  values(gen_random_uuid(),a,ev,e.program_id,e.day,player,s,case when own then 'owner'else 'trainer'end,null,item->>'status',1,null,captured_at);
 end loop;
 result:=jsonb_build_object('kind','register','event',ev,'op',op,'count',n);
 insert into academy.attendance_operations(actor,id,academy_id,event_id,fingerprint,result)values(s,op,a,ev,fp,result);
 insert into academy.audit_events(actor,academy_id,action,operation_id,details)values(s,a,'attendance.register',op,jsonb_build_object('event',ev,'count',n));
 -- Exceptions roll back marks, history, receipt and audit together, including a deadline crossed mid-write.
 if clock_timestamp()<e.starts_at or clock_timestamp()>e.ends_at+interval '24 hours' then raise exception 'Attendance window closed during commit' using errcode='PT409';end if;
 return result;
end $$;
revoke all on function public.a10_register_v1(uuid,uuid,jsonb,timestamptz,uuid) from public,anon,authenticated;
grant execute on function public.a10_register_v1(uuid,uuid,jsonb,timestamptz,uuid) to authenticated;
-- Preserve the latest issuer/proof validation and every existing gateway target.
do $$declare definition text;begin
 select pg_get_functiondef('academy.verified_subject()'::regprocedure) into definition;
 if position('|a10_operation_v1' in definition)=0 then raise exception 'Expected gateway boundary missing';end if;
 execute replace(definition,'|a10_operation_v1','|a10_register_v1|a10_operation_v1');
end $$;
