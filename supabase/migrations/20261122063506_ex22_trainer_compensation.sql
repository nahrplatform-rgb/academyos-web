-- EX-22: verified Trainer coverage and synthetic compensation.
create table academy.compensation_terms (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references academy.academies,
  staff_id uuid not null,
  starts_on date not null,
  rate bigint not null check (rate between 1 and 1000000000),
  created_by text not null,
  created_at timestamptz not null default now(),
  unique (academy_id,staff_id,starts_on),
  foreign key (staff_id,academy_id) references academy.trainer_people(id,academy_id)
);
create table academy.compensation_coverage (
  academy_id uuid not null references academy.academies,
  program_id uuid not null,
  day date not null,
  event_id uuid not null references academy.publication_events,
  staff_id uuid,
  status text not null check (status in ('present','absent')),
  version bigint not null check (version > 0),
  checked_by text not null,
  checked_at timestamptz not null default now(),
  primary key (program_id,day),
  foreign key (program_id,day,academy_id) references academy.training_dates(program_id,local_date,academy_id),
  foreign key (staff_id,academy_id) references academy.trainer_people(id,academy_id),
  check ((status='present' and staff_id is not null) or (status='absent' and staff_id is null))
);
create table academy.compensation_coverage_history (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references academy.academies,
  program_id uuid not null,
  day date not null,
  event_id uuid not null references academy.publication_events,
  staff_id uuid,
  status text not null,
  version bigint not null,
  actor text not null,
  created_at timestamptz not null default now(),
  unique(program_id,day,version)
);
create table academy.compensation_runs (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references academy.academies,
  staff_id uuid not null,
  month date not null check(extract(day from month)=1),
  status text not null check(status in ('draft','approved')),
  review text not null,
  total bigint not null check(total>0),
  prepared_by text not null,
  approved_by text,
  approval_reason text,
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  unique(academy_id,staff_id,month),
  foreign key (staff_id,academy_id) references academy.trainer_people(id,academy_id)
);
create table academy.compensation_lines (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references academy.academies,
  run_id uuid not null references academy.compensation_runs,
  staff_id uuid not null,
  event_id uuid not null references academy.publication_events,
  program_id uuid not null,
  day date not null,
  local_day date not null,
  starts_at timestamptz not null,
  name text not null,
  coverage_version bigint not null,
  terms_id uuid not null references academy.compensation_terms,
  amount bigint not null check(amount>0),
  unique(academy_id,program_id,day)
);
create table academy.compensation_requests (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references academy.academies,
  line_id uuid not null references academy.compensation_lines,
  actor text not null,
  reason text not null check(length(btrim(reason)) between 1 and 300),
  status text not null default 'pending' check(status in ('pending','resolved')),
  created_at timestamptz not null default now()
);
create table academy.compensation_adjustments (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references academy.academies,
  line_id uuid not null references academy.compensation_lines,
  run_id uuid not null references academy.compensation_runs,
  amount bigint not null check(amount<>0),
  reason text not null check(length(btrim(reason)) between 1 and 300),
  request_id uuid unique references academy.compensation_requests,
  actor text not null,
  created_at timestamptz not null default now()
);
create table academy.compensation_payouts (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references academy.academies,
  run_id uuid not null references academy.compensation_runs,
  amount bigint not null check(amount>0),
  method text not null check(method in ('cash','bank')),
  paid_on date not null,
  reference text,
  actor text not null,
  created_at timestamptz not null default now()
);
create table academy.compensation_operations (
  actor text not null,
  id uuid not null,
  academy_id uuid not null references academy.academies,
  fingerprint text,
  result jsonb not null,
  primary key(actor,id)
);
do $$
declare t text;
begin
  foreach t in array array['compensation_terms','compensation_coverage','compensation_coverage_history',
    'compensation_runs','compensation_lines','compensation_requests','compensation_adjustments',
    'compensation_payouts','compensation_operations'] loop
    execute format('alter table academy.%I enable row level security',t);
    execute format('revoke all on academy.%I from public,anon,authenticated',t);
  end loop;
end $$;

create function academy.c22_trainer(a uuid) returns uuid
language plpgsql security invoker set search_path='' as $$
declare person uuid;
begin
  person:=academy.t4_trainer(a);
  if not exists(select 1 from academy.trainer_assignments x where x.academy_id=a
      and x.staff_id=person and academy.q6_eligible(a,x.branch_id,person)) then
    raise exception 'Access denied' using errcode='42501';
  end if;
  return person;
end $$;

create function academy.c22_run_projection(a uuid,r uuid,owner_view boolean) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare run academy.compensation_runs; lines jsonb; payouts jsonb; adjustments jsonb; requests jsonb;
        adjusted bigint; paid bigint;
begin
  select * into run from academy.compensation_runs where academy_id=a and id=r;
  if not found or (not owner_view and run.status<>'approved') then return null; end if;
  select coalesce(jsonb_agg(jsonb_build_object('id',l.id,'event',l.event_id,'day',l.local_day,
    'name',l.name,'amount',l.amount,'start',t.starts_on,'terms',case when owner_view then l.terms_id end)
    order by l.local_day,l.id),'[]'::jsonb) into lines
    from academy.compensation_lines l join academy.compensation_terms t on t.id=l.terms_id
    where l.academy_id=a and l.run_id=r;
  select coalesce(sum(x.amount),0),coalesce(jsonb_agg(jsonb_build_object('id',x.id,'line',x.line_id,
    'amount',x.amount) order by x.created_at,x.id),'[]'::jsonb) into adjusted,adjustments
    from academy.compensation_adjustments x where x.academy_id=a and x.run_id=r;
  select coalesce(sum(x.amount),0),coalesce(jsonb_agg(jsonb_build_object('id',x.id,'amount',x.amount,
    'method',x.method,'date',x.paid_on) order by x.created_at,x.id),'[]'::jsonb) into paid,payouts
    from academy.compensation_payouts x where x.academy_id=a and x.run_id=r;
  select coalesce(jsonb_agg(jsonb_build_object('id',x.id,'line',x.line_id,'reason',x.reason,'status',x.status)
    order by x.created_at,x.id),'[]'::jsonb) into requests from academy.compensation_requests x
    join academy.compensation_lines l on l.id=x.line_id and l.run_id=r and l.academy_id=a
    where x.academy_id=a;
  return jsonb_build_object('id',run.id,'status',run.status,
    'stale',run.status='draft' and jsonb_array_length(lines)=0,
    'review',case when owner_view then run.review end,
    'total',run.total,'lines',lines,'approved',case when run.status='approved' then run.total+adjusted else 0 end,
    'payable',case when run.status='approved' then run.total+adjusted-paid else 0 end,
    'payouts',payouts,'adjustments',adjustments,'requests',requests);
end $$;

create function public.c22_context_v1(a uuid,v text,m date,s uuid default null,after_id uuid default null) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='8s' set lock_timeout='3s' as $$
declare z text; actor text; trainer uuid; staff jsonb:='[]'::jsonb; events jsonb:='[]'::jsonb;
        terms jsonb:='[]'::jsonb; run jsonb; next_cursor uuid; count_staff integer;
begin
  perform academy.t4_lock(a);
  if v is null or v not in ('owner','trainer') or m is null or extract(day from m)<>1
    or m<date '0001-01-01' or m>date '9998-12-01' then
    raise exception 'Invalid context' using errcode='22023';
  end if;
  if v='owner' then
    actor:=academy.i2_owner(a);
    select count(*) into count_staff from academy.trainer_people p
      where p.academy_id=a and (exists(select 1 from academy.trainer_assignments x
        where x.academy_id=a and x.staff_id=p.id and academy.q6_eligible(a,x.branch_id,p.id))
        or exists(select 1 from academy.compensation_runs r where r.academy_id=a and r.staff_id=p.id)
        or exists(select 1 from academy.compensation_terms t where t.academy_id=a and t.staff_id=p.id));
    if count_staff>500 then raise exception 'Staff scope too large' using errcode='54000'; end if;
    select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'name',p.display_name,'branch',b.name)
      order by p.display_name,p.id),'[]'::jsonb) into staff from academy.trainer_people p
      join lateral (select z.branch_id from academy.trainer_assignments z
        where z.staff_id=p.id and z.academy_id=a order by (z.state='active') desc,z.id limit 1) x on true
      join academy.branches b on b.id=x.branch_id and b.academy_id=a
      where p.academy_id=a and (academy.q6_eligible(a,x.branch_id,p.id)
        or exists(select 1 from academy.compensation_runs r where r.academy_id=a and r.staff_id=p.id)
        or exists(select 1 from academy.compensation_terms t where t.academy_id=a and t.staff_id=p.id));
    if s is not null and not exists(select 1 from academy.trainer_people p where p.academy_id=a and p.id=s) then
      raise exception 'Access denied' using errcode='42501';
    end if;
  else
    if s is not null or after_id is not null then raise exception 'Access denied' using errcode='42501'; end if;
    trainer:=academy.c22_trainer(a);
    s:=trainer;
  end if;
  select timezone into z from academy.academies where id=a;
  if z is null then raise exception 'Setup required' using errcode='PT428'; end if;
  if v='owner' then
    select coalesce(jsonb_agg(q.item order by q.id),'[]'::jsonb) into events from (
      select e.id,jsonb_build_object('id',e.id,'name',e.projection->>'name',
        'day',(e.starts_at at time zone z)::date,'startsAt',e.starts_at,'endsAt',e.ends_at,
        'branch',b.name,'assigned',e.trainer_id,'assignedName',p.display_name,
        'status',case when d.canceled then 'cancelled' when e.ends_at<=now() then 'completed' else 'scheduled' end,
        'coverage',case when c.version is not null then jsonb_build_object('staff',c.staff_id,
          'status',c.status,'version',c.version,'stale',c.event_id<>e.id) end) item
      from academy.publication_heads h
      join academy.publication_events e on e.id=h.event_id and e.academy_id=a
      join academy.training_dates d on d.program_id=e.program_id and d.local_date=e.day and d.academy_id=a
      join academy.branches b on b.id=e.branch_id and b.academy_id=a
      left join academy.trainer_people p on p.id=e.trainer_id and p.academy_id=a
      left join academy.compensation_coverage c on c.program_id=e.program_id and c.day=e.day and c.academy_id=a
      where h.academy_id=a and (e.published or d.canceled) and (e.starts_at at time zone z)::date>=m
        and (e.starts_at at time zone z)::date<(m+interval '1 month')::date
        and (after_id is null or e.id>after_id)
      order by e.id limit 26
    ) q;
    if jsonb_array_length(events)>25 then
      next_cursor:=(events->24->>'id')::uuid;
      events:=events-25;
    end if;
    if s is not null then
      select coalesce(jsonb_agg(jsonb_build_object('id',id,'start',starts_on,'rate',rate)
        order by starts_on),'[]'::jsonb) into terms
        from academy.compensation_terms where academy_id=a and staff_id=s;
    end if;
  end if;
  if s is not null then
    select academy.c22_run_projection(a,x.id,v='owner') into run
      from academy.compensation_runs x where x.academy_id=a and x.staff_id=s and x.month=m;
  end if;
  return jsonb_build_object('role',v,'timezone',z,'staff',staff,'events',events,'next',next_cursor,'terms',terms,'run',run);
end $$;

-- The reviewed snapshot is drawn from authoritative current publication heads,
-- Owner-confirmed coverage and immutable effective terms, under the trainer lock.
create function academy.c22_review(a uuid,s uuid,m date) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare z text; rows jsonb; bad integer; count_rows integer; total bigint;
begin
  select timezone into z from academy.academies where id=a;
  if z is null or m is null or extract(day from m)<>1 or m<date '0001-01-01' or m>date '9998-12-01'
    or not exists(select 1 from academy.trainer_people where academy_id=a and id=s) then
    raise exception 'Invalid review scope' using errcode='22023';
  end if;
  select count(*) into bad from academy.publication_heads h
    join academy.publication_events e on e.id=h.event_id and e.academy_id=a
    join academy.training_dates d on d.program_id=e.program_id and d.local_date=e.day and d.academy_id=a
    left join academy.compensation_coverage c on c.academy_id=a and c.program_id=e.program_id and c.day=e.day
    where h.academy_id=a and e.published and not d.canceled and e.ends_at<=now()
      and (e.starts_at at time zone z)::date>=m and (e.starts_at at time zone z)::date<(m+interval '1 month')::date
      and e.trainer_id=s and (c.version is null or c.event_id<>e.id);
  if bad>0 then raise exception 'Coverage review required' using errcode='PT412'; end if;
  select count(*),coalesce(sum(q.rate),0),coalesce(jsonb_agg(q.item order by q.local_day,q.event),'[]'::jsonb)
    into count_rows,total,rows
  from (
    select e.id event,(e.starts_at at time zone z)::date as local_day,t.rate,
      jsonb_build_object('event',e.id,'program',e.program_id,'occurrence',e.day,
        'day',(e.starts_at at time zone z)::date,'start',e.starts_at,
        'name',e.projection->>'name','branch',e.branch_id,'coverage',c.version,
        'terms',t.id,'amount',t.rate,'scheduleVersion',d.schedule_version) item
    from academy.publication_heads h
    join academy.publication_events e on e.id=h.event_id and e.academy_id=a
    join academy.training_dates d on d.program_id=e.program_id and d.local_date=e.day and d.academy_id=a
    join academy.compensation_coverage c on c.academy_id=a and c.program_id=e.program_id
      and c.day=e.day and c.event_id=e.id and c.status='present' and c.staff_id=s
    left join lateral (
      select x.id,x.rate from academy.compensation_terms x
      where x.academy_id=a and x.staff_id=s and x.starts_on<=(e.starts_at at time zone z)::date
      order by x.starts_on desc limit 1
    ) t on true
    where h.academy_id=a and e.published and not d.canceled and e.ends_at<=now()
      and (e.starts_at at time zone z)::date>=m and (e.starts_at at time zone z)::date<(m+interval '1 month')::date
  ) q;
  if count_rows=0 or count_rows>500 or total is null or exists(
      select 1 from jsonb_array_elements(rows) v where v->>'terms' is null or v->>'amount' is null) then
    raise exception 'Missing terms or no bounded earnings' using errcode='22023';
  end if;
  if exists(select 1 from jsonb_array_elements(rows) v where
      not academy.q6_eligible(a,(v->>'branch')::uuid,s)) then
    raise exception 'Trainer appointment unavailable' using errcode='42501';
  end if;
  return jsonb_build_object('lines',rows,'total',total,'review',
    encode(extensions.digest(jsonb_build_array(a,s,m,z,rows)::text,'sha256'),'hex'));
end $$;

create function public.c22_command_v1(a uuid,op uuid,act text,payload jsonb) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='8s' set lock_timeout='3s' as $$
declare subject_id text; previous academy.compensation_operations; fp text; result jsonb;
  new_id uuid:=gen_random_uuid(); person uuid; start_day date; period date; amount bigint;
  target_event uuid; ev academy.publication_events; date_row academy.training_dates;
  current_version bigint; target uuid; note text; run academy.compensation_runs;
  line academy.compensation_lines; request_row academy.compensation_requests; reviewed jsonb; item jsonb;
  adjusted bigint; paid bigint; method_name text; ref text; selected uuid;
begin
  perform academy.t4_lock(a);
  if op is null or act is null or act not in ('terms','coverage','prepare','approve','request','adjust','payout')
    or jsonb_typeof(payload) is distinct from 'object' then
    raise exception 'Invalid command' using errcode='22023';
  end if;
  if act='request' then
    subject_id:=academy.verified_subject();
    person:=academy.c22_trainer(a);
  else
    subject_id:=academy.i2_owner(a);
  end if;
  perform pg_advisory_xact_lock(hashtextextended('compensation-op:'||subject_id||':'||op::text,0));
  fp:=encode(extensions.digest(jsonb_build_array(a,act,payload)::text,'sha256'),'hex');
  select o.* into previous from academy.compensation_operations o where o.actor=subject_id and o.id=op;
  if found then
    if previous.academy_id<>a or previous.fingerprint is distinct from fp then
      raise exception 'Original intent conflicts' using errcode='23505';
    end if;
    return previous.result;
  end if;
  if act='terms' then
    if payload-array['staff','start','rate']<>'{}'::jsonb then raise exception 'Invalid terms' using errcode='22023'; end if;
    person:=(payload->>'staff')::uuid;
    start_day:=(payload->>'start')::date;
    amount:=(payload->>'rate')::bigint;
    if start_day is null or start_day not between date '0001-01-01' and date '9998-12-31'
      or amount is null or amount not between 1 and 1000000000
      or not exists(select 1 from academy.trainer_assignments x where x.academy_id=a
        and x.staff_id=person and academy.q6_eligible(a,x.branch_id,person)) then
      raise exception 'Invalid terms or trainer' using errcode='22023';
    end if;
    if exists(select 1 from academy.compensation_lines l join academy.compensation_runs r on r.id=l.run_id
      where l.academy_id=a and l.staff_id=person and r.status='approved' and l.local_day>=start_day
      and not exists(select 1 from academy.compensation_terms t where t.academy_id=a and t.staff_id=person
        and t.starts_on>start_day and t.starts_on<=l.local_day)) then
      raise exception 'Approved history cannot be repriced' using errcode='23505';
    end if;
    insert into academy.compensation_terms(id,academy_id,staff_id,starts_on,rate,created_by)
      values(new_id,a,person,start_day,amount,subject_id);
  elsif act='coverage' then
    if payload-array['event','staff','status','version']<>'{}'::jsonb then raise exception 'Invalid coverage' using errcode='22023'; end if;
    target_event:=(payload->>'event')::uuid;
    person:=(payload->>'staff')::uuid;
    note:=payload->>'status';
    current_version:=(payload->>'version')::bigint;
    select e.* into ev from academy.publication_events e join academy.publication_heads h
      on h.event_id=e.id and h.academy_id=e.academy_id
      where e.id=target_event and e.academy_id=a and e.published;
    if not found then raise exception 'Event unavailable' using errcode='42501'; end if;
    select * into date_row from academy.training_dates d
      where d.academy_id=a and d.program_id=ev.program_id and d.local_date=ev.day;
    if date_row.canceled or ev.ends_at>now() or current_version is null or current_version<0
      or note is null or note not in ('present','absent')
      or (note='present' and (person is null or not academy.q6_eligible(a,ev.branch_id,person)))
      or (note='absent' and person is not null) then
      raise exception 'Invalid coverage' using errcode='22023';
    end if;
    select coalesce((select c.version from academy.compensation_coverage c
      where c.academy_id=a and c.program_id=ev.program_id and c.day=ev.day),0) into adjusted;
    if current_version<>adjusted then raise exception 'Coverage changed' using errcode='PT412'; end if;
    if exists(select 1 from academy.compensation_lines l join academy.compensation_runs r on r.id=l.run_id
      where l.academy_id=a and l.program_id=ev.program_id and l.day=ev.day and r.status='approved') then
      raise exception 'Approved coverage requires a linked correction' using errcode='23505';
    end if;
    -- Re-review every affected draft as one unit. Its operation and run remain
    -- available, while another actual Trainer can prepare the occurrence.
    delete from academy.compensation_lines l where l.academy_id=a and l.run_id in (
      select distinct r.id from academy.compensation_runs r join academy.compensation_lines affected on affected.run_id=r.id
      where r.academy_id=a and r.status='draft' and affected.program_id=ev.program_id and affected.day=ev.day
    );
    insert into academy.compensation_coverage(academy_id,program_id,day,event_id,staff_id,status,version,checked_by)
      values(a,ev.program_id,ev.day,target_event,person,note,current_version+1,subject_id)
    on conflict(program_id,day) do update set event_id=excluded.event_id,staff_id=excluded.staff_id,
      status=excluded.status,version=excluded.version,checked_by=excluded.checked_by,checked_at=now();
    insert into academy.compensation_coverage_history(id,academy_id,program_id,day,event_id,staff_id,status,version,actor)
      values(new_id,a,ev.program_id,ev.day,target_event,person,note,current_version+1,subject_id);
  elsif act='prepare' then
    if payload-array['staff','month']<>'{}'::jsonb then raise exception 'Invalid preparation' using errcode='22023'; end if;
    person:=(payload->>'staff')::uuid;
    period:=(payload->>'month')::date;
    reviewed:=academy.c22_review(a,person,period);
    select * into run from academy.compensation_runs r
      where r.academy_id=a and r.staff_id=person and r.month=period for update;
    if found and run.status='approved' then raise exception 'Already approved' using errcode='23505'; end if;
    if found then
      new_id:=run.id;
      delete from academy.compensation_lines where academy_id=a and run_id=run.id;
      update academy.compensation_runs set review=reviewed->>'review',total=(reviewed->>'total')::bigint,
        prepared_by=subject_id,created_at=now() where id=run.id;
    else
      insert into academy.compensation_runs(id,academy_id,staff_id,month,status,review,total,prepared_by)
        values(new_id,a,person,period,'draft',reviewed->>'review',(reviewed->>'total')::bigint,subject_id);
    end if;
    for item in select value from jsonb_array_elements(reviewed->'lines') loop
      insert into academy.compensation_lines(academy_id,run_id,staff_id,event_id,program_id,day,local_day,
        starts_at,name,coverage_version,terms_id,amount)
      values(a,new_id,person,(item->>'event')::uuid,(item->>'program')::uuid,(item->>'occurrence')::date,
        (item->>'day')::date,(item->>'start')::timestamptz,coalesce(item->>'name',''),
        (item->>'coverage')::bigint,(item->>'terms')::uuid,(item->>'amount')::bigint);
    end loop;
  elsif act='approve' then
    if payload-array['run','review','reason']<>'{}'::jsonb then raise exception 'Invalid approval' using errcode='22023'; end if;
    target:=(payload->>'run')::uuid;
    note:=nullif(btrim(payload->>'reason'),'');
    select * into run from academy.compensation_runs where academy_id=a and id=target for update;
    if not found then raise exception 'Access denied' using errcode='42501'; end if;
    if run.status<>'draft' then raise exception 'Already approved' using errcode='23505'; end if;
    if note is null or length(note)>300 then raise exception 'Approval reason required' using errcode='22023'; end if;
    reviewed:=academy.c22_review(a,run.staff_id,run.month);
    if (payload->>'review') is distinct from run.review or run.review is distinct from reviewed->>'review'
      or run.total<>(reviewed->>'total')::bigint then
      raise exception 'Review changed' using errcode='PT412';
    end if;
    update academy.compensation_runs set status='approved',approved_by=subject_id,approval_reason=note,approved_at=now()
      where id=run.id;
    new_id:=run.id;
  elsif act='request' then
    if payload-array['line','reason']<>'{}'::jsonb then raise exception 'Invalid request' using errcode='22023'; end if;
    target:=(payload->>'line')::uuid;
    note:=nullif(btrim(payload->>'reason'),'');
    select l.* into line from academy.compensation_lines l join academy.compensation_runs r on r.id=l.run_id
      where l.academy_id=a and l.id=target and l.staff_id=person and r.status='approved';
    if not found then raise exception 'Access denied' using errcode='42501'; end if;
    if note is null or length(note)>300 then raise exception 'Request reason required' using errcode='22023'; end if;
    insert into academy.compensation_requests(id,academy_id,line_id,actor,reason)
      values(new_id,a,line.id,subject_id,note);
  elsif act='adjust' then
    if payload-array['line','amount','reason','request']<>'{}'::jsonb then raise exception 'Invalid adjustment' using errcode='22023'; end if;
    target:=(payload->>'line')::uuid;
    amount:=(payload->>'amount')::bigint;
    note:=nullif(btrim(payload->>'reason'),'');
    selected:=(payload->>'request')::uuid;
    select l.* into line from academy.compensation_lines l join academy.compensation_runs r on r.id=l.run_id
      where l.academy_id=a and l.id=target and r.status='approved';
    if not found then raise exception 'Access denied' using errcode='42501'; end if;
    select * into run from academy.compensation_runs where id=line.run_id for update;
    if amount is null or amount=0 or abs(amount::numeric)>1000000000 or note is null or length(note)>300 then
      raise exception 'Invalid adjustment' using errcode='22023';
    end if;
    select coalesce(sum(x.amount),0) into adjusted from academy.compensation_adjustments x where x.line_id=line.id;
    select coalesce(sum(x.amount),0) into paid from academy.compensation_payouts x where x.run_id=run.id;
    if line.amount+adjusted+amount<0 or run.total+(select coalesce(sum(x.amount),0)
      from academy.compensation_adjustments x where x.run_id=run.id)+amount<paid then
      raise exception 'Adjustment exceeds earned balance' using errcode='23505';
    end if;
    if selected is not null then
      select * into request_row from academy.compensation_requests where academy_id=a and id=selected
        and line_id=line.id and status='pending' for update;
      if not found then raise exception 'Request unavailable' using errcode='42501'; end if;
      update academy.compensation_requests set status='resolved' where id=selected;
    end if;
    insert into academy.compensation_adjustments(id,academy_id,line_id,run_id,amount,reason,request_id,actor)
      values(new_id,a,line.id,run.id,amount,note,selected,subject_id);
  else
    if payload-array['run','amount','method','date','reference']<>'{}'::jsonb then raise exception 'Invalid payout' using errcode='22023'; end if;
    target:=(payload->>'run')::uuid;
    amount:=(payload->>'amount')::bigint;
    method_name:=payload->>'method';
    start_day:=(payload->>'date')::date;
    ref:=nullif(btrim(payload->>'reference'),'');
    select * into run from academy.compensation_runs where academy_id=a and id=target and status='approved' for update;
    if not found then raise exception 'Access denied' using errcode='42501'; end if;
    if amount is null or amount not between 1 and 1000000000 or method_name is null or method_name not in ('cash','bank')
      or start_day is null or start_day<date '0001-01-01'
      or start_day>(now() at time zone (select timezone from academy.academies where id=a))::date
      or (method_name='bank' and ref is null) or length(ref)>120 then
      raise exception 'Invalid payout' using errcode='22023';
    end if;
    select coalesce(sum(x.amount),0) into adjusted from academy.compensation_adjustments x where x.run_id=run.id;
    select coalesce(sum(x.amount),0) into paid from academy.compensation_payouts x where x.run_id=run.id;
    if amount>run.total+adjusted-paid then raise exception 'Payout exceeds liability' using errcode='23505'; end if;
    insert into academy.compensation_payouts(id,academy_id,run_id,amount,method,paid_on,reference,actor)
      values(new_id,a,run.id,amount,method_name,start_day,ref,subject_id);
  end if;
  result:=jsonb_build_object('id',new_id,'action',act);
  insert into academy.compensation_operations values(subject_id,op,a,fp,result);
  insert into academy.audit_events(actor,academy_id,action,operation_id,details)
    values(subject_id,a,'compensation.'||act,op,jsonb_build_object('id',new_id));
  return result;
end $$;

create function public.c22_operation_v1(a uuid,op uuid) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='8s' set lock_timeout='3s' as $$
declare subject text; previous academy.compensation_operations; result jsonb:='{"cancelled":true}';
        is_owner boolean;
begin
  perform academy.t4_lock(a);
  subject:=academy.verified_subject();
  if op is null then raise exception 'Invalid operation' using errcode='22023'; end if;
  select exists(select 1 from academy.memberships m join academy.identities i on i.id=m.identity_id
      where m.academy_id=a and i.clerk_subject=subject and m.role='owner' and m.status='active') into is_owner;
  if not is_owner then
    perform academy.c22_trainer(a);
  else
    perform academy.i2_owner(a);
  end if;
  perform pg_advisory_xact_lock(hashtextextended('compensation-op:'||subject||':'||op::text,0));
  select * into previous from academy.compensation_operations where actor=subject and id=op;
  if found then
    if previous.academy_id<>a or (not is_owner and coalesce(previous.result->>'action','request')<>'request') then
      raise exception 'Access denied' using errcode='42501';
    end if;
    return previous.result;
  end if;
  insert into academy.compensation_operations values(subject,op,a,null,result);
  insert into academy.audit_events(actor,academy_id,action,operation_id,details)
    values(subject,a,'compensation.cancel',op,'{}');
  return result;
end $$;

do $$
declare entry record;
begin
  for entry in select n.nspname,f.oid::regprocedure as signature from pg_proc f
    join pg_namespace n on n.oid=f.pronamespace where n.nspname in ('public','academy') and f.proname like 'c22_%'
  loop
    execute format('revoke all on function %s from public,anon,authenticated',entry.signature);
    if entry.nspname='public' then execute format('grant execute on function %s to authenticated',entry.signature); end if;
  end loop;
end $$;

do $$
declare definition text:=pg_get_functiondef('academy.verified_subject()'::regprocedure);
begin
  if strpos(definition,'|f21_players_v1|')=0 then raise exception 'Unexpected signed gateway allowlist'; end if;
  execute replace(definition,'|f21_players_v1|','|c22_context_v1|c22_command_v1|c22_operation_v1|f21_players_v1|');
end $$;
