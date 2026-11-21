-- EX-21 synthetic family ledger. Existing Guardian access alone grants no billing access.
create table academy.billing_accounts (
  link uuid primary key references academy.guardian_links(id),
  academy_id uuid not null references academy.academies(id),
  player uuid not null references academy.players(id),
  enabled boolean not null
);
create table academy.billing_terms (
  id uuid primary key default gen_random_uuid(),
  version bigint generated always as identity unique,
  academy_id uuid not null references academy.academies(id),
  player uuid not null references academy.players(id),
  link uuid not null references academy.billing_accounts(link),
  calculation text not null default 'calendar-daily-v1',
  starts_on date not null,
  ends_on date check (ends_on >= starts_on),
  amount bigint not null check (amount between 1 and 1000000000)
);
create index billing_terms_effective_idx on academy.billing_terms(academy_id,player,starts_on desc,version desc);

create table academy.billing_entries (
  id uuid primary key default gen_random_uuid(),
  seq bigint generated always as identity unique,
  academy_id uuid not null references academy.academies(id),
  player uuid not null references academy.players(id),
  link uuid not null references academy.billing_accounts(link),
  kind text not null check (kind in ('bill','receipt','allocation','credit','unapply')),
  amount bigint not null check (amount between 1 and 1000000000),
  posted_on date not null,
  period date,
  plan uuid references academy.billing_terms(id),
  covered_from date,
  covered_to date,
  due_on date,
  bill uuid references academy.billing_entries(id),
  source uuid references academy.billing_entries(id),
  detail text,
  method text check (method in ('cash','bank'))
);
create unique index billing_one_bill_per_child_month on academy.billing_entries(academy_id,player,period) where kind='bill';
create index billing_statement_idx on academy.billing_entries(link,seq);
create index billing_bill_entries_idx on academy.billing_entries(link,bill);
create index billing_source_entries_idx on academy.billing_entries(link,source);

create table academy.billing_operations (
  actor text not null,
  id uuid not null,
  academy_id uuid not null references academy.academies(id),
  player uuid not null,
  link uuid not null,
  fingerprint text,
  result jsonb not null,
  primary key(actor,id)
);
alter table academy.billing_accounts enable row level security;
alter table academy.billing_terms enable row level security;
alter table academy.billing_entries enable row level security;
alter table academy.billing_operations enable row level security;
revoke all on academy.billing_accounts, academy.billing_terms, academy.billing_entries, academy.billing_operations
from public, anon, authenticated;

-- Use the existing Guardian lifecycle lock before scope checks. Billing writes in the
-- same academy serialize behind it, including posting, correcting and operation fences.
create function academy.f21_current_link(a uuid,l uuid,p uuid) returns boolean
language sql stable security invoker set search_path='' as $$
  select exists (
    select 1 from academy.guardian_links gl
    join academy.guardian_people g on g.id=gl.guardian_id and g.academy_id=a
    join academy.memberships m on m.id=g.membership_id and m.identity_id=g.identity_id and m.academy_id=a
    join academy.guardian_invitations v on v.id=gl.invitation_id and v.academy_id=a and v.player_id=p
    join academy.identities i on i.id=g.identity_id and i.clerk_subject=v.accepted_by
    where gl.id=l and gl.academy_id=a and gl.player_id=p and gl.state='active'
      and v.state='accepted' and m.role='guardian' and m.status='active'
  )
$$;

create function academy.f21_review(a uuid,p uuid,l uuid,m date) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare terms academy.billing_terms; month_end date; first_day date; last_day date;
        charge bigint; preview jsonb;
begin
  if m is null or m not between date '0001-01-01' and date '9998-12-01' or extract(day from m)<>1 then
    raise exception 'Invalid billing month' using errcode='22023';
  end if;
  if not academy.f21_current_link(a,l,p) or not exists (
    select 1 from academy.billing_accounts b where b.link=l and b.academy_id=a and b.player=p and b.enabled
  ) or not exists (
    select 1 from academy.players pl where pl.id=p and pl.academy_id=a and pl.archived_at is null
  ) then raise exception 'Billing assignment unavailable' using errcode='42501'; end if;
  if exists (select 1 from academy.billing_entries e where e.academy_id=a and e.player=p and e.period=m and e.kind='bill') then
    raise exception 'Already issued' using errcode='23505';
  end if;
  month_end := (m + interval '1 month - 1 day')::date;
  select t.* into terms from academy.billing_terms t
    where t.academy_id=a and t.player=p and t.starts_on<=month_end
    order by t.starts_on desc, t.version desc limit 1;
  if not found or terms.link<>l or terms.ends_on<m then
    raise exception 'No effective fee assignment' using errcode='22023';
  end if;
  first_day := greatest(m,terms.starts_on);
  last_day := least(month_end,coalesce(terms.ends_on,month_end));
  charge := round(terms.amount::numeric * (last_day-first_day+1) / (month_end-m+1));
  if charge < 1 then raise exception 'Charge below unit precision' using errcode='22023'; end if;
  preview := jsonb_build_object('month',to_char(m,'YYYY-MM'),'start',first_day,'end',last_day,
    'due',month_end,'amount',charge,'plan',terms.id);
  return preview || jsonb_build_object('review',
    encode(extensions.digest(jsonb_build_array(a,p,l,terms.calculation,preview)::text,'sha256'),'hex'));
end $$;

create function public.f21_preview_v1(a uuid,p uuid,l uuid,m date) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s' as $$
begin
  perform academy.g3_lock(a);
  perform academy.i2_owner(a);
  return academy.f21_review(a,p,l,m);
end $$;

create function public.f21_players_v1(a uuid,after_id uuid default null) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s' as $$
declare items jsonb;
begin
  perform academy.i2_owner(a);
  select coalesce(jsonb_agg(to_jsonb(r) order by r.id),'[]') into items from (
    select pl.id,pl.display_name as name from academy.players pl where pl.academy_id=a
      and (after_id is null or pl.id>after_id)
      and (pl.archived_at is null or exists (select 1 from academy.billing_accounts b where b.academy_id=a and b.player=pl.id))
    order by pl.id limit 26
  ) r;
  return jsonb_build_object('items',items-25,'more',jsonb_array_length(items)>25);
end $$;

create function public.f21_payers_v1(a uuid,p uuid,after_id uuid default null) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s' as $$
declare items jsonb;
begin
  perform academy.g3_lock(a);
  perform academy.i2_owner(a);
  if not exists(select 1 from academy.players pl where pl.id=p and pl.academy_id=a) then
    raise exception 'Access denied' using errcode='42501';
  end if;
  select coalesce(jsonb_agg(to_jsonb(r) order by r.id),'[]') into items from (
    select gl.id,v.recipient as name,b.link is not null as account,
      coalesce(b.enabled,false) and academy.f21_current_link(a,gl.id,p) as granted
    from academy.guardian_links gl join academy.guardian_invitations v on v.id=gl.invitation_id
    left join academy.billing_accounts b on b.link=gl.id
    where gl.academy_id=a and gl.player_id=p and (after_id is null or gl.id>after_id)
      and (b.link is not null or academy.f21_current_link(a,gl.id,p))
    order by gl.id limit 26
  ) r;
  return jsonb_build_object('items',items-25,'more',jsonb_array_length(items)>25);
end $$;

create function public.f21_grants_v1(a uuid,after_id uuid default null) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s' as $$
declare guardian uuid; items jsonb;
begin
  perform academy.g3_lock(a);
  guardian := academy.g3_guardian(a);
  select coalesce(jsonb_agg(to_jsonb(r) order by r.id),'[]') into items from (
    select gl.id,pl.display_name as name
    from academy.billing_accounts b join academy.guardian_links gl on gl.id=b.link
    join academy.players pl on pl.id=b.player and pl.academy_id=a
    where b.academy_id=a and gl.guardian_id=guardian and b.enabled
      and (after_id is null or gl.id>after_id) and academy.f21_current_link(a,gl.id,b.player)
    order by gl.id limit 26
  ) r;
  return jsonb_build_object('items',items-25,'more',jsonb_array_length(items)>25);
end $$;

create function academy.f21_due(l uuid,b uuid) returns bigint
language sql stable security invoker set search_path='' as $$
  select coalesce(sum(case e.kind when 'bill' then e.amount when 'unapply' then e.amount else -e.amount end),0)
  from academy.billing_entries e where e.link=l and ((e.kind='bill' and e.id=b) or e.bill=b)
$$;

create function public.f21_command_v1(a uuid,p uuid,l uuid,op uuid,act text,payload jsonb) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s' as $$
declare actor_id text; previous academy.billing_operations; fp text; result jsonb;
        entry_id uuid := gen_random_uuid(); posted_day date; start_day date; end_day date;
        review jsonb; value bigint; applied bigint; line jsonb; lines jsonb; line_amount bigint;
        target uuid; parent academy.billing_entries; note text; method_name text; enabled boolean;
begin
  perform academy.g3_lock(a);
  actor_id := academy.i2_owner(a);
  if op is null or act is null or act not in ('grant','assign','issue','receipt','credit','unapply')
    or jsonb_typeof(payload) is distinct from 'object' then
    raise exception 'Invalid billing operation' using errcode='22023';
  end if;
  if not exists(select 1 from academy.guardian_links gl join academy.players pl on pl.id=gl.player_id
    where gl.id=l and gl.academy_id=a and pl.id=p and pl.academy_id=a) then
    raise exception 'Access denied' using errcode='42501';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('billing-op:'||actor_id||':'||op::text,0));
  fp := encode(extensions.digest(jsonb_build_array(a,p,l,act,payload)::text,'sha256'),'hex');
  select * into previous from academy.billing_operations o where o.actor=actor_id and o.id=op;
  if found then
    if previous.fingerprint is distinct from fp then
      raise exception 'Original intent conflicts' using errcode='23505';
    end if;
    return previous.result;
  end if;
  select (now() at time zone x.timezone)::date into posted_day from academy.academies x where x.id=a;
  if act='grant' then
    if jsonb_typeof(payload->'enabled') is distinct from 'boolean' then raise exception 'Invalid grant' using errcode='22023'; end if;
    enabled := (payload->>'enabled')::boolean;
    if enabled and not academy.f21_current_link(a,l,p) then raise exception 'Access denied' using errcode='42501'; end if;
    insert into academy.billing_accounts values(l,a,p,enabled) on conflict(link)
      do update set enabled=excluded.enabled;
    entry_id := l;
  else
    if not exists(select 1 from academy.billing_accounts b where b.link=l and b.academy_id=a and b.player=p) then
      raise exception 'No payer account' using errcode='42501';
    end if;
    if act='assign' then
      if not academy.f21_current_link(a,l,p) or not exists(
          select 1 from academy.billing_accounts b where b.link=l and b.enabled
        ) or not exists(select 1 from academy.players pl where pl.id=p and pl.archived_at is null) then
        raise exception 'Payer or child unavailable' using errcode='42501';
      end if;
      start_day := (payload->>'start')::date;
      end_day := (payload->>'end')::date;
      value := (payload->>'amount')::bigint;
      if start_day is null or start_day not between date '0001-01-01' and date '9998-12-31'
        or end_day<start_day or end_day>date '9998-12-31' or value is null or value not between 1 and 1000000000 then
        raise exception 'Invalid assignment' using errcode='22023';
      end if;
      if exists(select 1 from academy.billing_entries e where e.academy_id=a and e.player=p
          and e.kind='bill' and e.period>=date_trunc('month',start_day)::date
          and not exists (select 1 from academy.billing_terms later where later.academy_id=a
            and later.player=p and later.starts_on>start_day and later.starts_on<=e.period)) then
        raise exception 'That period has posted history' using errcode='23505';
      end if;
      if extract(day from start_day)<>1 and exists (select 1 from academy.billing_terms t
          where t.academy_id=a and t.player=p and t.starts_on<start_day
            and coalesce(t.ends_on,date '9998-12-31')>=date_trunc('month',start_day)::date) then
        raise exception 'Fee changes start on a month boundary' using errcode='22023';
      end if;
      if exists (select 1 from academy.billing_terms t where t.academy_id=a and t.player=p
          and t.starts_on>start_day and t.starts_on<(date_trunc('month',start_day)+interval '1 month')::date) then
        raise exception 'An assignment already starts in this month' using errcode='23505';
      end if;
      insert into academy.billing_terms(id,academy_id,player,link,starts_on,ends_on,amount)
      values(entry_id,a,p,l,start_day,end_day,value);
    elsif act='issue' then
      start_day := (payload->>'month')::date;
      review := academy.f21_review(a,p,l,start_day);
      if (review->>'review') is distinct from (payload->>'review') then
        raise exception 'Review changed' using errcode='PT412';
      end if;
      insert into academy.billing_entries(id,academy_id,player,link,kind,amount,posted_on,period,plan,covered_from,covered_to,due_on)
      values(entry_id,a,p,l,'bill',(review->>'amount')::bigint,posted_day,start_day,(review->>'plan')::uuid,
        (review->>'start')::date,(review->>'end')::date,(review->>'due')::date);
    elsif act='receipt' then
      value := (payload->>'amount')::bigint;
      start_day := (payload->>'received')::date;
      method_name := payload->>'method';
      note := nullif(btrim(payload->>'reference'),'');
      lines := payload->'allocations';
      if value is null or value not between 1 and 1000000000 or start_day is null or start_day>posted_day
        or start_day<date '0001-01-01' or method_name is null or method_name not in ('cash','bank')
        or (method_name='bank' and note is null) or length(note)>120
        or jsonb_typeof(lines) is distinct from 'array' then
        raise exception 'Invalid receipt' using errcode='22023';
      end if;
      if jsonb_array_length(lines)>50 then raise exception 'Too many allocations' using errcode='22023'; end if;
      applied := 0;
      insert into academy.billing_entries(id,academy_id,player,link,kind,amount,posted_on,method,detail)
      values(entry_id,a,p,l,'receipt',value,start_day,method_name,note);
      for line in select elem from jsonb_array_elements(lines) elem loop
        target := (line->>'bill')::uuid;
        line_amount := (line->>'amount')::bigint;
        if line_amount is null or line_amount not between 1 and value then raise exception 'Invalid allocation' using errcode='22023'; end if;
        if not exists(select 1 from academy.billing_entries e where e.id=target and e.link=l and e.kind='bill') then
          raise exception 'Foreign bill' using errcode='42501';
        end if;
        if exists(select 1 from academy.billing_entries e where e.source=entry_id and e.bill=target) then
          raise exception 'Duplicate allocation' using errcode='22023';
        end if;
        applied := applied + line_amount;
        if applied>value or academy.f21_due(l,target)<line_amount then
          raise exception 'Allocation exceeds available amount' using errcode='23505';
        end if;
        insert into academy.billing_entries(academy_id,player,link,kind,amount,posted_on,bill,source)
        values(a,p,l,'allocation',line_amount,start_day,target,entry_id);
      end loop;
    else
      target := (case when act='credit' then payload->>'bill' else payload->>'allocation' end)::uuid;
      value := (payload->>'amount')::bigint;
      note := nullif(btrim(payload->>'reason'),'');
      if value is null or value not between 1 and 1000000000 or note is null or length(note)>300 then
        raise exception 'Amount and reason are required' using errcode='22023';
      end if;
      select * into parent from academy.billing_entries e where e.id=target and e.link=l
        and e.kind=(case when act='credit' then 'bill' else 'allocation' end);
      if not found then raise exception 'Access denied' using errcode='42501'; end if;
      if (act='credit' and academy.f21_due(l,parent.id)<value) or
        (act='unapply' and value>parent.amount-(select coalesce(sum(e.amount),0) from academy.billing_entries e where e.link=l and e.source=target and e.kind='unapply')) then
        raise exception 'Adjustment exceeds available amount' using errcode='23505';
      end if;
      insert into academy.billing_entries(id,academy_id,player,link,kind,amount,posted_on,bill,source,detail)
      values(entry_id,a,p,l,act,value,posted_day,coalesce(parent.bill,parent.id),parent.id,note);
    end if;
  end if;
  result := jsonb_build_object('id',entry_id,'action',act);
  insert into academy.billing_operations values(actor_id,op,a,p,l,fp,result);
  insert into academy.audit_events(actor,academy_id,action,operation_id,details)
  values(actor_id,a,'billing.'||act,op,jsonb_build_object('id',entry_id,'player',p,'link',l)
    || case when act='receipt' then '{"verification":"owner_attested"}'::jsonb else '{}'::jsonb end);
  return result;
end $$;

create function public.f21_operation_v1(a uuid,p uuid,l uuid,op uuid) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s' as $$
declare subject text; old academy.billing_operations; result jsonb := '{"cancelled":true}';
begin
  perform academy.g3_lock(a);
  subject := academy.i2_owner(a);
  if op is null or not exists(select 1 from academy.guardian_links gl join academy.players pl on pl.id=gl.player_id
    where gl.id=l and gl.academy_id=a and gl.player_id=p and pl.academy_id=a) then
    raise exception 'Access denied' using errcode='42501';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('billing-op:'||subject||':'||op::text,0));
  select * into old from academy.billing_operations o where o.actor=subject and o.id=op;
  if found then
    if (old.academy_id,old.player,old.link) is distinct from (a,p,l) then
      raise exception 'Original scope conflicts' using errcode='23505';
    end if;
    return old.result;
  end if;
  insert into academy.billing_operations values(subject,op,a,p,l,null,result);
  return result;
end $$;

create function public.f21_statement_v1(a uuid,l uuid,after_seq bigint default null,snapshot_seq bigint default null) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s' as $$
declare subject text; owner_scope boolean := false; account academy.billing_accounts;
        player_name text; totals jsonb; total bigint; head bigint; items jsonb; next_cursor text;
begin
  perform academy.g3_lock(a);
  subject := academy.verified_subject();
  select * into account from academy.billing_accounts b where b.academy_id=a and b.link=l;
  if not found then raise exception 'Access denied' using errcode='42501'; end if;
  perform 1 from academy.memberships m join academy.identities i on i.id=m.identity_id
    where m.academy_id=a and i.clerk_subject=subject and m.role='owner' and m.status='active' for share of m;
  owner_scope := found;
  if not owner_scope and (not account.enabled or not academy.f21_current_link(a,l,account.player)
    or not exists(select 1 from academy.guardian_links gl where gl.id=l and gl.guardian_id=academy.g3_guardian(a))) then
    raise exception 'Access denied' using errcode='42501';
  end if;
  select pl.display_name into player_name from academy.players pl where pl.academy_id=a and pl.id=account.player;
  select coalesce(max(e.seq),0) into head from academy.billing_entries e where e.link=l;
  if snapshot_seq>head or snapshot_seq<0 or after_seq<0 or (after_seq is not null and
      (snapshot_seq is null or after_seq>snapshot_seq or not exists (
        select 1 from academy.billing_entries e where e.link=l and e.seq=after_seq))) then
    raise exception 'Invalid statement cursor' using errcode='22023';
  end if;
  snapshot_seq := coalesce(snapshot_seq,head);
  select count(*), jsonb_build_object(
    'due',coalesce(sum(case kind when 'bill' then amount when 'unapply' then amount when 'credit' then -amount when 'allocation' then -amount else 0 end),0),
    'unapplied',coalesce(sum(case kind when 'receipt' then amount when 'allocation' then -amount when 'unapply' then amount else 0 end),0),
    'net',coalesce(sum(amount) filter (where kind='receipt'),0)
  ) into total,totals
  from academy.billing_entries where link=l and seq<=snapshot_seq;
  if (totals->>'net')::numeric>9007199254740991 or (totals->>'due')::numeric>9007199254740991 then
    raise exception 'Statement exceeds amount precision' using errcode='54000';
  end if;
  select coalesce(jsonb_agg(
    jsonb_build_object('seq',r.seq::text,'id',r.id,'kind',r.kind,'amount',r.amount,'date',r.posted_on,
      'bill',r.bill,'source',r.source,'period',case when r.period is not null then to_char(r.period,'YYYY-MM') end,
      'plan',case when owner_scope then r.plan end,'start',r.covered_from,'end',r.covered_to,'due',r.due_on,
      'method',r.method,'detail',case when owner_scope then r.detail end) order by r.seq
  ),'[]') into items from (
    select e.* from academy.billing_entries e where e.link=l and e.seq<=snapshot_seq and e.seq>coalesce(after_seq,0)
    order by e.seq limit 26
  ) r;
  if jsonb_array_length(items)>25 then next_cursor := items->24->>'seq'; end if;
  return jsonb_build_object('name',player_name,'player',account.player,'snapshot',snapshot_seq::text,
     'next',next_cursor,'total',total,'totals',totals,'items',items-25);
end $$;

do $$
declare entry record;
begin
  for entry in select n.nspname, f.oid::regprocedure as signature from pg_proc f
    join pg_namespace n on n.oid=f.pronamespace where n.nspname in ('public','academy') and f.proname like 'f21_%'
  loop
    execute format('revoke all on function %s from public, anon, authenticated',entry.signature);
    if entry.nspname='public' then execute format('grant execute on function %s to authenticated',entry.signature); end if;
  end loop;
end $$;

do $$
declare definition text := pg_get_functiondef('academy.verified_subject()'::regprocedure);
begin
  if strpos(definition,'|i2_register_v1|')=0 then raise exception 'Unexpected prior signed gateway allowlist'; end if;
  execute replace(definition,'|i2_register_v1|',
    '|f21_players_v1|f21_payers_v1|f21_grants_v1|f21_preview_v1|f21_command_v1|f21_operation_v1|f21_statement_v1|i2_register_v1|');
end $$;
