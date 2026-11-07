-- Accepted I3e: preserve the original composite occurrence identity; effective date is separate.
alter table academy.training_dates add column scheduled_date date,add column canceled boolean not null default false,add column schedule_version bigint not null default 1 check(schedule_version>0);
update academy.training_dates set scheduled_date=local_date;
alter table academy.training_dates alter column scheduled_date set not null;
create function academy.t9_date_default()returns trigger language plpgsql security invoker set search_path=''as $$begin new.scheduled_date:=coalesce(new.scheduled_date,new.local_date);return new;end$$;
create trigger training_date_default before insert on academy.training_dates for each row execute function academy.t9_date_default();
create unique index training_dates_active_day on academy.training_dates(program_id,scheduled_date)where not canceled;
create index training_dates_effective_window on academy.training_dates(academy_id,scheduled_date,program_id);
create table academy.session_changes(
 id uuid primary key,academy_id uuid not null,program_id uuid not null,day date not null,actor text not null,
 kind text not null check(kind in('move','cancel')),reason text not null check(length(trim(reason))between 1 and 240),
 before_state jsonb not null,after_state jsonb not null,created_at timestamptz not null default now(),
 foreign key(program_id,day,academy_id)references academy.training_dates(program_id,local_date,academy_id));
create index session_changes_scope on academy.session_changes(academy_id,program_id,day,created_at desc,id desc);
create table academy.session_change_operations(actor text not null,id uuid not null,academy_id uuid not null references academy.academies,fingerprint text,result jsonb not null,created_at timestamptz not null default now(),primary key(actor,id));
create index session_change_operations_scope on academy.session_change_operations(academy_id);
alter table academy.session_changes enable row level security;alter table academy.session_change_operations enable row level security;
revoke all on academy.session_changes,academy.session_change_operations from public,anon,authenticated;
alter table academy.program_plan_targets add column schedule_version bigint not null default 1;
alter table academy.publication_targets add column schedule_version bigint not null default 1;
create or replace function public.q6_read_v1(a uuid,p uuid,day date,after_id uuid default null) returns jsonb language plpgsql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s' as $$
declare d academy.training_dates:=academy.q6_target(a,p,day);plan academy.date_plans;ctx jsonb:=academy.p5_context(a);items jsonb;who jsonb;more boolean;begin
 select * into plan from academy.date_plans x where x.academy_id=a and x.program_id=p and x.local_date=day;
 select jsonb_build_object('id',x.id,'name',x.display_name,'eligible',academy.q6_eligible(a,(ctx->>'branch_id')::uuid,x.id)) into who from academy.trainer_people x where x.academy_id=a and x.id=plan.trainer_id;
 select coalesce(jsonb_agg(to_jsonb(q) order by q.id),'[]') into items from (select x.id,x.display_name name from academy.date_rosters r join academy.players x on x.id=r.player_id and x.academy_id=r.academy_id where r.academy_id=a and r.program_id=p and r.local_date=day and (after_id is null or x.id>after_id) order by x.id limit 26)q;
 more:=jsonb_array_length(items)>25;if more then items:=items-25;end if;
 return jsonb_build_object('context',ctx,'program',p,'name',(select definition->>'name' from academy.training_programs where id=p and academy_id=a),'day',day,'scheduled_day',d.scheduled_date,'canceled',d.canceled,'schedule_version',d.schedule_version,'start',to_char(d.starts_local,'HH24:MI'),'end',to_char(d.ends_local,'HH24:MI'),'timezone',(select timezone from academy.training_programs where id=p and academy_id=a),'published',exists(select 1 from academy.publication_heads h join academy.publication_events e on e.id=h.event_id where h.academy_id=a and h.program_id=p and h.day=q6_read_v1.day and e.published),'version',coalesce(plan.version,0),'capacity',plan.capacity,'trainer',who,'count',coalesce(plan.roster_count,0),'players',items,'more',more);
end $$;
create or replace function academy.q6_change(a uuid,p uuid,day date,expected_version bigint,capacity integer,trainer uuid,add_ids uuid[],remove_ids uuid[],op uuid) returns jsonb language plpgsql security invoker set search_path='' as $$
declare s text;d academy.training_dates;ctx jsonb;old academy.planning_operations;plan academy.date_plans;v bigint;n integer;fp text;payload jsonb;result jsonb;conflict record;begin
 perform academy.t4_lock(a);s:=academy.i2_owner(a);d:=academy.q6_target(a,p,day);ctx:=academy.p5_context(a);
 if op is not null then perform pg_advisory_xact_lock(hashtextextended('planning-op:'||s||':'||op::text,0));end if;
 if capacity is null or capacity<1 or expected_version is null or expected_version<0 or add_ids is null or remove_ids is null or cardinality(add_ids)+cardinality(remove_ids)>25 or array_position(add_ids,null) is not null or array_position(remove_ids,null) is not null
 or (select count(distinct x) from unnest(add_ids)x)<>cardinality(add_ids) or (select count(distinct x) from unnest(remove_ids)x)<>cardinality(remove_ids) or add_ids&&remove_ids then raise exception 'Invalid plan' using errcode='22023';end if;
 select coalesce(array_agg(x order by x),'{}') into add_ids from unnest(add_ids)x;select coalesce(array_agg(x order by x),'{}') into remove_ids from unnest(remove_ids)x;
 payload:=jsonb_build_object('program',p,'day',day,'version',expected_version,'capacity',capacity,'trainer',trainer,'add',add_ids,'remove',remove_ids);fp:=encode(extensions.digest(payload::text,'sha256'),'hex');
 if op is not null then
 select * into old from academy.planning_operations where actor=s and id=op;
 if found then if old.academy_id<>a or old.fingerprint is distinct from fp then raise exception 'Operation conflict' using errcode='PT409';end if;return old.result;end if;
 end if;
 select * into plan from academy.date_plans x where x.academy_id=a and x.program_id=p and x.local_date=day for update;
 if exists(select 1 from academy.publication_heads h join academy.publication_events e on e.id=h.event_id where h.academy_id=a and h.program_id=p and h.day=q6_change.day and e.published)then return '{"error":"published_locked"}';end if;if d.canceled then return '{"error":"canceled"}';end if;v:=coalesce(plan.version,0);if v<>expected_version then return jsonb_build_object('error','stale');end if;
 if trainer is not null then perform 1 from academy.trainer_people x join academy.memberships m on m.id=x.membership_id and m.identity_id=x.identity_id and m.academy_id=x.academy_id join academy.trainer_assignments z on z.staff_id=x.id and z.academy_id=x.academy_id join academy.trainer_invitations iv on iv.id=z.invitation_id and iv.academy_id=x.academy_id where x.id=trainer and x.academy_id=a for share of m,z,iv;end if;
 if trainer is not null and not academy.q6_eligible(a,(ctx->>'branch_id')::uuid,trainer) then return jsonb_build_object('error','trainer_unavailable');end if;
 if exists(select 1 from unnest(add_ids||remove_ids) as requested(player_id) where not exists(select 1 from academy.players x where x.id=requested.player_id and x.academy_id=a and x.branch_id=(ctx->>'branch_id')::uuid)) then raise exception 'Access denied' using errcode='42501';end if;
 if exists(select 1 from unnest(add_ids) id join academy.date_rosters r on r.player_id=id and r.academy_id=a and r.program_id=p and r.local_date=day) then return jsonb_build_object('error','duplicate');end if;
 if exists(select 1 from unnest(remove_ids) id where not exists(select 1 from academy.date_rosters r where r.academy_id=a and r.program_id=p and r.local_date=day and r.player_id=id)) then return jsonb_build_object('error','stale');end if;
 select count(*) into n from academy.date_rosters r where r.academy_id=a and r.program_id=p and r.local_date=day;
 if n<>coalesce(plan.roster_count,0) then raise exception 'Roster invariant' using errcode='XX000';end if;
 n:=n+cardinality(add_ids)-cardinality(remove_ids);if n>capacity then return jsonb_build_object('error','full');end if;
 select z.program_id,z.local_date into conflict from academy.date_plans z where z.academy_id=a and exists(select 1 from academy.training_dates live where live.program_id=z.program_id and live.local_date=z.local_date and live.academy_id=z.academy_id and not live.canceled) and (z.program_id,z.local_date)<>(p,day) and z.starts_at<d.ends_at and z.ends_at>d.starts_at and (
 (trainer is not null and z.trainer_id=trainer) or exists(select 1 from academy.date_rosters r where r.academy_id=a and r.program_id=z.program_id and r.local_date=z.local_date and (r.player_id=any(add_ids) or (r.player_id<>all(remove_ids) and exists(select 1 from academy.date_rosters mine where mine.academy_id=a and mine.program_id=p and mine.local_date=day and mine.player_id=r.player_id))))) limit 1;
 if found then return jsonb_build_object('error','overlap','day',conflict.local_date);end if;
 result:=jsonb_build_object('program',p,'day',day,'version',v+1);
 if op is null then return jsonb_build_object('reviewed',true,'version',v,'count',n);end if;
 insert into academy.date_plans(academy_id,program_id,local_date,branch_id,capacity,trainer_id,roster_count,starts_at,ends_at,version) values(a,p,day,(ctx->>'branch_id')::uuid,capacity,trainer,n,d.starts_at,d.ends_at,v+1)
 on conflict(program_id,local_date) do update set capacity=excluded.capacity,trainer_id=excluded.trainer_id,roster_count=excluded.roster_count,version=excluded.version;
 delete from academy.date_rosters r where r.academy_id=a and r.program_id=p and r.local_date=day and r.player_id=any(remove_ids);
 insert into academy.date_rosters(academy_id,program_id,local_date,player_id) select a,p,day,id from unnest(add_ids) id;
 insert into academy.planning_operations(actor,id,academy_id,fingerprint,payload,result) values(s,op,a,fp,payload,result);
 insert into academy.audit_events(actor,academy_id,action,operation_id,details) values(s,a,'planning.save',op,jsonb_build_object('program_id',p,'day',day,'version',v+1,'added',cardinality(add_ids),'removed',cardinality(remove_ids),'trainer_changed',plan.trainer_id is distinct from trainer));return result;
end $$;
create or replace function public.p5_read_v1(a uuid,program uuid,idx integer default 0) returns jsonb language plpgsql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s' as $$
declare ctx jsonb:=academy.p5_context(a);p academy.training_programs;rows jsonb;begin
 select * into p from academy.training_programs where id=program and academy_id=a for share;
 if not found then raise exception 'Access denied' using errcode='42501';end if;
 if idx is null or idx<0 or idx>=p.window_count then raise exception 'Invalid window' using errcode='22023';end if;
 rows:='[]';if p.state='ready' then select coalesce(jsonb_agg(to_jsonb(q) order by q.date),'[]') into rows from
 (select local_date::text date,scheduled_date::text "scheduledDate",canceled,to_char(starts_local,'HH24:MI') start,to_char(ends_local,'HH24:MI') "end",starts_at "utcStart",ends_at "utcEnd" from academy.training_dates where program_id=p.id and local_date between p.starts_on+idx*28 and least(p.ends_on,p.starts_on+idx*28+27)) q;end if;
 return jsonb_build_object('context',ctx,'program',academy.p5_projection(p),'dates',rows,'window',idx);
end $$;
create or replace function public.p5_dates_v1(a uuid,day_start date,after_day date default null,after_program uuid default null) returns jsonb language plpgsql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s' as $$
declare ctx jsonb:=academy.p5_context(a);items jsonb;more boolean;begin
 if day_start is null or (after_day is null)<>(after_program is null) then raise exception 'Invalid date cursor' using errcode='22023';end if;
 select coalesce(jsonb_agg(to_jsonb(q) order by q.date,q.program_id),'[]') into items from (
 select d.local_date::text date,d.scheduled_date::text scheduled_date,d.canceled,d.program_id,(d.local_date-p.starts_on)/28 "window",p.definition->>'name' name,to_char(d.starts_local,'HH24:MI') start,to_char(d.ends_local,'HH24:MI') "end",p.timezone
 from academy.training_dates d join academy.training_programs p on p.id=d.program_id
 where d.academy_id=a and p.academy_id=a and p.state='ready' and d.scheduled_date between day_start and day_start+27
 and (after_day is null or (d.local_date,d.program_id)>(after_day,after_program)) order by d.local_date,d.program_id limit 26) q;
 more:=jsonb_array_length(items)>25;if more then items:=items-25;end if;return jsonb_build_object('items',items,'more',more,'from',day_start,'to',day_start+27);
end $$;
create or replace function public.r7_create_v1(a uuid,p uuid,op uuid,first_date date,last_date date,rules jsonb) returns jsonb language plpgsql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s' as $$
declare s text;ctx jsonb;prog academy.training_programs;fp text;old academy.program_plan_operations;pair record;result jsonb;begin
 perform academy.t4_lock(a);s:=academy.i2_owner(a);ctx:=academy.p5_context(a);
 if op is null or first_date is null or last_date is null or first_date>last_date or jsonb_typeof(rules) is distinct from 'object' or (select count(*) from jsonb_object_keys(rules)) not between 1 and 7 then raise exception 'Invalid proposal' using errcode='22023';end if;
 for pair in select key,value from jsonb_each(rules) loop
 if pair.key !~ '^[0-6]$' or jsonb_typeof(pair.value) is distinct from 'object' or pair.value-array['capacity','trainer','players']<>'{}'::jsonb or jsonb_typeof(pair.value->'capacity') is distinct from 'number' or (pair.value->>'capacity')!~ '^[1-9][0-9]*$' or (pair.value->>'capacity')::bigint>2147483647 or not pair.value?'trainer' then raise exception 'Invalid rule' using errcode='22023';end if;
 if pair.value->>'trainer' is not null then perform (pair.value->>'trainer')::uuid;end if;
 if pair.value?'players' then if jsonb_typeof(pair.value->'players')is distinct from 'array' or jsonb_array_length(pair.value->'players')>25 then raise exception 'Invalid players'using errcode='22023';end if;
 if (select count(distinct v::uuid)from jsonb_array_elements_text(pair.value->'players')v)<>jsonb_array_length(pair.value->'players')or exists(select 1 from jsonb_array_elements_text(pair.value->'players')requested(player_id)where not exists(select 1 from academy.players pp where pp.id=requested.player_id::uuid and pp.academy_id=a and pp.branch_id=(ctx->>'branch_id')::uuid))then raise exception 'Invalid players'using errcode='22023';end if;end if;
 end loop;
 perform pg_advisory_xact_lock(hashtextextended('program-plan-op:'||s||':'||op::text,0));fp:=encode(extensions.digest(jsonb_build_object('p',p,'from',first_date,'to',last_date,'rules',rules)::text,'sha256'),'hex');
 select * into old from academy.program_plan_operations where actor=s and id=op;
 if found then if old.academy_id<>a or old.fingerprint is distinct from fp then return '{"error":"conflict"}';end if;return old.result;end if;
 select * into prog from academy.training_programs where id=p and academy_id=a and state='ready' and branch_id=(ctx->>'branch_id')::uuid for share;
 if not found then raise exception 'Access denied' using errcode='42501';end if;
 if first_date<prog.starts_on or last_date>prog.ends_on then raise exception 'Invalid range' using errcode='22023';end if;
 if not exists(select 1 from academy.training_dates d where d.program_id=p and d.academy_id=a and not d.canceled and d.local_date between first_date and last_date and rules?extract(dow from d.local_date)::integer::text) then raise exception 'Empty proposal' using errcode='22023';end if;
 insert into academy.program_plans(id,academy_id,program_id,actor,scope_from,scope_to,rules,context_version) values(op,a,p,s,first_date,last_date,(select jsonb_object_agg(key,value-'players')from jsonb_each(rules)),prog.context_version);
 insert into academy.program_plan_targets(job_id,academy_id,program_id,day,expected_version,schedule_version) select op,a,p,d.local_date,coalesce(dp.version,0),d.schedule_version from academy.training_dates d left join academy.date_plans dp on dp.program_id=d.program_id and dp.local_date=d.local_date and dp.academy_id=d.academy_id where d.program_id=p and d.academy_id=a and not d.canceled and d.local_date between first_date and last_date and rules?extract(dow from d.local_date)::integer::text;
 insert into academy.program_plan_players(job_id,academy_id,weekday,player_id) select op,a,key::integer,v::uuid from jsonb_each(rules)cross join lateral jsonb_array_elements_text(coalesce(value->'players','[]'))v;
 result:=jsonb_build_object('job',op,'version',1,'state','preparing');insert into academy.program_plan_operations values(s,op,a,fp,result,now());insert into academy.audit_events(actor,academy_id,action,operation_id,details)values(s,a,'program_plan.create',op,jsonb_build_object('program_id',p));return result;
end $$;
create or replace function academy.r7_problem(j uuid,day_date date) returns text language plpgsql security invoker set search_path='' as $$
declare job academy.program_plans;t academy.program_plan_targets;d academy.training_dates;r jsonb;b uuid;n integer;begin
 select * into job from academy.program_plans where id=j;select * into t from academy.program_plan_targets where job_id=j and day=day_date;
 if not found then raise exception 'Invalid target' using errcode='22023';end if;
 if coalesce((select version from academy.date_plans where program_id=t.program_id and local_date=t.day and academy_id=t.academy_id),0)<>t.expected_version then return 'stale';end if;
 if t.schedule_version<>(select schedule_version from academy.training_dates where program_id=t.program_id and local_date=t.day and academy_id=t.academy_id)then return 'stale';end if;if exists(select 1 from academy.training_dates where program_id=t.program_id and local_date=t.day and academy_id=t.academy_id and canceled)then return 'canceled';end if;if t.expected_version>0 then return null;end if;
 select * into d from academy.training_dates where program_id=t.program_id and local_date=t.day and academy_id=t.academy_id;
 r:=job.rules->extract(dow from t.day)::integer::text;select branch_id into b from academy.training_programs where id=job.program_id;
 select count(*) into n from academy.program_plan_players where job_id=j and weekday=extract(dow from t.day)::integer;
 if n>(r->>'capacity')::integer then return 'full';end if;
 if exists(select 1 from academy.program_plan_players z join academy.players p on p.id=z.player_id and p.academy_id=z.academy_id where z.job_id=j and z.weekday=extract(dow from t.day)::integer and p.branch_id<>b) then return 'denied';end if;
 if r->>'trainer' is not null and not academy.q6_eligible(job.academy_id,b,(r->>'trainer')::uuid) then return 'trainer_unavailable';end if;
 if exists(select 1 from academy.date_plans p where p.academy_id=job.academy_id and exists(select 1 from academy.training_dates live where live.program_id=p.program_id and live.local_date=p.local_date and live.academy_id=p.academy_id and not live.canceled) and p.starts_at<d.ends_at and p.ends_at>d.starts_at and (
 (r->>'trainer' is not null and p.trainer_id=(r->>'trainer')::uuid) or exists(select 1 from academy.date_rosters dr join academy.program_plan_players pp on pp.player_id=dr.player_id and pp.academy_id=dr.academy_id where dr.program_id=p.program_id and dr.local_date=p.local_date and dr.academy_id=p.academy_id and pp.job_id=j and pp.weekday=extract(dow from t.day)::integer))) then return 'overlap';end if;
 return null;
end $$;
create or replace function public.s8_create_v1(a uuid,p uuid,op uuid,kind text,first_date date,last_date date,weekdays integer[])returns jsonb language plpgsql security definer set search_path=''set statement_timeout='3s'set lock_timeout='2s'as $$
declare s text;fp text;old academy.publication_operations;result jsonb;begin
 perform academy.t4_lock(a);s:=academy.i2_owner(a);
 if op is null or kind not in('publish','withdraw')or first_date is null or last_date is null or first_date>last_date or weekdays is null or cardinality(weekdays)not between 1 and 7 or exists(select 1 from unnest(weekdays)x where x not between 0 and 6 or x is null)or(select count(distinct x)from unnest(weekdays)x)<>cardinality(weekdays)then raise exception 'Invalid scope'using errcode='22023';end if;
 select array_agg(x order by x)into weekdays from unnest(weekdays)x;
 perform pg_advisory_xact_lock(hashtextextended('publication-op:'||s||':'||op,0));fp:=encode(extensions.digest(jsonb_build_object('program',p,'kind',kind,'from',first_date,'to',last_date,'weekdays',weekdays)::text,'sha256'),'hex');
 select * into old from academy.publication_operations where actor=s and id=op;if found then if old.academy_id<>a or old.fingerprint is distinct from fp then return '{"error":"conflict"}';end if;return old.result;end if;
 perform 1 from academy.training_programs where id=p and academy_id=a and state='ready'and branch_id=(academy.p5_context(a)->>'branch_id')::uuid and context_version=(academy.p5_context(a)->>'version')::integer;if not found then raise exception 'Access denied'using errcode='42501';end if;
 if not exists(select 1 from academy.training_programs where id=p and academy_id=a and first_date>=starts_on and last_date<=ends_on)then raise exception 'Invalid range'using errcode='22023';end if;
 insert into academy.publication_jobs(id,academy_id,program_id,actor,kind,first_date,last_date,weekdays)values(op,a,p,s,kind,first_date,last_date,weekdays);
 insert into academy.publication_targets(job_id,academy_id,program_id,day,plan_version,head_id,changing,schedule_version)
 select op,a,p,d.local_date,coalesce(dp.version,0),h.event_id,case when kind='publish'then not coalesce(e.published,false)else coalesce(e.published,false)end,d.schedule_version
 from academy.training_dates d left join academy.date_plans dp on dp.program_id=d.program_id and dp.local_date=d.local_date and dp.academy_id=d.academy_id left join academy.publication_heads h on h.program_id=d.program_id and h.day=d.local_date and h.academy_id=d.academy_id left join academy.publication_events e on e.id=h.event_id
 where d.program_id=p and d.academy_id=a and not d.canceled and d.local_date between first_date and last_date and extract(dow from d.local_date)::integer=any(weekdays);
 if not exists(select 1 from academy.publication_targets where job_id=op and changing)then raise exception 'No changes'using errcode='22023';end if;
 result:=jsonb_build_object('job',op,'version',1,'state','preparing');insert into academy.publication_operations(actor,id,academy_id,fingerprint,result)values(s,op,a,fp,result);insert into academy.audit_events(actor,academy_id,action,operation_id,details)values(s,a,'publication.create',op,jsonb_build_object('program_id',p,'kind',kind));return result;
end$$;
create or replace function academy.s8_problem(j uuid,target_day date)returns text language plpgsql security invoker set search_path=''as $$
declare job academy.publication_jobs;t academy.publication_targets;dp academy.date_plans;head uuid;r jsonb;begin
 select * into job from academy.publication_jobs where id=j;select * into t from academy.publication_targets where job_id=j and day=target_day;
 select * into dp from academy.date_plans where program_id=t.program_id and local_date=t.day and academy_id=t.academy_id;
 select event_id into head from academy.publication_heads where program_id=t.program_id and day=t.day and academy_id=t.academy_id;
 if coalesce(dp.version,0)<>t.plan_version or head is distinct from t.head_id then return 'stale';end if;
 if t.schedule_version<>(select schedule_version from academy.training_dates where program_id=t.program_id and local_date=t.day and academy_id=t.academy_id)then return 'stale';end if;if exists(select 1 from academy.training_dates where program_id=t.program_id and local_date=t.day and academy_id=t.academy_id and canceled)then return 'canceled';end if;if not t.changing then return null;end if;
 if dp.version is null then return 'not_ready';end if;
 if dp.starts_at<=clock_timestamp()then return 'started';end if;
 if job.kind='withdraw'then return null;end if;
 if dp.trainer_id is null or not academy.q6_eligible(job.academy_id,dp.branch_id,dp.trainer_id)then return 'trainer_unavailable';end if;
 if exists(select 1 from academy.date_rosters r join academy.players p on p.id=r.player_id and p.academy_id=r.academy_id where r.program_id=t.program_id and r.local_date=t.day and r.academy_id=t.academy_id and p.branch_id<>dp.branch_id)then return 'denied';end if;
 r:=academy.q6_change(job.academy_id,t.program_id,t.day,dp.version,dp.capacity,dp.trainer_id,'{}','{}',null);
 return r->>'error';
end$$;
create or replace function public.s8_read_v1(a uuid,j uuid,after_day date default null)returns jsonb language plpgsql security definer set search_path=''set statement_timeout='3s'set lock_timeout='2s'as $$
declare job academy.publication_jobs:=academy.s8_job(a,j);items jsonb;more boolean;begin
 select coalesce(jsonb_agg(to_jsonb(q)order by q.day),'[]')into items from(select t.day,d.scheduled_date scheduled_day,d.canceled,t.plan_version,t.prepared,t.problem,t.changing,dp.capacity,dp.roster_count,(select display_name from academy.trainer_people who where who.id=dp.trainer_id and who.academy_id=a)trainer,to_char(d.starts_local,'HH24:MI')start,to_char(d.ends_local,'HH24:MI')finish from academy.publication_targets t join academy.training_dates d on d.program_id=t.program_id and d.local_date=t.day and d.academy_id=t.academy_id left join academy.date_plans dp on dp.program_id=t.program_id and dp.local_date=t.day and dp.academy_id=t.academy_id where t.job_id=j and(after_day is null or t.day>after_day)order by t.day limit 26)q;
 more:=jsonb_array_length(items)>25;if more then items:=items-25;end if;
 return jsonb_build_object('job',j,'program',job.program_id,'kind',job.kind,'version',job.version,'state',job.state,'from',job.first_date,'to',job.last_date,'weekdays',job.weekdays,'items',items,'more',more,'total',(select count(*)from academy.publication_targets where job_id=j),'changes',(select count(*)from academy.publication_targets where job_id=j and changing),'prepared',(select count(*)from academy.publication_targets where job_id=j and prepared),'blocked',(select count(*)from academy.publication_targets where job_id=j and problem is not null));
end$$;
create or replace function public.s8_owner_dates_v1(a uuid,p uuid,after_day date default null)returns jsonb language plpgsql security definer set search_path=''set statement_timeout='3s'set lock_timeout='2s'as $$
declare ctx jsonb:=academy.p5_context(a);items jsonb;more boolean;begin
 perform 1 from academy.training_programs where id=p and academy_id=a and state='ready'and branch_id=(ctx->>'branch_id')::uuid;if not found then raise exception 'Access denied'using errcode='42501';end if;
 select coalesce(jsonb_agg(to_jsonb(q)order by q.day),'[]')into items from(select d.local_date as day,d.scheduled_date scheduled_day,d.canceled,to_char(d.starts_local,'HH24:MI')start,to_char(d.ends_local,'HH24:MI')finish,dp.version,dp.capacity,dp.roster_count,coalesce(e.published,false)published,(select display_name from academy.trainer_people who where who.id=dp.trainer_id and who.academy_id=a)trainer,academy.q6_eligible(a,(ctx->>'branch_id')::uuid,dp.trainer_id)eligible from academy.training_dates d left join academy.date_plans dp on dp.program_id=d.program_id and dp.local_date=d.local_date and dp.academy_id=d.academy_id left join academy.publication_heads h on h.program_id=d.program_id and h.day=d.local_date and h.academy_id=d.academy_id left join academy.publication_events e on e.id=h.event_id where d.program_id=p and d.academy_id=a and(after_day is null or d.local_date>after_day)order by d.local_date limit 26)q;
 more:=jsonb_array_length(items)>25;if more then items:=items-25;end if;return jsonb_build_object('items',items,'more',more);
end$$;
create or replace function public.s8_change_v1(a uuid,j uuid,op uuid,expected_version bigint,act text)returns jsonb language plpgsql security definer set search_path=''set statement_timeout='3s'set lock_timeout='2s'as $$
declare s text;job academy.publication_jobs;old academy.publication_operations;fp text;target_row record;issue text;result jsonb;ctx jsonb;ev uuid;begin
 perform academy.t4_lock(a);s:=academy.i2_owner(a);job:=academy.s8_job(a,j);ctx:=academy.p5_context(a);
 if op is null or expected_version is null or expected_version<1 or act not in('prepare','activate','cancel')then raise exception 'Invalid command'using errcode='22023';end if;
 perform pg_advisory_xact_lock(hashtextextended('publication-op:'||s||':'||op,0));fp:=encode(extensions.digest(jsonb_build_object('job',j,'version',expected_version,'act',act)::text,'sha256'),'hex');
 select * into old from academy.publication_operations where actor=s and id=op;if found then if old.academy_id<>a or old.fingerprint is distinct from fp then return '{"error":"conflict"}';end if;return old.result;end if;
 select * into job from academy.publication_jobs where id=j for update;if job.version<>expected_version then return '{"error":"stale"}';end if;if job.state in('committed','cancelled')then return '{"error":"conflict"}';end if;
 if act='prepare'then
 for target_row in select day from academy.publication_targets where job_id=j and not prepared order by day limit 25 for update loop
 issue:=academy.s8_problem(j,target_row.day);update academy.publication_targets set prepared=true,problem=issue where job_id=j and day=target_row.day;end loop;
 if not exists(select 1 from academy.publication_targets where job_id=j and not prepared)then update academy.publication_jobs set state='ready'where id=j;end if;
 elsif act='cancel'then update academy.publication_jobs set state='cancelled'where id=j;
 else
 if job.state<>'ready'or exists(select 1 from academy.publication_targets where job_id=j and(not prepared or problem is not null))then return '{"error":"not_ready"}';end if;
 -- Same lifecycle lock as planning/staff end. Lock mutable identity and eligibility sources too.
 perform 1 from academy.trainer_people p join academy.memberships m on m.id=p.membership_id and m.identity_id=p.identity_id and m.academy_id=p.academy_id join academy.trainer_assignments z on z.staff_id=p.id and z.academy_id=p.academy_id join academy.trainer_invitations iv on iv.id=z.invitation_id and iv.academy_id=p.academy_id where p.academy_id=a and p.id in(select dp.trainer_id from academy.date_plans dp join academy.publication_targets t on t.program_id=dp.program_id and t.day=dp.local_date and t.academy_id=dp.academy_id where t.job_id=j and t.changing)for share of p,m,z,iv;
 perform 1 from academy.players p join academy.date_rosters r on r.player_id=p.id and r.academy_id=p.academy_id join academy.publication_targets t on t.program_id=r.program_id and t.day=r.local_date and t.academy_id=r.academy_id where t.job_id=j and t.changing for share of p;
 if(select count(*)from academy.training_dates d where d.program_id=job.program_id and d.academy_id=a and d.local_date between job.first_date and job.last_date and extract(dow from d.local_date)::integer=any(job.weekdays))<>(select count(*)from academy.publication_targets where job_id=j)then return '{"error":"stale"}';end if;
 for target_row in select day from academy.publication_targets where job_id=j order by day loop issue:=academy.s8_problem(j,target_row.day);if issue is not null then return jsonb_build_object('error',issue,'day',target_row.day);end if;end loop;
 for target_row in select t.day,dp.* from academy.publication_targets t join academy.date_plans dp on dp.program_id=t.program_id and dp.local_date=t.day and dp.academy_id=t.academy_id where t.job_id=j and t.changing order by t.day loop
 insert into academy.publication_events(academy_id,program_id,day,job_id,published,plan_version,trainer_id,branch_id,capacity,roster_count,starts_at,ends_at,projection)
 values(a,job.program_id,target_row.day,j,job.kind='publish',target_row.version,target_row.trainer_id,target_row.branch_id,target_row.capacity,target_row.roster_count,target_row.starts_at,target_row.ends_at,jsonb_build_object('name',(select definition->>'name'from academy.training_programs where id=job.program_id),'branch',ctx->>'branch_name','sport',ctx->>'sport_name','sport_ar',ctx->>'sport_name_ar','timezone',ctx->>'timezone','scheduled_day',(select scheduled_date from academy.training_dates where program_id=job.program_id and local_date=target_row.day and academy_id=a)))returning id into ev;
 if job.kind='publish'then insert into academy.publication_rosters(event_id,player_id,name)select ev,p.id,p.display_name from academy.date_rosters r join academy.players p on p.id=r.player_id and p.academy_id=r.academy_id where r.academy_id=a and r.program_id=job.program_id and r.local_date=target_row.day;end if;
 insert into academy.publication_heads values(a,job.program_id,target_row.day,ev)on conflict(program_id,day)do update set event_id=excluded.event_id;
 end loop;
 if exists(select 1 from academy.publication_targets t join academy.date_plans dp on dp.program_id=t.program_id and dp.local_date=t.day and dp.academy_id=t.academy_id where t.job_id=j and t.changing and dp.starts_at<=clock_timestamp())then raise exception 'Date started during activation'using errcode='PT409';end if;update academy.publication_jobs set state='committed'where id=j;
 end if;
 update academy.publication_jobs set version=version+1 where id=j returning jsonb_build_object('job',id,'version',version,'state',state)into result;
 insert into academy.publication_operations(actor,id,academy_id,fingerprint,result)values(s,op,a,fp,result);insert into academy.audit_events(actor,academy_id,action,operation_id,details)values(s,a,'publication.'||act,op,jsonb_build_object('job_id',j,'kind',job.kind));return result;
end$$;
create or replace function public.s8_schedule_v1(a uuid,first_date date default null,after_at timestamptz default null,after_program uuid default null)returns jsonb language plpgsql security definer set search_path=''set statement_timeout='3s'set lock_timeout='2s'as $$
declare staff uuid;ctx jsonb;items jsonb;more boolean;today date;begin
 perform academy.t4_lock(a);staff:=academy.t4_trainer(a);
 select jsonb_build_object('name',p.display_name,'branch',b.name,'timezone',x.timezone)into ctx from academy.trainer_people p join academy.trainer_assignments z on z.staff_id=p.id and z.academy_id=p.academy_id and z.state='active'join academy.branches b on b.id=z.branch_id and b.academy_id=a join academy.academies x on x.id=a where p.id=staff and p.academy_id=a;
 if ctx is null then raise exception 'Access denied'using errcode='42501';end if;today:=(clock_timestamp()at time zone(ctx->>'timezone'))::date;first_date:=coalesce(first_date,today);
 if(after_at is null)<>(after_program is null)then raise exception 'Invalid cursor'using errcode='22023';end if;
 select coalesce(jsonb_agg(to_jsonb(q)order by q.starts_at,q.program),'[]')into items from(select e.id,e.program_id program,coalesce(e.projection->>'scheduled_day',e.day::text)::date as day,e.day occurrence_day,e.starts_at,e.ends_at,e.capacity,e.roster_count,e.projection from academy.publication_heads h join academy.publication_events e on e.id=h.event_id where h.academy_id=a and e.trainer_id=staff and e.published and academy.q6_eligible(a,e.branch_id,staff)and coalesce(e.projection->>'scheduled_day',e.day::text)::date between first_date and first_date+6 and(after_at is null or(e.starts_at,e.program_id)>(after_at,after_program))order by e.starts_at,e.program_id limit 26)q;
 more:=jsonb_array_length(items)>25;if more then items:=items-25;end if;return jsonb_build_object('context',ctx,'today',today,'from',first_date,'to',first_date+6,'items',items,'more',more);
end$$;
create or replace function public.s8_roster_v1(a uuid,event uuid,after_id uuid default null)returns jsonb language plpgsql security definer set search_path=''set statement_timeout='3s'set lock_timeout='2s'as $$
declare staff uuid;e academy.publication_events;items jsonb;more boolean;begin
 perform academy.t4_lock(a);staff:=academy.t4_trainer(a);
 select x.*into e from academy.publication_events x join academy.publication_heads h on h.event_id=x.id and h.academy_id=x.academy_id where x.id=event and x.academy_id=a and x.published and x.trainer_id=staff and academy.q6_eligible(a,x.branch_id,staff);
 if not found then raise exception 'Access denied'using errcode='42501';end if;
 select coalesce(jsonb_agg(to_jsonb(q)order by q.id),'[]')into items from(select player_id id,name from academy.publication_rosters where event_id=event and(after_id is null or player_id>after_id)order by player_id limit 26)q;
 more:=jsonb_array_length(items)>25;if more then items:=items-25;end if;return jsonb_build_object('id',e.id,'program',e.program_id,'day',coalesce(e.projection->>'scheduled_day',e.day::text),'occurrence_day',e.day,'starts_at',e.starts_at,'ends_at',e.ends_at,'capacity',e.capacity,'count',e.roster_count,'projection',e.projection,'players',items,'more',more);
end$$;
create function academy.t9_guard_date()returns trigger language plpgsql security definer set search_path=''as $$begin
 perform academy.t4_lock(old.academy_id);
 if TG_OP='UPDATE'and(new.program_id,new.local_date,new.academy_id)is distinct from(old.program_id,old.local_date,old.academy_id)then raise exception 'Original occurrence immutable'using errcode='PT409';end if;
 if exists(select 1 from academy.publication_heads h join academy.publication_events e on e.id=h.event_id where h.academy_id=old.academy_id and h.program_id=old.program_id and h.day=old.local_date and e.published)then raise exception 'Published plan locked'using errcode='PT409';end if;
 if TG_OP='DELETE'then return old;end if;return new;end$$;
create trigger session_change_date_guard before update or delete on academy.training_dates for each row execute function academy.t9_guard_date();
create function public.t9_read_v1(a uuid,p uuid,day date,after_id uuid default null)returns jsonb language plpgsql security definer set search_path=''set statement_timeout='3s'set lock_timeout='2s'as $$
declare d academy.training_dates;items jsonb;more boolean;begin perform academy.t4_lock(a);d:=academy.q6_target(a,p,day);
 select coalesce(jsonb_agg(to_jsonb(q)order by q.created_at desc,q.id desc),'[]')into items from(select id,kind,reason,before_state,after_state,created_at from academy.session_changes where academy_id=a and program_id=p and session_changes.day=t9_read_v1.day and(after_id is null or(created_at,id)<(select x.created_at,x.id from academy.session_changes x where x.id=after_id and x.academy_id=a and x.program_id=p and x.day=t9_read_v1.day))order by created_at desc,id desc limit 26)q;more:=jsonb_array_length(items)>25;if more then items:=items-25;end if;
 return jsonb_build_object('plan',public.q6_read_v1(a,p,day),'head',(select event_id from academy.publication_heads where academy_id=a and program_id=p and publication_heads.day=t9_read_v1.day),'history',items,'more',more);end$$;
create function academy.t9_change(a uuid,p uuid,day date,sv bigint,pv bigint,head uuid,kind text,new_day date,new_start time,new_end time,reason text,op uuid)returns jsonb language plpgsql security invoker set search_path=''as $$
declare subject text;d academy.training_dates;dp academy.date_plans;current_head uuid;fp text;old academy.session_change_operations;result jsonb;before_data jsonb;after_data jsonb;z text;ts timestamptz;te timestamptz;n integer;begin
 perform academy.t4_lock(a);subject:=academy.i2_owner(a);d:=academy.q6_target(a,p,day);
 if kind is null or kind not in('move','cancel')or sv is null or sv<1 or pv is null or pv<0 or reason is null or length(trim(reason))not between 1 and 240 then raise exception 'Invalid change'using errcode='22023';end if;
 if kind='cancel'and(new_day is not null or new_start is not null or new_end is not null)then raise exception 'Invalid cancellation'using errcode='22023';end if;
 if kind='move'and(new_day is null or new_day<'0001-01-01'::date or new_start is null or new_end is null or new_end<=new_start or extract(second from new_start)<>0 or extract(second from new_end)<>0)then raise exception 'Invalid date/time'using errcode='22023';end if;
 fp:=encode(extensions.digest(jsonb_build_array(p,day,sv,pv,head,kind,new_day,new_start,new_end,trim(reason))::text,'sha256'),'hex');
 if op is not null then perform pg_advisory_xact_lock(hashtextextended('session-change-op:'||subject||':'||op,0));select *into old from academy.session_change_operations where actor=subject and id=op;if found then if old.academy_id<>a or old.fingerprint is distinct from fp then return '{"error":"conflict"}';end if;return old.result;end if;end if;
 select *into dp from academy.date_plans where academy_id=a and program_id=p and local_date=day for update;
 select event_id into current_head from academy.publication_heads where academy_id=a and program_id=p and publication_heads.day=t9_change.day;
 if d.schedule_version<>sv or coalesce(dp.version,0)<>pv or current_head is distinct from head then return '{"error":"stale"}';end if;
 if d.canceled then return '{"error":"canceled"}';end if;
 if exists(select 1 from academy.publication_events where id=current_head and published)then return '{"error":"published_locked"}';end if;
 if d.starts_at<=clock_timestamp()then return '{"error":"started"}';end if;
 select timezone into z from academy.training_programs where id=p and academy_id=a;
 before_data:=jsonb_build_object('original',day,'date',d.scheduled_date,'start',to_char(d.starts_local,'HH24:MI'),'end',to_char(d.ends_local,'HH24:MI'),'canceled',false,'schedule_version',sv,'plan_version',pv,'head',head);
 if kind='move'then
 ts:=academy.p5_instant(new_day+new_start,z);te:=academy.p5_instant(new_day+new_end,z);if ts is null or te is null then return '{"error":"timezone"}';end if;if ts<=clock_timestamp()then return '{"error":"started"}';end if;
 if exists(select 1 from academy.training_dates x where x.program_id=p and x.academy_id=a and x.local_date<>day and x.scheduled_date=new_day and not x.canceled)then return '{"error":"occupied"}';end if;
 if dp.trainer_id is not null then perform 1 from academy.trainer_people who join academy.memberships m on m.id=who.membership_id and m.academy_id=who.academy_id join academy.trainer_assignments za on za.staff_id=who.id and za.academy_id=who.academy_id join academy.trainer_invitations iv on iv.id=za.invitation_id where who.id=dp.trainer_id and who.academy_id=a for share of who,m,za,iv;if not academy.q6_eligible(a,dp.branch_id,dp.trainer_id)then return '{"error":"trainer_unavailable"}';end if;end if;
 perform 1 from academy.players who join academy.date_rosters r on r.player_id=who.id and r.academy_id=who.academy_id where r.academy_id=a and r.program_id=p and r.local_date=day for share of who;
 select count(*)into n from academy.date_rosters where academy_id=a and program_id=p and local_date=day;
 if n<>coalesce(dp.roster_count,0)then raise exception 'Roster invariant'using errcode='XX000';end if;if dp.capacity is not null and n>dp.capacity then return '{"error":"full"}';end if;
 if exists(select 1 from academy.date_rosters r join academy.players who on who.id=r.player_id and who.academy_id=r.academy_id where r.academy_id=a and r.program_id=p and r.local_date=day and who.branch_id<>dp.branch_id)then return '{"error":"denied"}';end if;
 if exists(select 1 from academy.date_plans other join academy.training_dates live on live.program_id=other.program_id and live.local_date=other.local_date and live.academy_id=other.academy_id where other.academy_id=a and not live.canceled and(other.program_id,other.local_date)<>(p,day)and other.starts_at<te and other.ends_at>ts and((dp.trainer_id is not null and other.trainer_id=dp.trainer_id)or exists(select 1 from academy.date_rosters r join academy.date_rosters mine on mine.player_id=r.player_id and mine.academy_id=r.academy_id where r.program_id=other.program_id and r.local_date=other.local_date and r.academy_id=a and mine.program_id=p and mine.local_date=day)))then return '{"error":"overlap"}';end if;
 end if;
 after_data:=jsonb_build_object('original',day,'date',case when kind='move'then new_day else d.scheduled_date end,'start',case when kind='move'then to_char(new_start,'HH24:MI')else to_char(d.starts_local,'HH24:MI')end,'end',case when kind='move'then to_char(new_end,'HH24:MI')else to_char(d.ends_local,'HH24:MI')end,'canceled',kind='cancel','schedule_version',sv+1,'plan_version',case when dp.version is null then 0 else pv+1 end,'head',head);
 if op is null then return jsonb_build_object('reviewed',true,'before',before_data,'after',after_data,'reason',trim(reason));end if;
 if kind='move'then update academy.training_dates set scheduled_date=new_day,starts_local=new_start,ends_local=new_end,starts_at=ts,ends_at=te,schedule_version=schedule_version+1 where program_id=p and local_date=day and academy_id=a;update academy.date_plans set starts_at=ts,ends_at=te,version=version+1 where program_id=p and local_date=day and academy_id=a;
 else update academy.training_dates set canceled=true,schedule_version=schedule_version+1 where program_id=p and local_date=day and academy_id=a;update academy.date_plans set version=version+1 where program_id=p and local_date=day and academy_id=a;end if;
 if d.starts_at<=clock_timestamp()or(kind='move'and ts<=clock_timestamp())then raise exception 'Session started during change'using errcode='PT409';end if;
 insert into academy.session_changes(id,academy_id,program_id,day,actor,kind,reason,before_state,after_state)values(op,a,p,day,subject,kind,trim(reason),before_data,after_data);
 result:=jsonb_build_object('program',p,'day',day,'schedule_version',sv+1,'version',case when dp.version is null then 0 else pv+1 end,'changed',true);
 insert into academy.session_change_operations(actor,id,academy_id,fingerprint,result)values(subject,op,a,fp,result);
 insert into academy.audit_events(actor,academy_id,action,operation_id,details)values(subject,a,'session.'||kind,op,jsonb_build_object('program',p,'original_day',day,'schedule_version',sv+1));if d.starts_at<=clock_timestamp()or(kind='move'and ts<=clock_timestamp())then raise exception 'Session started during commit'using errcode='PT409';end if;return result;end$$;
create function public.t9_review_v1(a uuid,p uuid,day date,sv bigint,pv bigint,head uuid,kind text,new_day date,new_start time,new_end time,reason text)returns jsonb language sql security definer set search_path=''set statement_timeout='3s'set lock_timeout='2s'as $$select academy.t9_change(a,p,day,sv,pv,head,kind,new_day,new_start,new_end,reason,null)$$;
create function public.t9_save_v1(a uuid,p uuid,day date,sv bigint,pv bigint,head uuid,kind text,new_day date,new_start time,new_end time,reason text,op uuid)returns jsonb language plpgsql security definer set search_path=''set statement_timeout='3s'set lock_timeout='2s'as $$begin if op is null then raise exception 'Operation required'using errcode='22023';end if;return academy.t9_change(a,p,day,sv,pv,head,kind,new_day,new_start,new_end,reason,op);end$$;
create function public.t9_operation_v1(a uuid,op uuid)returns jsonb language plpgsql security definer set search_path=''set statement_timeout='3s'set lock_timeout='2s'as $$declare subject text;old academy.session_change_operations;begin perform academy.t4_lock(a);subject:=academy.i2_owner(a);if op is null then raise exception 'Operation required'using errcode='22023';end if;perform pg_advisory_xact_lock(hashtextextended('session-change-op:'||subject||':'||op,0));select *into old from academy.session_change_operations where actor=subject and id=op;if found then if old.academy_id<>a then raise exception 'Access denied'using errcode='42501';end if;return old.result;end if;insert into academy.session_change_operations(actor,id,academy_id,result)values(subject,op,a,'{"cancelled":true}');insert into academy.audit_events(actor,academy_id,action,operation_id)values(subject,a,'session.reconcile_cancel',op);return '{"cancelled":true}';end$$;
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
 if method is distinct from 'POST' or path is null or path !~ '^/rpc/(m1_context_v1|m1_platform_list_v1|m1_setup_v1|m1_operation_v1|m1_create_v1|m1_save_setup_v1|m1_manage_invitation_v1|m1_invitation_v1|bootstrap_identity_v1|my_academy_memberships_v1|i2_people_v1|i2_candidates_v1|i2_profile_v1|i2_register_v1|i2_operation_v1|g3_owner_list_v1|g3_command_v1|g3_operation_v1|g3_invitation_v1|g3_links_v1|t4_owner_list_v1|t4_command_v1|t4_operation_v1|t4_invitation_v1|t4_profile_v1|p5_list_v1|p5_preview_v1|p5_create_v1|p5_read_v1|p5_step_v1|p5_operation_v1|p5_dates_v1|q6_read_v1|q6_candidates_v1|q6_review_v1|q6_save_v1|q6_operation_v1|r7_create_v1|r7_list_v1|r7_read_v1|r7_change_v1|r7_operation_v1|s8_create_v1|s8_read_v1|s8_jobs_v1|s8_change_v1|s8_operation_v1|s8_owner_dates_v1|s8_schedule_v1|s8_roster_v1|q6_review_v2|q6_save_v2|t9_read_v1|t9_review_v1|t9_save_v1|t9_operation_v1)$' then
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
do $$declare f record;begin for f in select p.oid::regprocedure sig,n.nspname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where p.proname like 't9_%'and n.nspname in('academy','public')loop execute format('revoke all on function %s from public,anon,authenticated',f.sig);if f.nspname='public'then execute format('grant execute on function %s to authenticated',f.sig);end if;end loop;end$$;

-- New HTTP planning writes bind the effective schedule even before a first plan exists.
create function public.q6_review_v2(a uuid,p uuid,day date,sv bigint,expected_version bigint,capacity integer,trainer uuid,add_ids uuid[],remove_ids uuid[])returns jsonb language plpgsql security definer set search_path=''set statement_timeout='3s'set lock_timeout='2s'as $$
declare d academy.training_dates;begin perform academy.t4_lock(a);d:=academy.q6_target(a,p,day);if sv is null or sv<>d.schedule_version then return '{"error":"stale"}';end if;return academy.q6_change(a,p,day,expected_version,capacity,trainer,add_ids,remove_ids,null);end$$;
create function public.q6_save_v2(a uuid,p uuid,day date,sv bigint,expected_version bigint,capacity integer,trainer uuid,add_ids uuid[],remove_ids uuid[],op uuid)returns jsonb language plpgsql security definer set search_path=''set statement_timeout='3s'set lock_timeout='2s'as $$
declare d academy.training_dates;s text;old academy.planning_operations;begin
 perform academy.t4_lock(a);s:=academy.i2_owner(a);d:=academy.q6_target(a,p,day);if op is null then raise exception 'Operation required'using errcode='22023';end if;
 -- Existing confirmed/fenced receipts still reconcile across a subsequent move.
 perform pg_advisory_xact_lock(hashtextextended('planning-op:'||s||':'||op::text,0));select *into old from academy.planning_operations where actor=s and id=op;
 if not found and(sv is null or sv<>d.schedule_version)then return '{"error":"stale"}';end if;
 return academy.q6_change(a,p,day,expected_version,capacity,trainer,add_ids,remove_ids,op);end$$;
revoke all on function public.q6_review_v2(uuid,uuid,date,bigint,bigint,integer,uuid,uuid[],uuid[]),public.q6_save_v2(uuid,uuid,date,bigint,bigint,integer,uuid,uuid[],uuid[],uuid)from public,anon;
grant execute on function public.q6_review_v2(uuid,uuid,date,bigint,bigint,integer,uuid,uuid[],uuid[]),public.q6_save_v2(uuid,uuid,date,bigint,bigint,integer,uuid,uuid[],uuid[],uuid)to authenticated;
