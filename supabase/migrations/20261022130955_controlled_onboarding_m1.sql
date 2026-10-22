-- M1 approved synthetic onboarding. No platform grant is seeded by this migration.
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
create table academy.m1_secrets (purpose text primary key check(purpose='onboarding'), secret text not null check(length(secret)=64));
create table academy.platform_grants (
 subject text primary key, active boolean not null default true,
 granted_by text not null, reason text not null, granted_at timestamptz not null default now()
);
alter table academy.academies add column setup_version integer not null default 0;
alter table academy.academies add column setup_complete boolean not null default false;
alter table academy.academies add column timezone text;
create unique index memberships_one_active_owner on academy.memberships(academy_id) where role='owner' and status='active';
create table academy.branches (
 id uuid primary key default gen_random_uuid(), academy_id uuid not null references academy.academies,
 name text not null check(length(trim(name)) between 1 and 160), unique(id,academy_id)
);
create table academy.sports (
 id uuid primary key default gen_random_uuid(), academy_id uuid not null references academy.academies,
 label_en text not null check(length(trim(label_en)) between 1 and 160),
 label_ar text not null check(length(trim(label_ar)) between 1 and 160), unique(id,academy_id)
);
create table academy.initial_setup (
 academy_id uuid primary key references academy.academies,
 branch_id uuid, sport_id uuid,
 foreign key(branch_id,academy_id) references academy.branches(id,academy_id),
 foreign key(sport_id,academy_id) references academy.sports(id,academy_id)
);
create table academy.owner_invitations (
 id uuid primary key, academy_id uuid not null unique references academy.academies,
 recipient text not null check(length(recipient)<=254), secret_hash text not null,
 generation integer not null default 1, expires_at timestamptz not null default now()+interval '72 hours',
 created_by text not null references academy.platform_grants(subject),
 revoked boolean not null default false, redeemed_by text, redeemed_at timestamptz,
 delivery text not null default 'queued' check(delivery in ('queued','sending','accepted','failed','unknown','blocked')),
 attempts integer not null default 0, lease_id uuid, lease_until timestamptz,
 first_attempt_at timestamptz, provider_id text, last_dispatch_at timestamptz,
 created_at timestamptz not null default now()
);
create table academy.operations (
 actor text not null, id uuid not null, action text not null, academy_id uuid not null references academy.academies,
 request jsonb not null, result jsonb not null, created_at timestamptz not null default now(), primary key(actor,id)
);
create table academy.audit_events (
 id bigint generated always as identity primary key, actor text not null, academy_id uuid references academy.academies,
 action text not null, operation_id uuid not null, details jsonb not null default '{}', created_at timestamptz not null default now()
);
-- Operator-only grants/revocations have an inseparable audit entry; never delete grant history.
create function academy.audit_platform_grant() returns trigger language plpgsql security invoker set search_path='' as $$
declare operator text:=current_setting('academy.operator_subject',true);begin
 if tg_op='DELETE' then raise exception 'Revoke grants; preserve history' using errcode='42501';end if;
 if coalesce(length(trim(operator)),0) not between 1 and 160 or coalesce(length(trim(new.reason)),0)=0 then raise exception 'Named operator and reason required' using errcode='22023';end if;
 insert into academy.audit_events(actor,action,operation_id,details) values(operator,case when new.active then 'platform.grant' else 'platform.revoke' end,gen_random_uuid(),jsonb_build_object('subject',new.subject,'active',new.active,'reason',new.reason));
 return new;
end $$;
create trigger audit_platform_grant after insert or update or delete on academy.platform_grants for each row execute function academy.audit_platform_grant();

-- Private tables remain inaccessible through the Data API, including secret and delivery records.
do $$ declare t text; begin
 foreach t in array array['m1_secrets','platform_grants','branches','sports','initial_setup','owner_invitations','operations','audit_events'] loop
 execute format('alter table academy.%I enable row level security',t);
 execute format('revoke all on academy.%I from public, anon, authenticated',t);
 end loop;
end $$;
create index operations_academy_idx on academy.operations(academy_id,created_at);
create index invitations_queue_idx on academy.owner_invitations(delivery,lease_until) where redeemed_at is null;

create function academy.m1_platform() returns text language plpgsql security invoker set search_path='' as $$
declare s text:=academy.verified_subject(); begin
 perform 1 from academy.platform_grants where subject=s and active for share;
 if not found then raise exception 'Access denied' using errcode='42501'; end if; return s;
end $$;
create function academy.m1_owner(a uuid) returns text language plpgsql security invoker set search_path='' as $$
declare s text:=academy.verified_subject(); begin
 perform 1 from academy.memberships m join academy.identities i on i.id=m.identity_id
 where m.academy_id=a and i.clerk_subject=s and m.role='owner' and m.status='active' for share of m;
 if not found then raise exception 'Access denied' using errcode='42501'; end if; return s;
end $$;
-- Server attestation is narrowly scoped: current Clerk-verified recipient or delivery worker only.
-- Signature message is constructed identically by the server; no client email is trusted.
create function academy.m1_proof(p jsonb, purpose text, target text) returns text language plpgsql security invoker set search_path='' as $$
declare secret text; msg text; subject text:=p->>'subject'; stamp bigint; expected text; begin
 if target is null or purpose is null or p is null or p->>'signature' is null or p->>'signature' !~ '^[a-f0-9]{64}$' then raise exception 'Invalid proof' using errcode='42501';end if;
 if p->>'purpose' is distinct from purpose or p->>'target' is distinct from target then raise exception 'Invalid proof' using errcode='42501'; end if;
 stamp:=(p->>'issued')::bigint;
 if stamp is null or stamp<extract(epoch from clock_timestamp())-30 or stamp>extract(epoch from clock_timestamp())+5 then raise exception 'Expired proof' using errcode='42501'; end if;
 if subject is null or subject !~ '^user_[a-zA-Z0-9_]+$' then raise exception 'Invalid proof' using errcode='42501'; end if;
 select s.secret into secret from academy.m1_secrets s where s.purpose='onboarding';
 msg:=purpose||E'\n'||target||E'\n'||subject||E'\n'||stamp::text||E'\n'||coalesce(p->>'emails','');
 expected:=encode(extensions.hmac(msg,secret,'sha256'),'hex');
 if secret is null or expected is null or p->>'signature' is distinct from expected then raise exception 'Invalid proof' using errcode='42501'; end if;
 return subject;
exception when invalid_text_representation or numeric_value_out_of_range then raise exception 'Invalid proof' using errcode='42501';
end $$;
create function academy.m1_replay(s text, op uuid, act text, payload jsonb) returns jsonb language plpgsql security invoker set search_path='' as $$
declare r academy.operations; begin
 if op is null then raise exception 'Operation required' using errcode='22023'; end if;
 perform pg_advisory_xact_lock(hashtextextended(s||op::text,0));
 select * into r from academy.operations where actor=s and id=op;
 if found then
 if r.action<>act or r.request<>payload then raise exception 'Operation payload conflict' using errcode='23505'; end if;
 return r.result; end if; return null;
end $$;
create function academy.m1_receipt(s text, op uuid, act text, a uuid, payload jsonb, result jsonb) returns jsonb language plpgsql security invoker set search_path='' as $$ begin
 insert into academy.operations values(s,op,act,a,payload,result,now());
 insert into academy.audit_events(actor,academy_id,action,operation_id,details) values(s,a,act,op,jsonb_strip_nulls(jsonb_build_object('result_version',result->'version','generation',result->'generation','branch_id',result->'branch'->'id','sport_id',result->'sport'->'id','complete',result->'complete')));
 return result;
end $$;

create function public.m1_context_v1(after_id uuid default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare s text:=academy.verified_subject(); items jsonb; more boolean; begin
 perform public.bootstrap_identity_v1();
 select coalesce(jsonb_agg(to_jsonb(x)),'[]') into items from (
 select m.id membership_id,m.academy_id,a.name academy_name,m.role from academy.memberships m
 join academy.identities i on i.id=m.identity_id join academy.academies a on a.id=m.academy_id
 where i.clerk_subject=s and m.status='active' and (after_id is null or m.id>after_id) order by m.id limit 26) x;
 more:=jsonb_array_length(items)>25;
 if more then items:=items-25; end if;
 return jsonb_build_object('platform',exists(select from academy.platform_grants where subject=s and active),'memberships',items,'more',more);
end $$;
create function public.m1_platform_list_v1(after_id uuid default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare s text:=academy.m1_platform(); items jsonb; more boolean; begin
 select coalesce(jsonb_agg(to_jsonb(x)),'[]') into items from (
 select a.id,a.name,a.setup_complete,i.id invitation_id,i.generation,i.expires_at,i.revoked,i.redeemed_at,i.delivery,i.attempts
 from academy.academies a join academy.owner_invitations i on i.academy_id=a.id
 where (after_id is null or a.id>after_id) order by a.id limit 26) x;
 more:=jsonb_array_length(items)>25; if more then items:=items-25;end if;
 return jsonb_build_object('items',items,'more',more);
end $$;
create function public.m1_create_v1(op uuid, invitation_id uuid, academy_name text, recipient text, token_hash text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare s text:=academy.m1_platform(); a uuid; r jsonb; payload jsonb:=jsonb_build_array(invitation_id,academy_name,recipient,token_hash);begin
 r:=academy.m1_replay(s,op,'academy.create',payload); if r is not null then return r;end if;
 if length(trim(academy_name)) not between 1 and 160 or recipient !~ '^[A-Za-z0-9.!#$%&''*+/=?^_`{|}~-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' or length(recipient)>254 or recipient<>lower(recipient) or token_hash !~ '^[a-f0-9]{64}$' then raise exception 'Invalid input' using errcode='22023';end if;
 if invitation_id is null or academy_name is null or recipient is null or token_hash is null then raise exception 'Missing input' using errcode='22023';end if;
 insert into academy.academies(name) values(trim(academy_name)) returning id into a;
 insert into academy.initial_setup(academy_id) values(a);
 insert into academy.owner_invitations(id,academy_id,recipient,secret_hash,created_by) values(invitation_id,a,recipient,token_hash,s);
 r:=jsonb_build_object('academy_id',a,'invitation_id',invitation_id,'generation',1,'delivery','queued');
 return academy.m1_receipt(s,op,'academy.create',a,payload,r);
end $$;
create function public.m1_invitation_v1(invitation_id uuid, token text, proof jsonb, accept_op uuid default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare s text:=academy.verified_subject(); inv academy.owner_invitations; identity_id uuid; r jsonb; payload jsonb; a_name text;begin
 if token is null or token !~ '^[a-f0-9]{64}$' then raise exception 'Invitation unavailable' using errcode='42501';end if;
 if academy.m1_proof(proof,'recipient',invitation_id::text||':'||encode(extensions.digest(token,'sha256'),'hex'))<>s then raise exception 'Access denied' using errcode='42501';end if;
 if accept_op is not null then perform pg_advisory_xact_lock(hashtextextended(s||accept_op::text,0));end if;
 select * into inv from academy.owner_invitations where id=invitation_id for update;
 if not found or inv.secret_hash<>encode(extensions.digest(token,'sha256'),'hex') or not coalesce(inv.recipient=any(string_to_array(proof->>'emails',',')),false) then raise exception 'Invitation unavailable' using errcode='42501';end if;
 -- Serialize with grant revocation. Revoked inviters cannot issue fresh access.
 perform 1 from academy.platform_grants where subject=inv.created_by and active for share;
 if not found or inv.revoked then raise exception 'Invitation unavailable' using errcode='42501';end if;
 select name into a_name from academy.academies where id=inv.academy_id for update;
 payload:=jsonb_build_array(invitation_id,inv.generation);
 if inv.redeemed_by is not null then
 if inv.redeemed_by<>s then raise exception 'Invitation unavailable' using errcode='42501';end if;
 perform academy.m1_owner(inv.academy_id);
 if accept_op is not null then r:=academy.m1_replay(s,accept_op,'owner.accept',payload);end if;
 return jsonb_build_object('academy_id',inv.academy_id,'name',a_name,'accepted',true);
 end if;
 if inv.expires_at<=clock_timestamp() then raise exception 'Invitation expired' using errcode='22023';end if;
 if accept_op is null then return jsonb_build_object('academy_id',inv.academy_id,'name',a_name,'accepted',false,'expires_at',inv.expires_at);end if;
 payload:=jsonb_build_array(invitation_id,inv.generation);
 r:=academy.m1_replay(s,accept_op,'owner.accept',payload);if r is not null then return r;end if;
 identity_id:=public.bootstrap_identity_v1();
 insert into academy.memberships(identity_id,academy_id,role,status) values(identity_id,inv.academy_id,'owner','active');
 update academy.owner_invitations set redeemed_by=s,redeemed_at=now() where id=invitation_id;
 r:=jsonb_build_object('academy_id',inv.academy_id,'name',a_name,'accepted',true);
 return academy.m1_receipt(s,accept_op,'owner.accept',inv.academy_id,payload,r);
end $$;
create function public.m1_setup_v1(a uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare s text:=academy.m1_owner(a); r jsonb; begin
 select jsonb_build_object('academy_id',x.id,'name',x.name,'version',x.setup_version,'complete',x.setup_complete,'timezone',x.timezone,
 'branch',case when b.id is null then null else jsonb_build_object('id',b.id,'name',b.name) end,
 'sport',case when p.id is null then null else jsonb_build_object('id',p.id,'label_en',p.label_en,'label_ar',p.label_ar) end)
 into r from academy.academies x join academy.initial_setup z on z.academy_id=x.id
 left join academy.branches b on b.id=z.branch_id and b.academy_id=x.id
 left join academy.sports p on p.id=z.sport_id and p.academy_id=x.id where x.id=a;
 if r is null then raise exception 'Setup unavailable' using errcode='22023';end if;return r;
end $$;
create function public.m1_save_setup_v1(a uuid, op uuid, expected_version integer, step text, fields jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare s text:=academy.m1_owner(a); v integer; z academy.initial_setup; r jsonb; id uuid; payload jsonb:=jsonb_build_array(a,expected_version,step,fields);begin
 r:=academy.m1_replay(s,op,'setup.'||step,payload);if r is not null then return r;end if;
 select setup_version into v from academy.academies where academy.academies.id=a for update;
 if expected_version is distinct from v then raise exception 'Version conflict' using errcode='40001';end if;
 select * into strict z from academy.initial_setup where academy_id=a for update;
 if step is null or step not in ('branch','sport','complete') or fields is null or jsonb_typeof(fields)<>'object' then raise exception 'Invalid step' using errcode='22023';end if;
 if step='branch' then
 if jsonb_typeof(fields->'name') is distinct from 'string' or jsonb_typeof(fields->'timezone') is distinct from 'string' or coalesce(length(trim(fields->>'name')),0) not between 1 and 160 or not exists(select from pg_timezone_names where name=fields->>'timezone') or fields - array['name','timezone'] <> '{}'::jsonb then raise exception 'Invalid branch' using errcode='22023';end if;
 if z.branch_id is null then insert into academy.branches(academy_id,name) values(a,trim(fields->>'name')) returning academy.branches.id into id;update academy.initial_setup set branch_id=id where academy_id=a;
 else update academy.branches set name=trim(fields->>'name') where academy.branches.id=z.branch_id and academy_id=a;end if;
 update academy.academies set timezone=fields->>'timezone',setup_complete=false where academy.academies.id=a;
 elsif step='sport' then
 if jsonb_typeof(fields->'label_en') is distinct from 'string' or jsonb_typeof(fields->'label_ar') is distinct from 'string' or coalesce(length(trim(fields->>'label_en')),0) not between 1 and 160 or coalesce(length(trim(fields->>'label_ar')),0) not between 1 and 160 or fields-array['label_en','label_ar']<>'{}'::jsonb then raise exception 'Invalid sport' using errcode='22023';end if;
 if z.sport_id is null then insert into academy.sports(academy_id,label_en,label_ar) values(a,trim(fields->>'label_en'),trim(fields->>'label_ar')) returning academy.sports.id into id;update academy.initial_setup set sport_id=id where academy_id=a;
 else update academy.sports set label_en=trim(fields->>'label_en'),label_ar=trim(fields->>'label_ar') where academy.sports.id=z.sport_id and academy_id=a;end if;
 update academy.academies set setup_complete=false where academy.academies.id=a;
 else
 if fields<>'{}'::jsonb or z.branch_id is null or z.sport_id is null or not exists(select from academy.academies where academy.academies.id=a and timezone is not null) then raise exception 'Setup incomplete' using errcode='22023';end if;
 update academy.academies set setup_complete=true where academy.academies.id=a;
 end if;
 update academy.academies set setup_version=setup_version+1 where academy.academies.id=a;
 r:=public.m1_setup_v1(a); return academy.m1_receipt(s,op,'setup.'||step,a,payload,r);
end $$;
create function public.m1_operation_v1(op uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare s text:=academy.verified_subject(); r academy.operations;begin
 perform pg_advisory_xact_lock(hashtextextended(s||op::text,0));
 select * into r from academy.operations where actor=s and id=op;
 if not found then return jsonb_build_object('found',false);end if;
 if r.action='academy.create' or r.action like 'invitation.%' then perform academy.m1_platform();else perform academy.m1_owner(r.academy_id);end if;
 return jsonb_build_object('found',true,'result',r.result);
end $$;
create function public.m1_manage_invitation_v1(invitation_id uuid, op uuid, expected_generation integer, act text, token_hash text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare s text:=academy.m1_platform(); inv academy.owner_invitations;r jsonb;payload jsonb:=jsonb_build_array(invitation_id,expected_generation,act,token_hash);begin
 r:=academy.m1_replay(s,op,'invitation.'||act,payload);if r is not null then return r;end if;
 select * into inv from academy.owner_invitations where id=invitation_id for update;
 if not found or inv.redeemed_by is not null then raise exception 'Invitation unavailable' using errcode='22023';end if;
 if expected_generation is distinct from inv.generation then raise exception 'Version conflict' using errcode='40001';end if;
 if act='revoke' then update academy.owner_invitations set revoked=true where id=invitation_id;
 elsif act='reissue' then
 if token_hash is null or token_hash !~ '^[a-f0-9]{64}$' then raise exception 'Invalid secret hash' using errcode='22023';end if;
 update academy.owner_invitations set secret_hash=token_hash,generation=generation+1,expires_at=now()+interval '72 hours',revoked=false,delivery='queued',attempts=0,first_attempt_at=null,lease_id=null,lease_until=null,provider_id=null,last_dispatch_at=null,created_by=s where id=invitation_id;
 elsif act='retry' then
 if inv.revoked or inv.expires_at<=now() or inv.attempts>=5 or (inv.lease_until>now()) or inv.delivery in ('accepted','unknown') or (inv.last_dispatch_at>now()-interval '12 minutes') then raise exception 'Retry unavailable' using errcode='22023';end if;
 update academy.owner_invitations set delivery='queued' where id=invitation_id;
 else raise exception 'Invalid action' using errcode='22023';end if;
 r:=jsonb_build_object('academy_id',inv.academy_id,'invitation_id',invitation_id,'generation',inv.generation+case when act='reissue' then 1 else 0 end);
 return academy.m1_receipt(s,op,'invitation.'||act,inv.academy_id,payload,r);
end $$;
-- Worker calls are proof-authenticated, with no arbitrary table/destination authority.
create function public.m1_delivery_v1(invitation_id uuid, generation integer, proof jsonb, lease uuid default null, outcome text default null, provider text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare s text; inv academy.owner_invitations; claim uuid;begin
 s:=academy.m1_proof(proof,'delivery',invitation_id::text||':'||generation::text||':'||coalesce(lease::text,'claim')||':'||coalesce(outcome,''));
 select * into inv from academy.owner_invitations where id=invitation_id for update;
 if not found or inv.generation<>generation or inv.revoked or inv.redeemed_at is not null or inv.expires_at<=now() then return jsonb_build_object('send',false);end if;
 perform 1 from academy.platform_grants where subject=inv.created_by and active for share;
 if not found then return jsonb_build_object('send',false);end if;
 if lease is not null then
 if inv.lease_id is distinct from lease or inv.lease_until is null or inv.lease_until<=now() then raise exception 'Lease unavailable' using errcode='42501';end if;
 if outcome not in ('accepted','failed','unknown','blocked') or outcome is null or length(coalesce(provider,''))>160 then raise exception 'Invalid outcome' using errcode='22023';end if;
 update academy.owner_invitations set delivery=outcome,provider_id=case when outcome='accepted' then provider else null end,lease_until=null where id=invitation_id;
 insert into academy.audit_events(actor,academy_id,action,operation_id,details) values('delivery-worker',inv.academy_id,'invitation.delivery',lease,jsonb_build_object('outcome',outcome));
 return jsonb_build_object('send',false);
 end if;
 if inv.delivery in ('accepted','unknown','blocked') or inv.attempts>=5 then return jsonb_build_object('send',false);end if;
 if inv.lease_until>now() then return jsonb_build_object('send',false,'retry',true);end if;
 if inv.first_attempt_at<now()-interval '23 hours' then update academy.owner_invitations set delivery='unknown' where id=invitation_id;return jsonb_build_object('send',false);end if;
 claim:=gen_random_uuid();update academy.owner_invitations set delivery='sending',attempts=attempts+1,lease_id=claim,lease_until=now()+interval '2 minutes',first_attempt_at=coalesce(first_attempt_at,now()),last_dispatch_at=now() where id=invitation_id;
 return jsonb_build_object('send',true,'lease',claim,'recipient',inv.recipient,'generation',inv.generation,'expires_at',inv.expires_at);
end $$;
-- Revoke default EXECUTE from private helpers and every new exposed function.
revoke all on all functions in schema academy from public,anon,authenticated;
do $$ declare f record;begin
 for f in select p.oid::regprocedure sig from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'm1_%' loop
 execute format('revoke all on function %s from public,anon,authenticated',f.sig);
 execute format('grant execute on function %s to authenticated',f.sig);
 execute format('alter function %s set statement_timeout = %L',f.sig,'3s');
 execute format('alter function %s set lock_timeout = %L',f.sig,'2s');
 end loop;
end $$;
grant execute on function public.m1_delivery_v1(uuid,integer,jsonb,uuid,text,text) to anon;
