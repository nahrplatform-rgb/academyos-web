-- EX-13B: separately scoped Owner workspace transfer. No hosted activation.
-- Existing register keys, originals, writers and projections retain their contracts.
create table academy.workspace_revisions (
  academy_id uuid primary key references academy.academies,
  people bigint not null default 0 check (people >= 0),
  calendar bigint not null default 0 check (calendar >= 0)
);
create table academy.owner_workspace_keys (
  subject text not null,
  academy_id uuid not null references academy.academies,
  device_id uuid not null,
  namespace uuid not null unique,
  field_epoch integer not null default 1 check (field_epoch = 1),
  wrapped_key text not null check (wrapped_key ~ '^[A-Za-z0-9_-]{80}$'),
  primary key (subject, academy_id, device_id)
);
create index owner_workspace_keys_academy on academy.owner_workspace_keys(academy_id);
alter table academy.workspace_revisions enable row level security;
alter table academy.owner_workspace_keys enable row level security;
revoke all on academy.workspace_revisions, academy.owner_workspace_keys from public, anon, authenticated;

-- Statement transition relations avoid one counter update per changed player/date.
-- Readers never lock this counter: acquire no new lock before existing domain locks.
create function academy.x21_revise() returns trigger
language plpgsql security invoker set search_path='' as $$
declare
  cols text[] := string_to_array(tg_argv[2], ',');
  n text; o text; changes text; affected uuid;
  people_changed boolean := tg_argv[0] in ('people','both');
  calendar_changed boolean := tg_argv[0] in ('calendar','both');
begin
  if tg_table_schema <> 'academy' or not (people_changed or calendar_changed)
    or tg_op not in ('INSERT','UPDATE','DELETE') then
    raise exception 'Invalid revision trigger' using errcode='22023';
  end if;
  if tg_op = 'UPDATE' then
    select 'jsonb_build_array(' || string_agg(format('n.%I', c), ',' order by position) || ')',
      'jsonb_build_array(' || string_agg(format('o.%I', c), ',' order by position) || ')'
      into n,o from unnest(cols) with ordinality as fields(c,position);
    changes := format(
      'select (v->>0)::uuid a from ((select %s v from x21_new_rows n except select %s from x21_old_rows o)
       union (select %s from x21_old_rows o except select %s from x21_new_rows n)) differences',n,o,o,n);
  elsif tg_op = 'INSERT' then
    changes := format('select %I a from x21_new_rows', tg_argv[1]);
  else
    changes := format('select %I a from x21_old_rows', tg_argv[1]);
  end if;
  for affected in execute 'select distinct a from (' || changes || ') q where a is not null order by a' loop
    insert into academy.workspace_revisions(academy_id, people, calendar)
      values(affected, people_changed::integer, calendar_changed::integer)
    on conflict(academy_id) do update set
      people = academy.workspace_revisions.people + people_changed::integer,
      calendar = academy.workspace_revisions.calendar + calendar_changed::integer;
  end loop;
  return null;
end
$$;

-- The first projection column is always the affected academy ID, including moves.
do $$
declare spec record;
begin
  for spec in select * from (values
    ('academies','both','id','id,name,timezone,setup_complete,setup_version'),
    ('initial_setup','both','academy_id','academy_id,branch_id,sport_id'),
    ('branches','both','academy_id','academy_id,id,name'),
    ('sports','calendar','academy_id','academy_id,id,label_en,label_ar'),
    ('players','people','academy_id','academy_id,id,display_name,branch_id'),
    ('training_programs','calendar','academy_id','academy_id,id,state,branch_id,definition,timezone'),
    ('training_dates','calendar','academy_id','academy_id,program_id,local_date,scheduled_date,starts_at,ends_at,canceled'),
    ('date_plans','calendar','academy_id','academy_id,program_id,local_date,capacity,roster_count'),
    ('publication_heads','calendar','academy_id','academy_id,program_id,day,event_id'),
    ('publication_events','calendar','academy_id','academy_id,id,published')
  ) as t(rel,kind,academy_col,cols) loop
    execute format('create trigger x21_insert after insert on academy.%I referencing new table as x21_new_rows
      for each statement execute function academy.x21_revise(%L,%L,%L)',spec.rel,spec.kind,spec.academy_col,spec.cols);
    execute format('create trigger x21_delete after delete on academy.%I referencing old table as x21_old_rows
      for each statement execute function academy.x21_revise(%L,%L,%L)',spec.rel,spec.kind,spec.academy_col,spec.cols);
    execute format('create trigger x21_update after update on academy.%I referencing old table as x21_old_rows new table as x21_new_rows
      for each statement execute function academy.x21_revise(%L,%L,%L)',spec.rel,spec.kind,spec.academy_col,spec.cols);
  end loop;
end
$$;

-- Private invoker projections; calendar pages bound the date slice before display joins.
create view academy.x21_people_rows with (security_invoker=true) as
  select p.academy_id, p.id, p.display_name, p.branch_id, b.name branch_name
  from academy.players p join academy.branches b on b.id=p.branch_id and b.academy_id=p.academy_id;
create view academy.x21_calendar_rows with (security_invoker=true) as
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
  join academy.sports s on s.id=z.sport_id and s.academy_id=d.academy_id
  left join academy.date_plans q on q.program_id=d.program_id and q.local_date=d.local_date and q.academy_id=d.academy_id
  left join academy.publication_heads h on h.program_id=d.program_id and h.day=d.local_date and h.academy_id=d.academy_id
  left join academy.publication_events e on e.id=h.event_id and e.academy_id=d.academy_id;
revoke all on academy.x21_people_rows, academy.x21_calendar_rows from public, anon, authenticated;
create index training_dates_workspace_cursor on academy.training_dates
  (academy_id,scheduled_date,starts_at,program_id,local_date);

create function public.x21_workspace_key_v1(a uuid,device uuid,expected_subject text,act text,ns uuid,envelope text)
returns jsonb language plpgsql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s' as $$
declare actor text; slot academy.owner_workspace_keys;
begin
  if a is null or device is null or ns is null or act is null or act not in ('prepare','recover')
    or (act='prepare' and (envelope is null or envelope !~ '^[A-Za-z0-9_-]{80}$'))
    or (act='recover' and envelope is not null) then
    raise exception 'Invalid workspace key request' using errcode='22023';
  end if;
  actor := academy.i2_owner(a);
  if actor is distinct from expected_subject then raise exception 'Access denied' using errcode='42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended('owner-workspace-key-v1:'||actor||':'||a::text||':'||device::text,0));
  select * into slot from academy.owner_workspace_keys k where k.subject=actor and k.academy_id=a and k.device_id=device;
  if found then
    if act='recover' and slot.namespace<>ns then raise exception 'Access denied' using errcode='42501'; end if;
  elsif act='recover' then
    raise exception 'Access denied' using errcode='42501';
  else
    insert into academy.owner_workspace_keys(subject,academy_id,device_id,namespace,wrapped_key)
      values(actor,a,device,ns,envelope) returning * into slot;
    insert into academy.audit_events(actor,academy_id,action,operation_id)
      values(actor,a,'workspace.local_device_prepared',slot.namespace);
  end if;
  return jsonb_build_object('subject',actor,'namespace',slot.namespace,'device',slot.device_id,
    'capability','owner-workspace-v1','field_epoch',slot.field_epoch,'wrapped',slot.wrapped_key,
    'verified_at',floor(extract(epoch from clock_timestamp())*1000)::bigint);
end
$$;

create function academy.x21_signature(actor text,p jsonb) returns text
language sql stable security invoker set search_path='' as $$
  select encode(extensions.hmac(jsonb_build_array('x21-owner-workspace-v1',actor,p)::text,k.secret,'sha256'),'hex')
  from academy.m1_secrets k where k.purpose='onboarding'
$$;
create function academy.x21_receipt(actor text,p jsonb) returns jsonb
language plpgsql stable security invoker set search_path='' as $$
declare sig text := academy.x21_signature(actor,p);
begin
  if sig is null then raise exception 'Signing unavailable' using errcode='XX000'; end if;
  return jsonb_build_object('payload',p,'signature',sig);
end
$$;
create function academy.x21_chain(acc text,dataset text,items jsonb) returns text
language plpgsql immutable security invoker set search_path='' as $$
declare item jsonb; k text; frame text; cols text[];
begin
  cols := case dataset when 'people' then array['id','display_name','branch_id','branch_name']
    when 'calendar' then array['id','program','day','date','starts_at','ends_at','title','branch','sport','sport_ar','timezone','state','published','capacity','roster_count'] end;
  if cols is null then raise exception 'Invalid collection' using errcode='22023'; end if;
  for item in select value from jsonb_array_elements(items) loop
    frame := 'x21-row-v1'||academy.x17_frame(acc)||academy.x17_frame(dataset);
    foreach k in array cols loop frame := frame||academy.x17_frame(item->>k); end loop;
    acc := academy.x17_hash(frame);
  end loop;
  return acc;
end
$$;

create function academy.x21_proof(receipt jsonb,actor text,a uuid,device uuid,ns uuid) returns jsonb
language plpgsql stable security invoker set search_path='' as $$
declare
  p jsonb := receipt->'payload'; k text;
  keys text[] := array['v','a','device','ns','epoch','scope','dataset','first','last','revision','total','seen','cursor','acc','issued','phase'];
begin
  if jsonb_typeof(receipt) is distinct from 'object' or not receipt ?& array['payload','signature']
    or receipt-array['payload','signature'] <> '{}'::jsonb
    or jsonb_typeof(p) is distinct from 'object' or not p ?& keys or p-keys <> '{}'::jsonb
    or jsonb_typeof(receipt->'signature') is distinct from 'string' or coalesce(receipt->>'signature','') !~ '^[a-f0-9]{64}$'
    or academy.x21_signature(actor,p) is null
    or receipt->>'signature' is distinct from academy.x21_signature(actor,p) then
    raise exception 'Invalid workspace receipt' using errcode='22023';
  end if;
  if p->'v' is distinct from '1'::jsonb or p->'epoch' is distinct from '1'::jsonb
    or p->>'a' is distinct from a::text or p->>'device' is distinct from device::text or p->>'ns' is distinct from ns::text
    or coalesce(p->>'dataset','') not in ('people','calendar') or coalesce(p->>'phase','') not in ('seed','transfer') then
    raise exception 'Invalid workspace receipt' using errcode='22023';
  end if;
  foreach k in array array['scope','acc'] loop
    if jsonb_typeof(p->k) is distinct from 'string' or coalesce(p->>k,'') !~ '^[a-f0-9]{64}$' then
      raise exception 'Invalid workspace receipt' using errcode='22023';
    end if;
  end loop;
  if jsonb_typeof(p->'revision') is distinct from 'string' or coalesce(p->>'revision','') !~ '^(0|[1-9][0-9]{0,18})$'
    or (p->>'revision')::numeric > 9223372036854775807 then
    raise exception 'Invalid workspace revision' using errcode='22023';
  end if;
  foreach k in array array['seen','issued'] loop
    if jsonb_typeof(p->k) is distinct from 'number' or coalesce(p->>k,'') !~ '^(0|[1-9][0-9]{0,15})$'
      or (p->>k)::numeric > 9007199254740991 then
      raise exception 'Invalid workspace progress' using errcode='22023';
    end if;
  end loop;
  if p->>'phase'='seed' then
    if p->'total' is distinct from 'null'::jsonb or p->'seen' <> '0'::jsonb or p->'cursor' is distinct from 'null'::jsonb then
      raise exception 'Invalid workspace seed' using errcode='22023';
    end if;
  else
    if jsonb_typeof(p->'total') is distinct from 'number' or coalesce(p->>'total','') !~ '^(0|[1-9][0-9]{0,15})$'
      or (p->>'total')::numeric > 9007199254740991 or (p->>'seen')::bigint > (p->>'total')::bigint
      or ((p->>'seen')::bigint=0 and p->'cursor' is distinct from 'null'::jsonb)
      or ((p->>'seen')::bigint>0 and jsonb_typeof(p->'cursor') is distinct from 'object') then
      raise exception 'Invalid workspace progress' using errcode='22023';
    end if;
  end if;
  if p->>'dataset'='people' then
    if p->'first' is distinct from 'null'::jsonb or p->'last' is distinct from 'null'::jsonb then
      raise exception 'Invalid directory window' using errcode='22023';
    end if;
    if (p->>'seen')::bigint>0 and (not (p->'cursor') ?& array['id'] or (p->'cursor')-array['id']<>'{}'::jsonb
      or coalesce(p#>>'{cursor,id}','') !~ '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$') then
      raise exception 'Invalid directory cursor' using errcode='22023';
    end if;
  else
    foreach k in array array['first','last'] loop
      if jsonb_typeof(p->k) is distinct from 'string' or coalesce(p->>k,'') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
        or (p->>k)::date<'0001-01-01'::date or (p->>k)::date>'9999-12-31'::date then
        raise exception 'Invalid calendar window' using errcode='22023';
      end if;
    end loop;
    if (p->>'last')::date-(p->>'first')::date <> 41 then raise exception 'Invalid calendar window' using errcode='22023'; end if;
    if (p->>'seen')::bigint>0 then
      if not (p->'cursor') ?& array['date','at','program','day'] or (p->'cursor')-array['date','at','program','day']<>'{}'::jsonb then
        raise exception 'Invalid calendar cursor' using errcode='22023';
      end if;
      foreach k in array array['program'] loop
        if coalesce(p->'cursor'->>k,'') !~ '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$' then
          raise exception 'Invalid calendar cursor' using errcode='22023';
        end if;
      end loop;
      if coalesce(p#>>'{cursor,at}','') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{6}Z$'
        or (p#>>'{cursor,at}')::timestamptz is null
        or coalesce(p#>>'{cursor,date}','') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
        or coalesce(p#>>'{cursor,day}','') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
        or (p#>>'{cursor,date}')::date not between (p->>'first')::date and (p->>'last')::date then
        raise exception 'Invalid calendar cursor' using errcode='22023';
      end if;
    end if;
  end if;
  return p;
end
$$;

-- All SELECTs inside this STABLE helper use its calling statement's snapshot.
-- Authorization/row locks happen in the public caller, not in this read helper.
create function academy.x21_snapshot(actor text,a uuid,device uuid,ns uuid,p jsonb,want_rows boolean)
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
        ctx->>'sport_name' sport,ctx->>'sport_name_ar' sport_ar,pr.timezone,
        case when d.canceled then 'cancelled' when d.scheduled_date<>d.local_date then 'moved'
          when coalesce(e.published,false) then 'published' else 'draft' end state,
        coalesce(e.published,false) published,q.capacity,coalesce(q.roster_count,0) roster_count
      from window_dates d join academy.training_programs pr on pr.id=d.program_id and pr.academy_id=a
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

create function public.x21_workspace_transfer_v1(a uuid,device uuid,ns uuid,expected_subject text,act text,
  previous jsonb default null,month_anchor date default null)
returns jsonb language plpgsql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s' as $$
declare
  actor text; snapshot jsonb; ctx jsonb; p jsonb; result jsonb; items jsonb;
  collections jsonb := '[]'; stamp bigint := floor(extract(epoch from clock_timestamp()))::bigint;
  selected_month date; window_month date; first_day date; last_day date; offset_month integer;
  dataset text; revision text; total bigint; seen bigint; cap integer; more boolean; last_item jsonb;
begin
  if a is null or device is null or ns is null or act is null or act not in ('manifest','page','resume','complete')
    or (act='manifest' and previous is not null) or (act<>'manifest' and (previous is null or month_anchor is not null))
    or (previous is not null and octet_length(previous::text)>8192)
    or (month_anchor is not null and (not isfinite(month_anchor) or month_anchor<'0001-01-01'::date
      or month_anchor>'9999-12-31'::date or extract(day from month_anchor)<>1)) then
    raise exception 'Invalid workspace command' using errcode='22023';
  end if;
  actor := academy.i2_owner(a);
  if actor is distinct from expected_subject then raise exception 'Access denied' using errcode='42501'; end if;
  perform 1 from academy.owner_workspace_keys k where k.subject=actor and k.academy_id=a
    and k.device_id=device and k.namespace=ns and k.field_epoch=1 for share;
  if not found then raise exception 'Access denied' using errcode='42501'; end if;

  if act='manifest' then
    snapshot := academy.x21_snapshot(actor,a,device,ns,null,false);
    ctx := snapshot->'context';
    selected_month := coalesce(month_anchor,date_trunc('month',clock_timestamp() at time zone(ctx->>'timezone'))::date);
    -- Three bounded windows; the requested/current task comes before its neighbours.
    for offset_month in select unnest(array[0,1,-1]) loop
      window_month := (selected_month + make_interval(months=>offset_month))::date;
      first_day := window_month-extract(dow from window_month)::integer;
      last_day := first_day+41;
      if first_day<'0001-01-01'::date or last_day>'9999-12-31'::date then
        raise exception 'Calendar window outside supported dates' using errcode='22023';
      end if;
      p := jsonb_build_object('v',1,'a',a,'device',device,'ns',ns,'epoch',1,'scope',snapshot->>'scope',
        'dataset','calendar','first',first_day,'last',last_day,'revision',snapshot#>>'{revisions,calendar}',
        'total',null,'seen',0,'cursor',null,'issued',stamp,'phase','seed');
      p := p||jsonb_build_object('acc',academy.x17_hash('x21-seed-v1'||(p-array['total','seen','cursor','issued','phase'])::text));
      collections := collections||jsonb_build_array(jsonb_build_object('id','calendar:'||to_char(window_month,'YYYY-MM'),
        'month',window_month,'receipt',academy.x21_receipt(actor,p)));
    end loop;
    p := jsonb_build_object('v',1,'a',a,'device',device,'ns',ns,'epoch',1,'scope',snapshot->>'scope',
      'dataset','people','first',null,'last',null,'revision',snapshot#>>'{revisions,people}',
      'total',null,'seen',0,'cursor',null,'issued',stamp,'phase','seed');
    p := p||jsonb_build_object('acc',academy.x17_hash('x21-seed-v1'||(p-array['total','seen','cursor','issued','phase'])::text));
    collections := jsonb_build_array(jsonb_build_object('id','people','receipt',academy.x21_receipt(actor,p)))||collections;
    result := snapshot||jsonb_build_object('kind','manifest','subject',actor,'namespace',ns,'device',device,
      'field_epoch',1,'today',(clock_timestamp() at time zone(ctx->>'timezone'))::date,'month',selected_month,
      'checked_at',floor(extract(epoch from clock_timestamp())*1000)::bigint,'collections',collections);
  else
    p := academy.x21_proof(previous,actor,a,device,ns);
    if (p->>'issued')::bigint>stamp+5 then raise exception 'Invalid receipt time' using errcode='22023'; end if;
    if act<>'resume' and (p->>'issued')::bigint<stamp-600 then return jsonb_build_object('error','expired'); end if;
    snapshot := academy.x21_snapshot(actor,a,device,ns,p,act='page');
    if snapshot ? 'error' then return snapshot; end if;
    dataset := p->>'dataset'; revision := p->>'revision';
    if act='resume' then
      p := p||jsonb_build_object('issued',stamp);
      result := jsonb_build_object('kind','resume','scope',p->>'scope','dataset',dataset,'revision',revision,
        'receipt',academy.x21_receipt(actor,p),'checked_at',floor(extract(epoch from clock_timestamp())*1000)::bigint);
    elsif act='complete' then
      if p->>'phase'<>'transfer' or (p->>'seen')::bigint<>(p->>'total')::bigint then
        raise exception 'Incomplete workspace transfer' using errcode='22023';
      end if;
      p := p||jsonb_build_object('phase','complete','issued',stamp);
      result := jsonb_build_object('kind','complete','scope',p->>'scope','dataset',dataset,'revision',revision,
        'total',p->'total','seen',p->'seen','root',p->>'acc','receipt',academy.x21_receipt(actor,p),
        'checked_at',floor(extract(epoch from clock_timestamp())*1000)::bigint);
    else
      if p->>'phase'='transfer' and (p->>'seen')::bigint>=(p->>'total')::bigint then
        raise exception 'Collection already covered' using errcode='22023';
      end if;
      items := snapshot->'items'; total := (snapshot->>'total')::bigint;
      cap := case dataset when 'people' then 25 else 50 end;
      more := jsonb_array_length(items)>cap;
      if more then items := items-cap; end if;
      while jsonb_array_length(items)>0 and octet_length(items::text)>24576 loop
        items := items-(jsonb_array_length(items)-1); more := true;
      end loop;
      seen := (p->>'seen')::bigint+jsonb_array_length(items);
      if (jsonb_array_length(items)=0 and total>0) or seen>total
        or (not more and seen<>total) or (more and seen>=total) then
        raise exception 'Workspace page invariant' using errcode='54000';
      end if;
      last_item := items->-1;
      p := p||jsonb_build_object('phase','transfer','total',total,'seen',seen,
        'cursor',case when total=0 then null when dataset='people' then jsonb_build_object('id',last_item->>'id')
          else jsonb_build_object('date',last_item->>'date','at',last_item->>'starts_at','program',last_item->>'program','day',last_item->>'day') end,
        'acc',academy.x21_chain(p->>'acc',dataset,items));
      result := jsonb_build_object('kind','page','scope',p->>'scope','dataset',dataset,'revision',revision,
        'items',items,'total',total,'seen',seen,'more',more,'receipt',academy.x21_receipt(actor,p));
    end if;
  end if;
  if octet_length(result::text)>=32768 then raise exception 'Workspace response exceeds bound' using errcode='54000'; end if;
  return result;
end
$$;

revoke all on function academy.x21_revise(),academy.x21_signature(text,jsonb),academy.x21_receipt(text,jsonb),
  academy.x21_chain(text,text,jsonb),academy.x21_proof(jsonb,text,uuid,uuid,uuid),
  academy.x21_snapshot(text,uuid,uuid,uuid,jsonb,boolean) from public,anon,authenticated;
revoke all on function public.x21_workspace_key_v1(uuid,uuid,text,text,uuid,text),
  public.x21_workspace_transfer_v1(uuid,uuid,uuid,text,text,jsonb,date) from public,anon,authenticated;
do $$begin
  if to_regrole('service_role') is not null then
    execute 'revoke all on academy.workspace_revisions,academy.owner_workspace_keys,academy.x21_people_rows,academy.x21_calendar_rows from service_role';
    execute 'revoke all on function academy.x21_revise(),academy.x21_signature(text,jsonb),academy.x21_receipt(text,jsonb),
      academy.x21_chain(text,text,jsonb),academy.x21_proof(jsonb,text,uuid,uuid,uuid),academy.x21_snapshot(text,uuid,uuid,uuid,jsonb,boolean),
      public.x21_workspace_key_v1(uuid,uuid,text,text,uuid,text),public.x21_workspace_transfer_v1(uuid,uuid,uuid,text,text,jsonb,date) from service_role';
  end if;
end$$;
grant execute on function public.x21_workspace_key_v1(uuid,uuid,text,text,uuid,text),
  public.x21_workspace_transfer_v1(uuid,uuid,uuid,text,text,jsonb,date) to authenticated;
do $$
declare definition text;
begin
  select pg_get_functiondef('academy.verified_subject()'::regprocedure) into definition;
  if position('|x20_register_download_v1' in definition)=0 or position('|x21_workspace_transfer_v1' in definition)>0 then
    raise exception 'Unexpected signed gateway definition';
  end if;
  execute replace(definition,'|x20_register_download_v1',
    '|x21_workspace_key_v1|x21_workspace_transfer_v1|x20_register_download_v1');
end
$$;
