-- The existing agreement and its original invoice keep their initial period.
alter table academy.platform_invoices
  drop constraint platform_invoices_subscription_id_key,
  add constraint platform_invoices_subscription_period_key unique (subscription_id, period_start);

do $migration$
declare
  context_definition text := pg_get_functiondef('public.x23_context_v1(uuid,text)'::regprocedure);
  command_definition text := pg_get_functiondef('public.x23_command_v1(uuid,uuid,text,jsonb)'::regprocedure);
  state_definition text := pg_get_functiondef('academy.x23_state(uuid)'::regprocedure);
  first_invoice text := 'where subscription_id=sub.id;';
  claim_invoice text := 'where id=target and academy_id=a;';
  old_claim_select text := 'select * into inv from academy.platform_invoices ' || claim_invoice;
  original_period text := 'where i.subscription_id=s.id and academy.x23_local_day(a) <= s.period_end';
begin
  if strpos(context_definition, first_invoice) = 0 or strpos(command_definition, old_claim_select) = 0
     or strpos(state_definition, original_period) = 0 then
    raise exception 'Unexpected platform billing baseline';
  end if;
  execute replace(context_definition, first_invoice, 'where subscription_id=sub.id and period_start=sub.period_start;');
  execute replace(command_definition, old_claim_select,
    'select i.* into inv from academy.platform_invoices i
      join academy.platform_subscriptions s on s.id=i.subscription_id
      where i.id=target and i.academy_id=a and i.period_start=s.period_start;');
  execute replace(state_definition, original_period,
    'where i.subscription_id=s.id and i.period_start=s.period_start and academy.x23_local_day(a) <= s.period_end');
end
$migration$;

create table academy.platform_paymob_test_renewals (
  invoice_id uuid primary key references academy.platform_invoices,
  merchant_id bigint not null check (merchant_id > 0),
  subscription_id bigint not null check (subscription_id > 0),
  integration_id bigint not null check (integration_id > 0),
  enrollment_transaction_id bigint not null check (enrollment_transaction_id > 0),
  unique (merchant_id, subscription_id)
);

create table academy.platform_paymob_test_transactions (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references academy.platform_paymob_test_renewals,
  transaction_id bigint not null unique check (transaction_id > 0),
  status text not null check (status in ('pending', 'review_required', 'settled')),
  occurred_at timestamptz not null,
  paid_at timestamptz,
  check (status <> 'settled' or (paid_at is not null and paid_at >= occurred_at)),
  unique (invoice_id, id)
);
create unique index platform_paymob_test_one_settled_transaction
  on academy.platform_paymob_test_transactions(invoice_id) where status = 'settled';

alter table academy.platform_paymob_test_renewals enable row level security;
alter table academy.platform_paymob_test_transactions enable row level security;
revoke all on academy.platform_paymob_test_renewals, academy.platform_paymob_test_transactions
  from public, anon, authenticated;

alter table academy.platform_settlements
  alter column claim_id drop not null,
  add column paymob_test_transaction_id uuid unique,
  add constraint platform_settlements_source_check
    check (num_nonnulls(claim_id, paymob_test_transaction_id) = 1),
  add constraint platform_settlements_paymob_test_invoice_fk
    foreign key (invoice_id, paymob_test_transaction_id)
    references academy.platform_paymob_test_transactions(invoice_id, id);

-- Private and invoker-only. There is no application RPC grant or payment scheduler.
create function academy.x30_record_paymob_test_renewal(
  a uuid, invoice uuid, merchant bigint, subscription bigint, integration bigint,
  tx bigint, amount bigint, outcome text, occurred timestamptz, paid timestamptz
) returns jsonb language plpgsql security invoker set search_path='' as $$
declare
  agreement academy.platform_invoices;
  binding academy.platform_paymob_test_renewals;
  previous academy.platform_paymob_test_transactions;
  recorded uuid;
  next_status text := outcome;
  billing_day date;
  billing_zone text;
begin
  if outcome is null or outcome not in ('pending', 'review_required', 'verified_payment')
    or tx is null or tx <= 0 or occurred is null or not isfinite(occurred)
    or (outcome = 'verified_payment' and (paid is null or not isfinite(paid) or paid < occurred))
    or (outcome <> 'verified_payment' and paid is not null) then
    raise exception 'Invalid Paymob test renewal' using errcode='22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('platform-paymob-test:' || tx::text, 0));
  select i.* into agreement from academy.platform_invoices i
    join academy.platform_subscriptions s on s.id=i.subscription_id and s.academy_id=i.academy_id
    where i.id=invoice and i.academy_id=a and i.period_start > s.period_end for update of i;
  if not found then raise exception 'Paymob renewal invoice unavailable' using errcode='42501'; end if;
  select * into binding from academy.platform_paymob_test_renewals r where r.invoice_id=invoice for share;
  if not found or binding.merchant_id is distinct from merchant or binding.subscription_id is distinct from subscription
    or binding.integration_id is distinct from integration or binding.enrollment_transaction_id=tx
    or agreement.amount is distinct from amount then
    raise exception 'Paymob renewal binding mismatch' using errcode='42501';
  end if;
  select timezone into billing_zone from academy.academies where id=a;
  billing_day := (occurred at time zone billing_zone)::date;
  if billing_day is null or billing_day not between agreement.period_start and agreement.period_end
    or (paid is not null and (paid at time zone billing_zone)::date not between agreement.period_start and agreement.period_end) then
    raise exception 'Paymob renewal outside invoice cycle' using errcode='22023';
  end if;

  select * into previous from academy.platform_paymob_test_transactions p where p.transaction_id=tx;
  if found and previous.invoice_id<>invoice then
    raise exception 'Paymob transaction belongs to a different invoice' using errcode='23505';
  end if;
  if previous.id is not null and previous.occurred_at is distinct from occurred then
    raise exception 'Paymob transaction timestamp conflicts' using errcode='23505';
  end if;
  if previous.status='settled' and outcome='verified_payment' and previous.paid_at is distinct from paid then
    raise exception 'Paymob confirmed payment timestamp conflicts' using errcode='23505';
  end if;
  if previous.status='settled' and outcome='review_required' then
    if not exists (select 1 from academy.audit_events e
      where e.operation_id=previous.id and e.action='platform_commerce.paymob_settlement_conflict') then
      insert into academy.audit_events(actor,academy_id,action,operation_id,details)
        values('paymob_egypt_test',a,'platform_commerce.paymob_settlement_conflict',previous.id,
          jsonb_build_object('invoice_id',invoice,'transaction_id',tx));
    end if;
    return jsonb_build_object('id',previous.id,'status','review_required');
  end if;
  if previous.status='settled' or (previous.status='review_required' and outcome='pending') then
    return jsonb_build_object('id',previous.id,'status',previous.status);
  end if;
  if outcome='verified_payment' then
    if exists (select 1 from academy.platform_settlements p where p.invoice_id=invoice) then
      next_status:='review_required';
    else
      next_status:='settled';
    end if;
  end if;
  if previous.status=next_status then
    return jsonb_build_object('id',previous.id,'status',previous.status);
  end if;

  insert into academy.platform_paymob_test_transactions(invoice_id,transaction_id,status,occurred_at,paid_at)
    values(invoice,tx,next_status,occurred,paid)
    on conflict (transaction_id) do update set status=excluded.status,paid_at=excluded.paid_at
    returning id into recorded;
  if next_status='settled' then
    insert into academy.platform_settlements(academy_id,invoice_id,paymob_test_transaction_id,amount,confirmed_by)
      values(a,invoice,recorded,amount,'paymob_egypt_test');
  end if;
  insert into academy.audit_events(actor,academy_id,action,operation_id,details)
    values('paymob_egypt_test',a,'platform_commerce.paymob_' || next_status,recorded,
      jsonb_build_object('invoice_id',invoice,'transaction_id',tx));
  return jsonb_build_object('id',recorded,'status',next_status);
end $$;

revoke all on function academy.x30_record_paymob_test_renewal(uuid,uuid,bigint,bigint,bigint,bigint,bigint,text,timestamptz,timestamptz)
  from public, anon, authenticated;
