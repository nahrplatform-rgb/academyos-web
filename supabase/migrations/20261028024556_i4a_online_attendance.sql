-- Accepted I4a: online manual attendance only. No seeded account, grant or mark.
create table academy.attendance_marks(
 academy_id uuid not null,program_id uuid not null,day date not null,player_id uuid not null,
 event_id uuid not null,status text not null check(status in('present','absent')),version bigint not null check(version>0),
 primary key(program_id,day,player_id),
 foreign key(event_id,academy_id,program_id,day)references academy.publication_events(id,academy_id,program_id,day),
 foreign key(player_id,academy_id)references academy.players(id,academy_id));
create index attendance_marks_scope on academy.attendance_marks(academy_id,event_id,player_id);
create table academy.attendance_history(
 id uuid primary key,academy_id uuid not null,event_id uuid not null,program_id uuid not null,day date not null,player_id uuid not null,
 actor text not null,actor_role text not null check(actor_role in('owner','trainer')),before_status text check(before_status in('present','absent')),
 status text not null check(status in('present','absent')),version bigint not null,reason text check(length(reason)<=500),
 captured_at timestamptz not null,received_at timestamptz not null default clock_timestamp(),
 unique(program_id,day,player_id,version),foreign key(program_id,day,player_id)references academy.attendance_marks(program_id,day,player_id),
 foreign key(event_id,academy_id,program_id,day)references academy.publication_events(id,academy_id,program_id,day));
create index attendance_history_scope on academy.attendance_history(academy_id,event_id,player_id,version desc);
create table academy.attendance_operations(
 actor text not null,id uuid not null,academy_id uuid not null,event_id uuid not null,fingerprint text,result jsonb not null,
 created_at timestamptz not null default clock_timestamp(),primary key(actor,id),
 foreign key(event_id)references academy.publication_events);
create index attendance_operations_scope on academy.attendance_operations(academy_id,event_id);
do $$declare t text;begin foreach t in array array['attendance_marks','attendance_history','attendance_operations']loop
 execute format('alter table academy.%I enable row level security',t);execute format('revoke all on academy.%I from public,anon,authenticated',t);end loop;end$$;
create function academy.a10_owner(a uuid,s text)returns boolean language plpgsql security invoker set search_path=''as $$begin
 perform 1 from academy.memberships m join academy.identities i on i.id=m.identity_id where m.academy_id=a and i.clerk_subject=s and m.role='owner'and m.status='active'for share of m;return found;end$$;
create function academy.a10_target(a uuid,ev uuid)returns academy.publication_events language plpgsql security invoker set search_path=''as $$
declare s text:=academy.verified_subject();e academy.publication_events;staff uuid;begin
 select x.*into e from academy.publication_events x join academy.publication_heads h on h.event_id=x.id and h.academy_id=x.academy_id join academy.training_dates d on d.program_id=x.program_id and d.local_date=x.day and d.academy_id=x.academy_id
 where x.id=ev and x.academy_id=a and x.published and not d.canceled and d.starts_at=x.starts_at and d.ends_at=x.ends_at;
 if not found then raise exception 'Access denied'using errcode='42501';end if;
 if not academy.a10_owner(a,s)then staff:=academy.t4_trainer(a);if e.trainer_id is distinct from staff or not academy.q6_eligible(a,e.branch_id,staff)then raise exception 'Access denied'using errcode='42501';end if;end if;return e;
end$$;
-- Table guards protect every existing writer, including older public RPC versions.
-- All attendance/publication/planning/lifecycle operations use this same academy lock.
create function academy.a10_protect(a uuid,p uuid,d date)returns void language plpgsql security invoker set search_path=''as $$begin
 perform academy.t4_lock(a);if exists(select 1 from academy.attendance_marks where academy_id=a and program_id=p and day=d)then raise exception 'Attendance protects session'using errcode='PT409';end if;end$$;
create function academy.a10_guard_session()returns trigger language plpgsql security definer set search_path=''as $$begin
 if TG_OP<>'INSERT'then perform academy.a10_protect(old.academy_id,old.program_id,coalesce((to_jsonb(old)->>'day')::date,(to_jsonb(old)->>'local_date')::date));end if;
 if TG_OP<>'DELETE'then perform academy.a10_protect(new.academy_id,new.program_id,coalesce((to_jsonb(new)->>'day')::date,(to_jsonb(new)->>'local_date')::date));return new;end if;return old;
end$$;
create trigger attendance_date_guard before update or delete on academy.training_dates for each row execute function academy.a10_guard_session();
create trigger attendance_plan_guard before insert or update or delete on academy.date_plans for each row execute function academy.a10_guard_session();
create trigger attendance_roster_guard before insert or update or delete on academy.date_rosters for each row execute function academy.a10_guard_session();
create trigger attendance_event_guard before update or delete on academy.publication_events for each row execute function academy.a10_guard_session();
create trigger attendance_publication_guard before insert or update or delete on academy.publication_heads for each row execute function academy.a10_guard_session();
create function academy.a10_guard_published_roster()returns trigger language plpgsql security definer set search_path=''as $$
declare e academy.publication_events;begin
 if TG_OP<>'INSERT'then select *into e from academy.publication_events where id=old.event_id;perform academy.a10_protect(e.academy_id,e.program_id,e.day);end if;
 if TG_OP<>'DELETE'then select *into e from academy.publication_events where id=new.event_id;perform academy.a10_protect(e.academy_id,e.program_id,e.day);return new;end if;return old;end$$;
create trigger attendance_snapshot_guard before insert or update or delete on academy.publication_rosters for each row execute function academy.a10_guard_published_roster();
create function academy.a10_history_immutable()returns trigger language plpgsql security invoker set search_path=''as $$begin raise exception 'Attendance history is immutable'using errcode='PT409';end$$;
create trigger attendance_history_immutable before update or delete on academy.attendance_history for each row execute function academy.a10_history_immutable();
create function public.a10_roster_v1(a uuid,ev uuid,after_id uuid default null)returns jsonb language plpgsql security definer set search_path=''set statement_timeout='3s'set lock_timeout='2s'as $$
declare e academy.publication_events;s text;items jsonb;n integer;saved integer;more boolean;server_now timestamptz;begin
 perform academy.t4_lock(a);e:=academy.a10_target(a,ev);s:=academy.verified_subject();
 select coalesce(jsonb_agg(to_jsonb(q)order by q.id),'[]')into items from(select r.player_id id,r.name,m.status,coalesce(m.version,0)version from academy.publication_rosters r left join academy.attendance_marks m on m.program_id=e.program_id and m.day=e.day and m.player_id=r.player_id and m.academy_id=a where r.event_id=ev and(after_id is null or r.player_id>after_id)order by r.player_id limit 51)q;
 more:=jsonb_array_length(items)>50;if more then items:=items-50;end if;while jsonb_array_length(items)>1 and octet_length(items::text)>24576 loop items:=items-(jsonb_array_length(items)-1);more:=true;end loop;
 select count(*)into n from academy.publication_rosters where event_id=ev;select count(*)into saved from academy.attendance_marks where event_id=ev and academy_id=a;
 if n<>e.roster_count or saved>n then raise exception 'Attendance roster invariant'using errcode='XX000';end if;server_now:=clock_timestamp();
 return jsonb_build_object('event',ev,'program',e.program_id,'day',e.day,'scheduled_day',coalesce(e.projection->>'scheduled_day',e.day::text),'starts_at',e.starts_at,'ends_at',e.ends_at,'projection',e.projection,'owner',academy.a10_owner(a,s),'server_now',server_now,'closes_at',e.ends_at+interval '24 hours','open',server_now>=e.starts_at and server_now<=e.ends_at+interval '24 hours','count',n,'saved',saved,'players',items,'more',more,'protected',saved>0);
end$$;
create function public.a10_history_v1(a uuid,ev uuid,player uuid,before_version bigint default null)returns jsonb language plpgsql security definer set search_path=''set statement_timeout='3s'set lock_timeout='2s'as $$
declare e academy.publication_events;items jsonb;more boolean;begin
 perform academy.t4_lock(a);e:=academy.a10_target(a,ev);if player is null or(before_version is not null and before_version<1)then raise exception 'Invalid history cursor'using errcode='22023';end if;
 perform 1 from academy.publication_rosters where event_id=ev and player_id=player;if not found then raise exception 'Access denied'using errcode='42501';end if;
 select coalesce(jsonb_agg(to_jsonb(q)order by q.version desc),'[]')into items from(select h.version,h.actor_role,h.before_status,h.status,h.reason,h.captured_at,h.received_at from academy.attendance_history h where h.academy_id=a and h.event_id=ev and h.player_id=player and(before_version is null or h.version<before_version)order by h.version desc limit 21)q;
 more:=jsonb_array_length(items)>20;if more then items:=items-20;end if;while jsonb_array_length(items)>1 and octet_length(items::text)>24576 loop items:=items-(jsonb_array_length(items)-1);more:=true;end loop;return jsonb_build_object('items',items,'more',more);
end$$;
create function public.a10_mark_v1(a uuid,ev uuid,player uuid,new_status text,expected_version bigint,reason text,captured_at timestamptz,op uuid)returns jsonb language plpgsql security definer set search_path=''set statement_timeout='3s'set lock_timeout='2s'as $$
declare e academy.publication_events;s text;owner_actor boolean;prior academy.attendance_marks;old academy.attendance_operations;fp text;result jsonb;begin
 perform academy.t4_lock(a);e:=academy.a10_target(a,ev);s:=academy.verified_subject();owner_actor:=academy.a10_owner(a,s);
 if op is null or player is null or new_status is null or new_status not in('present','absent')or expected_version is null or expected_version<0 or captured_at is null or not isfinite(captured_at)or length(coalesce(reason,''))>500 then raise exception 'Invalid attendance'using errcode='22023';end if;
 perform pg_advisory_xact_lock(hashtextextended('attendance-op:'||s||':'||op,0));
 fp:=encode(extensions.digest(jsonb_build_object('event',ev,'player',player,'status',new_status,'version',expected_version,'reason',reason,'captured_at',captured_at)::text,'sha256'),'hex');
 select *into old from academy.attendance_operations where actor=s and id=op;if found then if old.academy_id<>a or old.event_id<>ev or old.fingerprint is distinct from fp then return '{"error":"conflict"}';end if;return old.result;end if;
 perform 1 from academy.players p join academy.publication_rosters r on r.player_id=p.id where r.event_id=ev and r.player_id=player and p.academy_id=a and p.branch_id=e.branch_id for share of p;
 if not found then raise exception 'Access denied'using errcode='42501';end if;
 if clock_timestamp()<e.starts_at or clock_timestamp()>e.ends_at+interval '24 hours'then return '{"error":"window_closed"}';end if;
 select *into prior from academy.attendance_marks m where m.academy_id=a and m.program_id=e.program_id and m.day=e.day and m.player_id=player for update;
 if coalesce(prior.version,0)<>expected_version then return '{"error":"stale"}';end if;
 if prior.version is not null and not owner_actor then return '{"error":"owner_correction_required"}';end if;
 if prior.version is not null and(length(trim(coalesce(reason,'')))=0 or prior.status=new_status)or prior.version is null and reason is not null then raise exception 'Invalid correction'using errcode='22023';end if;
 insert into academy.attendance_marks(academy_id,program_id,day,player_id,event_id,status,version)values(a,e.program_id,e.day,player,ev,new_status,expected_version+1)
 on conflict(program_id,day,player_id)do update set status=excluded.status,version=excluded.version;
 insert into academy.attendance_history(id,academy_id,event_id,program_id,day,player_id,actor,actor_role,before_status,status,version,reason,captured_at)
 values(op,a,ev,e.program_id,e.day,player,s,case when owner_actor then 'owner'else 'trainer'end,prior.status,new_status,expected_version+1,case when prior.version is not null then trim(reason)else null end,captured_at);
 result:=jsonb_build_object('event',ev,'player',player,'status',new_status,'version',expected_version+1);
 insert into academy.attendance_operations(actor,id,academy_id,event_id,fingerprint,result)values(s,op,a,ev,fp,result);
 insert into academy.audit_events(actor,academy_id,action,operation_id,details)values(s,a,case when prior.version is null then 'attendance.record'else 'attendance.correct'end,op,jsonb_build_object('event',ev,'player',player,'version',expected_version+1));
 if clock_timestamp()<e.starts_at or clock_timestamp()>e.ends_at+interval '24 hours'then raise exception 'Attendance window closed during commit'using errcode='PT409';end if;return result;
end$$;
create function public.a10_operation_v1(a uuid,ev uuid,op uuid)returns jsonb language plpgsql security definer set search_path=''set statement_timeout='3s'set lock_timeout='2s'as $$
declare s text;old academy.attendance_operations;begin
 perform academy.t4_lock(a);perform academy.a10_target(a,ev);s:=academy.verified_subject();if op is null then raise exception 'Invalid operation'using errcode='22023';end if;
 perform pg_advisory_xact_lock(hashtextextended('attendance-op:'||s||':'||op,0));select *into old from academy.attendance_operations where actor=s and id=op;
 if found then if old.academy_id<>a or old.event_id<>ev then raise exception 'Access denied'using errcode='42501';end if;return old.result;end if;
 insert into academy.attendance_operations(actor,id,academy_id,event_id,result)values(s,op,a,ev,'{"cancelled":true}');insert into academy.audit_events(actor,academy_id,action,operation_id,details)values(s,a,'attendance.reconcile_cancel',op,jsonb_build_object('event',ev));return '{"cancelled":true}';end$$;
-- Extend the existing signed, rate-limited gateway allowlist without broadening caller authority.
create or replace function academy.verified_subject() returns text
language plpgsql stable security invoker set search_path = '' as $$
declare claims jsonb := auth.jwt(); headers jsonb; proof jsonb; path text; method text;
begin
 if claims->>'iss' is distinct from 'https://immune-grizzly-7875.clerk.accounts.dev'
    or coalesce(claims->>'sub','') !~ '^user_[a-zA-Z0-9_]+$'
    or claims->>'role' is distinct from 'authenticated' then
   raise exception 'Invalid identity' using errcode = '42501';
 end if;
 path := current_setting('request.path',true);
 method := current_setting('request.method',true);
 if method is distinct from 'POST' or path is null or path !~ '^/rpc/(m1_context_v1|m1_platform_list_v1|m1_setup_v1|m1_operation_v1|m1_create_v1|m1_save_setup_v1|m1_manage_invitation_v1|m1_invitation_v1|bootstrap_identity_v1|my_academy_memberships_v1|i2_people_v1|i2_candidates_v1|i2_profile_v1|i2_register_v1|i2_operation_v1|g3_owner_list_v1|g3_command_v1|g3_operation_v1|g3_invitation_v1|g3_links_v1|t4_owner_list_v1|t4_command_v1|t4_operation_v1|t4_invitation_v1|t4_profile_v1|p5_list_v1|p5_preview_v1|p5_create_v1|p5_read_v1|p5_step_v1|p5_operation_v1|p5_dates_v1|q6_read_v1|q6_candidates_v1|q6_review_v1|q6_save_v1|q6_operation_v1|r7_create_v1|r7_list_v1|r7_read_v1|r7_change_v1|r7_operation_v1|s8_create_v1|s8_read_v1|s8_jobs_v1|s8_change_v1|s8_operation_v1|s8_owner_dates_v1|s8_schedule_v1|s8_roster_v1|q6_review_v2|q6_save_v2|t9_read_v1|t9_review_v1|t9_save_v1|t9_operation_v1|a10_roster_v1|a10_history_v1|a10_mark_v1|a10_operation_v1)$' then
   raise exception 'Gateway required' using errcode='42501';
 end if;
 headers := nullif(current_setting('request.headers',true),'')::jsonb;
 if coalesce(length(headers->>'x-academyos-gateway'),0) not between 1 and 1024 then
   raise exception 'Gateway required' using errcode='42501';
 end if;
 proof := (headers->>'x-academyos-gateway')::jsonb;
 if academy.m1_proof(proof,'gateway',method||':'||path) is distinct from claims->>'sub' then
   raise exception 'Gateway required' using errcode='42501';
 end if;
 return claims->>'sub';
exception when invalid_text_representation or numeric_value_out_of_range then
 raise exception 'Gateway required' using errcode='42501';
end;
$$;

create or replace function public.q6_read_v1(a uuid,p uuid,day date,after_id uuid default null) returns jsonb language plpgsql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s' as $$
declare d academy.training_dates:=academy.q6_target(a,p,day);plan academy.date_plans;ctx jsonb:=academy.p5_context(a);items jsonb;who jsonb;more boolean;begin
 select * into plan from academy.date_plans x where x.academy_id=a and x.program_id=p and x.local_date=day;
 select jsonb_build_object('id',x.id,'name',x.display_name,'eligible',academy.q6_eligible(a,(ctx->>'branch_id')::uuid,x.id)) into who from academy.trainer_people x where x.academy_id=a and x.id=plan.trainer_id;
 select coalesce(jsonb_agg(to_jsonb(q) order by q.id),'[]') into items from (select x.id,x.display_name name from academy.date_rosters r join academy.players x on x.id=r.player_id and x.academy_id=r.academy_id where r.academy_id=a and r.program_id=p and r.local_date=day and (after_id is null or x.id>after_id) order by x.id limit 26)q;
 more:=jsonb_array_length(items)>25;if more then items:=items-25;end if;
 return jsonb_build_object('context',ctx,'program',p,'name',(select definition->>'name' from academy.training_programs where id=p and academy_id=a),'day',day,'scheduled_day',d.scheduled_date,'canceled',d.canceled,'schedule_version',d.schedule_version,'start',to_char(d.starts_local,'HH24:MI'),'end',to_char(d.ends_local,'HH24:MI'),'timezone',(select timezone from academy.training_programs where id=p and academy_id=a),'published',exists(select 1 from academy.publication_heads h join academy.publication_events e on e.id=h.event_id where h.academy_id=a and h.program_id=p and h.day=q6_read_v1.day and e.published),'version',coalesce(plan.version,0),'capacity',plan.capacity,'trainer',who,'count',coalesce(plan.roster_count,0),'players',items,'more',more,'attendance_event',(select h.event_id from academy.publication_heads h join academy.publication_events e on e.id=h.event_id where h.program_id=p and h.day=q6_read_v1.day and h.academy_id=a and e.published),'attendance_locked',exists(select 1 from academy.attendance_marks m where m.academy_id=a and m.program_id=p and m.day=q6_read_v1.day));
end $$;

do $$declare f record;begin for f in select p.oid::regprocedure sig,n.nspname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where p.proname like 'a10_%'and n.nspname in('academy','public')loop execute format('revoke all on function %s from public,anon,authenticated',f.sig);if f.nspname='public'then execute format('grant execute on function %s to authenticated',f.sig);end if;end loop;end$$;
