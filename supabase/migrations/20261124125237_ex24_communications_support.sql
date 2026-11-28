-- EX-24: Communications and support with delivery recovery (in-app only).
-- No external sends, no impersonation, no attachment storage. External channels,
-- quiet hours, retention and provider budgets remain gated on D-014/D-015/D-021/D-022.

create table academy.support_tickets (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references academy.academies,
  branch_id uuid,
  created_by text not null,
  subject text not null check (length(subject) between 1 and 200),
  status text not null default 'open' check (status in ('open','resolved','reopened')),
  version bigint not null default 1 check (version > 0),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  resolved_at timestamptz,
  resolved_by text
);

create table academy.support_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references academy.support_tickets,
  academy_id uuid not null references academy.academies,
  author_id text not null,
  body text not null check (length(body) between 1 and 4000),
  created_at timestamptz not null default clock_timestamp()
);

-- Schema-only for the future in-app inbox/outbox. No reader/writer ships in EX-24.
create table academy.inbox_messages (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references academy.academies,
  recipient_id text not null,
  sender_id text not null,
  subject text not null check (length(subject) between 1 and 200),
  body text not null check (length(body) between 1 and 4000),
  channel text not null default 'in_app' check (channel in ('in_app')),
  delivery_status text not null default 'delivered' check (delivery_status in ('queued','delivered','failed')),
  created_at timestamptz not null default clock_timestamp(),
  read_at timestamptz
);

-- Original-operation receipt for create/reply/resolve/reopen retries.
create table academy.support_operations (
  actor text not null,
  id uuid not null,
  academy_id uuid not null references academy.academies,
  action text not null check (action in ('create','reply','resolve','reopen')),
  fingerprint text not null,
  result jsonb not null,
  created_at timestamptz not null default clock_timestamp(),
  primary key (actor, id)
);

create index idx_support_tickets_academy on academy.support_tickets(academy_id, updated_at desc);
create index idx_support_messages_ticket on academy.support_messages(ticket_id, created_at);
create index idx_inbox_recipient on academy.inbox_messages(recipient_id, academy_id);
create index idx_support_operations_scope on academy.support_operations(academy_id, action);

do $$declare t text;begin foreach t in array array['support_tickets','support_messages','inbox_messages','support_operations']loop
  execute format('alter table academy.%I enable row level security',t);
  execute format('revoke all on academy.%I from public,anon,authenticated',t);
end loop;end$$;

-- Resolve the acting Clerk subject to an active membership in the selected academy.
-- Returns null when the caller has no current membership there.
create function academy.x24_member(a uuid, s text) returns text
language sql stable security invoker set search_path='' as $$
  select i.clerk_subject
  from academy.memberships m join academy.identities i on i.id=m.identity_id
  where m.academy_id=a and i.clerk_subject=s and m.status='active'
$$;

create function public.support_list_tickets_v1(a uuid) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s' as $$
declare s text;items jsonb;
begin
  perform academy.t4_lock(a);
  s:=academy.verified_subject();
  if academy.x24_member(a,s) is null then return '[]'::jsonb; end if;
  select coalesce(jsonb_agg(to_jsonb(q) order by q.updated_at desc),'[]'::jsonb) into items from (
    select id,subject,status,version,created_by,created_at,updated_at,resolved_at
    from academy.support_tickets where academy_id=a
  ) q;
  return items;
end$$;

create function public.support_list_messages_v1(a uuid,t uuid) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s' as $$
declare s text;items jsonb;
begin
  perform academy.t4_lock(a);
  s:=academy.verified_subject();
  if academy.x24_member(a,s) is null then return '[]'::jsonb; end if;
  if not exists(select 1 from academy.support_tickets where id=t and academy_id=a) then return '[]'::jsonb; end if;
  select coalesce(jsonb_agg(to_jsonb(q) order by q.created_at,q.id),'[]'::jsonb) into items from (
    select id,author_id,body,created_at from academy.support_messages where ticket_id=t and academy_id=a
  ) q;
  return items;
end$$;

create function public.support_create_ticket_v1(a uuid,p_subject text,p_message text,op uuid) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s' as $$
declare s text;prior academy.support_operations;fp text;tid uuid;result jsonb;
begin
  perform academy.t4_lock(a);
  s:=academy.verified_subject();
  if op is null or p_subject is null or length(p_subject) not between 1 and 200 or p_message is null or length(p_message) not between 1 and 4000 then
    raise exception 'Invalid ticket' using errcode='22023';
  end if;
  if academy.x24_member(a,s) is null then raise exception 'Access denied' using errcode='42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended('support-op:'||s||':'||op,0));
  fp:=encode(extensions.digest(jsonb_build_object('action','create','academy',a,'subject',p_subject,'message',p_message)::text,'sha256'),'hex');
  select * into prior from academy.support_operations where actor=s and id=op;
  if found then
    if prior.academy_id<>a or prior.action<>'create' or prior.fingerprint<>fp then return '{"error":"conflict"}'::jsonb; end if;
    return prior.result;
  end if;
  insert into academy.support_tickets(academy_id,created_by,subject) values(a,s,p_subject) returning id into tid;
  insert into academy.support_messages(ticket_id,academy_id,author_id,body) values(tid,a,s,p_message);
  result:=jsonb_build_object('ticket_id',tid,'status','open','version',1);
  insert into academy.support_operations(actor,id,academy_id,action,fingerprint,result) values(s,op,a,'create',fp,result);
  insert into academy.audit_events(actor,academy_id,action,operation_id,details) values(s,a,'support.create',op,jsonb_build_object('ticket',tid));
  return result;
end$$;

create function public.support_reply_v1(a uuid,t uuid,p_message text,op uuid) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s' as $$
declare s text;prior academy.support_operations;fp text;ticket academy.support_tickets;mid uuid;result jsonb;
begin
  perform academy.t4_lock(a);
  s:=academy.verified_subject();
  if op is null or p_message is null or length(p_message) not between 1 and 4000 then raise exception 'Invalid reply' using errcode='22023'; end if;
  if academy.x24_member(a,s) is null then raise exception 'Access denied' using errcode='42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended('support-op:'||s||':'||op,0));
  fp:=encode(extensions.digest(jsonb_build_object('action','reply','academy',a,'ticket',t,'message',p_message)::text,'sha256'),'hex');
  select * into prior from academy.support_operations where actor=s and id=op;
  if found then
    if prior.academy_id<>a or prior.action<>'reply' or prior.fingerprint<>fp then return '{"error":"conflict"}'::jsonb; end if;
    return prior.result;
  end if;
  select * into ticket from academy.support_tickets where id=t and academy_id=a for update;
  if not found then return '{"error":"not_found"}'::jsonb; end if;
  insert into academy.support_messages(ticket_id,academy_id,author_id,body) values(t,a,s,p_message) returning id into mid;
  update academy.support_tickets set updated_at=clock_timestamp() where id=t;
  result:=jsonb_build_object('ok',true,'message_id',mid,'ticket_id',t);
  insert into academy.support_operations(actor,id,academy_id,action,fingerprint,result) values(s,op,a,'reply',fp,result);
  insert into academy.audit_events(actor,academy_id,action,operation_id,details) values(s,a,'support.reply',op,jsonb_build_object('ticket',t,'message',mid));
  return result;
end$$;

create function public.support_resolve_v1(a uuid,t uuid,p_expected_version bigint,op uuid) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s' as $$
declare s text;prior academy.support_operations;fp text;ticket academy.support_tickets;result jsonb;
begin
  perform academy.t4_lock(a);
  s:=academy.verified_subject();
  if op is null or p_expected_version is null or p_expected_version<1 then raise exception 'Invalid resolve' using errcode='22023'; end if;
  if academy.x24_member(a,s) is null then raise exception 'Access denied' using errcode='42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended('support-op:'||s||':'||op,0));
  fp:=encode(extensions.digest(jsonb_build_object('action','resolve','academy',a,'ticket',t,'version',p_expected_version)::text,'sha256'),'hex');
  select * into prior from academy.support_operations where actor=s and id=op;
  if found then
    if prior.academy_id<>a or prior.action<>'resolve' or prior.fingerprint<>fp then return '{"error":"conflict"}'::jsonb; end if;
    return prior.result;
  end if;
  select * into ticket from academy.support_tickets where id=t and academy_id=a for update;
  if not found then return '{"error":"not_found"}'::jsonb; end if;
  if ticket.version<>p_expected_version then
    return jsonb_build_object('error','stale','status',ticket.status,'version',ticket.version);
  end if;
  update academy.support_tickets set status='resolved',version=version+1,resolved_at=clock_timestamp(),resolved_by=s,updated_at=clock_timestamp() where id=t;
  result:=jsonb_build_object('ok',true,'status','resolved','version',p_expected_version+1);
  insert into academy.support_operations(actor,id,academy_id,action,fingerprint,result) values(s,op,a,'resolve',fp,result);
  insert into academy.audit_events(actor,academy_id,action,operation_id,details) values(s,a,'support.resolve',op,jsonb_build_object('ticket',t));
  return result;
end$$;

create function public.support_reopen_v1(a uuid,t uuid,p_expected_version bigint,op uuid) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s' as $$
declare s text;prior academy.support_operations;fp text;ticket academy.support_tickets;result jsonb;
begin
  perform academy.t4_lock(a);
  s:=academy.verified_subject();
  if op is null or p_expected_version is null or p_expected_version<1 then raise exception 'Invalid reopen' using errcode='22023'; end if;
  if academy.x24_member(a,s) is null then raise exception 'Access denied' using errcode='42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended('support-op:'||s||':'||op,0));
  fp:=encode(extensions.digest(jsonb_build_object('action','reopen','academy',a,'ticket',t,'version',p_expected_version)::text,'sha256'),'hex');
  select * into prior from academy.support_operations where actor=s and id=op;
  if found then
    if prior.academy_id<>a or prior.action<>'reopen' or prior.fingerprint<>fp then return '{"error":"conflict"}'::jsonb; end if;
    return prior.result;
  end if;
  select * into ticket from academy.support_tickets where id=t and academy_id=a for update;
  if not found then return '{"error":"not_found"}'::jsonb; end if;
  if ticket.version<>p_expected_version then
    return jsonb_build_object('error','stale','status',ticket.status,'version',ticket.version);
  end if;
  update academy.support_tickets set status='reopened',version=version+1,resolved_at=null,resolved_by=null,updated_at=clock_timestamp() where id=t;
  result:=jsonb_build_object('ok',true,'status','reopened','version',p_expected_version+1);
  insert into academy.support_operations(actor,id,academy_id,action,fingerprint,result) values(s,op,a,'reopen',fp,result);
  insert into academy.audit_events(actor,academy_id,action,operation_id,details) values(s,a,'support.reopen',op,jsonb_build_object('ticket',t));
  return result;
end$$;

-- Reconcile a committed original whose reply was lost. Never inserts.
create function public.support_operation_v1(a uuid,op uuid) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s' as $$
declare s text;prior academy.support_operations;
begin
  s:=academy.verified_subject();
  if op is null then raise exception 'Invalid operation' using errcode='22023'; end if;
  if academy.x24_member(a,s) is null then raise exception 'Access denied' using errcode='42501'; end if;
  select * into prior from academy.support_operations where actor=s and id=op;
  if not found then return '{"error":"not_found"}'::jsonb; end if;
  if prior.academy_id<>a then raise exception 'Access denied' using errcode='42501'; end if;
  return prior.result;
end$$;

do $$declare entry record;begin
  for entry in select n.nspname,f.oid::regprocedure as signature from pg_proc f
    join pg_namespace n on n.oid=f.pronamespace where n.nspname in ('public','academy') and f.proname in
      ('support_list_tickets_v1','support_list_messages_v1','support_create_ticket_v1','support_reply_v1','support_resolve_v1','support_reopen_v1','support_operation_v1','x24_member')
  loop
    execute format('revoke all on function %s from public,anon,authenticated',entry.signature);
    if entry.nspname='public' then execute format('grant execute on function %s to authenticated',entry.signature); end if;
  end loop;
end$$;

do $$
declare definition text:=pg_get_functiondef('academy.verified_subject()'::regprocedure);
  additions text:='|support_list_tickets_v1|support_list_messages_v1|support_create_ticket_v1|support_reply_v1|support_resolve_v1|support_reopen_v1|support_operation_v1';
begin
  if strpos(definition,'|support_create_ticket_v1|')>0 then return; end if;
  if strpos(definition,'|x23_context_v1|')>0 then
    execute replace(definition,'|x23_context_v1|',additions||'|x23_context_v1|');
  elsif strpos(definition,'|c22_context_v1|')>0 then
    execute replace(definition,'|c22_context_v1|',additions||'|c22_context_v1|');
  elsif strpos(definition,'|a10_register_v1|')>0 then
    -- Bounded fixtures: EX-24 without EX-22/EX-23. Append before the last attendance anchor.
    execute replace(definition,'|a10_register_v1|',additions||'|a10_register_v1|');
  else
    raise exception 'Unexpected verified_subject allowlist: cannot find anchor for EX-24 support routes';
  end if;
end $$;
