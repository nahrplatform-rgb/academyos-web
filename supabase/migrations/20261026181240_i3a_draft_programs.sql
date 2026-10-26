-- Approved I3a: immutable Owner-only draft definitions and bounded resumable preparation.
-- No memberships, invitations, assignments, publication or grants are seeded.
create table academy.training_programs (
 id uuid primary key, academy_id uuid not null references academy.academies, unique(id,academy_id),
 branch_id uuid not null, sport_id uuid not null, context_version integer not null,
 timezone text not null, definition jsonb not null, starts_on date not null, ends_on date not null,
 expected_count integer not null check(expected_count>0), window_count integer not null check(window_count>0),
 next_window integer not null default 0 check(next_window>=0), prepared_count integer not null default 0,
 state text not null default 'preparing' check(state in ('preparing','paused','failed','ready')),
 review_root text not null check(review_root ~ '^[a-f0-9]{64}$'), prepared_root text not null check(prepared_root ~ '^[a-f0-9]{64}$'),
 failure_code text, failure_date date, version bigint not null default 1,
 created_by text not null, created_at timestamptz not null default now(),
 check(ends_on>=starts_on and next_window<=window_count and prepared_count between 0 and expected_count),
 foreign key(branch_id,academy_id) references academy.branches(id,academy_id),
 foreign key(sport_id,academy_id) references academy.sports(id,academy_id)
);
create index training_programs_cursor on academy.training_programs(academy_id,id);
create table academy.training_dates (
 program_id uuid not null, academy_id uuid not null, local_date date not null,
 foreign key(program_id,academy_id) references academy.training_programs(id,academy_id),
 starts_local time not null, ends_local time not null, starts_at timestamptz not null, ends_at timestamptz not null,
 primary key(program_id,local_date),check(ends_local>starts_local and ends_at>starts_at)
);
create table academy.training_operations (
 actor text not null, id uuid not null, academy_id uuid not null references academy.academies,
 fingerprint text, program_id uuid references academy.training_programs,
 cancelled boolean not null default false, created_at timestamptz not null default now(),
 primary key(actor,id), check((program_id is null)=cancelled)
);
do $$declare t text;begin foreach t in array array['training_programs','training_dates','training_operations'] loop
 execute format('alter table academy.%I enable row level security',t);
 execute format('revoke all on academy.%I from public,anon,authenticated',t);end loop;end $$;

create function academy.p5_definition(d jsonb) returns jsonb language plpgsql immutable security invoker set search_path='' as $$
declare r jsonb; rules jsonb; first_date date; last_date date;begin
 if jsonb_typeof(d) is distinct from 'object' or (d-array['name','from','to','rules'])<>'{}'::jsonb
 or jsonb_typeof(d->'name') is distinct from 'string' or length(trim(d->>'name')) not between 1 and 160
 or jsonb_typeof(d->'rules') is distinct from 'array' or jsonb_array_length(d->'rules') not between 1 and 7
 or coalesce(d->>'from','') !~ '^\d{4}-\d{2}-\d{2}$' or coalesce(d->>'to','') !~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'Invalid program' using errcode='22023';end if;
 first_date:=(d->>'from')::date;last_date:=(d->>'to')::date;
 if last_date<first_date then raise exception 'Invalid range' using errcode='22023';end if;
 for r in select value from jsonb_array_elements(d->'rules') loop
 if jsonb_typeof(r) is distinct from 'object' or (r-array['day','start','end'])<>'{}'::jsonb
 or jsonb_typeof(r->'day') is distinct from 'number' or (r->>'day') !~ '^[0-6]$'
 or coalesce(r->>'start','') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' or coalesce(r->>'end','') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
 or r->>'end'<=r->>'start' then raise exception 'Invalid weekday time' using errcode='22023';end if;
 end loop;
 if (select count(distinct value->>'day') from jsonb_array_elements(d->'rules'))<>jsonb_array_length(d->'rules') then raise exception 'Duplicate weekday' using errcode='22023';end if;
 select jsonb_agg(value order by (value->>'day')::integer) into rules from jsonb_array_elements(d->'rules');
 return jsonb_build_object('name',trim(d->>'name'),'from',first_date::text,'to',last_date::text,'rules',rules);
 exception when invalid_datetime_format or datetime_field_overflow then raise exception 'Invalid dates' using errcode='22023';
end $$;
create function academy.p5_count(d jsonb) returns integer language sql immutable security invoker set search_path='' as $$
 select coalesce(sum(case when offset_days<days then 1+(days-1-offset_days)/7 else 0 end),0)::integer from (
 select ((value->>'day')::integer-extract(dow from (d->>'from')::date)::integer+7)%7 offset_days,
 (d->>'to')::date-(d->>'from')::date+1 days from jsonb_array_elements(d->'rules')) q
$$;
-- Collect actual timezone offsets surrounding the local wall time and round-trip every candidate.
-- Reject both gaps and folds; never let AT TIME ZONE silently choose an offset.
create function academy.p5_instant(w timestamp, z text) returns timestamptz language sql stable security invoker set search_path='' as $$
 with offsets as (select distinct (v at time zone z)-(v at time zone 'UTC') delta
 from generate_series((w at time zone 'UTC')-interval '36 hours',(w at time zone 'UTC')+interval '36 hours',interval '1 hour') v),
 candidates as (select (w-delta) at time zone 'UTC' instant from offsets)
 select case when count(*)=1 then min(instant) else null end from candidates where instant at time zone z=w
$$;
create function academy.p5_window(d jsonb,z text,idx integer) returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare first_date date:=(d->>'from')::date; last_date date:=(d->>'to')::date; day date; rule jsonb; st timestamptz; en timestamptz; rows jsonb:='[]';begin
 if idx is null or idx<0 or idx>(last_date-first_date)/28 then raise exception 'Invalid window' using errcode='22023';end if;
 for day in select (first_date+idx*28)+n from generate_series(0,least(27,last_date-(first_date+idx*28))) n loop
 select value into rule from jsonb_array_elements(d->'rules') where (value->>'day')::integer=extract(dow from day)::integer;
 if rule is null then continue;end if;
 st:=academy.p5_instant(day+(rule->>'start')::time,z);en:=academy.p5_instant(day+(rule->>'end')::time,z);
 if st is null or en is null or en<=st then return jsonb_build_object('error','invalid_time','date',day);end if;
 rows:=rows||jsonb_build_array(jsonb_build_object('date',day,'start',rule->>'start','end',rule->>'end','utcStart',to_char(st at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"'),'utcEnd',to_char(en at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"')));
 end loop;
 return jsonb_build_object('dates',rows,'window',idx,'windows',1+(last_date-first_date)/28,'total',academy.p5_count(d));
end $$;
-- Fixed-size, domain-separated review chain. No caller-supplied dates are trusted.
create function academy.p5_seed(a uuid,d jsonb,c jsonb) returns text language sql immutable security invoker set search_path='' as $$
 select encode(extensions.digest(jsonb_build_array(a,d,c->'branch_id',c->'sport_id',c->'timezone',c->'version')::text,'sha256'),'hex')
$$;
create function academy.p5_chain(previous text,dates jsonb) returns text language sql immutable security invoker set search_path='' as $$
 select encode(extensions.digest(jsonb_build_array(previous,dates)::text,'sha256'),'hex')
$$;
create function academy.p5_review_signature(subject text,seed text,through integer,digest text) returns text language sql stable security invoker set search_path='' as $$
 select encode(extensions.hmac(jsonb_build_array('p5-reviewed-window-v1',subject,seed,through,digest)::text,s.secret,'sha256'),'hex') from academy.m1_secrets s where s.purpose='onboarding'
$$;
create function academy.p5_review_root(receipt jsonb,subject text,seed text,through integer) returns text language plpgsql stable security invoker set search_path='' as $$
declare signature text;begin
 if jsonb_typeof(receipt) is distinct from 'object' or receipt-array['through','digest','signature']<>'{}'::jsonb
 or jsonb_typeof(receipt->'through') is distinct from 'number' or coalesce(receipt->>'through','') !~ '^[0-9]{1,9}$'
 or (receipt->>'through')::integer is distinct from through
 or coalesce(receipt->>'digest','') !~ '^[a-f0-9]{64}$' or coalesce(receipt->>'signature','') !~ '^[a-f0-9]{64}$' then raise exception 'Review every window' using errcode='22023';end if;
 signature:=academy.p5_review_signature(subject,seed,through,receipt->>'digest');
 if signature is null or receipt->>'signature' is distinct from signature then raise exception 'Invalid review receipt' using errcode='22023';end if;
 return receipt->>'digest';
end $$;
create function academy.p5_context(a uuid) returns jsonb language plpgsql security invoker set search_path='' as $$
declare s text:=academy.i2_owner(a);r jsonb;begin
 select jsonb_build_object('academy_id',a,'academy_name',x.name,'branch_id',b.id,'branch_name',b.name,'sport_id',p.id,'sport_name',p.label_en,'sport_name_ar',p.label_ar,'timezone',x.timezone,'version',x.setup_version)
 into r from academy.academies x join academy.initial_setup i on i.academy_id=x.id join academy.branches b on b.id=i.branch_id join academy.sports p on p.id=i.sport_id where x.id=a;
 if r is null then raise exception 'Access denied' using errcode='42501';end if;return r;
end $$;
create function academy.p5_projection(p academy.training_programs) returns jsonb language sql stable security invoker set search_path='' as $$
 select jsonb_build_object('id',p.id,'definition',p.definition,'timezone',p.timezone,'state',p.state,'completed',p.next_window,'windows',p.window_count,'prepared',p.prepared_count,'total',p.expected_count,'version',p.version,'failure',p.failure_code,'failure_date',p.failure_date,'context_version',p.context_version)
$$;
create function public.p5_list_v1(a uuid,after_id uuid default null) returns jsonb language plpgsql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s' as $$
declare ctx jsonb:=academy.p5_context(a);items jsonb;more boolean;begin
 select coalesce(jsonb_agg(academy.p5_projection(q)),'[]') into items from (select p.* from academy.training_programs p where p.academy_id=a and (after_id is null or p.id>after_id) order by p.id limit 26) q;
 more:=jsonb_array_length(items)>25;if more then items:=items-25;end if;return jsonb_build_object('context',ctx,'items',items,'more',more);
end $$;
create function public.p5_preview_v1(a uuid,definition jsonb,expected_context integer,idx integer,previous jsonb default null) returns jsonb language plpgsql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s' as $$
declare ctx jsonb:=academy.p5_context(a);subject text:=academy.verified_subject();d jsonb:=academy.p5_definition(definition);seed text;root text;through integer:=-1;w jsonb;receipt jsonb;begin
 if expected_context is distinct from (ctx->>'version')::integer then raise exception 'Context changed' using errcode='PT409';end if;
 if academy.p5_count(d)=0 then raise exception 'No dates' using errcode='22023';end if;
 seed:=academy.p5_seed(a,d,ctx);root:=seed;
 if previous is not null then
 if coalesce(previous->>'through','') !~ '^[0-9]{1,9}$' then raise exception 'Invalid review receipt' using errcode='22023';end if;
 through:=(previous->>'through')::integer;root:=academy.p5_review_root(previous,subject,seed,through);
 end if;
 if idx is null or idx>through+1 then raise exception 'Review previous windows first' using errcode='22023';end if;
 w:=academy.p5_window(d,ctx->>'timezone',idx);if w ? 'error' then return w;end if;
 if idx=through+1 then
 root:=academy.p5_chain(root,w->'dates');receipt:=jsonb_build_object('through',idx,'digest',root,'signature',academy.p5_review_signature(subject,seed,idx,root));
 else receipt:=previous;end if;
 return w||jsonb_build_object('receipt',receipt);
end $$;
create function public.p5_create_v1(a uuid,op uuid,definition jsonb,expected_context integer,review jsonb default null) returns jsonb language plpgsql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s' as $$
declare ctx jsonb:=academy.p5_context(a);s text:=academy.verified_subject();d jsonb:=academy.p5_definition(definition);fp text;seed text;root text;old academy.training_operations;p academy.training_programs;begin
 if op is null or expected_context is null then raise exception 'Invalid intent' using errcode='22023';end if;
 fp:=encode(extensions.digest(jsonb_build_array(a,d,expected_context,review)::text,'sha256'),'hex');
 perform pg_advisory_xact_lock(hashtextextended('program-op:'||s||op::text,0));
 select * into old from academy.training_operations where actor=s and id=op;
 if found then
 if old.academy_id<>a or old.fingerprint is distinct from fp or old.cancelled then raise exception 'Operation conflict' using errcode='23505';end if;
 select * into p from academy.training_programs where id=old.program_id and academy_id=a;return academy.p5_projection(p);end if;
 if expected_context is distinct from (ctx->>'version')::integer then raise exception 'Context changed' using errcode='PT409';end if;
 if academy.p5_count(d)=0 then raise exception 'No dates' using errcode='22023';end if;
 seed:=academy.p5_seed(a,d,ctx);root:=academy.p5_review_root(review,s,seed,((d->>'to')::date-(d->>'from')::date)/28);
 insert into academy.training_programs(id,academy_id,branch_id,sport_id,context_version,timezone,definition,starts_on,ends_on,expected_count,window_count,created_by,review_root,prepared_root)
 values(gen_random_uuid(),a,(ctx->>'branch_id')::uuid,(ctx->>'sport_id')::uuid,expected_context,ctx->>'timezone',d,(d->>'from')::date,(d->>'to')::date,academy.p5_count(d),1+((d->>'to')::date-(d->>'from')::date)/28,s,root,seed) returning * into p;
 insert into academy.training_operations(actor,id,academy_id,fingerprint,program_id) values(s,op,a,fp,p.id);
 insert into academy.audit_events(actor,academy_id,action,operation_id,details) values(s,a,'program.create',op,jsonb_build_object('program_id',p.id));
 return academy.p5_projection(p);
end $$;
create function public.p5_read_v1(a uuid,program uuid,idx integer default 0) returns jsonb language plpgsql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s' as $$
declare ctx jsonb:=academy.p5_context(a);p academy.training_programs;rows jsonb;begin
 select * into p from academy.training_programs where id=program and academy_id=a for share;
 if not found then raise exception 'Access denied' using errcode='42501';end if;
 if idx is null or idx<0 or idx>=p.window_count then raise exception 'Invalid window' using errcode='22023';end if;
 rows:='[]';if p.state='ready' then select coalesce(jsonb_agg(to_jsonb(q) order by q.date),'[]') into rows from
 (select local_date::text date,to_char(starts_local,'HH24:MI') start,to_char(ends_local,'HH24:MI') "end",starts_at "utcStart",ends_at "utcEnd" from academy.training_dates where program_id=p.id and local_date between p.starts_on+idx*28 and least(p.ends_on,p.starts_on+idx*28+27)) q;end if;
 return jsonb_build_object('context',ctx,'program',academy.p5_projection(p),'dates',rows,'window',idx);
end $$;
create function public.p5_step_v1(a uuid,program uuid,expected_version bigint,act text) returns jsonb language plpgsql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s' as $$
declare ctx jsonb:=academy.p5_context(a);s text:=academy.verified_subject();p academy.training_programs;w jsonb;row jsonb;n integer:=0;begin
 if act is null or act not in ('prepare','pause','resume','finalize') or expected_version is null or expected_version<1 then raise exception 'Invalid action' using errcode='22023';end if;
 select * into p from academy.training_programs where id=program and academy_id=a for update;
 if not found then raise exception 'Access denied' using errcode='42501';end if;
 -- A retry of a committed chunk returns current state; it must not process a second chunk.
 if expected_version<p.version then return academy.p5_projection(p);end if;
 if expected_version<>p.version then raise exception 'Version conflict' using errcode='PT409';end if;
 if p.state='ready' then return academy.p5_projection(p);end if;
 if p.context_version<>(ctx->>'version')::integer or p.timezone is distinct from ctx->>'timezone' or p.branch_id<>(ctx->>'branch_id')::uuid or p.sport_id<>(ctx->>'sport_id')::uuid then raise exception 'Context changed' using errcode='PT409';end if;
 if act='pause' then p.state:='paused';
 elsif act='resume' then
 if p.state not in ('paused','failed') then raise exception 'Invalid state' using errcode='PT409';end if;
 if p.failure_code in ('invalid_time','preview_changed') then raise exception 'New reviewed definition required' using errcode='PT409';end if;p.state:='preparing';
 elsif act='finalize' then
 if p.state<>'preparing' or p.next_window<>p.window_count or p.prepared_count<>p.expected_count then raise exception 'Incomplete preparation' using errcode='PT409';end if;
 if p.prepared_root is distinct from p.review_root then p.state:='failed';p.failure_code:='preview_changed';else p.state:='ready';end if;
 else
 if p.state<>'preparing' or p.next_window>=p.window_count then raise exception 'Invalid state' using errcode='PT409';end if;
 w:=academy.p5_window(p.definition,p.timezone,p.next_window);
 if w ? 'error' then p.state:='failed';p.failure_code:=w->>'error';p.failure_date:=(w->>'date')::date;
 else
 for row in select value from jsonb_array_elements(w->'dates') loop
 insert into academy.training_dates(program_id,academy_id,local_date,starts_local,ends_local,starts_at,ends_at)
 values(p.id,p.academy_id,(row->>'date')::date,(row->>'start')::time,(row->>'end')::time,(row->>'utcStart')::timestamptz,(row->>'utcEnd')::timestamptz);n:=n+1;
 end loop;
 p.next_window:=p.next_window+1;p.prepared_count:=p.prepared_count+n;p.prepared_root:=academy.p5_chain(p.prepared_root,w->'dates');
 end if;
 end if;
 update academy.training_programs set prepared_root=p.prepared_root,state=p.state,next_window=p.next_window,prepared_count=p.prepared_count,version=p.version+1,failure_code=p.failure_code,failure_date=p.failure_date where id=p.id returning * into p;
 insert into academy.audit_events(actor,academy_id,action,operation_id,details) values(s,a,'program.'||act,p.id,jsonb_build_object('program_id',p.id,'version',p.version,'completed_windows',p.next_window,'state',p.state));
 return academy.p5_projection(p);
end $$;
create function public.p5_operation_v1(a uuid,op uuid) returns jsonb language plpgsql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s' as $$
declare ctx jsonb:=academy.p5_context(a);s text:=academy.verified_subject();old academy.training_operations;p academy.training_programs;begin
 if op is null then raise exception 'Invalid operation' using errcode='22023';end if;
 perform pg_advisory_xact_lock(hashtextextended('program-op:'||s||op::text,0));
 select * into old from academy.training_operations where actor=s and id=op;
 if found then
 if old.academy_id<>a then raise exception 'Access denied' using errcode='42501';end if;
 if old.cancelled then return jsonb_build_object('cancelled',true);end if;
 select * into p from academy.training_programs where id=old.program_id and academy_id=a;return jsonb_build_object('program',academy.p5_projection(p));end if;
 insert into academy.training_operations(actor,id,academy_id,cancelled) values(s,op,a,true);
 insert into academy.audit_events(actor,academy_id,action,operation_id) values(s,a,'program.reconcile_cancel',op);
 return jsonb_build_object('cancelled',true);
end $$;
create index training_dates_window on academy.training_dates(academy_id,local_date,program_id);
create function public.p5_dates_v1(a uuid,day_start date,after_day date default null,after_program uuid default null) returns jsonb language plpgsql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s' as $$
declare ctx jsonb:=academy.p5_context(a);items jsonb;more boolean;begin
 if day_start is null or (after_day is null)<>(after_program is null) then raise exception 'Invalid date cursor' using errcode='22023';end if;
 select coalesce(jsonb_agg(to_jsonb(q) order by q.date,q.program_id),'[]') into items from (
 select d.local_date::text date,d.program_id,(d.local_date-p.starts_on)/28 "window",p.definition->>'name' name,to_char(d.starts_local,'HH24:MI') start,to_char(d.ends_local,'HH24:MI') "end",p.timezone
 from academy.training_dates d join academy.training_programs p on p.id=d.program_id
 where d.academy_id=a and p.academy_id=a and p.state='ready' and d.local_date between day_start and day_start+27
 and (after_day is null or (d.local_date,d.program_id)>(after_day,after_program)) order by d.local_date,d.program_id limit 26) q;
 more:=jsonb_array_length(items)>25;if more then items:=items-25;end if;return jsonb_build_object('items',items,'more',more,'from',day_start,'to',day_start+27);
end $$;
-- Extend the current transport allowlist, preserving all earlier caller checks and APIs.
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
 if method is distinct from 'POST' or path is null or path !~ '^/rpc/(m1_context_v1|m1_platform_list_v1|m1_setup_v1|m1_operation_v1|m1_create_v1|m1_save_setup_v1|m1_manage_invitation_v1|m1_invitation_v1|bootstrap_identity_v1|my_academy_memberships_v1|i2_people_v1|i2_candidates_v1|i2_profile_v1|i2_register_v1|i2_operation_v1|g3_owner_list_v1|g3_command_v1|g3_operation_v1|g3_invitation_v1|g3_links_v1|t4_owner_list_v1|t4_command_v1|t4_operation_v1|t4_invitation_v1|t4_profile_v1|p5_list_v1|p5_preview_v1|p5_create_v1|p5_read_v1|p5_step_v1|p5_operation_v1|p5_dates_v1)$' then
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
 for f in select p.oid::regprocedure sig,n.nspname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where p.proname like 'p5_%' and n.nspname in ('academy','public') loop
 execute format('revoke all on function %s from public,anon,authenticated',f.sig);
 if f.nspname='public' then execute format('grant execute on function %s to authenticated',f.sig);end if;
 end loop;
end $$;
