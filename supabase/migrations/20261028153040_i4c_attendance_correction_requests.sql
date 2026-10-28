-- I4c accepted request/review rules. No seeded account, access grant or attendance.
-- Existing academy lifecycle lock -> actor-scoped operation lock -> current rows.
alter table academy.trainer_assignments add column authority_revision uuid not null default gen_random_uuid();
create function academy.c12_assignment_revision()returns trigger language plpgsql security invoker set search_path=''as $$begin new.authority_revision:=gen_random_uuid();return new;end$$;
create trigger correction_assignment_revision before update on academy.trainer_assignments for each row execute function academy.c12_assignment_revision();
create function academy.c12_authority_changed()returns trigger language plpgsql security definer set search_path=''as $$begin
 if TG_TABLE_NAME='memberships' then
  if(new.identity_id,new.academy_id,new.role,new.status)is distinct from(old.identity_id,old.academy_id,old.role,old.status)then
   update academy.trainer_assignments z set authority_revision=gen_random_uuid()from academy.trainer_people p where p.id=z.staff_id and p.membership_id=old.id;
  end if;
 elsif TG_TABLE_NAME='trainer_invitations'then
  if(new.version,new.state,new.branch_id,new.accepted_by)is distinct from(old.version,old.state,old.branch_id,old.accepted_by)then update academy.trainer_assignments set authority_revision=gen_random_uuid()where invitation_id=old.id;end if;
 elsif(new.identity_id,new.membership_id)is distinct from(old.identity_id,old.membership_id)then update academy.trainer_assignments set authority_revision=gen_random_uuid()where staff_id=old.id;end if;return new;
end$$;
create trigger correction_membership_revision after update on academy.memberships for each row execute function academy.c12_authority_changed();
create trigger correction_invitation_revision after update on academy.trainer_invitations for each row execute function academy.c12_authority_changed();
create trigger correction_person_revision after update on academy.trainer_people for each row execute function academy.c12_authority_changed();
create table academy.correction_requests(
 id uuid primary key,academy_id uuid not null,event_id uuid not null,program_id uuid not null,day date not null,player_id uuid not null,
 requester text not null,assignment_id uuid not null references academy.trainer_assignments,authority_revision uuid not null,
 before_status text not null check(before_status in('present','absent')),proposed text not null check(proposed in('present','absent')and proposed<>before_status),
 base_version bigint not null check(base_version>0),reason text not null check(length(trim(reason))between 1 and 500),created_at timestamptz not null default clock_timestamp(),
 decision text check(decision in('approved','rejected')),reviewer text,decision_reason text check(length(trim(decision_reason))between 1 and 500),decided_at timestamptz,
 check((decision is null and reviewer is null and decision_reason is null and decided_at is null)or(decision is not null and reviewer is not null and reviewer<>requester and decision_reason is not null and decided_at is not null)),
 foreign key(event_id,academy_id,program_id,day)references academy.publication_events(id,academy_id,program_id,day),
 foreign key(program_id,day,player_id)references academy.attendance_marks(program_id,day,player_id));
create index correction_mark_version on academy.correction_requests(event_id,player_id,base_version);
create index correction_queue on academy.correction_requests(academy_id,created_at,id);
create index correction_requester on academy.correction_requests(academy_id,requester,event_id,created_at,id);
create index correction_assignment on academy.correction_requests(assignment_id);
create table academy.correction_history(
 id uuid primary key,request_id uuid not null references academy.correction_requests,kind text not null check(kind in('requested','approved','rejected')),
 actor text not null,reason text not null check(length(trim(reason))between 1 and 500),created_at timestamptz not null default clock_timestamp(),unique(request_id,kind));
create index correction_history_cursor on academy.correction_history(request_id,created_at,id);
create table academy.correction_operations(actor text not null,id uuid not null,academy_id uuid not null,event_id uuid not null references academy.publication_events,
 fingerprint text,result jsonb not null,created_at timestamptz not null default clock_timestamp(),primary key(actor,id));
do $$declare t text;begin foreach t in array array['correction_requests','correction_history','correction_operations']loop
 execute format('alter table academy.%I enable row level security',t);execute format('revoke all on academy.%I from public,anon,authenticated',t);end loop;end$$;
create trigger correction_history_immutable before update or delete on academy.correction_history for each row execute function academy.a10_history_immutable();
create function academy.c12_request_immutable()returns trigger language plpgsql security invoker set search_path=''as $$begin
 if TG_OP='DELETE'then raise exception 'Retained request'using errcode='PT409';end if;
 if(to_jsonb(new)-array['decision','reviewer','decision_reason','decided_at'])is distinct from(to_jsonb(old)-array['decision','reviewer','decision_reason','decided_at'])or old.decision is not null then raise exception 'Immutable request snapshot/decision'using errcode='PT409';end if;return new;end$$;
create trigger correction_request_immutable before update or delete on academy.correction_requests for each row execute function academy.c12_request_immutable();
create function academy.c12_state(r academy.correction_requests)returns text language plpgsql security invoker set search_path=''as $$declare e academy.publication_events;begin
 if r.decision is not null then return r.decision;end if;
 if not exists(select 1 from academy.attendance_marks m where m.program_id=r.program_id and m.day=r.day and m.player_id=r.player_id and m.version=r.base_version and m.status=r.before_status)then return 'stale';end if;
 select *into e from academy.publication_events where id=r.event_id;
 if clock_timestamp()>e.ends_at+interval '24 hours'then return 'expired';end if;
 if not exists(select 1 from academy.trainer_assignments z join academy.trainer_people p on p.id=z.staff_id join academy.identities i on i.id=p.identity_id where z.id=r.assignment_id and z.academy_id=r.academy_id and z.staff_id=e.trainer_id and i.clerk_subject=r.requester and z.authority_revision=r.authority_revision and academy.q6_eligible(r.academy_id,e.branch_id,z.staff_id))then return 'ineligible';end if;
 return 'pending';end$$;
create function academy.c12_access(a uuid,ev uuid default null)returns boolean language plpgsql security invoker set search_path=''as $$declare s text:=academy.verified_subject();begin
 if ev is not null and not exists(select 1 from academy.publication_events where id=ev and academy_id=a)then raise exception 'Access denied'using errcode='42501';end if;
 if academy.a10_owner(a,s)then return true;end if;
 if ev is null then raise exception 'Access denied'using errcode='42501';end if;perform academy.a10_target(a,ev);return false;end$$;
create function public.c12_list_v1(a uuid,ev uuid default null,scope text default 'pending',after_at timestamptz default null,after_id uuid default null)returns jsonb language plpgsql security definer set search_path=''set statement_timeout='3s'set lock_timeout='2s'as $$
declare own boolean;s text;items jsonb;more boolean;begin
 perform academy.t4_lock(a);own:=academy.c12_access(a,ev);s:=academy.verified_subject();
 if scope is null or scope not in('pending','all')or(after_at is null)<>(after_id is null)or after_at is not null and not isfinite(after_at)then raise exception 'Invalid request filter/cursor'using errcode='22023';end if;
 select coalesce(jsonb_agg(to_jsonb(q)order by q.created_at,q.id),'[]')into items from(select r.id,r.event_id event,r.player_id player,ro.name,r.before_status,r.proposed,r.base_version,r.created_at,academy.c12_state(r)state
 from academy.correction_requests r join academy.publication_rosters ro on ro.event_id=r.event_id and ro.player_id=r.player_id
 where r.academy_id=a and(ev is null or r.event_id=ev)and(own or r.requester=s)and(scope='all'or r.decision is null and academy.c12_state(r)='pending')and(after_at is null or(r.created_at,r.id)>(after_at,after_id))order by r.created_at,r.id limit 26)q;
 more:=jsonb_array_length(items)>25;if more then items:=items-25;end if;while jsonb_array_length(items)>1 and octet_length(items::text)>24576 loop items:=items-(jsonb_array_length(items)-1);more:=true;end loop;
 return jsonb_build_object('owner',own,'items',items,'more',more);
end$$;
create function public.c12_detail_v1(a uuid,ev uuid,rid uuid)returns jsonb language plpgsql security definer set search_path=''set statement_timeout='3s'set lock_timeout='2s'as $$
declare own boolean;s text;r academy.correction_requests;e academy.publication_events;m academy.attendance_marks;begin
 perform academy.t4_lock(a);own:=academy.c12_access(a,ev);s:=academy.verified_subject();select *into r from academy.correction_requests where id=rid and academy_id=a and event_id=ev;
 if not found or not own and r.requester<>s then raise exception 'Access denied'using errcode='42501';end if;
 select *into e from academy.publication_events where id=ev;select *into m from academy.attendance_marks where program_id=r.program_id and day=r.day and player_id=r.player_id;
 return jsonb_build_object('id',r.id,'event',ev,'player',r.player_id,'name',(select name from academy.publication_rosters where event_id=ev and player_id=r.player_id),'projection',e.projection,'starts_at',e.starts_at,'ends_at',e.ends_at,'closes_at',e.ends_at+interval '24 hours','open',clock_timestamp()between e.starts_at and e.ends_at+interval '24 hours',
 'owner',own,'self',s=r.requester,'state',academy.c12_state(r),'before',r.before_status,'proposed',r.proposed,'base',r.base_version,'current',m.status,'version',m.version,'reason',r.reason,'decision_reason',r.decision_reason,'created_at',r.created_at,'decided_at',r.decided_at);
end$$;
create function public.c12_history_v1(a uuid,ev uuid,rid uuid,after_at timestamptz default null,after_id uuid default null)returns jsonb language plpgsql security definer set search_path=''set statement_timeout='3s'set lock_timeout='2s'as $$declare detail jsonb;items jsonb;more boolean;begin
 detail:=public.c12_detail_v1(a,ev,rid);if(after_at is null)<>(after_id is null)or after_at is not null and not isfinite(after_at)then raise exception 'Invalid cursor'using errcode='22023';end if;
 select coalesce(jsonb_agg(to_jsonb(q)order by q.created_at,q.id),'[]')into items from(select h.id,h.kind,h.reason,h.created_at from academy.correction_history h where h.request_id=rid and(after_at is null or(h.created_at,h.id)>(after_at,after_id))order by h.created_at,h.id limit 21)q;
 more:=jsonb_array_length(items)>20;if more then items:=items-20;end if;while jsonb_array_length(items)>1 and octet_length(items::text)>24576 loop items:=items-(jsonb_array_length(items)-1);more:=true;end loop;return jsonb_build_object('items',items,'more',more);end$$;
create function public.c12_submit_v1(a uuid,ev uuid,player uuid,expected_version bigint,reason text,op uuid)returns jsonb language plpgsql security definer set search_path=''set statement_timeout='3s'set lock_timeout='2s'as $$
declare s text;e academy.publication_events;staff uuid;z academy.trainer_assignments;m academy.attendance_marks;r academy.correction_requests;old academy.correction_operations;fp text;result jsonb;begin
 perform academy.t4_lock(a);e:=academy.a10_target(a,ev);s:=academy.verified_subject();
 if academy.a10_owner(a,s)then raise exception 'Owner uses direct correction'using errcode='42501';end if;staff:=academy.t4_trainer(a);
 if op is null or player is null or expected_version is null or expected_version<1 or length(trim(coalesce(reason,'')))not between 1 and 500 then raise exception 'Invalid correction request'using errcode='22023';end if;
 perform pg_advisory_xact_lock(hashtextextended('correction-op:'||s||':'||op,0));fp:=encode(extensions.digest(jsonb_build_object('kind','request','event',ev,'player',player,'version',expected_version,'reason',reason)::text,'sha256'),'hex');
 select *into old from academy.correction_operations where actor=s and id=op;if found then if old.academy_id<>a or old.event_id<>ev or old.fingerprint is distinct from fp then return '{"error":"conflict"}';end if;return old.result;end if;
 perform 1 from academy.players p join academy.publication_rosters ro on ro.player_id=p.id and ro.event_id=ev where p.id=player and p.academy_id=a and p.branch_id=e.branch_id for share of p;if not found then raise exception 'Access denied'using errcode='42501';end if;
 select *into m from academy.attendance_marks where program_id=e.program_id and day=e.day and player_id=player and academy_id=a for update;
 if not found or m.version<>expected_version then return '{"error":"stale"}';end if;
 if clock_timestamp()<e.starts_at or clock_timestamp()>e.ends_at+interval '24 hours'then return '{"error":"window_closed"}';end if;
 select *into z from academy.trainer_assignments where staff_id=staff and academy_id=a and branch_id=e.branch_id and state='active'for share;
 if not found then raise exception 'Access denied'using errcode='42501';end if;
 perform 1 from academy.trainer_people pp join academy.memberships mm on mm.id=pp.membership_id join academy.trainer_assignments zz on zz.staff_id=pp.id join academy.trainer_invitations vv on vv.id=zz.invitation_id where zz.id=z.id for share of mm,pp,vv,zz;
 if not academy.q6_eligible(a,e.branch_id,staff)then raise exception 'Access denied'using errcode='42501';end if;select zz.*into z from academy.trainer_assignments zz where zz.id=z.id;
 select *into r from academy.correction_requests where event_id=ev and player_id=c12_submit_v1.player and base_version=expected_version and academy.c12_state(correction_requests)='pending';
 if not found then
  insert into academy.correction_requests(id,academy_id,event_id,program_id,day,player_id,requester,assignment_id,authority_revision,before_status,proposed,base_version,reason)values(op,a,ev,e.program_id,e.day,player,s,z.id,z.authority_revision,m.status,case m.status when 'present'then 'absent'else 'present'end,m.version,trim(reason))returning *into r;
  insert into academy.correction_history(id,request_id,kind,actor,reason)values(op,r.id,'requested',s,trim(reason));
  insert into academy.audit_events(actor,academy_id,action,operation_id,details)values(s,a,'attendance.correction_request',op,jsonb_build_object('request',r.id,'event',ev,'player',player,'version',m.version));
 elsif r.requester<>s then raise exception 'Access denied'using errcode='42501';end if;
 result:=jsonb_build_object('request',r.id,'event',ev,'player',player,'state',academy.c12_state(r));insert into academy.correction_operations(actor,id,academy_id,event_id,fingerprint,result)values(s,op,a,ev,fp,result);
 if clock_timestamp()>e.ends_at+interval '24 hours'then raise exception 'Window closed during commit'using errcode='PT409';end if;return result;
end$$;
create function public.c12_decide_v1(a uuid,ev uuid,rid uuid,choice text,reason text,op uuid)returns jsonb language plpgsql security definer set search_path=''set statement_timeout='3s'set lock_timeout='2s'as $$
declare s text;r academy.correction_requests;e academy.publication_events;m academy.attendance_marks;old academy.correction_operations;fp text;result jsonb;n integer;begin
 perform academy.t4_lock(a);s:=academy.verified_subject();perform academy.t4_approver(a,s);
 if op is null or choice is null or choice not in('approved','rejected')or length(trim(coalesce(reason,'')))not between 1 and 500 then raise exception 'Invalid decision'using errcode='22023';end if;
 select *into r from academy.correction_requests where id=rid and academy_id=a and event_id=ev for update;if not found or r.requester=s then raise exception 'Access denied'using errcode='42501';end if;
 perform pg_advisory_xact_lock(hashtextextended('correction-op:'||s||':'||op,0));fp:=encode(extensions.digest(jsonb_build_object('kind','decision','event',ev,'request',rid,'choice',choice,'reason',reason)::text,'sha256'),'hex');
 select *into old from academy.correction_operations where actor=s and id=op;if found then if old.academy_id<>a or old.event_id<>ev or old.fingerprint is distinct from fp then return '{"error":"conflict"}';end if;return old.result;end if;
 -- Lock current requester authority, not a caller-supplied role. Epoch changes on end/re-enable and membership changes.
 perform 1 from academy.trainer_people p join academy.memberships mm on mm.id=p.membership_id join academy.trainer_assignments z on z.staff_id=p.id join academy.trainer_invitations v on v.id=z.invitation_id where z.id=r.assignment_id for share of mm,p,v,z;
 if academy.c12_state(r)<>'pending'then return jsonb_build_object('error',academy.c12_state(r));end if;
 e:=academy.a10_target(a,ev);perform 1 from academy.players pp join academy.publication_rosters rr on rr.player_id=pp.id and rr.event_id=ev where pp.id=r.player_id and pp.academy_id=a and pp.branch_id=e.branch_id for share of pp;if not found then raise exception 'Access denied'using errcode='42501';end if;
 if clock_timestamp()<e.starts_at or clock_timestamp()>e.ends_at+interval '24 hours'then return '{"error":"window_closed"}';end if;
 select *into m from academy.attendance_marks where program_id=r.program_id and day=r.day and player_id=r.player_id for update;
 if choice='approved'then
  update academy.attendance_marks set status=r.proposed,version=version+1 where program_id=r.program_id and day=r.day and player_id=r.player_id and version=r.base_version and status=r.before_status;get diagnostics n=row_count;if n<>1 then raise exception 'Version conflict'using errcode='PT409';end if;
  insert into academy.attendance_history(id,academy_id,event_id,program_id,day,player_id,actor,actor_role,before_status,status,version,reason,captured_at)values(op,a,ev,r.program_id,r.day,r.player_id,s,'owner',r.before_status,r.proposed,r.base_version+1,trim(reason),clock_timestamp());
 end if;
 update academy.correction_requests set decision=choice,reviewer=s,decision_reason=trim(c12_decide_v1.reason),decided_at=clock_timestamp()where id=rid and decision is null;get diagnostics n=row_count;if n<>1 then raise exception 'Decision conflict'using errcode='PT409';end if;
 insert into academy.correction_history(id,request_id,kind,actor,reason)values(op,rid,choice,s,trim(reason));
 result:=jsonb_build_object('request',rid,'event',ev,'player',r.player_id,'state',choice);insert into academy.correction_operations(actor,id,academy_id,event_id,fingerprint,result)values(s,op,a,ev,fp,result);
 insert into academy.audit_events(actor,academy_id,action,operation_id,details)values(s,a,'attendance.correction_decision',op,jsonb_build_object('request',rid,'event',ev,'decision',choice));
 if clock_timestamp()<e.starts_at or clock_timestamp()>e.ends_at+interval '24 hours'then raise exception 'Window closed during commit'using errcode='PT409';end if;return result;
end$$;
create function public.c12_operation_v1(a uuid,ev uuid,op uuid)returns jsonb language plpgsql security definer set search_path=''set statement_timeout='3s'set lock_timeout='2s'as $$declare s text;old academy.correction_operations;begin
 perform academy.t4_lock(a);perform academy.c12_access(a,ev);s:=academy.verified_subject();if op is null then raise exception 'Invalid operation'using errcode='22023';end if;perform pg_advisory_xact_lock(hashtextextended('correction-op:'||s||':'||op,0));
 select *into old from academy.correction_operations where actor=s and id=op;if found then if old.academy_id<>a or old.event_id<>ev then raise exception 'Access denied'using errcode='42501';end if;return old.result;end if;
 insert into academy.correction_operations(actor,id,academy_id,event_id,result)values(s,op,a,ev,'{"cancelled":true}');insert into academy.audit_events(actor,academy_id,action,operation_id,details)values(s,a,'attendance.correction_fence',op,jsonb_build_object('event',ev));return '{"cancelled":true}';end$$;
create function public.c12_context_v1(a uuid,ev uuid,player uuid)returns jsonb language plpgsql security definer set search_path=''set statement_timeout='3s'set lock_timeout='2s'as $$declare e academy.publication_events;m academy.attendance_marks;who text;existing uuid;begin
 perform academy.t4_lock(a);e:=academy.a10_target(a,ev);who:=academy.verified_subject();
 perform 1 from academy.publication_rosters r join academy.players p on p.id=r.player_id and p.academy_id=a and p.branch_id=e.branch_id where r.event_id=ev and r.player_id=player;if not found then raise exception 'Access denied'using errcode='42501';end if;
 select *into m from academy.attendance_marks where event_id=ev and player_id=player;
 select r.id into existing from academy.correction_requests r where r.event_id=ev and r.player_id=player and r.requester=who and academy.c12_state(r)='pending';
 return jsonb_build_object('event',ev,'player',player,'name',(select r.name from academy.publication_rosters r where r.event_id=ev and r.player_id=player),'current',m.status,'version',coalesce(m.version,0),'owner',academy.a10_owner(a,who),'projection',e.projection,'starts_at',e.starts_at,'ends_at',e.ends_at,'closes_at',e.ends_at+interval '24 hours','open',clock_timestamp()between e.starts_at and e.ends_at+interval '24 hours','existing',existing);
end$$;
do $$declare f record;begin for f in select p.oid::regprocedure sig,n.nspname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where p.proname like 'c12_%'and n.nspname in('academy','public')loop execute format('revoke all on function %s from public,anon,authenticated',f.sig);if f.nspname='public'then execute format('grant execute on function %s to authenticated',f.sig);end if;end loop;end$$;

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
 if method is distinct from 'POST' or path is null or path !~ '^/rpc/(m1_context_v1|m1_platform_list_v1|m1_setup_v1|m1_operation_v1|m1_create_v1|m1_save_setup_v1|m1_manage_invitation_v1|m1_invitation_v1|bootstrap_identity_v1|my_academy_memberships_v1|i2_people_v1|i2_candidates_v1|i2_profile_v1|i2_register_v1|i2_operation_v1|g3_owner_list_v1|g3_command_v1|g3_operation_v1|g3_invitation_v1|g3_links_v1|t4_owner_list_v1|t4_command_v1|t4_operation_v1|t4_invitation_v1|t4_profile_v1|p5_list_v1|p5_preview_v1|p5_create_v1|p5_read_v1|p5_step_v1|p5_operation_v1|p5_dates_v1|q6_read_v1|q6_candidates_v1|q6_review_v1|q6_save_v1|q6_operation_v1|r7_create_v1|r7_list_v1|r7_read_v1|r7_change_v1|r7_operation_v1|s8_create_v1|s8_read_v1|s8_jobs_v1|s8_change_v1|s8_operation_v1|s8_owner_dates_v1|s8_schedule_v1|s8_roster_v1|q6_review_v2|q6_save_v2|t9_read_v1|t9_review_v1|t9_save_v1|t9_operation_v1|a10_roster_v1|a10_history_v1|a10_mark_v1|a10_operation_v1|b11_links_v1|b11_schedule_v1|b11_detail_v1|c12_context_v1|c12_list_v1|c12_detail_v1|c12_history_v1|c12_submit_v1|c12_decide_v1|c12_operation_v1)$' then
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
