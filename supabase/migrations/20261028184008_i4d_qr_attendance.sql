-- Accepted I4d: Owner credential lifecycle/windows and actor-scoped online capture.
-- Additive; no cards, settings, memberships, marks or access grants seeded.
create table academy.qr_cards(id uuid primary key,academy_id uuid not null,player_id uuid not null,token_hash bytea not null unique,created_at timestamptz not null default clock_timestamp(),revoked_at timestamptz,
 foreign key(player_id,academy_id)references academy.players(id,academy_id),unique(id,academy_id,player_id));
create unique index qr_cards_current on academy.qr_cards(academy_id,player_id)where revoked_at is null;
create table academy.qr_card_heads(academy_id uuid not null,player_id uuid not null,version bigint not null check(version>0),card_id uuid not null,primary key(academy_id,player_id),foreign key(card_id,academy_id,player_id)references academy.qr_cards(id,academy_id,player_id));
create table academy.qr_window_settings(academy_id uuid primary key references academy.academies,version bigint not null check(version>0),before_minutes integer not null check(before_minutes between 0 and 180),after_minutes integer not null check(after_minutes between 0 and 180));
create table academy.qr_window_overrides(academy_id uuid not null,program_id uuid not null,day date not null,before_minutes integer not null check(before_minutes between 0 and 180),after_minutes integer not null check(after_minutes between 0 and 180),primary key(academy_id,program_id,day),foreign key(program_id,day)references academy.training_dates(program_id,local_date));
create index qr_published_branch_time on academy.publication_events(academy_id,branch_id,starts_at,id)where published;
create table academy.qr_operations(actor text not null,id uuid not null,academy_id uuid not null references academy.academies,context text not null,fingerprint text,result jsonb not null,created_at timestamptz not null default clock_timestamp(),primary key(actor,id));
create index qr_operations_scope on academy.qr_operations(academy_id,actor,context);
do $$declare t text;begin foreach t in array array['qr_cards','qr_card_heads','qr_window_settings','qr_window_overrides','qr_operations']loop execute format('alter table academy.%I enable row level security',t);execute format('revoke all on academy.%I from public,anon,authenticated',t);end loop;end$$;
create function academy.q13_scope(a uuid,b uuid)returns boolean language plpgsql security invoker set search_path=''as $$declare s text:=academy.verified_subject();staff uuid;begin
 perform 1 from academy.branches where id=b and academy_id=a;if not found then raise exception 'Access denied'using errcode='42501';end if;
 if academy.a10_owner(a,s)then return true;end if;staff:=academy.t4_trainer(a);
 if not academy.q6_eligible(a,b,staff)then raise exception 'Access denied'using errcode='42501';end if;
 perform 1 from academy.trainer_assignments z join academy.trainer_people p on p.id=z.staff_id join academy.memberships m on m.id=p.membership_id and m.identity_id=p.identity_id and m.academy_id=a join academy.trainer_invitations v on v.id=z.invitation_id where z.staff_id=staff and z.academy_id=a and z.branch_id=b and z.state='active'and m.role='trainer'and m.status='active'and v.state='accepted'for share of z,p,m,v;
 if not found then raise exception 'Access denied'using errcode='42501';end if;return false;end$$;
-- Shared player/roster eligibility for manual and QR. No imported archive state.
create function academy.q13_player(e academy.publication_events,pid uuid)returns void language plpgsql security invoker set search_path=''as $$begin
 perform 1 from academy.players p join academy.publication_rosters r on r.player_id=p.id and r.event_id=e.id where p.id=pid and p.academy_id=e.academy_id and p.branch_id=e.branch_id for share of p;
 if not found then raise exception 'Access denied'using errcode='42501';end if;end$$;
create function academy.q13_window(e academy.publication_events)returns jsonb language sql security invoker set search_path=''as $$
 select jsonb_build_object('version',coalesce(w.version,0),'before',coalesce(o.before_minutes,w.before_minutes,30),'after',coalesce(o.after_minutes,w.after_minutes,30),'override',o.program_id is not null,'opens_at',e.starts_at-make_interval(mins=>coalesce(o.before_minutes,w.before_minutes,30)),'closes_at',e.ends_at+make_interval(mins=>coalesce(o.after_minutes,w.after_minutes,30)))from(select 1)x left join academy.qr_window_settings w on w.academy_id=e.academy_id left join academy.qr_window_overrides o on o.academy_id=e.academy_id and o.program_id=e.program_id and o.day=e.day;
$$;
create function public.q13_context_v1(a uuid)returns jsonb language plpgsql security definer set search_path=''set statement_timeout='3s'set lock_timeout='2s'as $$declare own boolean;b uuid;staff uuid;s text:=academy.verified_subject();begin
 perform academy.t4_lock(a);own:=academy.a10_owner(a,s);if own then select branch_id into b from academy.initial_setup where academy_id=a;else staff:=academy.t4_trainer(a);select z.branch_id into b from academy.trainer_assignments z where z.staff_id=staff and z.academy_id=a and z.state='active'order by z.id limit 1;end if;perform academy.q13_scope(a,b);if b is null then raise exception 'Access denied'using errcode='42501';end if;
 return jsonb_build_object('owner',own,'branch',b,'branch_name',(select name from academy.branches where id=b),'timezone',(select timezone from academy.academies where id=a),'server_now',clock_timestamp(),'settings',jsonb_build_object('version',coalesce((select version from academy.qr_window_settings where academy_id=a),0),'before',coalesce((select before_minutes from academy.qr_window_settings where academy_id=a),30),'after',coalesce((select after_minutes from academy.qr_window_settings where academy_id=a),30)));end$$;
create function public.q13_sessions_v1(a uuid,b uuid,on_day date,after_at timestamptz default null,after_id uuid default null)returns jsonb language plpgsql security definer set search_path=''set statement_timeout='3s'set lock_timeout='2s'as $$declare own boolean;staff uuid;tz text;items jsonb;more boolean;begin
 perform academy.t4_lock(a);own:=academy.q13_scope(a,b);if not own then staff:=academy.t4_trainer(a);end if;
 if on_day is null or not isfinite(on_day)or (after_at is null)<>(after_id is null)or after_at is not null and not isfinite(after_at)then raise exception 'Invalid session cursor'using errcode='22023';end if;select timezone into tz from academy.academies where id=a;
 select coalesce(jsonb_agg(to_jsonb(q)order by q.starts_at,q.id),'[]')into items from(select e.id,e.starts_at,e.ends_at,e.projection,e.roster_count,academy.q13_window(e)as window,(select count(*)from academy.attendance_marks m where m.academy_id=a and m.event_id=e.id and m.status='present')as present
 from academy.publication_events e join academy.publication_heads h on h.event_id=e.id join academy.training_dates d on d.program_id=e.program_id and d.local_date=e.day and d.academy_id=a
 where e.academy_id=a and e.branch_id=b and e.published and not d.canceled and d.starts_at=e.starts_at and d.ends_at=e.ends_at and e.starts_at>=on_day::timestamp at time zone tz and e.starts_at<(on_day+1)::timestamp at time zone tz and(own or e.trainer_id=staff)and(after_at is null or(e.starts_at,e.id)>(after_at,after_id))order by e.starts_at,e.id limit 26)q;
 more:=jsonb_array_length(items)>25;if more then items:=items-25;end if;while jsonb_array_length(items)>1 and octet_length(items::text)>24576 loop items:=items-(jsonb_array_length(items)-1);more:=true;end loop;
 return jsonb_build_object('items',items,'more',more,'server_now',clock_timestamp());end$$;
create function public.q13_card_v1(a uuid,pid uuid)returns jsonb language plpgsql security definer set search_path=''set statement_timeout='3s'set lock_timeout='2s'as $$declare h academy.qr_card_heads;p academy.players;begin
 perform academy.t4_lock(a);if not academy.a10_owner(a,academy.verified_subject())then raise exception 'Access denied'using errcode='42501';end if;select *into p from academy.players where id=pid and academy_id=a;if not found then raise exception 'Access denied'using errcode='42501';end if;select *into h from academy.qr_card_heads where academy_id=a and player_id=pid;
 return jsonb_build_object('player',pid,'name',p.display_name,'branch',p.branch_id,'version',coalesce(h.version,0),'card',h.card_id,'active',coalesce((select revoked_at is null from academy.qr_cards where id=h.card_id),false));end$$;
create function public.q13_card_change_v1(a uuid,pid uuid,act text,expected bigint,code text,op uuid)returns jsonb language plpgsql security definer set search_path=''set statement_timeout='3s'set lock_timeout='2s'as $$declare s text:=academy.verified_subject();h academy.qr_card_heads;c academy.qr_cards;old academy.qr_operations;fp text;result jsonb;ctx text:='card:'||pid;begin
 perform academy.t4_lock(a);if not academy.a10_owner(a,s)then raise exception 'Access denied'using errcode='42501';end if;perform 1 from academy.players where id=pid and academy_id=a for share;if not found then raise exception 'Access denied'using errcode='42501';end if;
 if act is null or act not in('issue','replace','revoke')or expected is null or expected<0 or op is null or (act='revoke'and code is not null)or(act<>'revoke'and(code is null or code!~'^aos:qr:1:[A-Za-z0-9_-]{43}$'))then raise exception 'Invalid credential operation'using errcode='22023';end if;
 perform pg_advisory_xact_lock(hashtextextended('qr-op:'||s||':'||op,0));fp:=encode(extensions.digest(jsonb_build_array(ctx,act,expected,encode(extensions.digest(coalesce(code,''),'sha256'),'hex'))::text,'sha256'),'hex');select *into old from academy.qr_operations where actor=s and id=op;if found then if old.academy_id<>a or old.context<>ctx or old.fingerprint is distinct from fp then return '{"error":"conflict"}';end if;return old.result;end if;
 select *into h from academy.qr_card_heads where academy_id=a and player_id=pid for update;select *into c from academy.qr_cards where id=h.card_id for update;
 if coalesce(h.version,0)<>expected then return '{"error":"stale"}';end if;if act='issue'and c.id is not null and c.revoked_at is null or act in('replace','revoke')and(c.id is null or c.revoked_at is not null)then return '{"error":"stale"}';end if;
 if c.id is not null and c.revoked_at is null then update academy.qr_cards set revoked_at=clock_timestamp()where id=c.id;end if;
 if act<>'revoke'then insert into academy.qr_cards(id,academy_id,player_id,token_hash)values(op,a,pid,extensions.digest(code,'sha256'));end if;
 insert into academy.qr_card_heads(academy_id,player_id,version,card_id)values(a,pid,expected+1,case when act='revoke'then c.id else op end)on conflict(academy_id,player_id)do update set version=excluded.version,card_id=excluded.card_id;
 result:=jsonb_build_object('kind','card','player',pid,'version',expected+1,'card',case when act='revoke'then c.id else op end,'active',act<>'revoke');insert into academy.qr_operations values(s,op,a,ctx,fp,result,clock_timestamp());insert into academy.audit_events(actor,academy_id,action,operation_id,details)values(s,a,'qr.card.'||act,op,jsonb_build_object('player',pid,'version',expected+1));return result;end$$;
create function public.q13_window_change_v1(a uuid,ev uuid,expected bigint,before_minutes integer,after_minutes integer,op uuid)returns jsonb language plpgsql security definer set search_path=''set statement_timeout='3s'set lock_timeout='2s'as $$declare s text:=academy.verified_subject();e academy.publication_events;old academy.qr_operations;fp text;result jsonb;ctx text:='settings';current_version bigint;begin
 perform academy.t4_lock(a);if not academy.a10_owner(a,s)then raise exception 'Access denied'using errcode='42501';end if;if ev is not null then e:=academy.a10_target(a,ev);end if;
 if expected is null or expected<0 or before_minutes is null or before_minutes not between 0 and 180 or after_minutes is null or after_minutes not between 0 and 180 or op is null then raise exception 'Invalid scan window'using errcode='22023';end if;
 perform pg_advisory_xact_lock(hashtextextended('qr-op:'||s||':'||op,0));fp:=encode(extensions.digest(jsonb_build_array(ev,expected,before_minutes,after_minutes)::text,'sha256'),'hex');select *into old from academy.qr_operations where actor=s and id=op;if found then if old.academy_id<>a or old.context<>ctx or old.fingerprint is distinct from fp then return '{"error":"conflict"}';end if;return old.result;end if;
 select version into current_version from academy.qr_window_settings where academy_id=a for update;if coalesce(current_version,0)<>expected then return '{"error":"stale"}';end if;
 insert into academy.qr_window_settings values(a,expected+1,case when ev is null then before_minutes else 30 end,case when ev is null then after_minutes else 30 end)on conflict(academy_id)do update set version=excluded.version,before_minutes=case when ev is null then excluded.before_minutes else qr_window_settings.before_minutes end,after_minutes=case when ev is null then excluded.after_minutes else qr_window_settings.after_minutes end;
 if ev is not null then insert into academy.qr_window_overrides values(a,e.program_id,e.day,before_minutes,after_minutes)on conflict(academy_id,program_id,day)do update set before_minutes=excluded.before_minutes,after_minutes=excluded.after_minutes;end if;
 result:=jsonb_build_object('kind','settings','event',ev,'version',expected+1,'before',before_minutes,'after',after_minutes);insert into academy.qr_operations values(s,op,a,ctx,fp,result,clock_timestamp());insert into academy.audit_events(actor,academy_id,action,operation_id,details)values(s,a,'qr.window.change',op,result);return result;end$$;
-- Scope is explicit, complete and bounded; uniqueness is never inferred from a paged response.
create function academy.q13_matches(a uuid,b uuid,events uuid[],code text)returns jsonb language plpgsql security invoker set search_path=''as $$declare card academy.qr_cards;e academy.publication_events;ev uuid;w jsonb;items jsonb:='[]';m academy.attendance_marks;begin
 perform academy.q13_scope(a,b);if code is null or code!~'^aos:qr:1:[A-Za-z0-9_-]{43}$'or events is null or cardinality(events)not between 1 and 25 or cardinality(events)<>(select count(distinct x)from unnest(events)x)or array_position(events,null)is not null then raise exception 'Invalid scan scope'using errcode='22023';end if;
 -- Validate every selected occurrence before resolving a card, even when no match exists.
 foreach ev in array events loop e:=academy.a10_target(a,ev);if e.branch_id<>b then raise exception 'Access denied'using errcode='42501';end if;end loop;
 select *into card from academy.qr_cards where academy_id=a and token_hash=extensions.digest(code,'sha256')and revoked_at is null for share;if not found then return '{"error":"card_unavailable"}';end if;
 foreach ev in array events loop select *into e from academy.publication_events where id=ev;w:=academy.q13_window(e);
 if clock_timestamp()between(w->>'opens_at')::timestamptz and(w->>'closes_at')::timestamptz and exists(select 1 from academy.publication_rosters where event_id=ev and player_id=card.player_id)then
 perform academy.q13_player(e,card.player_id);select *into m from academy.attendance_marks where program_id=e.program_id and day=e.day and player_id=card.player_id;
 items:=items||jsonb_build_array(jsonb_build_object('event',ev,'player',card.player_id,'name',(select name from academy.publication_rosters where event_id=ev and player_id=card.player_id),'starts_at',e.starts_at,'ends_at',e.ends_at,'projection',e.projection,'status',m.status,'version',coalesce(m.version,0),'card',card.id,'window',w));end if;end loop;
 if jsonb_array_length(items)=0 then return '{"error":"no_match"}';end if;if octet_length(items::text)>24576 then return '{"error":"narrow_scope"}';end if;return jsonb_build_object('items',items);end$$;
create function public.q13_resolve_v1(a uuid,b uuid,events uuid[],code text)returns jsonb language plpgsql security definer set search_path=''set statement_timeout='3s'set lock_timeout='2s'as $$begin perform academy.t4_lock(a);return academy.q13_matches(a,b,events,code);end$$;
create function public.q13_capture_v1(a uuid,b uuid,events uuid[],code text,chosen uuid,op uuid)returns jsonb language plpgsql security definer set search_path=''set statement_timeout='3s'set lock_timeout='2s'as $$declare s text:=academy.verified_subject();own boolean;old academy.qr_operations;fp text;r jsonb;match jsonb;ev uuid;pid uuid;e academy.publication_events;prior academy.attendance_marks;result jsonb;w jsonb;ctx text:='scan:'||b;begin
 perform academy.t4_lock(a);own:=academy.q13_scope(a,b);if op is null then raise exception 'Invalid operation'using errcode='22023';end if;
 perform pg_advisory_xact_lock(hashtextextended('qr-op:'||s||':'||op,0));fp:=encode(extensions.digest(jsonb_build_array(b,(select jsonb_agg(x order by x)from unnest(events)x),encode(extensions.digest(coalesce(code,''),'sha256'),'hex'),chosen)::text,'sha256'),'hex');select *into old from academy.qr_operations where actor=s and id=op;
 if found then if old.academy_id<>a or old.context<>ctx or old.fingerprint is distinct from fp then return '{"error":"conflict"}';end if;if old.result?'event'then perform academy.q13_player(academy.a10_target(a,(old.result->>'event')::uuid),(old.result->>'player')::uuid);end if;return old.result;end if;
 r:=academy.q13_matches(a,b,events,code);if r?'error'then return r;end if;
 if chosen is null then if jsonb_array_length(r->'items')<>1 then return '{"error":"ambiguous"}';end if;match:=r->'items'->0;else select x into match from jsonb_array_elements(r->'items')x where(x->>'event')::uuid=chosen;if match is null then return '{"error":"no_match"}';end if;end if;
 ev:=(match->>'event')::uuid;pid:=(match->>'player')::uuid;e:=academy.a10_target(a,ev);perform academy.q13_player(e,pid);
 perform pg_advisory_xact_lock(hashtextextended('attendance-op:'||s||':'||op,0));select *into prior from academy.attendance_marks where program_id=e.program_id and day=e.day and player_id=pid for update;
 if prior.status='absent'then return '{"error":"correction_required"}';end if;
 result:=jsonb_build_object('kind','scan','event',ev,'player',pid,'name',match->>'name','status','present','version',coalesce(prior.version,1),'already',prior.status='present');
 -- coalesce SQL null -> false for newly recorded receipt.
 result:=jsonb_set(result,'{already}',to_jsonb(coalesce(prior.status='present',false)));
 if prior.version is null then
 insert into academy.attendance_marks values(a,e.program_id,e.day,pid,ev,'present',1);
 insert into academy.attendance_history(id,academy_id,event_id,program_id,day,player_id,actor,actor_role,before_status,status,version,reason,captured_at)values(op,a,ev,e.program_id,e.day,pid,s,case when own then 'owner'else 'trainer'end,null,'present',1,null,clock_timestamp());
 insert into academy.attendance_operations(actor,id,academy_id,event_id,fingerprint,result)values(s,op,a,ev,'qr:'||fp,jsonb_build_object('event',ev,'player',pid,'status','present','version',1));
 insert into academy.audit_events(actor,academy_id,action,operation_id,details)values(s,a,'attendance.record',op,jsonb_build_object('event',ev,'player',pid,'version',1,'method','qr','card',match->>'card'));end if;
 insert into academy.qr_operations values(s,op,a,ctx,fp,result,clock_timestamp());
 w:=academy.q13_window(e);if not(clock_timestamp()between(w->>'opens_at')::timestamptz and(w->>'closes_at')::timestamptz)then raise exception 'QR window closed during commit'using errcode='PT409';end if;return result;end$$;
create function public.q13_operation_v1(a uuid,context text,op uuid)returns jsonb language plpgsql security definer set search_path=''set statement_timeout='3s'set lock_timeout='2s'as $$declare s text:=academy.verified_subject();old academy.qr_operations;begin
 perform academy.t4_lock(a);if context='settings'or context~'^card:[a-f0-9-]{36}$'then if not academy.a10_owner(a,s)then raise exception 'Access denied'using errcode='42501';end if;
 elsif context~'^scan:[a-f0-9-]{36}$'then perform academy.q13_scope(a,substring(context from 6)::uuid);else raise exception 'Invalid recovery context'using errcode='22023';end if;if op is null then raise exception 'Invalid operation'using errcode='22023';end if;
 perform pg_advisory_xact_lock(hashtextextended('qr-op:'||s||':'||op,0));select *into old from academy.qr_operations where actor=s and id=op;
 if found then if old.academy_id<>a or old.context<>context then raise exception 'Access denied'using errcode='42501';end if;if old.result?'event'and old.result->>'kind'='scan'then perform academy.q13_player(academy.a10_target(a,(old.result->>'event')::uuid),(old.result->>'player')::uuid);end if;return old.result;end if;
 insert into academy.qr_operations values(s,op,a,context,null,'{"cancelled":true}',clock_timestamp());insert into academy.audit_events(actor,academy_id,action,operation_id,details)values(s,a,'qr.reconcile_cancel',op,jsonb_build_object('context',context));return '{"cancelled":true}';end$$;
do $$declare f record;begin for f in select p.oid::regprocedure sig,n.nspname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where p.proname like 'q13_%'and n.nspname in('academy','public')loop execute format('revoke all on function %s from public,anon,authenticated',f.sig);if f.nspname='public'then execute format('grant execute on function %s to authenticated',f.sig);end if;end loop;end$$;

-- Preserve manual/correction timing and transitions; share only target eligibility.
create or replace function public.a10_mark_v1(a uuid,ev uuid,player uuid,new_status text,expected_version bigint,reason text,captured_at timestamptz,op uuid)returns jsonb language plpgsql security definer set search_path=''set statement_timeout='3s'set lock_timeout='2s'as $$
declare e academy.publication_events;s text;owner_actor boolean;prior academy.attendance_marks;old academy.attendance_operations;fp text;result jsonb;begin
 perform academy.t4_lock(a);e:=academy.a10_target(a,ev);s:=academy.verified_subject();owner_actor:=academy.a10_owner(a,s);
 if op is null or player is null or new_status is null or new_status not in('present','absent')or expected_version is null or expected_version<0 or captured_at is null or not isfinite(captured_at)or length(coalesce(reason,''))>500 then raise exception 'Invalid attendance'using errcode='22023';end if;
 perform pg_advisory_xact_lock(hashtextextended('attendance-op:'||s||':'||op,0));
 fp:=encode(extensions.digest(jsonb_build_object('event',ev,'player',player,'status',new_status,'version',expected_version,'reason',reason,'captured_at',captured_at)::text,'sha256'),'hex');
 select *into old from academy.attendance_operations where actor=s and id=op;if found then if old.academy_id<>a or old.event_id<>ev or old.fingerprint is distinct from fp then return '{"error":"conflict"}';end if;return old.result;end if;
 perform academy.q13_player(e,player);
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
 if method is distinct from 'POST' or path is null or path !~ '^/rpc/(m1_context_v1|m1_platform_list_v1|m1_setup_v1|m1_operation_v1|m1_create_v1|m1_save_setup_v1|m1_manage_invitation_v1|m1_invitation_v1|bootstrap_identity_v1|my_academy_memberships_v1|i2_people_v1|i2_candidates_v1|i2_profile_v1|i2_register_v1|i2_operation_v1|g3_owner_list_v1|g3_command_v1|g3_operation_v1|g3_invitation_v1|g3_links_v1|t4_owner_list_v1|t4_command_v1|t4_operation_v1|t4_invitation_v1|t4_profile_v1|p5_list_v1|p5_preview_v1|p5_create_v1|p5_read_v1|p5_step_v1|p5_operation_v1|p5_dates_v1|q6_read_v1|q6_candidates_v1|q6_review_v1|q6_save_v1|q6_operation_v1|r7_create_v1|r7_list_v1|r7_read_v1|r7_change_v1|r7_operation_v1|s8_create_v1|s8_read_v1|s8_jobs_v1|s8_change_v1|s8_operation_v1|s8_owner_dates_v1|s8_schedule_v1|s8_roster_v1|q6_review_v2|q6_save_v2|t9_read_v1|t9_review_v1|t9_save_v1|t9_operation_v1|a10_roster_v1|a10_history_v1|a10_mark_v1|a10_operation_v1|b11_links_v1|b11_schedule_v1|b11_detail_v1|c12_context_v1|c12_list_v1|c12_detail_v1|c12_history_v1|c12_submit_v1|c12_decide_v1|c12_operation_v1|q13_context_v1|q13_sessions_v1|q13_card_v1|q13_card_change_v1|q13_window_change_v1|q13_resolve_v1|q13_capture_v1|q13_operation_v1)$' then
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
