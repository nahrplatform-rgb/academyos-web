-- Approved all-or-none program planning. Preparation is private and non-effective.
create table academy.program_plans (
 id uuid primary key,academy_id uuid not null,program_id uuid not null,actor text not null,
 scope_from date not null,scope_to date not null,rules jsonb not null,context_version integer not null,
 version bigint not null default 1,state text not null default 'preparing' check(state in('preparing','ready','committed','cancelled')),
 created_at timestamptz not null default now(),check(scope_to>=scope_from),
 foreign key(program_id,academy_id) references academy.training_programs(id,academy_id),unique(id,academy_id)
);
create index program_plans_scope on academy.program_plans(academy_id,program_id,id);
create table academy.program_plan_players (
 job_id uuid not null,academy_id uuid not null,weekday integer not null check(weekday between 0 and 6),player_id uuid not null,
 primary key(job_id,weekday,player_id),foreign key(job_id,academy_id) references academy.program_plans(id,academy_id),
 foreign key(player_id,academy_id) references academy.players(id,academy_id)
);
create index program_plan_players_scope on academy.program_plan_players(player_id,academy_id);
create table academy.program_plan_targets (
 job_id uuid not null,academy_id uuid not null,program_id uuid not null,day date not null,
 expected_version bigint not null,prepared boolean not null default false,problem text,
 primary key(job_id,day),foreign key(job_id,academy_id) references academy.program_plans(id,academy_id),
 foreign key(program_id,day,academy_id) references academy.training_dates(program_id,local_date,academy_id)
);
create index program_plan_targets_date on academy.program_plan_targets(program_id,day,academy_id);
create table academy.program_plan_operations (
 actor text not null,id uuid not null,academy_id uuid not null references academy.academies,
 fingerprint text,result jsonb not null,primary key(actor,id),created_at timestamptz not null default now()
);
create index program_plan_operations_scope on academy.program_plan_operations(academy_id);
do $$declare t text;begin foreach t in array array['program_plans','program_plan_players','program_plan_targets','program_plan_operations'] loop
 execute format('alter table academy.%I enable row level security',t);execute format('revoke all on academy.%I from public,anon,authenticated',t);end loop;end $$;

create function academy.r7_job(a uuid,j uuid) returns academy.program_plans language plpgsql security invoker set search_path='' as $$
declare s text:=academy.i2_owner(a);x academy.program_plans;ctx jsonb:=academy.p5_context(a);begin
 select * into x from academy.program_plans where id=j and academy_id=a and actor=s;
 if not found then raise exception 'Access denied' using errcode='42501';end if;
 perform 1 from academy.training_programs p where p.id=x.program_id and p.academy_id=a and p.state='ready' and p.branch_id=(ctx->>'branch_id')::uuid and p.context_version=x.context_version for share;
 if not found then raise exception 'Access denied' using errcode='42501';end if;return x;
end $$;
create function academy.r7_problem(j uuid,day_date date) returns text language plpgsql security invoker set search_path='' as $$
declare job academy.program_plans;t academy.program_plan_targets;d academy.training_dates;r jsonb;b uuid;n integer;begin
 select * into job from academy.program_plans where id=j;select * into t from academy.program_plan_targets where job_id=j and day=day_date;
 if not found then raise exception 'Invalid target' using errcode='22023';end if;
 if coalesce((select version from academy.date_plans where program_id=t.program_id and local_date=t.day and academy_id=t.academy_id),0)<>t.expected_version then return 'stale';end if;
 if t.expected_version>0 then return null;end if;
 select * into d from academy.training_dates where program_id=t.program_id and local_date=t.day and academy_id=t.academy_id;
 r:=job.rules->extract(dow from t.day)::integer::text;select branch_id into b from academy.training_programs where id=job.program_id;
 select count(*) into n from academy.program_plan_players where job_id=j and weekday=extract(dow from t.day)::integer;
 if n>(r->>'capacity')::integer then return 'full';end if;
 if exists(select 1 from academy.program_plan_players z join academy.players p on p.id=z.player_id and p.academy_id=z.academy_id where z.job_id=j and z.weekday=extract(dow from t.day)::integer and p.branch_id<>b) then return 'denied';end if;
 if r->>'trainer' is not null and not academy.q6_eligible(job.academy_id,b,(r->>'trainer')::uuid) then return 'trainer_unavailable';end if;
 if exists(select 1 from academy.date_plans p where p.academy_id=job.academy_id and p.starts_at<d.ends_at and p.ends_at>d.starts_at and (
 (r->>'trainer' is not null and p.trainer_id=(r->>'trainer')::uuid) or exists(select 1 from academy.date_rosters dr join academy.program_plan_players pp on pp.player_id=dr.player_id and pp.academy_id=dr.academy_id where dr.program_id=p.program_id and dr.local_date=p.local_date and dr.academy_id=p.academy_id and pp.job_id=j and pp.weekday=extract(dow from t.day)::integer))) then return 'overlap';end if;
 return null;
end $$;
create function public.r7_create_v1(a uuid,p uuid,op uuid,first_date date,last_date date,rules jsonb) returns jsonb language plpgsql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s' as $$
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
 if not exists(select 1 from academy.training_dates d where d.program_id=p and d.academy_id=a and d.local_date between first_date and last_date and rules?extract(dow from d.local_date)::integer::text) then raise exception 'Empty proposal' using errcode='22023';end if;
 insert into academy.program_plans(id,academy_id,program_id,actor,scope_from,scope_to,rules,context_version) values(op,a,p,s,first_date,last_date,(select jsonb_object_agg(key,value-'players')from jsonb_each(rules)),prog.context_version);
 insert into academy.program_plan_targets(job_id,academy_id,program_id,day,expected_version) select op,a,p,d.local_date,coalesce(dp.version,0) from academy.training_dates d left join academy.date_plans dp on dp.program_id=d.program_id and dp.local_date=d.local_date and dp.academy_id=d.academy_id where d.program_id=p and d.academy_id=a and d.local_date between first_date and last_date and rules?extract(dow from d.local_date)::integer::text;
 insert into academy.program_plan_players(job_id,academy_id,weekday,player_id) select op,a,key::integer,v::uuid from jsonb_each(rules)cross join lateral jsonb_array_elements_text(coalesce(value->'players','[]'))v;
 result:=jsonb_build_object('job',op,'version',1,'state','preparing');insert into academy.program_plan_operations values(s,op,a,fp,result,now());insert into academy.audit_events(actor,academy_id,action,operation_id,details)values(s,a,'program_plan.create',op,jsonb_build_object('program_id',p));return result;
end $$;
create function public.r7_list_v1(a uuid,p uuid,after_id uuid default null) returns jsonb language plpgsql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s' as $$
declare s text:=academy.i2_owner(a);ctx jsonb:=academy.p5_context(a);items jsonb;more boolean;begin
 perform 1 from academy.training_programs where id=p and academy_id=a and state='ready' and branch_id=(ctx->>'branch_id')::uuid;if not found then raise exception 'Access denied' using errcode='42501';end if;
 select coalesce(jsonb_agg(to_jsonb(q)order by q.id),'[]')into items from(select id,version,state from academy.program_plans where academy_id=a and program_id=p and actor=s and(after_id is null or id>after_id)order by id limit 26)q;more:=jsonb_array_length(items)>25;if more then items:=items-25;end if;return jsonb_build_object('items',items,'more',more);
end $$;
create function public.r7_read_v1(a uuid,j uuid,after_day date default null,weekday integer default null,after_player uuid default null) returns jsonb language plpgsql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s' as $$
declare job academy.program_plans:=academy.r7_job(a,j);items jsonb;people jsonb;more boolean;people_more boolean;begin
 if weekday is null then select key::integer into weekday from jsonb_object_keys(job.rules)key order by key limit 1;end if;
 if weekday is not null and not job.rules?weekday::text then raise exception 'Invalid weekday' using errcode='22023';end if;
 select coalesce(jsonb_agg(to_jsonb(q)order by q.day),'[]')into items from(select t.day,t.expected_version,t.prepared,t.problem,dp.capacity current_capacity,dp.roster_count current_count,(select display_name from academy.trainer_people who where who.id=dp.trainer_id and who.academy_id=t.academy_id)current_trainer,(select display_name from academy.trainer_people who where who.id=(job.rules->extract(dow from t.day)::integer::text->>'trainer')::uuid and who.academy_id=t.academy_id)trainer_name,to_char(d.starts_local,'HH24:MI') start,to_char(d.ends_local,'HH24:MI') finish,job.rules->extract(dow from t.day)::integer::text rule from academy.program_plan_targets t join academy.training_dates d on d.program_id=t.program_id and d.local_date=t.day and d.academy_id=t.academy_id left join academy.date_plans dp on dp.program_id=t.program_id and dp.local_date=t.day and dp.academy_id=t.academy_id where t.job_id=j and(after_day is null or t.day>after_day)order by t.day limit 26)q;
 more:=jsonb_array_length(items)>25;if more then items:=items-25;end if;
 select coalesce(jsonb_agg(to_jsonb(q)order by q.id),'[]')into people from(select p.id,p.display_name name from academy.program_plan_players x join academy.players p on p.id=x.player_id and p.academy_id=x.academy_id where x.job_id=j and x.weekday=r7_read_v1.weekday and(after_player is null or p.id>after_player)order by p.id limit 26)q;people_more:=jsonb_array_length(people)>25;if people_more then people:=people-25;end if;
 return jsonb_build_object('job',j,'program',job.program_id,'version',job.version,'state',job.state,'rules',job.rules,'from',job.scope_from,'to',job.scope_to,'items',items,'more',more,'weekday',weekday,'players',people,'players_more',people_more,'player_counts',(select coalesce(jsonb_object_agg(week,n),'{}')from(select x.weekday week,count(*) n from academy.program_plan_players x where x.job_id=j group by x.weekday)q),'total',(select count(*)from academy.program_plan_targets where job_id=j),'preserved',(select count(*)from academy.program_plan_targets where job_id=j and expected_version>0),'prepared',(select count(*)from academy.program_plan_targets where job_id=j and prepared),'blocked',(select count(*)from academy.program_plan_targets where job_id=j and prepared and problem is not null),'context',academy.p5_context(a));
end $$;
create function public.r7_change_v1(a uuid,j uuid,op uuid,expected_version bigint,act text,weekday integer default null,add_ids uuid[] default '{}',remove_ids uuid[] default '{}') returns jsonb language plpgsql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s' as $$
declare s text;job academy.program_plans;old academy.program_plan_operations;fp text;r jsonb;target_row record;issue_code text;ctx jsonb;b uuid;result jsonb;begin
 perform academy.t4_lock(a);s:=academy.i2_owner(a);job:=academy.r7_job(a,j);ctx:=academy.p5_context(a);b:=(ctx->>'branch_id')::uuid;
 if op is null or expected_version is null or act not in('players','prepare','activate','cancel') or add_ids is null or remove_ids is null or cardinality(add_ids)+cardinality(remove_ids)>25 or array_position(add_ids,null)is not null or array_position(remove_ids,null)is not null or(select count(distinct x)from unnest(add_ids)x)<>cardinality(add_ids)or(select count(distinct x)from unnest(remove_ids)x)<>cardinality(remove_ids)or add_ids&&remove_ids then raise exception 'Invalid command' using errcode='22023';end if;
 if act<>'players' and (weekday is not null or cardinality(add_ids)+cardinality(remove_ids)>0) then raise exception 'Invalid fields' using errcode='22023';end if;
 select coalesce(array_agg(x order by x),'{}')into add_ids from unnest(add_ids)x;select coalesce(array_agg(x order by x),'{}')into remove_ids from unnest(remove_ids)x;
 perform pg_advisory_xact_lock(hashtextextended('program-plan-op:'||s||':'||op::text,0));fp:=encode(extensions.digest(jsonb_build_object('job',j,'version',expected_version,'act',act,'weekday',weekday,'add',add_ids,'remove',remove_ids)::text,'sha256'),'hex');
 select * into old from academy.program_plan_operations where actor=s and id=op;if found then if old.academy_id<>a or old.fingerprint is distinct from fp then return '{"error":"conflict"}';end if;return old.result;end if;
 select * into job from academy.program_plans where id=j for update;
 if job.version<>expected_version then return '{"error":"stale"}';end if;
 if job.state in('committed','cancelled')then return '{"error":"conflict"}';end if;
 if act='players' then
 if weekday is null or not job.rules?weekday::text then raise exception 'Invalid weekday' using errcode='22023';end if;
 if exists(select 1 from unnest(add_ids||remove_ids)requested(player_id)where not exists(select 1 from academy.players p where p.id=requested.player_id and p.academy_id=a and p.branch_id=b))then raise exception 'Access denied' using errcode='42501';end if;
 if exists(select 1 from unnest(add_ids)requested(player_id)where exists(select 1 from academy.program_plan_players pp where pp.job_id=j and pp.weekday=r7_change_v1.weekday and pp.player_id=requested.player_id))then return '{"error":"duplicate"}';end if;
 if exists(select 1 from unnest(remove_ids)requested(player_id)where not exists(select 1 from academy.program_plan_players pp where pp.job_id=j and pp.weekday=r7_change_v1.weekday and pp.player_id=requested.player_id))then return '{"error":"stale"}';end if;
 delete from academy.program_plan_players where job_id=j and program_plan_players.weekday=r7_change_v1.weekday and player_id=any(remove_ids);
 insert into academy.program_plan_players select j,a,weekday,x from unnest(add_ids)x;
 update academy.program_plan_targets set prepared=false,problem=null where job_id=j;update academy.program_plans set state='preparing'where id=j;
 elsif act='prepare' then
 for target_row in select day from academy.program_plan_targets where job_id=j and not prepared order by day limit 25 for update loop
 issue_code:=academy.r7_problem(j,target_row.day);update academy.program_plan_targets set prepared=true,problem=issue_code where job_id=j and day=target_row.day;
 end loop;
 if not exists(select 1 from academy.program_plan_targets where job_id=j and not prepared)then update academy.program_plans set state='ready'where id=j;end if;
 elsif act='cancel' then update academy.program_plans set state='cancelled'where id=j;
 else
 if job.state<>'ready' or exists(select 1 from academy.program_plan_targets where job_id=j and(not prepared or problem is not null))then return '{"error":"not_ready"}';end if;
 if not exists(select 1 from academy.program_plan_targets target where target.job_id=j and target.expected_version=0)then return '{"error":"empty"}';end if;
 -- Lifecycle lock already serializes every q6 save and Trainer end. Lock current people too.
 perform 1 from academy.players p join academy.program_plan_players pp on pp.player_id=p.id and pp.academy_id=p.academy_id where pp.job_id=j for share of p;
 perform 1 from academy.trainer_people p join academy.memberships m on m.id=p.membership_id and m.identity_id=p.identity_id and m.academy_id=p.academy_id join academy.trainer_assignments z on z.staff_id=p.id and z.academy_id=p.academy_id join academy.trainer_invitations iv on iv.id=z.invitation_id and iv.academy_id=p.academy_id where p.academy_id=a and p.id in(select(value->>'trainer')::uuid from jsonb_each(job.rules)where value->>'trainer' is not null)for share of p,m,z,iv;
 if (select count(*)from academy.training_dates d where d.program_id=job.program_id and d.academy_id=a and d.local_date between job.scope_from and job.scope_to and job.rules?extract(dow from d.local_date)::integer::text)<>(select count(*)from academy.program_plan_targets where job_id=j)then return '{"error":"stale"}';end if;
 for target_row in select day from academy.program_plan_targets where job_id=j order by day loop issue_code:=academy.r7_problem(j,target_row.day);if issue_code is not null then return jsonb_build_object('error',issue_code,'day',target_row.day);end if;end loop;
 insert into academy.date_plans(academy_id,program_id,local_date,branch_id,capacity,trainer_id,roster_count,starts_at,ends_at)
 select a,job.program_id,t.day,b,(r.value->>'capacity')::integer,(r.value->>'trainer')::uuid,(select count(*)from academy.program_plan_players pp where pp.job_id=j and pp.weekday=extract(dow from t.day)::integer),d.starts_at,d.ends_at
 from academy.program_plan_targets t join academy.training_dates d on d.program_id=t.program_id and d.local_date=t.day and d.academy_id=t.academy_id join lateral(select job.rules->extract(dow from t.day)::integer::text value)r on true where t.job_id=j and t.expected_version=0;
 insert into academy.date_rosters(academy_id,program_id,local_date,player_id)select a,job.program_id,t.day,pp.player_id from academy.program_plan_targets t join academy.program_plan_players pp on pp.job_id=t.job_id and pp.weekday=extract(dow from t.day)::integer where t.job_id=j and t.expected_version=0;
 update academy.program_plans set state='committed'where id=j;
 end if;
 update academy.program_plans set version=version+1 where id=j returning jsonb_build_object('job',id,'version',version,'state',state)into result;
 insert into academy.program_plan_operations values(s,op,a,fp,result,now());insert into academy.audit_events(actor,academy_id,action,operation_id,details)values(s,a,'program_plan.'||act,op,jsonb_build_object('job',j,'version',expected_version+1));return result;
end $$;
create function public.r7_operation_v1(a uuid,op uuid) returns jsonb language plpgsql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s' as $$
declare s text;old academy.program_plan_operations;begin
 perform academy.t4_lock(a);s:=academy.i2_owner(a);if op is null then raise exception 'Invalid operation'using errcode='22023';end if;
 perform pg_advisory_xact_lock(hashtextextended('program-plan-op:'||s||':'||op::text,0));select * into old from academy.program_plan_operations where actor=s and id=op;
 if found then if old.academy_id<>a then raise exception 'Access denied'using errcode='42501';end if;return old.result;end if;
 insert into academy.program_plan_operations values(s,op,a,null,'{"cancelled":true}',now());insert into academy.audit_events(actor,academy_id,action,operation_id)values(s,a,'program_plan.reconcile_cancel',op);return '{"cancelled":true}';
end $$;

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
 if method is distinct from 'POST' or path is null or path !~ '^/rpc/(m1_context_v1|m1_platform_list_v1|m1_setup_v1|m1_operation_v1|m1_create_v1|m1_save_setup_v1|m1_manage_invitation_v1|m1_invitation_v1|bootstrap_identity_v1|my_academy_memberships_v1|i2_people_v1|i2_candidates_v1|i2_profile_v1|i2_register_v1|i2_operation_v1|g3_owner_list_v1|g3_command_v1|g3_operation_v1|g3_invitation_v1|g3_links_v1|t4_owner_list_v1|t4_command_v1|t4_operation_v1|t4_invitation_v1|t4_profile_v1|p5_list_v1|p5_preview_v1|p5_create_v1|p5_read_v1|p5_step_v1|p5_operation_v1|p5_dates_v1|q6_read_v1|q6_candidates_v1|q6_review_v1|q6_save_v1|q6_operation_v1|r7_create_v1|r7_list_v1|r7_read_v1|r7_change_v1|r7_operation_v1)$' then
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


do $$declare f record;begin for f in select p.oid::regprocedure sig,n.nspname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where p.proname like 'r7_%' and n.nspname in ('academy','public')loop execute format('revoke all on function %s from public,anon,authenticated',f.sig);if f.nspname='public'then execute format('grant execute on function %s to authenticated',f.sig);end if;end loop;end $$;
