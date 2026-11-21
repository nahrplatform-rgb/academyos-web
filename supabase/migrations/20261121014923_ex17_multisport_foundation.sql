-- Mark the two supported catalog sports without changing any existing IDs or labels.
alter table academy.sports
  add column catalog_key text check (catalog_key in ('football','swimming')),
  add unique (academy_id,catalog_key);

create function academy.setup_sport_key(en text, ar text) returns text
language sql immutable security invoker set search_path='' as $$
  select case
    when lower(trim(en)) in ('football','soccer') and trim(ar)='كرة القدم' then 'football'
    when lower(trim(en))='swimming' and trim(ar)='السباحة' then 'swimming'
  end
$$;

update academy.sports s
set catalog_key=academy.setup_sport_key(s.label_en,s.label_ar)
from academy.initial_setup z
where z.sport_id=s.id and z.academy_id=s.academy_id
  and academy.setup_sport_key(s.label_en,s.label_ar) is not null;

create function academy.enabled_sports(a uuid) returns jsonb
language sql stable security invoker set search_path='' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',s.id,'label_en',s.label_en,'label_ar',s.label_ar,'catalog_key',s.catalog_key
  ) order by (s.id=z.sport_id) desc,s.catalog_key,s.id),'[]'::jsonb)
  from academy.sports s join academy.initial_setup z on z.academy_id=s.academy_id
  where s.academy_id=a and (s.id=z.sport_id or s.catalog_key is not null)
$$;

create function academy.p5_selected_sport(a uuid, d jsonb, ctx jsonb) returns jsonb
language plpgsql stable security invoker set search_path='' as $$
declare selected uuid:=coalesce(d->>'sport_id',ctx->>'sport_id')::uuid;
begin
  if not exists (
    select from academy.sports s where s.academy_id=a and s.id=selected
      and (s.id=(ctx->>'sport_id')::uuid or s.catalog_key is not null)
  ) then raise exception 'Invalid sport' using errcode='22023'; end if;
  return ctx||jsonb_build_object('sport_id',selected);
end
$$;

revoke execute on function academy.setup_sport_key(text,text), academy.enabled_sports(uuid),
  academy.p5_selected_sport(uuid,jsonb,jsonb) from public,anon,authenticated;


create or replace function public.m1_setup_v1(a uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare s text:=academy.m1_owner(a); r jsonb; begin
 select jsonb_build_object('academy_id',x.id,'name',x.name,'version',x.setup_version,'complete',x.setup_complete,'timezone',x.timezone,'sports',academy.enabled_sports(a),
 'branch',case when b.id is null then null else jsonb_build_object('id',b.id,'name',b.name) end,
 'sport',case when p.id is null then null else jsonb_build_object('id',p.id,'label_en',p.label_en,'label_ar',p.label_ar) end)
 into r from academy.academies x join academy.initial_setup z on z.academy_id=x.id
 left join academy.branches b on b.id=z.branch_id and b.academy_id=x.id
 left join academy.sports p on p.id=z.sport_id and p.academy_id=x.id where x.id=a;
 if r is null then raise exception 'Setup unavailable' using errcode='22023';end if;return r;
end $$;

create or replace function academy.m1_receipt(s text, op uuid, act text, a uuid, payload jsonb, result jsonb) returns jsonb language plpgsql security invoker set search_path='' as $$ begin
 insert into academy.operations values(s,op,act,a,payload,result,now());
 insert into academy.audit_events(actor,academy_id,action,operation_id,details) values(s,a,act,op,jsonb_strip_nulls(jsonb_build_object('result_version',result->'version','generation',result->'generation','branch_id',result->'branch'->'id','sport_id',coalesce(result->'enabled_sport_id',result->'sport'->'id'),'complete',result->'complete')));
 return result;
end $$;

create or replace function public.m1_save_setup_v1(a uuid, op uuid, expected_version integer, step text, fields jsonb)
returns jsonb language plpgsql security definer set search_path=''
set statement_timeout='3s' set lock_timeout='2s' as $$
declare s text:=academy.m1_owner(a); v integer; z academy.initial_setup; r jsonb; sport_key text; id uuid; payload jsonb:=jsonb_build_array(a,expected_version,step,fields);begin
 r:=academy.m1_replay(s,op,'setup.'||step,payload);if r is not null then return r;end if;
 select setup_version into v from academy.academies where academy.academies.id=a for update;
 if expected_version is distinct from v then raise exception 'Version conflict' using errcode='PT409';end if;
 select * into strict z from academy.initial_setup where academy_id=a for update;
 if step is null or step not in ('branch','sport','complete','enable_sport') or fields is null or jsonb_typeof(fields)<>'object' then raise exception 'Invalid step' using errcode='22023';end if;
 if step='enable_sport' then
   sport_key:=fields->>'key';
   if fields-'key'<>'{}'::jsonb or sport_key is null or sport_key not in ('football','swimming')
     or not exists(select from academy.academies ac where ac.id=a and ac.setup_complete)
   then raise exception 'Invalid sport or incomplete setup' using errcode='22023'; end if;
   select s.id into id from academy.sports s where s.academy_id=a and s.catalog_key=sport_key;
   if id is null then
     insert into academy.sports(academy_id,label_en,label_ar,catalog_key)
     values (a,case sport_key when 'football' then 'Football' else 'Swimming' end,
       case sport_key when 'football' then 'كرة القدم' else 'السباحة' end,sport_key)
     returning academy.sports.id into id;
   end if;
   r:=public.m1_setup_v1(a)||jsonb_build_object('enabled_sport_id',id);
   return academy.m1_receipt(s,op,'setup.'||step,a,payload,r);
 end if;
 if step='branch' then
 if jsonb_typeof(fields->'name') is distinct from 'string' or jsonb_typeof(fields->'timezone') is distinct from 'string' or coalesce(length(trim(fields->>'name')),0) not between 1 and 160 or not exists(select from pg_timezone_names where name=fields->>'timezone') or fields - array['name','timezone'] <> '{}'::jsonb then raise exception 'Invalid branch' using errcode='22023';end if;
 if z.branch_id is null then insert into academy.branches(academy_id,name) values(a,trim(fields->>'name')) returning academy.branches.id into id;update academy.initial_setup set branch_id=id where academy_id=a;
 else update academy.branches set name=trim(fields->>'name') where academy.branches.id=z.branch_id and academy_id=a;end if;
 update academy.academies set timezone=fields->>'timezone',setup_complete=false where academy.academies.id=a;
 elsif step='sport' then
 if jsonb_typeof(fields->'label_en') is distinct from 'string' or jsonb_typeof(fields->'label_ar') is distinct from 'string' or coalesce(length(trim(fields->>'label_en')),0) not between 1 and 160 or coalesce(length(trim(fields->>'label_ar')),0) not between 1 and 160 or fields-array['label_en','label_ar']<>'{}'::jsonb then raise exception 'Invalid sport' using errcode='22023';end if;
 if z.sport_id is null then insert into academy.sports(academy_id,label_en,label_ar) values(a,trim(fields->>'label_en'),trim(fields->>'label_ar')) returning academy.sports.id into id;update academy.initial_setup set sport_id=id where academy_id=a;
 else update academy.sports set label_en=trim(fields->>'label_en'),label_ar=trim(fields->>'label_ar') where academy.sports.id=z.sport_id and academy_id=a;id:=z.sport_id;end if;
 sport_key:=academy.setup_sport_key(fields->>'label_en',fields->>'label_ar');
 if sport_key is not null and not exists(select from academy.sports s where s.academy_id=a and s.catalog_key=sport_key) then
   update academy.sports set catalog_key=sport_key where academy.sports.id=id and catalog_key is null;
 end if;
 update academy.academies set setup_complete=false where academy.academies.id=a;
 else
 if fields<>'{}'::jsonb or z.branch_id is null or z.sport_id is null or not exists(select from academy.academies where academy.academies.id=a and timezone is not null) then raise exception 'Setup incomplete' using errcode='22023';end if;
 update academy.academies set setup_complete=true where academy.academies.id=a;
 end if;
 update academy.academies set setup_version=setup_version+1 where academy.academies.id=a;
 r:=public.m1_setup_v1(a); return academy.m1_receipt(s,op,'setup.'||step,a,payload,r);
end $$;

create or replace function academy.p5_definition(d jsonb) returns jsonb language plpgsql immutable security invoker set search_path='' as $$
declare r jsonb; rules jsonb; first_date date; last_date date;begin
 if jsonb_typeof(d) is distinct from 'object' or (d-array['name','from','to','rules','sport_id'])<>'{}'::jsonb
 or jsonb_typeof(d->'name') is distinct from 'string' or length(trim(d->>'name')) not between 1 and 160
 or jsonb_typeof(d->'rules') is distinct from 'array' or jsonb_array_length(d->'rules') not between 1 and 7
 or coalesce(d->>'from','') !~ '^\d{4}-\d{2}-\d{2}$' or coalesce(d->>'to','') !~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'Invalid program' using errcode='22023';end if;
 if d ? 'sport_id' and (jsonb_typeof(d->'sport_id') is distinct from 'string'
   or d->>'sport_id' !~* '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$')
 then raise exception 'Invalid sport' using errcode='22023';end if;
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
 return jsonb_build_object('name',trim(d->>'name'),'from',first_date::text,'to',last_date::text,'rules',rules)
   || case when d ? 'sport_id' then jsonb_build_object('sport_id',(d->>'sport_id')::uuid) else '{}'::jsonb end;
 exception when invalid_datetime_format or datetime_field_overflow then raise exception 'Invalid dates' using errcode='22023';
end $$;

create or replace function academy.p5_projection(p academy.training_programs) returns jsonb language sql stable security invoker set search_path='' as $$
 select jsonb_build_object('id',p.id,'definition',p.definition,'timezone',p.timezone,'state',p.state,'completed',p.next_window,'windows',p.window_count,'prepared',p.prepared_count,'total',p.expected_count,'version',p.version,'failure',p.failure_code,'failure_date',p.failure_date,'context_version',p.context_version,
   'sport_id',p.sport_id,'sport_name',s.label_en,'sport_name_ar',s.label_ar)
 from academy.sports s where s.id=p.sport_id and s.academy_id=p.academy_id
$$;

create or replace function public.p5_list_v1(a uuid,after_id uuid default null) returns jsonb language plpgsql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s' as $$
declare ctx jsonb:=academy.p5_context(a);items jsonb;more boolean;begin
 select coalesce(jsonb_agg(academy.p5_projection(q)),'[]') into items from (select p.* from academy.training_programs p where p.academy_id=a and (after_id is null or p.id>after_id) order by p.id limit 26) q;
 more:=jsonb_array_length(items)>25;if more then items:=items-25;end if;return jsonb_build_object('context',ctx||jsonb_build_object('sports',academy.enabled_sports(a)),'items',items,'more',more);
end $$;

create or replace function public.p5_preview_v1(a uuid,definition jsonb,expected_context integer,idx integer,previous jsonb default null) returns jsonb language plpgsql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s' as $$
declare ctx jsonb:=academy.p5_context(a);subject text:=academy.verified_subject();d jsonb:=academy.p5_definition(definition);seed text;root text;through integer:=-1;w jsonb;receipt jsonb;begin
 if expected_context is distinct from (ctx->>'version')::integer then raise exception 'Context changed' using errcode='PT409';end if;
 if academy.p5_count(d)=0 then raise exception 'No dates' using errcode='22023';end if;
 ctx:=academy.p5_selected_sport(a,d,ctx);
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

create or replace function public.p5_create_v1(a uuid,op uuid,definition jsonb,expected_context integer,review jsonb default null) returns jsonb language plpgsql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s' as $$
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
 ctx:=academy.p5_selected_sport(a,d,ctx);
 seed:=academy.p5_seed(a,d,ctx);root:=academy.p5_review_root(review,s,seed,((d->>'to')::date-(d->>'from')::date)/28);
 insert into academy.training_programs(id,academy_id,branch_id,sport_id,context_version,timezone,definition,starts_on,ends_on,expected_count,window_count,created_by,review_root,prepared_root)
 values(gen_random_uuid(),a,(ctx->>'branch_id')::uuid,(ctx->>'sport_id')::uuid,expected_context,ctx->>'timezone',d,(d->>'from')::date,(d->>'to')::date,academy.p5_count(d),1+((d->>'to')::date-(d->>'from')::date)/28,s,root,seed) returning * into p;
 insert into academy.training_operations(actor,id,academy_id,fingerprint,program_id) values(s,op,a,fp,p.id);
 insert into academy.audit_events(actor,academy_id,action,operation_id,details) values(s,a,'program.create',op,jsonb_build_object('program_id',p.id));
 return academy.p5_projection(p);
end $$;

create or replace function public.p5_step_v1(a uuid,program uuid,expected_version bigint,act text) returns jsonb language plpgsql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s' as $$
declare ctx jsonb:=academy.p5_context(a);s text:=academy.verified_subject();p academy.training_programs;w jsonb;row jsonb;n integer:=0;begin
 if act is null or act not in ('prepare','pause','resume','finalize') or expected_version is null or expected_version<1 then raise exception 'Invalid action' using errcode='22023';end if;
 select * into p from academy.training_programs where id=program and academy_id=a for update;
 if not found then raise exception 'Access denied' using errcode='42501';end if;
 -- A retry of a committed chunk returns current state; it must not process a second chunk.
 if expected_version<p.version then return academy.p5_projection(p);end if;
 if expected_version<>p.version then raise exception 'Version conflict' using errcode='PT409';end if;
 if p.state='ready' then return academy.p5_projection(p);end if;
 if p.context_version<>(ctx->>'version')::integer or p.timezone is distinct from ctx->>'timezone' or p.branch_id<>(ctx->>'branch_id')::uuid then raise exception 'Context changed' using errcode='PT409';end if;
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

create or replace function academy.x15_rows(a uuid,actor text,ctx jsonb,first_date date,last_date date)
returns table(id uuid,program uuid,day date,scheduled date,starts_at timestamptz,ends_at timestamptz,title text,branch text,sport text,sport_ar text,timezone text,state text,published boolean,capacity integer,roster_count integer)
language plpgsql security invoker set search_path='' as $$begin
 if actor='owner' then return query
  select coalesce(e.id,d.program_id),d.program_id,d.local_date,d.scheduled_date,d.starts_at,d.ends_at,p.definition->>'name',ctx->>'branch_name',s.label_en,s.label_ar,p.timezone,
   case when d.canceled then 'cancelled' when d.scheduled_date<>d.local_date then 'moved' when coalesce(e.published,false)then 'published' else 'draft'end,
   coalesce(e.published,false),q.capacity,coalesce(q.roster_count,0)
  from academy.training_dates d join academy.training_programs p on p.id=d.program_id and p.academy_id=a and p.state='ready' and p.branch_id=(ctx->>'branch_id')::uuid
  join academy.sports s on s.id=p.sport_id and s.academy_id=a
  left join academy.date_plans q on q.program_id=d.program_id and q.local_date=d.local_date and q.academy_id=a
  left join academy.publication_heads h on h.program_id=d.program_id and h.day=d.local_date and h.academy_id=a
  left join academy.publication_events e on e.id=h.event_id and e.academy_id=a
  where d.academy_id=a and d.scheduled_date between first_date and last_date;
 elsif actor in('trainer','guardian')then return query
  select e.id,e.program_id,e.day,(e.starts_at at time zone(e.projection->>'timezone'))::date,e.starts_at,e.ends_at,e.projection->>'name',e.projection->>'branch',e.projection->>'sport',e.projection->>'sport_ar',e.projection->>'timezone',
   case when d.scheduled_date<>d.local_date then 'moved' else 'published'end,true,e.capacity,e.roster_count
  from academy.publication_heads h join academy.publication_events e on e.id=h.event_id and e.academy_id=h.academy_id
  join academy.training_dates d on d.program_id=e.program_id and d.local_date=e.day and d.academy_id=a and not d.canceled and d.starts_at=e.starts_at and d.ends_at=e.ends_at
  where h.academy_id=a and e.published and(e.starts_at at time zone(e.projection->>'timezone'))::date between first_date and last_date
  and case when actor='trainer'then e.trainer_id=(ctx->>'staff')::uuid and academy.q6_eligible(a,e.branch_id,e.trainer_id)
   else exists(select 1 from academy.publication_rosters r where r.event_id=e.id and r.player_id=(ctx->>'player')::uuid)end;
 else raise exception 'Access denied'using errcode='42501';end if;
end$$;

create or replace trigger x21_update after update on academy.training_programs
  referencing old table as x21_old_rows new table as x21_new_rows
  for each statement execute function academy.x21_revise(
    'calendar','academy_id','academy_id,id,state,branch_id,sport_id,definition,timezone'
  );

create or replace view academy.x21_calendar_rows with (security_invoker=true) as
  select d.academy_id, coalesce(e.id,d.program_id) id, d.program_id program,
    d.local_date as day, d.scheduled_date as date, d.starts_at, d.ends_at,
    p.definition->>'name' title, b.name branch, s.label_en sport, s.label_ar sport_ar,
    p.timezone, case when d.canceled then 'cancelled' when d.scheduled_date<>d.local_date then 'moved'
      when coalesce(e.published,false) then 'published' else 'draft' end state,
    coalesce(e.published,false) published, q.capacity, coalesce(q.roster_count,0) roster_count
  from academy.training_dates d
  join academy.training_programs p on p.id=d.program_id and p.academy_id=d.academy_id and p.state='ready'
  join academy.initial_setup z on z.academy_id=d.academy_id and z.branch_id=p.branch_id
  join academy.branches b on b.id=z.branch_id and b.academy_id=d.academy_id
  join academy.sports s on s.id=p.sport_id and s.academy_id=d.academy_id
  left join academy.date_plans q on q.program_id=d.program_id and q.local_date=d.local_date and q.academy_id=d.academy_id
  left join academy.publication_heads h on h.program_id=d.program_id and h.day=d.local_date and h.academy_id=d.academy_id
  left join academy.publication_events e on e.id=h.event_id and e.academy_id=d.academy_id;

create or replace function academy.x21_snapshot(actor text,a uuid,device uuid,ns uuid,p jsonb,want_rows boolean)
returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare
  ctx jsonb; revisions jsonb; scope text; result jsonb; items jsonb;
  total bigint; cursor jsonb := p->'cursor'; dataset text := p->>'dataset';
begin
  select jsonb_build_object('academy_id',ac.id,'academy_name',ac.name,'version',ac.setup_version,
      'branch_id',b.id,'branch_name',b.name,'sport_id',s.id,'sport_name',s.label_en,'sport_name_ar',s.label_ar,'timezone',ac.timezone),
    jsonb_build_object('people',coalesce(r.people,0)::text,'calendar',coalesce(r.calendar,0)::text)
    into ctx,revisions
  from academy.academies ac join academy.initial_setup z on z.academy_id=ac.id
  join academy.branches b on b.id=z.branch_id and b.academy_id=ac.id
  join academy.sports s on s.id=z.sport_id and s.academy_id=ac.id
  join academy.owner_workspace_keys k on k.subject=actor and k.academy_id=ac.id
    and k.device_id=device and k.namespace=ns and k.field_epoch=1
  left join academy.workspace_revisions r on r.academy_id=ac.id
  where ac.id=a and ac.setup_complete;
  if ctx is null then raise exception 'Access denied' using errcode='42501'; end if;
  scope := academy.x17_hash('x21-scope-v1'||jsonb_build_array(a,device,ns,1,ctx)::text);
  result := jsonb_build_object('context',ctx,'scope',scope,'revisions',revisions);
  if p is not null and (p->>'scope' is distinct from scope or p->>'revision' is distinct from revisions->>dataset) then
    return jsonb_build_object('error','changed');
  end if;
  if not want_rows then return result; end if;
  total := (p->>'total')::bigint;
  if dataset='people' then
    if p->>'phase'='seed' then select count(*) into total from academy.x21_people_rows where academy_id=a; end if;
    select coalesce(jsonb_agg(to_jsonb(q) order by q.id),'[]'::jsonb) into items from (
      select id,display_name,branch_id,branch_name from academy.x21_people_rows
      where academy_id=a and (cursor='null'::jsonb or id>(cursor->>'id')::uuid) order by id limit 26
    ) q;
  elsif dataset='calendar' then
    if p->>'phase'='seed' then
      select count(*) into total from academy.x21_calendar_rows
        where academy_id=a and date between (p->>'first')::date and (p->>'last')::date;
    end if;
    with window_dates as materialized (
      select d.program_id,d.local_date,d.scheduled_date,d.starts_at,d.ends_at,d.canceled
      from academy.training_dates d
      where d.academy_id=a and d.scheduled_date between (p->>'first')::date and (p->>'last')::date
        and (cursor='null'::jsonb or (d.scheduled_date,d.starts_at,d.program_id,d.local_date)>
          ((cursor->>'date')::date,(cursor->>'at')::timestamptz,(cursor->>'program')::uuid,(cursor->>'day')::date))
        and exists(select 1 from academy.training_programs pr where pr.id=d.program_id and pr.academy_id=a
          and pr.state='ready' and pr.branch_id=(ctx->>'branch_id')::uuid)
      order by d.scheduled_date,d.starts_at,d.program_id,d.local_date limit 51
    )
    select coalesce(jsonb_agg(jsonb_build_object('id',q.id,'program',q.program,'day',q.day,'date',q.date,
        'starts_at',to_char(q.starts_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
        'ends_at',to_char(q.ends_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
        'title',q.title,'branch',q.branch,'sport',q.sport,'sport_ar',q.sport_ar,'timezone',q.timezone,
        'state',q.state,'published',q.published,'capacity',q.capacity,'roster_count',q.roster_count)
      order by q.date,q.starts_at,q.program,q.day),'[]'::jsonb) into items from (
      select coalesce(e.id,d.program_id) id,d.program_id program,d.local_date as day,d.scheduled_date as date,
        d.starts_at,d.ends_at,pr.definition->>'name' title,ctx->>'branch_name' branch,
        sport.label_en sport,sport.label_ar sport_ar,pr.timezone,
        case when d.canceled then 'cancelled' when d.scheduled_date<>d.local_date then 'moved'
          when coalesce(e.published,false) then 'published' else 'draft' end state,
        coalesce(e.published,false) published,q.capacity,coalesce(q.roster_count,0) roster_count
      from window_dates d join academy.training_programs pr on pr.id=d.program_id and pr.academy_id=a
      join academy.sports sport on sport.id=pr.sport_id and sport.academy_id=a
      left join academy.date_plans q on q.academy_id=a and q.program_id=d.program_id and q.local_date=d.local_date
      left join academy.publication_heads h on h.academy_id=a and h.program_id=d.program_id and h.day=d.local_date
      left join academy.publication_events e on e.academy_id=a and e.id=h.event_id
    ) q;
  else
    raise exception 'Invalid collection' using errcode='22023';
  end if;
  if total>9007199254740991 then raise exception 'Collection exceeds client count bound' using errcode='54000'; end if;
  return result||jsonb_build_object('items',items,'total',total);
end
$$;

create or replace function public.s8_change_v1(a uuid,j uuid,op uuid,expected_version bigint,act text)returns jsonb language plpgsql security definer set search_path=''set statement_timeout='3s'set lock_timeout='2s'as $$
declare s text;job academy.publication_jobs;old academy.publication_operations;fp text;target_row record;issue text;result jsonb;ctx jsonb; sport academy.sports; ev uuid;begin
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
 select s.* into strict sport from academy.training_programs p
 join academy.sports s on s.id=p.sport_id and s.academy_id=p.academy_id
 where p.id=job.program_id and p.academy_id=a;
 for target_row in select t.day,dp.* from academy.publication_targets t join academy.date_plans dp on dp.program_id=t.program_id and dp.local_date=t.day and dp.academy_id=t.academy_id where t.job_id=j and t.changing order by t.day loop
 insert into academy.publication_events(academy_id,program_id,day,job_id,published,plan_version,trainer_id,branch_id,capacity,roster_count,starts_at,ends_at,projection)
 values(a,job.program_id,target_row.day,j,job.kind='publish',target_row.version,target_row.trainer_id,target_row.branch_id,target_row.capacity,target_row.roster_count,target_row.starts_at,target_row.ends_at,jsonb_build_object('name',(select definition->>'name'from academy.training_programs where id=job.program_id),'branch',ctx->>'branch_name','sport',sport.label_en,'sport_ar',sport.label_ar,'timezone',ctx->>'timezone','scheduled_day',(select scheduled_date from academy.training_dates where program_id=job.program_id and local_date=target_row.day and academy_id=a)))returning id into ev;
 if job.kind='publish'then insert into academy.publication_rosters(event_id,player_id,name)select ev,p.id,p.display_name from academy.date_rosters r join academy.players p on p.id=r.player_id and p.academy_id=r.academy_id where r.academy_id=a and r.program_id=job.program_id and r.local_date=target_row.day;end if;
 insert into academy.publication_heads values(a,job.program_id,target_row.day,ev)on conflict(program_id,day)do update set event_id=excluded.event_id;
 end loop;
 if exists(select 1 from academy.publication_targets t join academy.date_plans dp on dp.program_id=t.program_id and dp.local_date=t.day and dp.academy_id=t.academy_id where t.job_id=j and t.changing and dp.starts_at<=clock_timestamp())then raise exception 'Date started during activation'using errcode='PT409';end if;update academy.publication_jobs set state='committed'where id=j;
 end if;
 update academy.publication_jobs set version=version+1 where id=j returning jsonb_build_object('job',id,'version',version,'state',state)into result;
 insert into academy.publication_operations(actor,id,academy_id,fingerprint,result)values(s,op,a,fp,result);insert into academy.audit_events(actor,academy_id,action,operation_id,details)values(s,a,'publication.'||act,op,jsonb_build_object('job_id',j,'kind',job.kind));return result;
end$$;
