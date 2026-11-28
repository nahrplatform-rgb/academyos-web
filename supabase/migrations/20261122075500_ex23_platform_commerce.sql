-- EX-23: first fictional platform plan, manual claim and bounded entitlements.
-- No assignments, invoices, users or operational permissions are seeded.
create table academy.platform_plan_versions (
  id uuid primary key default gen_random_uuid(),
  version integer not null unique,
  price bigint not null check(price > 0),
  trial_days integer not null check(trial_days > 0),
  program_limit integer not null check(program_limit > 0),
  created_by text not null,
  created_at timestamptz not null default now()
);
create table academy.platform_subscriptions (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null unique references academy.academies,
  plan_id uuid not null references academy.platform_plan_versions,
  trial_start date not null,
  trial_end date not null,
  period_start date not null,
  period_end date not null,
  due_on date not null,
  grace_end date not null,
  created_by text not null,
  created_at timestamptz not null default now(),
  check(trial_end >= trial_start and period_start = trial_end + 1
    and period_end >= period_start and due_on >= period_start and grace_end >= due_on)
);
create table academy.platform_invoices (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references academy.academies,
  subscription_id uuid not null unique references academy.platform_subscriptions,
  amount bigint not null check(amount > 0),
  issued_on date not null,
  due_on date not null,
  period_start date not null,
  period_end date not null,
  created_by text not null,
  created_at timestamptz not null default now()
);
create table academy.platform_claims (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references academy.academies,
  invoice_id uuid not null references academy.platform_invoices,
  amount bigint not null check(amount > 0),
  reference text not null check(length(btrim(reference)) between 1 and 120),
  state text not null default 'pending' check(state in ('pending','accepted','rejected')),
  version bigint not null default 1 check(version > 0),
  submitted_on date not null,
  submitted_by text not null,
  created_at timestamptz not null default now()
);
create unique index platform_claim_open_invoice on academy.platform_claims(invoice_id) where state in ('pending','accepted');
create unique index platform_claim_accepted_reference on academy.platform_claims(academy_id,lower(reference)) where state='accepted';
create table academy.platform_claim_reviews (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references academy.academies,
  claim_id uuid not null unique references academy.platform_claims,
  decision text not null check(decision in ('accepted','rejected')),
  reason text not null check(length(btrim(reason)) between 1 and 300),
  actor text not null,
  created_at timestamptz not null default now()
);
create table academy.platform_settlements (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references academy.academies,
  invoice_id uuid not null unique references academy.platform_invoices,
  claim_id uuid not null unique references academy.platform_claims,
  amount bigint not null check(amount > 0),
  confirmed_by text not null,
  confirmed_at timestamptz not null default now()
);
create table academy.platform_commerce_operations (
  actor text not null,
  id uuid not null,
  academy_id uuid references academy.academies,
  fingerprint text,
  result jsonb not null,
  primary key(actor,id)
);
do $$
declare t text;
begin
  foreach t in array array['platform_plan_versions','platform_subscriptions','platform_invoices',
    'platform_claims','platform_claim_reviews','platform_settlements','platform_commerce_operations']
  loop
    execute format('alter table academy.%I enable row level security',t);
    execute format('revoke all on academy.%I from public,anon,authenticated',t);
  end loop;
end $$;

-- Replaced only inside a disposable test database to exercise boundary dates.
create function academy.x23_now() returns timestamptz
language sql stable security invoker set search_path='' as $$ select now() $$;

create function academy.x23_local_day(a uuid) returns date
language sql stable security invoker set search_path='' as $$
  select (academy.x23_now() at time zone timezone)::date from academy.academies where id=a
$$;

create function academy.x23_state(a uuid) returns text
language sql stable security invoker set search_path='' as $$
  select case
    when academy.x23_local_day(a) < s.trial_start then 'scheduled'
    when academy.x23_local_day(a) <= s.trial_end then 'trial'
    when exists(select 1 from academy.platform_settlements p
      join academy.platform_invoices i on i.id=p.invoice_id
      where i.subscription_id=s.id and academy.x23_local_day(a) <= s.period_end) then 'active'
    when academy.x23_local_day(a) <= s.due_on then 'due'
    when academy.x23_local_day(a) <= s.grace_end then 'grace'
    else 'restricted' end
  from academy.platform_subscriptions s where s.academy_id=a
$$;

-- Lock each academy's quota and subscription state for all competing writers.
-- A legacy academy without an assignment keeps its existing behavior.
create function academy.x23_check_write(a uuid,kind text) returns void
language plpgsql volatile security invoker set search_path='' as $$
declare state text; quota integer; used integer;
begin
  perform pg_advisory_xact_lock(hashtextextended('platform-entitlement:'||a::text,0));
  select academy.x23_state(a),p.program_limit into state,quota
    from academy.platform_subscriptions s join academy.platform_plan_versions p on p.id=s.plan_id
    where s.academy_id=a;
  if not found then return; end if;
  if state in ('scheduled','restricted') then
    raise exception 'Academy subscription restricts new work' using errcode='PT423';
  end if;
  if kind='program' then
    select count(*) into used from academy.training_programs where academy_id=a;
    if used >= quota then raise exception 'Program plan limit reached' using errcode='PT426'; end if;
  end if;
end $$;

create function academy.x23_guard_insert() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
  if tg_table_name='publication_events' then
    if new.published and not exists(
      select 1 from academy.publication_heads h join academy.publication_events e on e.id=h.event_id
      where h.academy_id=new.academy_id and h.program_id=new.program_id and h.day=new.day and e.published
    ) then
      perform academy.x23_check_write(new.academy_id,'publication');
    end if;
  elsif tg_table_name='training_programs' then
    perform academy.x23_check_write(new.academy_id,'program');
  else
    perform academy.x23_check_write(new.academy_id,'registration');
  end if;
  return new;
end $$;
create trigger x23_registration_guard before insert on academy.players
  for each row execute function academy.x23_guard_insert();
create trigger x23_program_guard before insert on academy.training_programs
  for each row execute function academy.x23_guard_insert();
create trigger x23_publication_guard before insert on academy.publication_events
  for each row execute function academy.x23_guard_insert();

create function public.x23_context_v1(a uuid,v text) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='8s' set lock_timeout='3s' as $$
declare actor text; academies jsonb:='[]'; plans jsonb:='[]'; claims jsonb:='[]';
  subscription jsonb; invoice jsonb; sub academy.platform_subscriptions; inv academy.platform_invoices;
  count_programs integer;
begin
  if v is null or v not in ('platform','owner') then raise exception 'Invalid view' using errcode='22023'; end if;
  if v='platform' then
    actor:=academy.m1_platform();
    select coalesce(jsonb_agg(jsonb_build_object('id',ac.id,'name',ac.name,'setup',ac.setup_complete)
      order by ac.name,ac.id),'[]'::jsonb) into academies from academy.academies ac;
    select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'version',p.version,'price',p.price,
      'trialDays',p.trial_days,'programLimit',p.program_limit) order by p.version),'[]'::jsonb)
      into plans from academy.platform_plan_versions p;
    if a is not null and not exists(select 1 from academy.academies where id=a) then
      raise exception 'Access denied' using errcode='42501';
    end if;
  else
    if a is null then raise exception 'Access denied' using errcode='42501'; end if;
    actor:=academy.i2_owner(a);
  end if;
  if a is not null then
    select * into sub from academy.platform_subscriptions where academy_id=a;
    if found then
      select count(*) into count_programs from academy.training_programs where academy_id=a;
      select jsonb_build_object('id',sub.id,'plan',sub.plan_id,'trialStart',sub.trial_start,
        'trialEnd',sub.trial_end,'periodStart',sub.period_start,'periodEnd',sub.period_end,
        'due',sub.due_on,'graceEnd',sub.grace_end,'status',academy.x23_state(a),
        'programCount',count_programs,'programLimit',p.program_limit,'price',p.price)
        into subscription from academy.platform_plan_versions p where p.id=sub.plan_id;
      select * into inv from academy.platform_invoices where subscription_id=sub.id;
      if found then
        select jsonb_build_object('id',inv.id,'amount',inv.amount,'paid',coalesce(p.amount,0),
          'balance',inv.amount-coalesce(p.amount,0),'issuedOn',inv.issued_on,'due',inv.due_on,
          'periodStart',inv.period_start,'periodEnd',inv.period_end)
          into invoice from (select 1) x left join academy.platform_settlements p on p.invoice_id=inv.id;
        select coalesce(jsonb_agg(jsonb_build_object('id',c.id,'amount',c.amount,'reference',c.reference,
          'state',c.state,'version',c.version,'submittedOn',c.submitted_on,'reason',r.reason)
          order by c.created_at,c.id),'[]'::jsonb) into claims
          from academy.platform_claims c left join academy.platform_claim_reviews r on r.claim_id=c.id
          where c.invoice_id=inv.id;
      end if;
    end if;
  end if;
  return jsonb_build_object('role',v,'academies',academies,'plans',plans,
    'subscription',subscription,'invoice',invoice,'claims',claims);
end $$;

create function public.x23_command_v1(a uuid,op uuid,act text,payload jsonb) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='8s' set lock_timeout='3s' as $$
declare subject_id text; previous academy.platform_commerce_operations; fingerprint text;
  target uuid; created uuid:=gen_random_uuid(); result jsonb; plan academy.platform_plan_versions;
  sub academy.platform_subscriptions; inv academy.platform_invoices; claim academy.platform_claims;
  start_day date; today date; amount bigint; reference text; decision text; note text; ver bigint;
begin
  if op is null or act is null or act not in ('publish_plan','assign','issue','claim','review')
    or jsonb_typeof(payload) is distinct from 'object' then raise exception 'Invalid command' using errcode='22023'; end if;
  if act='publish_plan' then
    if a is not null then raise exception 'Invalid scope' using errcode='22023'; end if;
    subject_id:=academy.m1_platform();
  elsif act='claim' then
    if a is null then raise exception 'Invalid scope' using errcode='22023'; end if;
    subject_id:=academy.i2_owner(a);
  else
    if a is null then raise exception 'Invalid scope' using errcode='22023'; end if;
    subject_id:=academy.m1_platform();
  end if;
  if a is not null then perform pg_advisory_xact_lock(hashtextextended('platform-entitlement:'||a::text,0)); end if;
  perform pg_advisory_xact_lock(hashtextextended('platform-commerce-op:'||subject_id||':'||op::text,0));
  fingerprint:=encode(extensions.digest(jsonb_build_array(a,act,payload)::text,'sha256'),'hex');
  select * into previous from academy.platform_commerce_operations o where o.actor=subject_id and o.id=op;
  if found then
    if previous.academy_id is distinct from a or previous.fingerprint is distinct from fingerprint then
      raise exception 'Original intent conflicts' using errcode='23505';
    end if;
    return previous.result;
  end if;
  if act='publish_plan' then
    if payload<>'{}'::jsonb then raise exception 'Invalid plan' using errcode='22023'; end if;
    insert into academy.platform_plan_versions(id,version,price,trial_days,program_limit,created_by)
      values(created,1,100000,14,2,subject_id);
  elsif act='assign' then
    if payload-array['plan','start']<>'{}'::jsonb then raise exception 'Invalid assignment' using errcode='22023'; end if;
    target:=(payload->>'plan')::uuid; start_day:=(payload->>'start')::date;
    select * into plan from academy.platform_plan_versions where id=target;
    if not found or start_day is null or start_day not between date '0001-01-01' and date '9998-11-01'
      or not exists(select 1 from academy.academies where id=a and setup_complete and timezone is not null) then
      raise exception 'Setup or plan unavailable' using errcode='22023';
    end if;
    insert into academy.platform_subscriptions(id,academy_id,plan_id,trial_start,trial_end,period_start,
      period_end,due_on,grace_end,created_by)
    values(created,a,target,start_day,start_day+13,start_day+14,
      ((start_day+14)+interval '1 month - 1 day')::date,start_day+20,start_day+27,subject_id);
  elsif act='issue' then
    if payload-array['subscription']<>'{}'::jsonb then raise exception 'Invalid invoice' using errcode='22023'; end if;
    target:=(payload->>'subscription')::uuid;
    select * into sub from academy.platform_subscriptions where id=target and academy_id=a;
    if not found then raise exception 'Access denied' using errcode='42501'; end if;
    today:=academy.x23_local_day(a);
    if today<sub.period_start then raise exception 'Invoice not due to issue' using errcode='PT412'; end if;
    select * into plan from academy.platform_plan_versions where id=sub.plan_id;
    insert into academy.platform_invoices(id,academy_id,subscription_id,amount,issued_on,due_on,period_start,period_end,created_by)
      values(created,a,sub.id,plan.price,today,sub.due_on,sub.period_start,sub.period_end,subject_id);
  elsif act='claim' then
    if payload-array['invoice','amount','reference']<>'{}'::jsonb then raise exception 'Invalid claim' using errcode='22023'; end if;
    target:=(payload->>'invoice')::uuid; amount:=(payload->>'amount')::bigint; reference:=nullif(btrim(payload->>'reference'),'');
    select * into inv from academy.platform_invoices where id=target and academy_id=a;
    if not found then raise exception 'Access denied' using errcode='42501'; end if;
    if amount is distinct from inv.amount or reference is null or length(reference)>120 then
      raise exception 'Invalid claim' using errcode='22023';
    end if;
    insert into academy.platform_claims(id,academy_id,invoice_id,amount,reference,submitted_on,submitted_by)
      values(created,a,inv.id,amount,reference,academy.x23_local_day(a),subject_id);
  else
    if payload-array['claim','version','decision','reason']<>'{}'::jsonb then raise exception 'Invalid review' using errcode='22023'; end if;
    target:=(payload->>'claim')::uuid; ver:=(payload->>'version')::bigint;
    decision:=payload->>'decision'; note:=nullif(btrim(payload->>'reason'),'');
    select * into claim from academy.platform_claims where id=target and academy_id=a for update;
    if not found then raise exception 'Access denied' using errcode='42501'; end if;
    if decision not in ('accepted','rejected') or decision is null or note is null or length(note)>300 then
      raise exception 'Invalid review' using errcode='22023';
    end if;
    if claim.state<>'pending' or claim.version is distinct from ver then raise exception 'Claim changed' using errcode='PT412'; end if;
    update academy.platform_claims set state=decision,version=version+1 where id=claim.id;
    insert into academy.platform_claim_reviews(id,academy_id,claim_id,decision,reason,actor)
      values(created,a,claim.id,decision,note,subject_id);
    if decision='accepted' then
      insert into academy.platform_settlements(academy_id,invoice_id,claim_id,amount,confirmed_by)
        values(a,claim.invoice_id,claim.id,claim.amount,subject_id);
    end if;
  end if;
  result:=jsonb_build_object('id',created,'action',act);
  insert into academy.platform_commerce_operations values(subject_id,op,a,fingerprint,result);
  insert into academy.audit_events(actor,academy_id,action,operation_id,details)
    values(subject_id,a,'platform_commerce.'||act,op,jsonb_build_object('id',created));
  return result;
end $$;

create function public.x23_operation_v1(a uuid,op uuid) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='8s' set lock_timeout='3s' as $$
declare subject_id text; previous academy.platform_commerce_operations; result jsonb:='{"cancelled":true}';
begin
  if op is null then raise exception 'Invalid operation' using errcode='22023'; end if;
  subject_id:=academy.verified_subject();
  if exists(select 1 from academy.platform_grants g where g.subject=subject_id and g.active) then
    perform academy.m1_platform();
  elsif a is not null then
    perform academy.i2_owner(a);
  else
    raise exception 'Access denied' using errcode='42501';
  end if;
  if a is not null then perform pg_advisory_xact_lock(hashtextextended('platform-entitlement:'||a::text,0)); end if;
  perform pg_advisory_xact_lock(hashtextextended('platform-commerce-op:'||subject_id||':'||op::text,0));
  select * into previous from academy.platform_commerce_operations o where o.actor=subject_id and o.id=op;
  if found then
    if previous.academy_id is distinct from a then raise exception 'Access denied' using errcode='42501'; end if;
    return previous.result;
  end if;
  insert into academy.platform_commerce_operations values(subject_id,op,a,null,result);
  insert into academy.audit_events(actor,academy_id,action,operation_id,details)
    values(subject_id,a,'platform_commerce.cancel',op,'{}');
  return result;
end $$;

do $$
declare entry record;
begin
  for entry in select n.nspname,f.oid::regprocedure as signature from pg_proc f
    join pg_namespace n on n.oid=f.pronamespace where n.nspname in ('public','academy') and f.proname in ('x23_now','x23_local_day','x23_state','x23_check_write','x23_guard_insert','x23_context_v1','x23_command_v1','x23_operation_v1')
  loop
    execute format('revoke all on function %s from public,anon,authenticated',entry.signature);
    if entry.nspname='public' then
      execute format('grant execute on function %s to authenticated',entry.signature);
    end if;
  end loop;
end $$;

do $$
declare definition text:=pg_get_functiondef('academy.verified_subject()'::regprocedure);
begin
  if strpos(definition,'|c22_context_v1|')=0 then raise exception 'Unexpected signed gateway allowlist'; end if;
  execute replace(definition,'|c22_context_v1|','|x23_context_v1|x23_command_v1|x23_operation_v1|c22_context_v1|');
end $$;
