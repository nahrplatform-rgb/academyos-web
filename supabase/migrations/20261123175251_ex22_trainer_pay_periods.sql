-- Add flexible periods to the existing liability ledger. Legacy rows retain
-- their identifiers, stored values and original operation receipts.
alter table academy.compensation_terms
  add column basis text not null default 'session',
  add column fixed_amount bigint not null default 0,
  add column fixed_unit text,
  add column frequency text not null default 'month',
  add column ends_on date,
  alter column rate drop not null,
  add constraint compensation_term_configuration check (
    frequency in ('week','month') and (ends_on is null or ends_on >= starts_on) and
    ((basis='session' and rate is not null and fixed_amount=0 and fixed_unit is null)
      or (basis in ('fixed','hybrid') and fixed_amount between 1 and 1000000000
        and fixed_unit is not null and fixed_unit in ('week','month')
        and ((basis='fixed' and rate is null) or (basis='hybrid' and rate is not null)))));

alter table academy.compensation_runs
  drop constraint compensation_runs_academy_id_staff_id_month_key,
  add column period_start date,
  add column period_end date,
  add column frequency text,
  add constraint compensation_run_period check (
    (period_start is null and period_end is null and frequency is null)
    or (period_start is not null and period_end is not null and frequency is not null
      and period_end >= period_start and period_end - period_start < 31
      and frequency in ('week','month')));
create unique index compensation_run_start on academy.compensation_runs
  (academy_id, staff_id, coalesce(period_start,month));

alter table academy.compensation_lines
  alter column event_id drop not null,
  alter column program_id drop not null,
  alter column day drop not null,
  alter column coverage_version drop not null,
  add constraint compensation_line_source check (
    (event_id is null and program_id is null and day is null and coverage_version is null)
    or (event_id is not null and program_id is not null and day is not null and coverage_version is not null));
create index compensation_lines_run on academy.compensation_lines(run_id);

create table academy.compensation_defaults (
  academy_id uuid primary key references academy.academies,
  frequency text not null check(frequency in ('week','month'))
);

create table academy.compensation_extras (
  academy_id uuid not null references academy.academies,
  event_id uuid not null references academy.publication_events,
  staff_id uuid not null,
  reason text not null check(length(btrim(reason)) between 1 and 300),
  primary key(academy_id,event_id,staff_id),
  foreign key(staff_id,academy_id) references academy.trainer_people(id,academy_id)
);

alter table academy.compensation_defaults enable row level security;
alter table academy.compensation_extras enable row level security;
revoke all on academy.compensation_defaults,academy.compensation_extras from public,anon,authenticated;

create function academy.c22_period(a uuid,s uuid,d date)
returns table (first_day date,last_day date,cadence text)
language plpgsql stable security invoker set search_path='' as $$
declare recent academy.compensation_terms; next_change date; first_change date;
begin
  if d is null or d not between date '0001-01-01' and date '9998-12-31' then
    raise exception 'Invalid statement date' using errcode='22023';
  end if;
  select * into recent from academy.compensation_terms t
    where t.academy_id=a and t.staff_id=s and t.starts_on<=d
    order by t.starts_on desc limit 1;
  if not found then return; end if;
  cadence:=recent.frequency;
  first_day:=case cadence when 'week' then d-(extract(isodow from d)::integer-1)
    else date_trunc('month',d)::date end;
  last_day:=case cadence when 'week' then first_day+6
    else (first_day+interval '1 month')::date-1 end;
  -- A frequency change may shorten the first new calendar period.
  with changes as (
    select t.starts_on,t.frequency,lag(t.frequency) over(order by t.starts_on) prior
    from academy.compensation_terms t where t.academy_id=a and t.staff_id=s
  )
  select max(starts_on) filter(where starts_on<=d), min(starts_on) filter(where starts_on>d)
    into first_change,next_change from changes where prior is distinct from frequency;
  first_day:=greatest(first_day,first_change);
  if next_change is not null then last_day:=least(last_day,next_change-1); end if;
  return next;
end $$;

create function academy.c22_period_review(a uuid,s uuid,lo date,hi date) returns jsonb
language plpgsql stable security invoker set search_path='' as $$
declare z text; rows jsonb; total bigint; exceptions jsonb;
begin
  select timezone into z from academy.academies where id=a;
  if z is null or lo is null or hi is null or hi-lo not between 0 and 30 then
    raise exception 'Invalid statement period' using errcode='22023';
  end if;

  -- Accumulate in the original rate week/month before rounding each day.
  -- The resulting allocation is independent of statement frequency.
  with days as (
    select lo-30+n as d from generate_series(0,hi-lo+30) n
  ), effective as (
    select d,t.*, case t.fixed_unit when 'week' then d-(extract(isodow from d)::integer-1)
      else date_trunc('month',d)::date end as origin,
      case t.fixed_unit when 'week' then 7 else
        (date_trunc('month',d)+interval '1 month')::date-date_trunc('month',d)::date end as denominator
    from days left join lateral (
      select x.* from academy.compensation_terms x
        where x.academy_id=a and x.staff_id=s and x.starts_on<=days.d
        order by x.starts_on desc limit 1
    ) t on true
    where t.basis in ('fixed','hybrid') and (t.ends_on is null or d<=t.ends_on)
  ), accumulated as (
    select d,id,fixed_amount::numeric/denominator as daily_rate,
      sum(fixed_amount::numeric/denominator) over(partition by fixed_unit,origin order by d) as cumulative
    from effective
  ), fixed as (
    select null::uuid as event,d as day,round(cumulative)-round(cumulative-daily_rate) as amount,
      jsonb_build_object('day',d,'terms',id,'name','Fixed pay','start',d::timestamp at time zone z) as item
    from accumulated where d between lo and hi
  ), sessions as (
    select e.id as event,(e.starts_at at time zone z)::date as day,t.rate as amount,
      jsonb_build_object('event',e.id,'program',e.program_id,'occurrence',e.day,
        'day',(e.starts_at at time zone z)::date,'start',e.starts_at,'name',e.projection->>'name',
        'coverage',c.version,'terms',t.id,'extraReason',x.reason,'scheduleVersion',d.schedule_version) as item
    from academy.compensation_coverage c
    join academy.publication_heads h on h.academy_id=a and h.event_id=c.event_id
    join academy.publication_events e on e.id=h.event_id
    join academy.training_dates d on d.academy_id=a and d.program_id=e.program_id and d.local_date=e.day
    left join academy.compensation_extras x on x.academy_id=a and x.event_id=e.id and x.staff_id=s
    left join lateral (
      select tt.* from academy.compensation_terms tt where tt.academy_id=a and tt.staff_id=s
        and tt.starts_on<=(e.starts_at at time zone z)::date order by tt.starts_on desc limit 1
    ) t on true
    where c.academy_id=a and c.staff_id=s and c.status='present'
      and e.published and not d.canceled and e.ends_at<=now()
      and e.starts_at=d.starts_at and e.ends_at=d.ends_at
      and (e.starts_at at time zone z)::date between lo and hi
      and (t.ends_on is null or t.ends_on>=(e.starts_at at time zone z)::date)
      and (t.basis='session' or (t.basis='hybrid' and x.event_id is not null))
  ), earnings as (
    select * from fixed where amount>0
    union all select * from sessions
  )
  select coalesce(jsonb_agg(item||jsonb_build_object('amount',amount::bigint) order by day,event), '[]'::jsonb),
    coalesce(sum(amount),0)::bigint into rows,total from earnings;

  select coalesce(jsonb_agg(jsonb_build_object('id',x.id,'name',x.name,'day',x.day,'status',x.status)
      order by x.day,x.id),'[]'::jsonb) into exceptions
  from (
    select e.id,e.projection->>'name' as name,(e.starts_at at time zone z)::date as day,
      case when d.canceled or not e.published then 'cancelled'
        when c.event_id is distinct from e.id or e.starts_at<>d.starts_at or e.ends_at<>d.ends_at then 'unverified'
        when c.status='absent' then 'absent' end as status
    from academy.publication_heads h join academy.publication_events e on e.id=h.event_id
    join academy.training_dates d on d.academy_id=a and d.program_id=e.program_id and d.local_date=e.day
    left join academy.compensation_coverage c on c.academy_id=a and c.program_id=e.program_id and c.day=e.day
    where h.academy_id=a and e.trainer_id=s and e.ends_at<=now()
      and (e.starts_at at time zone z)::date between lo and hi
    order by e.starts_at,e.id limit 501
  ) x where x.status is not null;
  if jsonb_array_length(rows)>500 or jsonb_array_length(exceptions)>500 then
    raise exception 'Statement scope too large' using errcode='54000';
  end if;
  return jsonb_build_object('lines',rows,'total',total,'exceptions',exceptions,'review',
    encode(extensions.digest(jsonb_build_array(a,s,lo,hi,z,rows,exceptions)::text,'sha256'),'hex'));
end $$;

create function academy.c22_run_nonoverlap() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
  perform academy.t4_lock(new.academy_id);
  if exists(select 1 from academy.compensation_runs r where r.academy_id=new.academy_id
    and r.staff_id=new.staff_id and r.id<>new.id
    and daterange(coalesce(r.period_start,r.month),coalesce(r.period_end,(r.month+interval '1 month')::date-1),'[]')
      && daterange(coalesce(new.period_start,new.month),coalesce(new.period_end,(new.month+interval '1 month')::date-1),'[]')) then
    raise exception 'Statement period overlaps an existing period' using errcode='23505';
  end if;
  return new;
end $$;
create trigger compensation_run_nonoverlap before insert or update of period_start,period_end,month
  on academy.compensation_runs for each row execute function academy.c22_run_nonoverlap();

revoke all on function academy.c22_period(uuid,uuid,date), academy.c22_period_review(uuid,uuid,date,date),
  academy.c22_run_nonoverlap() from public,anon,authenticated;

alter function public.c22_command_v1(uuid,uuid,text,jsonb) set schema academy;
alter function academy.c22_command_v1(uuid,uuid,text,jsonb) rename to c22_legacy_command;
revoke all on function academy.c22_legacy_command(uuid,uuid,text,jsonb) from public,anon,authenticated;

create function public.c22_command_v1(a uuid,op uuid,act text,payload jsonb) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='8s' set lock_timeout='3s' as $$
declare actor_id text; fp text; old academy.compensation_operations; result jsonb;
  target uuid; staff uuid; d date; finish date; cadence text; prior text; basis_name text;
  fixed bigint; rate bigint; unit text; note text; p record; run academy.compensation_runs;
  reviewed jsonb; amount bigint; item jsonb; statement_id uuid:=gen_random_uuid();
begin
  perform academy.t4_lock(a);
  if not (coalesce(act in ('default','extra'),false)
    or (act='terms' and payload ? 'basis') or (act='prepare' and payload ? 'period')
    or (act='approve' and exists(select 1 from academy.compensation_runs r
      where r.academy_id=a and r.id=(payload->>'run')::uuid and r.period_start is not null))) then
    -- Preserve old drafts/receipts and prevent legacy clients from preparing
    -- a monthly session-only run against flexible terms.
    if act in ('terms','prepare') then
      perform academy.i2_owner(a);
      if exists(select 1 from academy.compensation_terms t where t.academy_id=a
        and t.staff_id=(payload->>'staff')::uuid and (t.basis<>'session' or t.frequency<>'month' or t.ends_on is not null))
        and not exists(select 1 from academy.compensation_operations o
          where o.actor=academy.verified_subject() and o.id=op) then
        raise exception 'Use the current statement workflow' using errcode='PT412';
      end if;
    end if;
    return academy.c22_legacy_command(a,op,act,payload);
  end if;
  actor_id:=academy.i2_owner(a);
  if op is null or jsonb_typeof(payload) is distinct from 'object' then
    raise exception 'Invalid operation' using errcode='22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('compensation-op:'||actor_id||':'||op::text,0));
  fp:=encode(extensions.digest(jsonb_build_array(a,act,payload)::text,'sha256'),'hex');
  select * into old from academy.compensation_operations o where o.actor=actor_id and o.id=op;
  if found then
    if old.academy_id<>a or old.fingerprint is distinct from fp then
      raise exception 'Original intent conflicts' using errcode='23505';
    end if;
    return old.result;
  end if;

  if act='default' then
    cadence:=payload->>'frequency';
    if payload-array['frequency']<>'{}' or cadence is null or cadence not in ('week','month') then
      raise exception 'Invalid statement schedule' using errcode='22023';
    end if;
    insert into academy.compensation_defaults values(a,cadence)
      on conflict(academy_id) do update set frequency=excluded.frequency;
    statement_id:=a;
  elsif act='terms' then
    staff:=(payload->>'staff')::uuid;
    d:=(payload->>'start')::date;
    finish:=(payload->>'end')::date;
    basis_name:=payload->>'basis';
    fixed:=coalesce((payload->>'fixed')::bigint,0);
    rate:=nullif((payload->>'rate')::bigint,0);
    unit:=payload->>'fixedUnit';
    cadence:=coalesce(payload->>'frequency',(select frequency from academy.compensation_defaults where academy_id=a),'month');
    if payload-array['staff','start','end','basis','fixed','rate','fixedUnit','frequency']<>'{}'
      or d is null or d not between date '0001-01-01' and date '9998-12-31'
      or (finish is not null and finish not between d and date '9998-12-31')
      or basis_name is null or basis_name not in ('session','fixed','hybrid')
      or cadence not in ('week','month')
      or not exists(select 1 from academy.trainer_assignments x where x.academy_id=a and x.staff_id=staff
        and academy.q6_eligible(a,x.branch_id,staff)) then
      raise exception 'Invalid contract' using errcode='22023';
    end if;
    if exists(select 1 from academy.compensation_runs r where r.academy_id=a and r.staff_id=staff
      and r.status='approved' and d<=coalesce(r.period_end,(r.month+interval '1 month')::date-1)
      and not exists(select 1 from academy.compensation_terms t where t.academy_id=a and t.staff_id=staff
        and t.starts_on>d and t.starts_on<=coalesce(r.period_start,r.month))) then
      raise exception 'Approved history cannot be repriced' using errcode='23505';
    end if;
    select t.frequency into prior from academy.compensation_terms t where t.academy_id=a and t.staff_id=staff
      and t.starts_on<d order by t.starts_on desc limit 1;
    if prior is not null and prior<>cadence then
      select * into p from academy.c22_period(a,staff,d-1);
      if p.last_day<>d-1 then
        raise exception 'Change frequency after the current period closes' using errcode='PT412';
      end if;
    end if;
    if exists(select 1 from academy.compensation_terms t where t.academy_id=a and t.staff_id=staff
      and t.starts_on>d and t.frequency<>cadence) then
      raise exception 'Review the later contract before changing frequency' using errcode='PT412';
    end if;
    insert into academy.compensation_terms(id,academy_id,staff_id,starts_on,ends_on,rate,created_by,basis,fixed_amount,fixed_unit,frequency)
      values(statement_id,a,staff,d,finish,rate,actor_id,basis_name,fixed,unit,cadence);
  elsif act='extra' then
    target:=(payload->>'event')::uuid;
    staff:=(payload->>'staff')::uuid;
    note:=nullif(btrim(payload->>'reason'),'');
    if payload-array['event','staff','reason']<>'{}' or note is null or length(note)>300
      or not exists(select 1 from academy.publication_heads h join academy.publication_events e on e.id=h.event_id
        where h.academy_id=a and e.id=target and e.published and academy.q6_eligible(a,e.branch_id,staff)) then
      raise exception 'Invalid extra assignment' using errcode='22023';
    end if;
    if exists(select 1 from academy.compensation_runs r join academy.publication_events e on e.id=target
      join academy.academies ac on ac.id=a where r.academy_id=a and r.staff_id=staff and r.status='approved'
      and (e.starts_at at time zone ac.timezone)::date between coalesce(r.period_start,r.month)
        and coalesce(r.period_end,(r.month+interval '1 month')::date-1)) then
      raise exception 'Use a linked adjustment for an approved period' using errcode='PT412';
    end if;
    insert into academy.compensation_extras values(a,target,staff,note);
    statement_id:=target;
  elsif act='prepare' then
    staff:=(payload->>'staff')::uuid;
    d:=(payload->>'period')::date;
    if payload-array['staff','period']<>'{}' then raise exception 'Invalid preparation' using errcode='22023'; end if;
    select * into p from academy.c22_period(a,staff,d);
    if not found then
      -- A first contract within the selected month/week can still be found by its start date.
      raise exception 'No terms for selected day' using errcode='22023';
    end if;
    reviewed:=academy.c22_period_review(a,staff,p.first_day,p.last_day);
    amount:=(reviewed->>'total')::bigint;
    if amount<=0 then raise exception 'No payable earnings' using errcode='22023'; end if;
    select * into run from academy.compensation_runs r where r.academy_id=a and r.staff_id=staff
      and r.period_start=p.first_day for update;
    if found then
      if run.status='approved' then raise exception 'Already approved' using errcode='23505'; end if;
      statement_id:=run.id;
      delete from academy.compensation_lines where run_id=run.id;
      update academy.compensation_runs set period_end=p.last_day, frequency=p.cadence,
        review=reviewed->>'review',total=amount,prepared_by=actor_id,created_at=now() where id=run.id;
    else
      insert into academy.compensation_runs(id,academy_id,staff_id,month,status,review,total,prepared_by,
        period_start,period_end,frequency) values(statement_id,a,staff,date_trunc('month',p.first_day)::date,
        'draft',reviewed->>'review',amount,actor_id,p.first_day,p.last_day,p.cadence);
    end if;
    for item in select value from jsonb_array_elements(reviewed->'lines') loop
      insert into academy.compensation_lines(academy_id,run_id,staff_id,event_id,program_id,day,local_day,
        starts_at,name,coverage_version,terms_id,amount)
      values(a,statement_id,staff,(item->>'event')::uuid,(item->>'program')::uuid,(item->>'occurrence')::date,
        (item->>'day')::date,(item->>'start')::timestamptz,
        coalesce(item->>'name','')||coalesce(' · '||(item->>'extraReason'),''), (item->>'coverage')::bigint,
        (item->>'terms')::uuid,(item->>'amount')::bigint);
    end loop;
  else
    target:=(payload->>'run')::uuid;
    note:=nullif(btrim(payload->>'reason'),'');
    if payload-array['run','reason','review']<>'{}' or note is null or length(note)>300 then
      raise exception 'Invalid approval' using errcode='22023';
    end if;
    select * into run from academy.compensation_runs r where r.academy_id=a and r.id=target for update;
    if run.status<>'draft' then raise exception 'Already approved' using errcode='23505'; end if;
    select * into p from academy.c22_period(a,run.staff_id,run.period_start);
    if p.last_day is distinct from run.period_end or p.cadence is distinct from run.frequency
      or run.period_end >= (now() at time zone (select timezone from academy.academies where id=a))::date then
      raise exception 'Statement period is open or changed' using errcode='PT412';
    end if;
    reviewed:=academy.c22_period_review(a,run.staff_id,run.period_start,run.period_end);
    if run.review is distinct from payload->>'review' or run.review is distinct from reviewed->>'review' then
      raise exception 'Review changed' using errcode='PT412';
    end if;
    update academy.compensation_runs set status='approved',approved_by=actor_id,approval_reason=note,approved_at=now()
      where id=target;
    statement_id:=target;
  end if;
  result:=jsonb_build_object('id',statement_id,'action',act);
  insert into academy.compensation_operations values(actor_id,op,a,fp,result);
  insert into academy.audit_events(actor,academy_id,action,operation_id,details)
    values(actor_id,a,'compensation.'||act,op,jsonb_build_object('id',statement_id));
  return result;
end $$;
revoke all on function public.c22_command_v1(uuid,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.c22_command_v1(uuid,uuid,text,jsonb) to authenticated;

-- Preserve the old context shape and prevent a legacy month read from choosing
-- an arbitrary weekly statement.
do $$
declare definition text:=pg_get_functiondef('public.c22_context_v1(uuid,text,date,uuid,uuid)'::regprocedure);
begin
  if strpos(definition,'and x.month=m;')=0 then raise exception 'Unexpected compensation context'; end if;
  execute replace(definition,'and x.month=m;','and x.month=m and x.period_start is null;');
end $$;

create function public.c22_period_context_v1(a uuid,v text,d date,s uuid default null,after_id uuid default null) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='8s' set lock_timeout='3s' as $$
declare context jsonb; p record; run academy.compensation_runs; result jsonb; terms jsonb;
  history jsonb; review jsonb; m date:=date_trunc('month',d)::date;
begin
  context:=public.c22_context_v1(a,v,m,s,after_id);
  if v='trainer' then s:=academy.c22_trainer(a); end if;
  select * into p from academy.c22_period(a,s,d);
  select * into run from academy.compensation_runs r where r.academy_id=a and r.staff_id=s
    and d between coalesce(r.period_start,r.month) and coalesce(r.period_end,(r.month+interval '1 month')::date-1)
    and (v='owner' or r.status='approved');
  if found then
    result:=academy.c22_run_projection(a,run.id,v='owner')||jsonb_build_object(
      'periodStart',coalesce(run.period_start,run.month),'periodEnd',coalesce(run.period_end,(run.month+interval '1 month')::date-1),
      'frequency',coalesce(run.frequency,'month'),'approvedAt',run.approved_at);
    if run.period_start is not null and run.status='draft' and v='owner' then
      review:=academy.c22_period_review(a,s,run.period_start,run.period_end);
      result:=result||jsonb_build_object('exceptions',review->'exceptions',
        'stale',run.review is distinct from review->>'review' or p.last_day is distinct from run.period_end);
    end if;
  end if;
  select coalesce(jsonb_agg(to_jsonb(q) order by q.day desc),'[]') into history from (
    select r.id,coalesce(r.period_start,r.month) as day
    from academy.compensation_runs r where r.academy_id=a and r.staff_id=s and r.status='approved'
    order by day desc limit 50
  ) q;
  select coalesce(jsonb_agg(jsonb_build_object('id',t.id,'start',t.starts_on,'end',t.ends_on,'basis',t.basis,
    'rate',t.rate,'fixed',t.fixed_amount,'fixedUnit',t.fixed_unit,'frequency',t.frequency) order by t.starts_on),'[]')
    into terms from academy.compensation_terms t where v='owner' and t.academy_id=a and t.staff_id=s;
  return context||jsonb_build_object('run',result,'terms',terms,'periodStart',p.first_day,'periodEnd',p.last_day,
    'frequency',p.cadence,'statements',history,'defaultFrequency',
    case when v='owner' then coalesce((select frequency from academy.compensation_defaults where academy_id=a),'month') end);
end $$;
revoke all on function public.c22_period_context_v1(uuid,text,date,uuid,uuid) from public,anon,authenticated;
grant execute on function public.c22_period_context_v1(uuid,text,date,uuid,uuid) to authenticated;

create function public.c22_payslip_v1(a uuid,v text,r uuid) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='8s' set lock_timeout='3s' as $$
declare own_staff uuid; slip jsonb;
begin
  perform academy.t4_lock(a);
  if v='owner' then perform academy.i2_owner(a);
  elsif v='trainer' then own_staff:=academy.c22_trainer(a);
  else raise exception 'Access denied' using errcode='42501'; end if;

  select jsonb_build_object('academy',ac.name,'trainer',p.display_name,'id',x.id,
    'periodStart',coalesce(x.period_start,x.month),
    'periodEnd',coalesce(x.period_end,(x.month+interval '1 month')::date-1),
    'approvedAt',x.approved_at,'retrievedAt',statement_timestamp(),'timezone',ac.timezone,
    'total',q.data->'total','net',q.data->'approved','balance',q.data->'payable',
    'lines',(select coalesce(jsonb_agg(e.value-'terms'-'event'-'id' order by e.ordinality),'[]')
      from jsonb_array_elements(q.data->'lines') with ordinality e),
    'payouts',(select coalesce(jsonb_agg(e.value-'id' order by e.ordinality),'[]')
      from jsonb_array_elements(q.data->'payouts') with ordinality e),
    'adjustments',(select coalesce(jsonb_agg(jsonb_build_object('amount',j.amount,'date',
      (j.created_at at time zone ac.timezone)::date) order by j.created_at,j.id),'[]')
      from academy.compensation_adjustments j where j.academy_id=a and j.run_id=r)) into slip
  from academy.compensation_runs x
  join academy.academies ac on ac.id=x.academy_id
  join academy.trainer_people p on p.academy_id=x.academy_id and p.id=x.staff_id
  cross join lateral (select academy.c22_run_projection(a,r,false) as data) q
  where x.academy_id=a and x.id=r and x.status='approved' and (v='owner' or x.staff_id=own_staff);
  if not found then raise exception 'Access denied' using errcode='42501'; end if;
  return slip;
end $$;
revoke all on function public.c22_payslip_v1(uuid,text,uuid) from public,anon,authenticated;
grant execute on function public.c22_payslip_v1(uuid,text,uuid) to authenticated;

do $$
declare definition text:=pg_get_functiondef('academy.verified_subject()'::regprocedure);
begin
  if strpos(definition,'|c22_context_v1|')=0 then raise exception 'Unexpected signed gateway allowlist'; end if;
  execute replace(definition,'|c22_context_v1|','|c22_period_context_v1|c22_payslip_v1|c22_context_v1|');
end $$;

create table academy.compensation_staff_cards (
  id uuid primary key,
  academy_id uuid not null references academy.academies,
  staff_id uuid not null,
  token_hash bytea not null unique,
  revoked_at timestamptz,
  foreign key(staff_id,academy_id) references academy.trainer_people(id,academy_id)
);
create unique index compensation_active_staff_card on academy.compensation_staff_cards(academy_id,staff_id)
  where revoked_at is null;

create table academy.compensation_arrivals (
  id uuid primary key,
  academy_id uuid not null references academy.academies,
  staff_id uuid not null,
  branch_id uuid not null,
  anchor uuid not null references academy.publication_events,
  card_id uuid references academy.compensation_staff_cards,
  captured_at timestamptz not null,
  candidates jsonb not null,
  manual_reason text,
  unique(academy_id,staff_id,anchor),
  foreign key(staff_id,academy_id) references academy.trainer_people(id,academy_id),
  foreign key(branch_id,academy_id) references academy.branches(id,academy_id)
);
alter table academy.compensation_coverage_history
  add column arrival_id uuid references academy.compensation_arrivals,
  add column verification_reason text;
alter table academy.compensation_staff_cards enable row level security;
alter table academy.compensation_arrivals enable row level security;
revoke all on academy.compensation_staff_cards,academy.compensation_arrivals from public,anon,authenticated;

create function academy.c22_clock() returns timestamptz
language sql stable security invoker set search_path='' as $$select now()$$;

create function academy.c22_scan_events(a uuid,b uuid,s uuid,lo timestamptz,hi timestamptz)
returns table (id uuid,starts_at timestamptz,ends_at timestamptz,version bigint,name text)
language sql stable security invoker set search_path='' as $$
  select e.id,e.starts_at,e.ends_at,d.schedule_version,e.projection->>'name'
  from academy.publication_events e
  join academy.publication_heads h on h.academy_id=a and h.event_id=e.id
  join academy.training_dates d on d.academy_id=a and d.program_id=e.program_id and d.local_date=e.day
  where e.academy_id=a and e.branch_id=b and e.trainer_id=s and e.published and not d.canceled
    and e.starts_at=d.starts_at and e.ends_at=d.ends_at and e.starts_at between lo and hi
$$;

create function public.c22_staff_context_v1(a uuid,b uuid) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='8s' set lock_timeout='3s' as $$
declare staff jsonb; arrivals jsonb;
begin
  perform academy.t4_lock(a);
  perform academy.i2_owner(a);
  if not exists(select 1 from academy.branches where academy_id=a and id=b) then
    raise exception 'Branch unavailable' using errcode='42501';
  end if;
  select coalesce(jsonb_agg(to_jsonb(q) order by q.name,q.id),'[]') into staff from (
    select p.id,p.display_name as name,c.id as card
    from academy.trainer_people p left join academy.compensation_staff_cards c
      on c.academy_id=a and c.staff_id=p.id and c.revoked_at is null
    where p.academy_id=a and academy.q6_eligible(a,b,p.id) order by p.display_name,p.id limit 100
  ) q;
  select coalesce(jsonb_agg(to_jsonb(q) order by q."capturedAt" desc),'[]') into arrivals from (
    select x.id,x.staff_id as staff,x.captured_at as "capturedAt",(
      select jsonb_agg(item||jsonb_build_object('coverageVersion',coalesce(c.version,0),
        'actual',c.staff_id) order by ordinal)
      from jsonb_array_elements(x.candidates) with ordinality as candidates(item,ordinal)
      join academy.publication_events e on e.id=(item->>'id')::uuid
      left join academy.compensation_coverage c on c.academy_id=a and c.program_id=e.program_id and c.day=e.day
    ) as candidates,
      (x.card_id is null or exists(select 1 from academy.compensation_staff_cards c
        where c.id=x.card_id and c.revoked_at is null)) as "cardActive"
    from academy.compensation_arrivals x where x.academy_id=a and x.branch_id=b
    order by x.captured_at desc limit 30
  ) q;
  return jsonb_build_object('staff',staff,'arrivals',arrivals,'now',academy.c22_clock());
end $$;

create function public.c22_staff_command_v1(a uuid,op uuid,act text,payload jsonb) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='8s' set lock_timeout='3s' as $$
declare actor_id text; fp text; old academy.compensation_operations; result jsonb;
  who uuid; b uuid; selected uuid; expected uuid; target uuid:=gen_random_uuid(); token text;
  card academy.compensation_staff_cards; arrival academy.compensation_arrivals;
  stamp timestamptz:=academy.c22_clock(); note text; items jsonb; item jsonb; candidate jsonb;
  slot record; anchor record; last_end timestamptz; ev academy.publication_events; current_version bigint;
begin
  perform academy.t4_lock(a);
  actor_id:=academy.i2_owner(a);
  if op is null or jsonb_typeof(payload) is distinct from 'object' or act is null
    or act not in ('staff_card','staff_arrival','staff_verify') then
    raise exception 'Invalid staff operation' using errcode='22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('compensation-op:'||actor_id||':'||op::text,0));
  fp:=encode(extensions.digest(jsonb_build_array(a,act,payload)::text,'sha256'),'hex');
  select * into old from academy.compensation_operations where actor=actor_id and id=op;
  if found then
    if old.academy_id<>a or old.fingerprint is distinct from fp then
      raise exception 'Original intent conflicts' using errcode='23505';
    end if;
    return old.result;
  end if;
  b:=(payload->>'branch')::uuid;
  who:=(payload->>'staff')::uuid;
  token:=payload->>'code';
  note:=nullif(btrim(payload->>'reason'),'');
  if not exists(select 1 from academy.branches where academy_id=a and id=b) then
    raise exception 'Branch unavailable' using errcode='42501';
  end if;

  if act='staff_card' then
    expected:=(payload->>'expected')::uuid;
    if payload-array['branch','staff','code','expected']<>'{}' or not academy.q6_eligible(a,b,who)
      or (token is not null and token !~ '^aos:staff:1:[A-Za-z0-9_-]{43}$') then
      raise exception 'Invalid card change' using errcode='22023';
    end if;
    select * into card from academy.compensation_staff_cards where academy_id=a and staff_id=who and revoked_at is null;
    if expected is distinct from card.id or (token is null and card.id is null) then
      raise exception 'Card changed' using errcode='PT412';
    end if;
    update academy.compensation_staff_cards set revoked_at=stamp where id=card.id;
    if token is not null then
      insert into academy.compensation_staff_cards(id,academy_id,staff_id,token_hash)
        values(target,a,who,extensions.digest(token,'sha256'));
    else
      target:=card.id;
    end if;
  elsif act='staff_arrival' then
    selected:=(payload->>'event')::uuid;
    if payload-array['branch','staff','code','event','reason']<>'{}'
      or (token is null and (who is null or selected is null or note is null or length(note)>300))
      or (token is not null and (who is not null or note is not null or token !~ '^aos:staff:1:[A-Za-z0-9_-]{43}$')) then
      raise exception 'Invalid arrival' using errcode='22023';
    end if;
    if token is not null then
      select * into card from academy.compensation_staff_cards where academy_id=a and revoked_at is null
        and token_hash=extensions.digest(token,'sha256');
      who:=card.staff_id;
    end if;
    if not academy.q6_eligible(a,b,who) then raise exception 'Trainer unavailable' using errcode='42501'; end if;

    if token is not null then
      select coalesce(jsonb_agg(to_jsonb(q) order by q.starts_at,q.id),'[]') into items from (
        select * from academy.c22_scan_events(a,b,who,stamp-interval '24 hours',stamp+interval '30 minutes')
        where ends_at>=stamp order by starts_at,id limit 21
      ) q;
      if jsonb_array_length(items)=0 or jsonb_array_length(items)>20 then
        raise exception 'No bounded scan match' using errcode='PT412';
      end if;
      if selected is null and jsonb_array_length(items)>1 then
        return jsonb_build_object('choices',items);
      end if;
      selected:=coalesce(selected,(items->0->>'id')::uuid);
      if not exists(select 1 from jsonb_array_elements(items) x where (x->>'id')::uuid=selected) then
        raise exception 'Choose a current session' using errcode='PT412';
      end if;
    end if;
    select * into anchor from academy.c22_scan_events(a,b,who,stamp-interval '31 days',stamp+interval '30 minutes')
      where id=selected;
    if not found then raise exception 'Session unavailable' using errcode='PT412'; end if;
    select x.* into arrival from academy.compensation_arrivals x where x.academy_id=a and x.staff_id=who and x.anchor=selected;
    if found then
      target:=arrival.id;
    else
      items:=jsonb_build_array(to_jsonb(anchor));
      last_end:=anchor.ends_at;
      for slot in select * from academy.c22_scan_events(a,b,who,anchor.starts_at,anchor.starts_at+interval '6 hours')
        where id<>selected order by starts_at,id limit 41 loop
        exit when slot.starts_at<last_end or slot.starts_at>last_end+interval '15 minutes'
          or slot.ends_at>anchor.starts_at+interval '6 hours';
        exit when exists(select 1 from academy.c22_scan_events(a,b,who,slot.starts_at-interval '6 hours',slot.ends_at)
          z where z.id<>slot.id and z.starts_at<slot.ends_at and z.ends_at>slot.starts_at);
        items:=items||jsonb_build_array(to_jsonb(slot));
        last_end:=slot.ends_at;
      end loop;
      insert into academy.compensation_arrivals values(target,a,who,b,selected,card.id,stamp,items,note)
        returning * into arrival;
    end if;
    result:=jsonb_build_object('arrival',target,'candidates',arrival.candidates);
  else
    selected:=(payload->>'arrival')::uuid;
    items:=payload->'coverage';
    if payload-array['branch','arrival','coverage','reason']<>'{}' or jsonb_typeof(items) is distinct from 'array'
      or jsonb_array_length(items) not between 1 and 42 or length(note)>300 then
      raise exception 'Invalid coverage list' using errcode='22023';
    end if;
    select * into arrival from academy.compensation_arrivals where id=selected and academy_id=a and branch_id=b;
    if not found or not academy.q6_eligible(a,b,arrival.staff_id)
      or (arrival.card_id is not null and not exists(select 1 from academy.compensation_staff_cards
        where id=arrival.card_id and revoked_at is null)) then
      raise exception 'Arrival authority changed' using errcode='42501';
    end if;
    for item in select value from jsonb_array_elements(items) loop
      who:=(item->>'staff')::uuid;
      current_version:=(item->>'version')::bigint;
      select x into candidate from jsonb_array_elements(arrival.candidates) x where x->>'id'=item->>'event';
      select e.* into ev from academy.publication_events e
      join academy.publication_heads h on h.event_id=e.id and h.academy_id=a
      join academy.training_dates d on d.academy_id=a and d.program_id=e.program_id and d.local_date=e.day
      where e.id=(item->>'event')::uuid and e.academy_id=a and e.branch_id=b and e.published and not d.canceled
        and e.trainer_id=arrival.staff_id and d.schedule_version=(candidate->>'version')::bigint
        and e.starts_at=d.starts_at and e.ends_at=d.ends_at and e.ends_at<=stamp
      for share of h,d;
      if not found or not academy.q6_eligible(a,b,who) or current_version is null or current_version<0
        or ((who<>arrival.staff_id or current_version>0) and note is null) then
        raise exception 'Review current coverage and reason' using errcode='PT412';
      end if;
      perform academy.c22_legacy_command(a,gen_random_uuid(),'coverage',jsonb_build_object(
        'event',ev.id,'staff',who,'status','present','version',current_version));
      update academy.compensation_coverage_history set arrival_id=arrival.id,verification_reason=note
        where academy_id=a and program_id=ev.program_id and day=ev.day and version=current_version+1;
    end loop;
    target:=arrival.id;
  end if;
  result:=coalesce(result,'{}')||jsonb_build_object('id',target,'action',act);
  insert into academy.compensation_operations values(actor_id,op,a,fp,result);
  insert into academy.audit_events(actor,academy_id,action,operation_id,details)
    values(actor_id,a,'compensation.'||act,op,jsonb_build_object('id',target));
  return result;
end $$;

revoke all on function academy.c22_clock(),academy.c22_scan_events(uuid,uuid,uuid,timestamptz,timestamptz),
  public.c22_staff_context_v1(uuid,uuid),public.c22_staff_command_v1(uuid,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.c22_staff_context_v1(uuid,uuid),public.c22_staff_command_v1(uuid,uuid,text,jsonb) to authenticated;

do $$
declare definition text:=pg_get_functiondef('academy.verified_subject()'::regprocedure);
begin
  if strpos(definition,'|c22_period_context_v1|')=0 then raise exception 'Unexpected signed gateway allowlist'; end if;
  execute replace(definition,'|c22_period_context_v1|','|c22_staff_context_v1|c22_staff_command_v1|c22_period_context_v1|');
end $$;
