-- Accepted I3d. Immutable publication revisions; private preparation; no account or appointment seeded.
create table academy.publication_jobs (
 id uuid primary key,academy_id uuid not null,program_id uuid not null,actor text not null,
 kind text not null check(kind in('publish','withdraw')),first_date date not null,last_date date not null,weekdays integer[] not null,
 state text not null default 'preparing' check(state in('preparing','ready','committed','cancelled')),version bigint not null default 1,
 created_at timestamptz not null default now(),unique(id,academy_id),foreign key(program_id,academy_id)references academy.training_programs(id,academy_id)
);
create index publication_jobs_scope on academy.publication_jobs(academy_id,program_id,id);
create table academy.publication_events (
 id uuid primary key default gen_random_uuid(),academy_id uuid not null,program_id uuid not null,day date not null,job_id uuid not null,
 published boolean not null,plan_version bigint not null,trainer_id uuid,branch_id uuid not null,capacity integer not null,roster_count integer not null,
 starts_at timestamptz not null,ends_at timestamptz not null,projection jsonb not null,
 unique(id,academy_id,program_id,day),unique(job_id,day),foreign key(job_id,academy_id)references academy.publication_jobs(id,academy_id),
 foreign key(program_id,day,academy_id)references academy.date_plans(program_id,local_date,academy_id),
 foreign key(trainer_id,academy_id)references academy.trainer_people(id,academy_id)
);
create index publication_events_trainer_time on academy.publication_events(academy_id,trainer_id,starts_at,program_id,day);
create index publication_events_date on academy.publication_events(program_id,day,academy_id);
create table academy.publication_heads (
 academy_id uuid not null,program_id uuid not null,day date not null,event_id uuid not null,
 primary key(program_id,day),foreign key(event_id,academy_id,program_id,day)references academy.publication_events(id,academy_id,program_id,day)
);
create index publication_heads_event on academy.publication_heads(event_id,academy_id,program_id,day);
create table academy.publication_rosters (
 event_id uuid not null references academy.publication_events,player_id uuid not null,name text not null,
 primary key(event_id,player_id)
);
create table academy.publication_targets (
 job_id uuid not null,academy_id uuid not null,program_id uuid not null,day date not null,
 plan_version bigint not null,head_id uuid,changing boolean not null,prepared boolean not null default false,problem text,
 primary key(job_id,day),foreign key(job_id,academy_id)references academy.publication_jobs(id,academy_id),
 foreign key(program_id,day,academy_id)references academy.training_dates(program_id,local_date,academy_id)
);
create index publication_targets_date on academy.publication_targets(program_id,day,academy_id);
create table academy.publication_operations (
 actor text not null,id uuid not null,academy_id uuid not null references academy.academies,fingerprint text,result jsonb not null,
 created_at timestamptz not null default now(),primary key(actor,id)
);
create index publication_operations_scope on academy.publication_operations(academy_id);
do $$declare t text;begin foreach t in array array['publication_jobs','publication_events','publication_heads','publication_rosters','publication_targets','publication_operations']loop
 execute format('alter table academy.%I enable row level security',t);execute format('revoke all on academy.%I from public,anon,authenticated',t);end loop;end$$;

create function academy.s8_guard_plan()returns trigger language plpgsql security definer set search_path='' as $$
declare old_a uuid;old_p uuid;old_d date;begin
 if TG_OP<>'INSERT'then old_a:=old.academy_id;old_p:=old.program_id;old_d:=old.local_date;perform academy.t4_lock(old_a);
 if exists(select 1 from academy.publication_heads h join academy.publication_events e on e.id=h.event_id where h.academy_id=old_a and h.program_id=old_p and h.day=old_d and e.published)then raise exception 'Published plan locked'using errcode='PT409';end if;end if;
 if TG_OP<>'DELETE'then perform academy.t4_lock(new.academy_id);if exists(select 1 from academy.publication_heads h join academy.publication_events e on e.id=h.event_id where h.academy_id=new.academy_id and h.program_id=new.program_id and h.day=new.local_date and e.published)then raise exception 'Published plan locked'using errcode='PT409';end if;return new;end if;return old;
end$$;
create trigger publication_plan_guard before insert or update or delete on academy.date_plans for each row execute function academy.s8_guard_plan();
create trigger publication_roster_guard before insert or update or delete on academy.date_rosters for each row execute function academy.s8_guard_plan();
create function academy.s8_job(a uuid,j uuid)returns academy.publication_jobs language plpgsql security invoker set search_path=''as $$
declare s text:=academy.i2_owner(a);x academy.publication_jobs;ctx jsonb:=academy.p5_context(a);begin
 select * into x from academy.publication_jobs where id=j and academy_id=a and actor=s;if not found then raise exception 'Access denied'using errcode='42501';end if;
 perform 1 from academy.training_programs where id=x.program_id and academy_id=a and state='ready'and branch_id=(ctx->>'branch_id')::uuid and context_version=(ctx->>'version')::integer;if not found then raise exception 'Access denied'using errcode='42501';end if;return x;
end$$;
create function academy.s8_problem(j uuid,target_day date)returns text language plpgsql security invoker set search_path=''as $$
declare job academy.publication_jobs;t academy.publication_targets;dp academy.date_plans;head uuid;r jsonb;begin
 select * into job from academy.publication_jobs where id=j;select * into t from academy.publication_targets where job_id=j and day=target_day;
 select * into dp from academy.date_plans where program_id=t.program_id and local_date=t.day and academy_id=t.academy_id;
 select event_id into head from academy.publication_heads where program_id=t.program_id and day=t.day and academy_id=t.academy_id;
 if coalesce(dp.version,0)<>t.plan_version or head is distinct from t.head_id then return 'stale';end if;
 if not t.changing then return null;end if;
 if dp.version is null then return 'not_ready';end if;
 if dp.starts_at<=clock_timestamp()then return 'started';end if;
 if job.kind='withdraw'then return null;end if;
 if dp.trainer_id is null or not academy.q6_eligible(job.academy_id,dp.branch_id,dp.trainer_id)then return 'trainer_unavailable';end if;
 if exists(select 1 from academy.date_rosters r join academy.players p on p.id=r.player_id and p.academy_id=r.academy_id where r.program_id=t.program_id and r.local_date=t.day and r.academy_id=t.academy_id and p.branch_id<>dp.branch_id)then return 'denied';end if;
 r:=academy.q6_change(job.academy_id,t.program_id,t.day,dp.version,dp.capacity,dp.trainer_id,'{}','{}',null);
 return r->>'error';
end$$;
create function public.s8_create_v1(a uuid,p uuid,op uuid,kind text,first_date date,last_date date,weekdays integer[])returns jsonb language plpgsql security definer set search_path=''set statement_timeout='3s'set lock_timeout='2s'as $$
declare s text;fp text;old academy.publication_operations;result jsonb;begin
 perform academy.t4_lock(a);s:=academy.i2_owner(a);
 if op is null or kind not in('publish','withdraw')or first_date is null or last_date is null or first_date>last_date or weekdays is null or cardinality(weekdays)not between 1 and 7 or exists(select 1 from unnest(weekdays)x where x not between 0 and 6 or x is null)or(select count(distinct x)from unnest(weekdays)x)<>cardinality(weekdays)then raise exception 'Invalid scope'using errcode='22023';end if;
 select array_agg(x order by x)into weekdays from unnest(weekdays)x;
 perform pg_advisory_xact_lock(hashtextextended('publication-op:'||s||':'||op,0));fp:=encode(extensions.digest(jsonb_build_object('program',p,'kind',kind,'from',first_date,'to',last_date,'weekdays',weekdays)::text,'sha256'),'hex');
 select * into old from academy.publication_operations where actor=s and id=op;if found then if old.academy_id<>a or old.fingerprint is distinct from fp then return '{"error":"conflict"}';end if;return old.result;end if;
 perform 1 from academy.training_programs where id=p and academy_id=a and state='ready'and branch_id=(academy.p5_context(a)->>'branch_id')::uuid and context_version=(academy.p5_context(a)->>'version')::integer;if not found then raise exception 'Access denied'using errcode='42501';end if;
 if not exists(select 1 from academy.training_programs where id=p and academy_id=a and first_date>=starts_on and last_date<=ends_on)then raise exception 'Invalid range'using errcode='22023';end if;
 insert into academy.publication_jobs(id,academy_id,program_id,actor,kind,first_date,last_date,weekdays)values(op,a,p,s,kind,first_date,last_date,weekdays);
 insert into academy.publication_targets(job_id,academy_id,program_id,day,plan_version,head_id,changing)
 select op,a,p,d.local_date,coalesce(dp.version,0),h.event_id,case when kind='publish'then not coalesce(e.published,false)else coalesce(e.published,false)end
 from academy.training_dates d left join academy.date_plans dp on dp.program_id=d.program_id and dp.local_date=d.local_date and dp.academy_id=d.academy_id left join academy.publication_heads h on h.program_id=d.program_id and h.day=d.local_date and h.academy_id=d.academy_id left join academy.publication_events e on e.id=h.event_id
 where d.program_id=p and d.academy_id=a and d.local_date between first_date and last_date and extract(dow from d.local_date)::integer=any(weekdays);
 if not exists(select 1 from academy.publication_targets where job_id=op and changing)then raise exception 'No changes'using errcode='22023';end if;
 result:=jsonb_build_object('job',op,'version',1,'state','preparing');insert into academy.publication_operations(actor,id,academy_id,fingerprint,result)values(s,op,a,fp,result);insert into academy.audit_events(actor,academy_id,action,operation_id,details)values(s,a,'publication.create',op,jsonb_build_object('program_id',p,'kind',kind));return result;
end$$;
create function public.s8_read_v1(a uuid,j uuid,after_day date default null)returns jsonb language plpgsql security definer set search_path=''set statement_timeout='3s'set lock_timeout='2s'as $$
declare job academy.publication_jobs:=academy.s8_job(a,j);items jsonb;more boolean;begin
 select coalesce(jsonb_agg(to_jsonb(q)order by q.day),'[]')into items from(select t.day,t.plan_version,t.prepared,t.problem,t.changing,dp.capacity,dp.roster_count,(select display_name from academy.trainer_people who where who.id=dp.trainer_id and who.academy_id=a)trainer,to_char(d.starts_local,'HH24:MI')start,to_char(d.ends_local,'HH24:MI')finish from academy.publication_targets t join academy.training_dates d on d.program_id=t.program_id and d.local_date=t.day and d.academy_id=t.academy_id left join academy.date_plans dp on dp.program_id=t.program_id and dp.local_date=t.day and dp.academy_id=t.academy_id where t.job_id=j and(after_day is null or t.day>after_day)order by t.day limit 26)q;
 more:=jsonb_array_length(items)>25;if more then items:=items-25;end if;
 return jsonb_build_object('job',j,'program',job.program_id,'kind',job.kind,'version',job.version,'state',job.state,'from',job.first_date,'to',job.last_date,'weekdays',job.weekdays,'items',items,'more',more,'total',(select count(*)from academy.publication_targets where job_id=j),'changes',(select count(*)from academy.publication_targets where job_id=j and changing),'prepared',(select count(*)from academy.publication_targets where job_id=j and prepared),'blocked',(select count(*)from academy.publication_targets where job_id=j and problem is not null));
end$$;
create function public.s8_jobs_v1(a uuid,p uuid,after_id uuid default null)returns jsonb language plpgsql security definer set search_path=''set statement_timeout='3s'set lock_timeout='2s'as $$
declare s text:=academy.i2_owner(a);ctx jsonb:=academy.p5_context(a);items jsonb;more boolean;begin
 perform 1 from academy.training_programs where id=p and academy_id=a and branch_id=(ctx->>'branch_id')::uuid and state='ready';if not found then raise exception 'Access denied'using errcode='42501';end if;
 select coalesce(jsonb_agg(to_jsonb(q)order by q.id),'[]')into items from(select id,kind,state,version from academy.publication_jobs where academy_id=a and program_id=p and actor=s and(after_id is null or id>after_id)order by id limit 26)q;
 more:=jsonb_array_length(items)>25;if more then items:=items-25;end if;return jsonb_build_object('items',items,'more',more);
end$$;
create function public.s8_change_v1(a uuid,j uuid,op uuid,expected_version bigint,act text)returns jsonb language plpgsql security definer set search_path=''set statement_timeout='3s'set lock_timeout='2s'as $$
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
 values(a,job.program_id,target_row.day,j,job.kind='publish',target_row.version,target_row.trainer_id,target_row.branch_id,target_row.capacity,target_row.roster_count,target_row.starts_at,target_row.ends_at,jsonb_build_object('name',(select definition->>'name'from academy.training_programs where id=job.program_id),'branch',ctx->>'branch_name','sport',ctx->>'sport_name','sport_ar',ctx->>'sport_name_ar','timezone',ctx->>'timezone'))returning id into ev;
 if job.kind='publish'then insert into academy.publication_rosters(event_id,player_id,name)select ev,p.id,p.display_name from academy.date_rosters r join academy.players p on p.id=r.player_id and p.academy_id=r.academy_id where r.academy_id=a and r.program_id=job.program_id and r.local_date=target_row.day;end if;
 insert into academy.publication_heads values(a,job.program_id,target_row.day,ev)on conflict(program_id,day)do update set event_id=excluded.event_id;
 end loop;
 if exists(select 1 from academy.publication_targets t join academy.date_plans dp on dp.program_id=t.program_id and dp.local_date=t.day and dp.academy_id=t.academy_id where t.job_id=j and t.changing and dp.starts_at<=clock_timestamp())then raise exception 'Date started during activation'using errcode='PT409';end if;update academy.publication_jobs set state='committed'where id=j;
 end if;
 update academy.publication_jobs set version=version+1 where id=j returning jsonb_build_object('job',id,'version',version,'state',state)into result;
 insert into academy.publication_operations(actor,id,academy_id,fingerprint,result)values(s,op,a,fp,result);insert into academy.audit_events(actor,academy_id,action,operation_id,details)values(s,a,'publication.'||act,op,jsonb_build_object('job_id',j,'kind',job.kind));return result;
end$$;
create function public.s8_operation_v1(a uuid,op uuid)returns jsonb language plpgsql security definer set search_path=''set statement_timeout='3s'set lock_timeout='2s'as $$
declare s text;old academy.publication_operations;begin perform academy.t4_lock(a);s:=academy.i2_owner(a);if op is null then raise exception 'Invalid operation'using errcode='22023';end if;
 perform pg_advisory_xact_lock(hashtextextended('publication-op:'||s||':'||op,0));select * into old from academy.publication_operations where actor=s and id=op;if found then if old.academy_id<>a then raise exception 'Access denied'using errcode='42501';end if;return old.result;end if;
 insert into academy.publication_operations(actor,id,academy_id,result)values(s,op,a,'{"cancelled":true}');insert into academy.audit_events(actor,academy_id,action,operation_id,details)values(s,a,'publication.reconcile_cancel',op,'{}');return '{"cancelled":true}';end$$;
create function public.s8_owner_dates_v1(a uuid,p uuid,after_day date default null)returns jsonb language plpgsql security definer set search_path=''set statement_timeout='3s'set lock_timeout='2s'as $$
declare ctx jsonb:=academy.p5_context(a);items jsonb;more boolean;begin
 perform 1 from academy.training_programs where id=p and academy_id=a and state='ready'and branch_id=(ctx->>'branch_id')::uuid;if not found then raise exception 'Access denied'using errcode='42501';end if;
 select coalesce(jsonb_agg(to_jsonb(q)order by q.day),'[]')into items from(select d.local_date as day,to_char(d.starts_local,'HH24:MI')start,to_char(d.ends_local,'HH24:MI')finish,dp.version,dp.capacity,dp.roster_count,coalesce(e.published,false)published,(select display_name from academy.trainer_people who where who.id=dp.trainer_id and who.academy_id=a)trainer,academy.q6_eligible(a,(ctx->>'branch_id')::uuid,dp.trainer_id)eligible from academy.training_dates d left join academy.date_plans dp on dp.program_id=d.program_id and dp.local_date=d.local_date and dp.academy_id=d.academy_id left join academy.publication_heads h on h.program_id=d.program_id and h.day=d.local_date and h.academy_id=d.academy_id left join academy.publication_events e on e.id=h.event_id where d.program_id=p and d.academy_id=a and(after_day is null or d.local_date>after_day)order by d.local_date limit 26)q;
 more:=jsonb_array_length(items)>25;if more then items:=items-25;end if;return jsonb_build_object('items',items,'more',more);
end$$;
create function public.s8_schedule_v1(a uuid,first_date date default null,after_at timestamptz default null,after_program uuid default null)returns jsonb language plpgsql security definer set search_path=''set statement_timeout='3s'set lock_timeout='2s'as $$
declare staff uuid;ctx jsonb;items jsonb;more boolean;today date;begin
 perform academy.t4_lock(a);staff:=academy.t4_trainer(a);
 select jsonb_build_object('name',p.display_name,'branch',b.name,'timezone',x.timezone)into ctx from academy.trainer_people p join academy.trainer_assignments z on z.staff_id=p.id and z.academy_id=p.academy_id and z.state='active'join academy.branches b on b.id=z.branch_id and b.academy_id=a join academy.academies x on x.id=a where p.id=staff and p.academy_id=a;
 if ctx is null then raise exception 'Access denied'using errcode='42501';end if;today:=(clock_timestamp()at time zone(ctx->>'timezone'))::date;first_date:=coalesce(first_date,today);
 if(after_at is null)<>(after_program is null)then raise exception 'Invalid cursor'using errcode='22023';end if;
 select coalesce(jsonb_agg(to_jsonb(q)order by q.starts_at,q.program),'[]')into items from(select e.id,e.program_id program,e.day,e.starts_at,e.ends_at,e.capacity,e.roster_count,e.projection from academy.publication_heads h join academy.publication_events e on e.id=h.event_id where h.academy_id=a and e.trainer_id=staff and e.published and academy.q6_eligible(a,e.branch_id,staff)and e.day between first_date and first_date+6 and(after_at is null or(e.starts_at,e.program_id)>(after_at,after_program))order by e.starts_at,e.program_id limit 26)q;
 more:=jsonb_array_length(items)>25;if more then items:=items-25;end if;return jsonb_build_object('context',ctx,'today',today,'from',first_date,'to',first_date+6,'items',items,'more',more);
end$$;
create function public.s8_roster_v1(a uuid,event uuid,after_id uuid default null)returns jsonb language plpgsql security definer set search_path=''set statement_timeout='3s'set lock_timeout='2s'as $$
declare staff uuid;e academy.publication_events;items jsonb;more boolean;begin
 perform academy.t4_lock(a);staff:=academy.t4_trainer(a);
 select x.*into e from academy.publication_events x join academy.publication_heads h on h.event_id=x.id and h.academy_id=x.academy_id where x.id=event and x.academy_id=a and x.published and x.trainer_id=staff and academy.q6_eligible(a,x.branch_id,staff);
 if not found then raise exception 'Access denied'using errcode='42501';end if;
 select coalesce(jsonb_agg(to_jsonb(q)order by q.id),'[]')into items from(select player_id id,name from academy.publication_rosters where event_id=event and(after_id is null or player_id>after_id)order by player_id limit 26)q;
 more:=jsonb_array_length(items)>25;if more then items:=items-25;end if;return jsonb_build_object('id',e.id,'program',e.program_id,'day',e.day,'starts_at',e.starts_at,'ends_at',e.ends_at,'capacity',e.capacity,'count',e.roster_count,'projection',e.projection,'players',items,'more',more);
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
 if method is distinct from 'POST' or path is null or path !~ '^/rpc/(m1_context_v1|m1_platform_list_v1|m1_setup_v1|m1_operation_v1|m1_create_v1|m1_save_setup_v1|m1_manage_invitation_v1|m1_invitation_v1|bootstrap_identity_v1|my_academy_memberships_v1|i2_people_v1|i2_candidates_v1|i2_profile_v1|i2_register_v1|i2_operation_v1|g3_owner_list_v1|g3_command_v1|g3_operation_v1|g3_invitation_v1|g3_links_v1|t4_owner_list_v1|t4_command_v1|t4_operation_v1|t4_invitation_v1|t4_profile_v1|p5_list_v1|p5_preview_v1|p5_create_v1|p5_read_v1|p5_step_v1|p5_operation_v1|p5_dates_v1|q6_read_v1|q6_candidates_v1|q6_review_v1|q6_save_v1|q6_operation_v1|r7_create_v1|r7_list_v1|r7_read_v1|r7_change_v1|r7_operation_v1|s8_create_v1|s8_read_v1|s8_jobs_v1|s8_change_v1|s8_operation_v1|s8_owner_dates_v1|s8_schedule_v1|s8_roster_v1)$' then
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
revoke all on function academy.verified_subject() from public,anon,authenticated;



do $$declare f record;begin for f in select p.oid::regprocedure sig,n.nspname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where p.proname like 's8_%'and n.nspname in('academy','public')loop execute format('revoke all on function %s from public,anon,authenticated',f.sig);if f.nspname='public'then execute format('grant execute on function %s to authenticated',f.sig);end if;end loop;end$$;

-- Existing date journeys expose the lock and reject review/write of published dates.
create or replace function public.q6_read_v1(a uuid,p uuid,day date,after_id uuid default null) returns jsonb language plpgsql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s' as $$
declare d academy.training_dates:=academy.q6_target(a,p,day);plan academy.date_plans;ctx jsonb:=academy.p5_context(a);items jsonb;who jsonb;more boolean;begin
 select * into plan from academy.date_plans x where x.academy_id=a and x.program_id=p and x.local_date=day;
 select jsonb_build_object('id',x.id,'name',x.display_name,'eligible',academy.q6_eligible(a,(ctx->>'branch_id')::uuid,x.id)) into who from academy.trainer_people x where x.academy_id=a and x.id=plan.trainer_id;
 select coalesce(jsonb_agg(to_jsonb(q) order by q.id),'[]') into items from (select x.id,x.display_name name from academy.date_rosters r join academy.players x on x.id=r.player_id and x.academy_id=r.academy_id where r.academy_id=a and r.program_id=p and r.local_date=day and (after_id is null or x.id>after_id) order by x.id limit 26)q;
 more:=jsonb_array_length(items)>25;if more then items:=items-25;end if;
 return jsonb_build_object('context',ctx,'program',p,'name',(select definition->>'name' from academy.training_programs where id=p and academy_id=a),'day',day,'start',to_char(d.starts_local,'HH24:MI'),'end',to_char(d.ends_local,'HH24:MI'),'timezone',(select timezone from academy.training_programs where id=p and academy_id=a),'published',exists(select 1 from academy.publication_heads h join academy.publication_events e on e.id=h.event_id where h.academy_id=a and h.program_id=p and h.day=q6_read_v1.day and e.published),'version',coalesce(plan.version,0),'capacity',plan.capacity,'trainer',who,'count',coalesce(plan.roster_count,0),'players',items,'more',more);
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
 if exists(select 1 from academy.publication_heads h join academy.publication_events e on e.id=h.event_id where h.academy_id=a and h.program_id=p and h.day=q6_change.day and e.published)then return '{"error":"published_locked"}';end if;v:=coalesce(plan.version,0);if v<>expected_version then return jsonb_build_object('error','stale');end if;
 if trainer is not null then perform 1 from academy.trainer_people x join academy.memberships m on m.id=x.membership_id and m.identity_id=x.identity_id and m.academy_id=x.academy_id join academy.trainer_assignments z on z.staff_id=x.id and z.academy_id=x.academy_id join academy.trainer_invitations iv on iv.id=z.invitation_id and iv.academy_id=x.academy_id where x.id=trainer and x.academy_id=a for share of m,z,iv;end if;
 if trainer is not null and not academy.q6_eligible(a,(ctx->>'branch_id')::uuid,trainer) then return jsonb_build_object('error','trainer_unavailable');end if;
 if exists(select 1 from unnest(add_ids||remove_ids) as requested(player_id) where not exists(select 1 from academy.players x where x.id=requested.player_id and x.academy_id=a and x.branch_id=(ctx->>'branch_id')::uuid)) then raise exception 'Access denied' using errcode='42501';end if;
 if exists(select 1 from unnest(add_ids) id join academy.date_rosters r on r.player_id=id and r.academy_id=a and r.program_id=p and r.local_date=day) then return jsonb_build_object('error','duplicate');end if;
 if exists(select 1 from unnest(remove_ids) id where not exists(select 1 from academy.date_rosters r where r.academy_id=a and r.program_id=p and r.local_date=day and r.player_id=id)) then return jsonb_build_object('error','stale');end if;
 select count(*) into n from academy.date_rosters r where r.academy_id=a and r.program_id=p and r.local_date=day;
 if n<>coalesce(plan.roster_count,0) then raise exception 'Roster invariant' using errcode='XX000';end if;
 n:=n+cardinality(add_ids)-cardinality(remove_ids);if n>capacity then return jsonb_build_object('error','full');end if;
 select z.program_id,z.local_date into conflict from academy.date_plans z where z.academy_id=a and (z.program_id,z.local_date)<>(p,day) and z.starts_at<d.ends_at and z.ends_at>d.starts_at and (
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
