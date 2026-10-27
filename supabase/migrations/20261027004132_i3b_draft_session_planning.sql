-- Accepted I3b: private Owner planning only. No accounts, grants or invitations seeded.
alter table academy.training_dates add constraint training_dates_tenant_key unique(program_id,local_date,academy_id);
alter table academy.players add constraint players_tenant_key unique(id,academy_id);
create table academy.date_plans (
 academy_id uuid not null, program_id uuid not null, local_date date not null, branch_id uuid not null,
 capacity integer not null check(capacity>0), trainer_id uuid, roster_count integer not null default 0,
 starts_at timestamptz not null, ends_at timestamptz not null, version bigint not null default 1 check(version>0),
 primary key(program_id,local_date), unique(program_id,local_date,academy_id),
 check(roster_count between 0 and capacity and ends_at>starts_at),
 foreign key(program_id,local_date,academy_id) references academy.training_dates(program_id,local_date,academy_id),
 foreign key(branch_id,academy_id) references academy.branches(id,academy_id),
 foreign key(trainer_id,academy_id) references academy.trainer_people(id,academy_id)
);
create index date_plans_scope_time on academy.date_plans(academy_id,starts_at,ends_at);
create index date_plans_trainer_time on academy.date_plans(academy_id,trainer_id,starts_at,ends_at);
create index date_plans_branch on academy.date_plans(branch_id,academy_id);
create index date_plans_trainer_fk on academy.date_plans(trainer_id,academy_id);
create table academy.date_rosters (
 academy_id uuid not null, program_id uuid not null, local_date date not null, player_id uuid not null,
 primary key(program_id,local_date,player_id),
 foreign key(program_id,local_date,academy_id) references academy.date_plans(program_id,local_date,academy_id),
 foreign key(player_id,academy_id) references academy.players(id,academy_id)
);
create index date_rosters_player_scope on academy.date_rosters(player_id,academy_id,program_id,local_date);
create table academy.planning_operations (
 actor text not null,id uuid not null,academy_id uuid not null references academy.academies,
 fingerprint text,payload jsonb,result jsonb not null,created_at timestamptz not null default now(),primary key(actor,id)
);
create index planning_operations_scope on academy.planning_operations(academy_id);
do $$declare t text;begin foreach t in array array['date_plans','date_rosters','planning_operations'] loop
 execute format('alter table academy.%I enable row level security',t);
 execute format('revoke all on academy.%I from public,anon,authenticated',t);end loop;end $$;
create function academy.q6_target(a uuid,p uuid,day date) returns academy.training_dates language plpgsql security invoker set search_path='' as $$
declare ctx jsonb:=academy.p5_context(a);d academy.training_dates;begin
 select x.* into d from academy.training_dates x join academy.training_programs z on z.id=x.program_id and z.academy_id=x.academy_id
 where x.academy_id=a and x.program_id=p and x.local_date=day and z.state='ready' and z.branch_id=(ctx->>'branch_id')::uuid for share of z,x;
 if not found then raise exception 'Access denied' using errcode='42501';end if;return d;
end $$;
create function academy.q6_eligible(a uuid,b uuid,staff uuid) returns boolean language sql stable security invoker set search_path='' as $$
 select exists(select 1 from academy.trainer_people p join academy.memberships m on m.id=p.membership_id and m.identity_id=p.identity_id and m.academy_id=p.academy_id
 join academy.trainer_assignments z on z.staff_id=p.id and z.academy_id=p.academy_id
 join academy.trainer_invitations v on v.id=z.invitation_id and v.staff_id=p.id and v.academy_id=p.academy_id
 where p.id=staff and p.academy_id=a and z.branch_id=b and z.state='active' and v.state='accepted' and m.role='trainer' and m.status='active')
$$;
create function public.q6_read_v1(a uuid,p uuid,day date,after_id uuid default null) returns jsonb language plpgsql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s' as $$
declare d academy.training_dates:=academy.q6_target(a,p,day);plan academy.date_plans;ctx jsonb:=academy.p5_context(a);items jsonb;who jsonb;more boolean;begin
 select * into plan from academy.date_plans x where x.academy_id=a and x.program_id=p and x.local_date=day;
 select jsonb_build_object('id',x.id,'name',x.display_name,'eligible',academy.q6_eligible(a,(ctx->>'branch_id')::uuid,x.id)) into who from academy.trainer_people x where x.academy_id=a and x.id=plan.trainer_id;
 select coalesce(jsonb_agg(to_jsonb(q) order by q.id),'[]') into items from (select x.id,x.display_name name from academy.date_rosters r join academy.players x on x.id=r.player_id and x.academy_id=r.academy_id where r.academy_id=a and r.program_id=p and r.local_date=day and (after_id is null or x.id>after_id) order by x.id limit 26)q;
 more:=jsonb_array_length(items)>25;if more then items:=items-25;end if;
 return jsonb_build_object('context',ctx,'program',p,'name',(select definition->>'name' from academy.training_programs where id=p and academy_id=a),'day',day,'start',to_char(d.starts_local,'HH24:MI'),'end',to_char(d.ends_local,'HH24:MI'),'timezone',(select timezone from academy.training_programs where id=p and academy_id=a),'version',coalesce(plan.version,0),'capacity',plan.capacity,'trainer',who,'count',coalesce(plan.roster_count,0),'players',items,'more',more);
end $$;
create function public.q6_candidates_v1(a uuid,p uuid,day date,kind text,query text default '',after_id uuid default null) returns jsonb language plpgsql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s' as $$
declare d academy.training_dates:=academy.q6_target(a,p,day);ctx jsonb:=academy.p5_context(a);items jsonb;more boolean;begin
 if kind not in ('trainer','player') or query is null or length(query)>80 then raise exception 'Invalid search' using errcode='22023';end if;
 if kind='trainer' then
 select coalesce(jsonb_agg(to_jsonb(q) order by q.id),'[]') into items from (select x.id,x.display_name name from academy.trainer_people x where x.academy_id=a and (after_id is null or x.id>after_id) and position(lower(trim(query)) in lower(x.display_name))>0 and academy.q6_eligible(a,(ctx->>'branch_id')::uuid,x.id) order by x.id limit 26)q;
 else
 select coalesce(jsonb_agg(to_jsonb(q) order by q.id),'[]') into items from (select x.id,x.display_name name,exists(select 1 from academy.date_rosters r where r.academy_id=a and r.program_id=p and r.local_date=day and r.player_id=x.id) enrolled from academy.players x where x.academy_id=a and x.branch_id=(ctx->>'branch_id')::uuid and (after_id is null or x.id>after_id) and position(lower(trim(query)) in lower(x.display_name))>0 order by x.id limit 26)q;
 end if;
 more:=jsonb_array_length(items)>25;if more then items:=items-25;end if;return jsonb_build_object('items',items,'more',more);
end $$;
-- Existing Trainer lifecycle uses this same per-academy lock before membership locks.
-- It also serializes dated plans across different dates, preventing overlap write skew.
create function academy.q6_change(a uuid,p uuid,day date,expected_version bigint,capacity integer,trainer uuid,add_ids uuid[],remove_ids uuid[],op uuid) returns jsonb language plpgsql security invoker set search_path='' as $$
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
 v:=coalesce(plan.version,0);if v<>expected_version then return jsonb_build_object('error','stale');end if;
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
create function public.q6_review_v1(a uuid,p uuid,day date,expected_version bigint,capacity integer,trainer uuid,add_ids uuid[],remove_ids uuid[]) returns jsonb language sql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s' as $$select academy.q6_change(a,p,day,expected_version,capacity,trainer,add_ids,remove_ids,null)$$;
create function public.q6_save_v1(a uuid,p uuid,day date,expected_version bigint,capacity integer,trainer uuid,add_ids uuid[],remove_ids uuid[],op uuid) returns jsonb language plpgsql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s' as $$begin if op is null then raise exception 'Operation required' using errcode='22023';end if;return academy.q6_change(a,p,day,expected_version,capacity,trainer,add_ids,remove_ids,op);end $$;
create function public.q6_operation_v1(a uuid,op uuid) returns jsonb language plpgsql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s' as $$
declare s text;old academy.planning_operations;begin
 perform academy.t4_lock(a);s:=academy.i2_owner(a);if op is null then raise exception 'Operation required' using errcode='22023';end if;
 perform pg_advisory_xact_lock(hashtextextended('planning-op:'||s||':'||op::text,0));select * into old from academy.planning_operations where actor=s and id=op;
 if found then if old.academy_id<>a then raise exception 'Access denied' using errcode='42501';end if;return old.result;end if;
 insert into academy.planning_operations(actor,id,academy_id,result) values(s,op,a,'{"cancelled":true}');insert into academy.audit_events(actor,academy_id,action,operation_id) values(s,a,'planning.reconcile_cancel',op);return '{"cancelled":true}'::jsonb;
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
 if method is distinct from 'POST' or path is null or path !~ '^/rpc/(m1_context_v1|m1_platform_list_v1|m1_setup_v1|m1_operation_v1|m1_create_v1|m1_save_setup_v1|m1_manage_invitation_v1|m1_invitation_v1|bootstrap_identity_v1|my_academy_memberships_v1|i2_people_v1|i2_candidates_v1|i2_profile_v1|i2_register_v1|i2_operation_v1|g3_owner_list_v1|g3_command_v1|g3_operation_v1|g3_invitation_v1|g3_links_v1|t4_owner_list_v1|t4_command_v1|t4_operation_v1|t4_invitation_v1|t4_profile_v1|p5_list_v1|p5_preview_v1|p5_create_v1|p5_read_v1|p5_step_v1|p5_operation_v1|p5_dates_v1|q6_read_v1|q6_candidates_v1|q6_review_v1|q6_save_v1|q6_operation_v1)$' then
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

do $$declare f record;begin
 for f in select p.oid::regprocedure sig,n.nspname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where p.proname like 'q6_%' and n.nspname in ('academy','public') loop
 execute format('revoke all on function %s from public,anon,authenticated',f.sig);
 if f.nspname='public' then execute format('grant execute on function %s to authenticated',f.sig);end if;
 end loop;
end $$;
