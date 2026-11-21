-- I2c: narrow synthetic appointments. No accounts, memberships or recipients seeded.
create table academy.trainer_people (
 id uuid primary key default gen_random_uuid(), academy_id uuid not null references academy.academies,
 display_name text not null check(length(trim(display_name)) between 1 and 160),
 identity_id uuid references academy.identities, membership_id uuid references academy.memberships,
 unique(academy_id,identity_id), unique(id,academy_id)
);
create table academy.trainer_invitations (
 id uuid primary key, academy_id uuid not null references academy.academies, staff_id uuid not null unique,
 branch_id uuid not null, recipient text not null check(length(recipient) between 3 and 254), approved_by text not null,
 token_hash text not null check(token_hash ~ '^[a-f0-9]{64}$'),
 state text not null default 'pending' check(state in ('pending','accepted','revoked')),
 version integer not null default 1 check(version>0), expires_at timestamptz not null default now()+interval '72 hours',
 accepted_by text, revoke_reason text, created_at timestamptz not null default now(),
 delivery text not null default 'queued' check(delivery in ('queued','sending','accepted','failed','unknown','blocked')),
 attempts integer not null default 0, lease_id uuid, lease_until timestamptz, first_attempt_at timestamptz, provider_id text,
 foreign key(staff_id,academy_id) references academy.trainer_people(id,academy_id),
 foreign key(branch_id,academy_id) references academy.branches(id,academy_id), unique(academy_id,recipient)
);
create index trainer_invites_owner_cursor on academy.trainer_invitations(academy_id,id);
create index trainer_invites_branch on academy.trainer_invitations(branch_id);
create table academy.trainer_assignments (
 id uuid primary key default gen_random_uuid(), invitation_id uuid not null unique references academy.trainer_invitations,
 academy_id uuid not null references academy.academies, staff_id uuid not null, branch_id uuid not null,
 state text not null default 'active' check(state in ('active','ended')), end_reason text, ended_at timestamptz,
 foreign key(staff_id,academy_id) references academy.trainer_people(id,academy_id),
 foreign key(branch_id,academy_id) references academy.branches(id,academy_id)
);
create index trainer_assignments_staff on academy.trainer_assignments(academy_id,staff_id);
create index trainer_assignments_branch on academy.trainer_assignments(branch_id);
create index trainer_people_identity on academy.trainer_people(identity_id);
create index trainer_people_membership on academy.trainer_people(membership_id);
create table academy.trainer_operations (
 actor text not null, id uuid not null, academy_id uuid not null references academy.academies,
 invitation_id uuid, fingerprint text, result jsonb not null, created_at timestamptz not null default now(), primary key(actor,id)
);
create index trainer_operations_academy on academy.trainer_operations(academy_id);
do $$ declare t text; begin foreach t in array array['trainer_people','trainer_invitations','trainer_assignments','trainer_operations'] loop
 execute format('alter table academy.%I enable row level security',t);
 execute format('revoke all on academy.%I from public,anon,authenticated',t); end loop; end $$;
-- All trainer lifecycle calls acquire this lock before membership/operation locks.
-- Bounded per-academy serialization prevents revoke/accept/read races; no global lock.
create function academy.t4_lock(a uuid) returns void language sql volatile security invoker set search_path='' as $$
 select pg_advisory_xact_lock(hashtextextended('trainer-scope:'||a::text,0))
$$;
create function academy.t4_approver(a uuid, subject text) returns void language plpgsql security invoker set search_path='' as $$
begin
 perform 1 from academy.memberships m join academy.identities i on i.id=m.identity_id
 where m.academy_id=a and i.clerk_subject=subject and m.role='owner' and m.status='active' for share of m;
 if not found then raise exception 'Access denied' using errcode='42501';end if;
end $$;
create function academy.t4_trainer(a uuid) returns uuid language plpgsql security invoker set search_path='' as $$
declare s text:=academy.verified_subject();g uuid;begin
 select p.id into g from academy.trainer_people p join academy.identities i on i.id=p.identity_id
 join academy.memberships m on m.id=p.membership_id and m.identity_id=i.id and m.academy_id=p.academy_id
 join academy.trainer_assignments z on z.staff_id=p.id and z.academy_id=p.academy_id and z.state='active'
 where p.academy_id=a and i.clerk_subject=s and m.role='trainer' and m.status='active' for share of m;
 if g is null then raise exception 'Access denied' using errcode='42501';end if;return g;
end $$;
create function public.t4_owner_list_v1(a uuid, after_id uuid default null, inspect_id uuid default null) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s' as $$
declare s text;items jsonb;more boolean;r jsonb;begin
 perform academy.t4_lock(a);s:=academy.i2_owner(a);
 select jsonb_build_object('branch_id',b.id,'branch_name',b.name) into r from academy.initial_setup z join academy.branches b on b.id=z.branch_id and b.academy_id=z.academy_id where z.academy_id=a;
 select coalesce(jsonb_agg(to_jsonb(x)),'[]') into items from (
 select v.id,v.version,p.display_name,b.name branch_name,'trainer'::text role,
 case when v.state='pending' and v.expires_at<=now() then 'expired' when z.state='ended' then 'ended' else v.state end state,
 case when inspect_id=v.id then v.recipient else left(v.recipient,1)||'***@'||split_part(v.recipient,'@',2) end recipient,
 v.delivery,v.expires_at from academy.trainer_invitations v join academy.trainer_people p on p.id=v.staff_id
 join academy.branches b on b.id=v.branch_id left join academy.trainer_assignments z on z.invitation_id=v.id
 where v.academy_id=a and (after_id is null or v.id>after_id) and (inspect_id is null or v.id=inspect_id) order by v.id limit 26) x;
 if inspect_id is not null and jsonb_array_length(items)=0 then raise exception 'Access denied' using errcode='42501';end if;
 more:=jsonb_array_length(items)>25;if more then items:=items-25;end if;
 return jsonb_build_object('branch',r,'items',items,'more',more);
end $$;
create function public.t4_command_v1(a uuid, op uuid, act text, invitation uuid, branch uuid default null, display_name text default null, recipient text default null, token_hash text default null, expected_version integer default null, reason text default null) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s' as $$
declare s text;fp text;old academy.trainer_operations;v academy.trainer_invitations;staff uuid;r jsonb;begin
 perform academy.t4_lock(a);s:=academy.i2_owner(a);
 if op is null or invitation is null or act is null or act not in ('appoint','revoke','end','retry') then raise exception 'Invalid command' using errcode='22023';end if;
 recipient:=lower(trim(recipient));reason:=trim(reason);display_name:=trim(regexp_replace(display_name,'[[:space:]]+',' ','g'));
 fp:=encode(extensions.digest(jsonb_build_array(act,a,invitation,branch,display_name,recipient,token_hash,expected_version,reason)::text,'sha256'),'hex');
 perform pg_advisory_xact_lock(hashtextextended('trainer-op:'||s||op::text,0));
 select * into old from academy.trainer_operations where actor=s and id=op;
 if found then
 if old.academy_id<>a or old.fingerprint is distinct from fp then raise exception 'Operation conflict' using errcode='23505';end if;
 return old.result;end if;
 if act='appoint' then
 if branch is null or display_name is null or length(display_name) not between 1 and 160 or recipient is null or length(recipient)>254 or recipient !~ '^[^[:space:],@]+@[^[:space:],@]+\.[^[:space:],@]+$' or token_hash is null or token_hash !~ '^[a-f0-9]{64}$' then raise exception 'Invalid appointment' using errcode='22023';end if;
 perform 1 from academy.initial_setup where academy_id=a and branch_id=branch;
 if not found then raise exception 'Access denied' using errcode='42501';end if;
 -- All historical same-email appointments require deliberate inspection; no implicit restoration.
 perform 1 from academy.trainer_invitations ti where ti.academy_id=a and ti.recipient=t4_command_v1.recipient;
 if found then raise exception 'Existing appointment' using errcode='23505';end if;
 insert into academy.trainer_people(academy_id,display_name) values(a,display_name) returning id into staff;
 insert into academy.trainer_invitations(id,academy_id,staff_id,branch_id,recipient,approved_by,token_hash) values(invitation,a,staff,branch,recipient,s,token_hash);
 r:=jsonb_build_object('invitation_id',invitation,'version',1,'state','pending');
 else
 select * into v from academy.trainer_invitations where id=invitation and academy_id=a for update;
 if not found then raise exception 'Access denied' using errcode='42501';end if;
 if expected_version is distinct from v.version then raise exception 'Stale appointment' using errcode='PT409';end if;
 if act in ('end','revoke') then
 if reason is null or length(reason) not between 1 and 240 then raise exception 'Reason required' using errcode='22023';end if;
 if act='revoke' then
 if v.state<>'pending' then raise exception 'Stale appointment' using errcode='PT409';end if;
 update academy.trainer_invitations set state='revoked',revoke_reason=reason,version=version+1 where id=invitation;
 else
 update academy.trainer_assignments set state='ended',end_reason=reason,ended_at=now() where invitation_id=invitation and state='active';
 if not found then raise exception 'Stale appointment' using errcode='PT409';end if;
 update academy.memberships m set status='ended' from academy.trainer_people p where p.id=v.staff_id and p.academy_id=a and m.id=p.membership_id and m.academy_id=a and m.role='trainer';
 if not found then raise exception 'Access denied' using errcode='42501';end if;
 update academy.trainer_invitations set version=version+1 where id=invitation;
 end if;
 else
 if v.state<>'pending' or v.expires_at<=now() or v.delivery not in ('queued','failed') or v.attempts>=5 or v.lease_until>now() then raise exception 'Delivery unavailable' using errcode='PT409';end if;
 end if;
 r:=jsonb_build_object('invitation_id',invitation,'version',v.version+case when act='retry' then 0 else 1 end,'state',case act when 'revoke' then 'revoked' when 'end' then 'ended' else 'pending' end);
 end if;
 insert into academy.trainer_operations(actor,id,academy_id,invitation_id,fingerprint,result) values(s,op,a,invitation,fp,r);
 insert into academy.audit_events(actor,academy_id,action,operation_id,details) values(s,a,'trainer.'||act,op,r||case when act='appoint' then '{"basis":"synthetic-owner-confirmation"}'::jsonb else '{}'::jsonb end);

 return r;
end $$;
create function public.t4_operation_v1(a uuid,op uuid) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s' as $$
declare s text;old academy.trainer_operations;begin
 perform academy.t4_lock(a);s:=academy.i2_owner(a);
 if op is null then raise exception 'Operation required' using errcode='22023';end if;
 perform pg_advisory_xact_lock(hashtextextended('trainer-op:'||s||op::text,0));
 select * into old from academy.trainer_operations where actor=s and id=op;
 if found then if old.academy_id<>a then raise exception 'Access denied' using errcode='42501';end if;return old.result;end if;
 insert into academy.trainer_operations(actor,id,academy_id,result) values(s,op,a,'{"cancelled":true}');
 insert into academy.audit_events(actor,academy_id,action,operation_id) values(s,a,'trainer.reconcile_cancel',op);
 return '{"cancelled":true}';
end $$;
create function public.t4_invitation_v1(invitation uuid,token text,proof jsonb,act text default 'review',op uuid default null) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s' as $$
declare s text:=academy.verified_subject();v academy.trainer_invitations;who uuid;m academy.memberships;g uuid;l uuid;fp text;old academy.trainer_operations;r jsonb;begin
 if invitation is null or token is null or token !~ '^[a-f0-9]{64}$' or act is null or act not in ('review','accept','reconcile') or (act<>'review' and op is null) then raise exception 'Invalid invitation' using errcode='22023';end if;
 if academy.m1_proof(proof,'recipient',invitation::text||':'||encode(extensions.digest(token,'sha256'),'hex')) is distinct from s then raise exception 'Access denied' using errcode='42501';end if;
 select academy_id into who from academy.trainer_invitations where id=invitation;
 if who is null then raise exception 'Access denied' using errcode='42501';end if;perform academy.t4_lock(who);
 select * into v from academy.trainer_invitations where id=invitation for update;
 if v.token_hash is distinct from encode(extensions.digest(token,'sha256'),'hex') or not(v.recipient=any(string_to_array(proof->>'emails',','))) or v.state='revoked' then raise exception 'Access denied' using errcode='42501';end if;
 if v.state='pending' then
 if v.expires_at<=now() then raise exception 'Access denied' using errcode='42501';end if;
 perform academy.t4_approver(v.academy_id,v.approved_by);
 else
 if v.accepted_by is distinct from s then raise exception 'Access denied' using errcode='42501';end if;
 g:=academy.t4_trainer(v.academy_id);
 perform 1 from academy.trainer_assignments where invitation_id=v.id and staff_id=g and branch_id=v.branch_id and state='active';
 if not found then raise exception 'Access denied' using errcode='42501';end if;
 end if;
 if act='review' then
 select jsonb_build_object('display_name',p.display_name,'role','trainer','branch_name',b.name,'academy_id',v.academy_id,'state',v.state,'expires_at',v.expires_at) into r from academy.trainer_people p join academy.branches b on b.id=v.branch_id where p.id=v.staff_id and p.academy_id=v.academy_id;
 return r;end if;
 perform pg_advisory_xact_lock(hashtextextended('trainer-op:'||s||op::text,0));
 fp:=encode(extensions.digest(jsonb_build_array('accept',invitation)::text,'sha256'),'hex');
 select * into old from academy.trainer_operations where actor=s and id=op;
 if found then
 if old.academy_id<>v.academy_id or old.invitation_id is distinct from invitation or (act='accept' and old.fingerprint is distinct from fp) then raise exception 'Operation conflict' using errcode='23505';end if;
 return old.result;end if;
 if act='reconcile' then
 insert into academy.trainer_operations(actor,id,academy_id,invitation_id,result) values(s,op,v.academy_id,invitation,'{"cancelled":true}');
 insert into academy.audit_events(actor,academy_id,action,operation_id) values(s,v.academy_id,'trainer.accept_cancel',op);return '{"cancelled":true}';end if;
 if v.state<>'pending' then raise exception 'Already accepted' using errcode='PT409';end if;
 insert into academy.identities(clerk_subject) values(s) on conflict(clerk_subject) do nothing;
 select id into who from academy.identities where clerk_subject=s;
 -- Never reuse/reactivate an existing Trainer membership, regardless of its status.
 perform 1 from academy.memberships where identity_id=who and academy_id=v.academy_id and role='trainer' for update;
 if found then raise exception 'Access denied' using errcode='42501';end if;
 insert into academy.memberships(identity_id,academy_id,role,status) values(who,v.academy_id,'trainer','active') returning * into m;
 update academy.trainer_people set identity_id=who,membership_id=m.id where id=v.staff_id and academy_id=v.academy_id and identity_id is null;
 if not found then raise exception 'Access denied' using errcode='42501';end if;
 insert into academy.trainer_assignments(invitation_id,academy_id,staff_id,branch_id) values(v.id,v.academy_id,v.staff_id,v.branch_id) returning id into l;
 update academy.trainer_invitations set state='accepted',accepted_by=s,version=version+1 where id=v.id;
 r:=jsonb_build_object('academy_id',v.academy_id,'staff_id',v.staff_id,'accepted',true);
 insert into academy.trainer_operations(actor,id,academy_id,invitation_id,fingerprint,result) values(s,op,v.academy_id,invitation,fp,r);
 insert into academy.audit_events(actor,academy_id,action,operation_id,details) values(s,v.academy_id,'trainer.accept',op,jsonb_build_object('staff_id',v.staff_id));return r;
end $$;
create function public.t4_profile_v1(a uuid) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s' as $$
declare g uuid;r jsonb;begin
 perform academy.t4_lock(a);g:=academy.t4_trainer(a);
 select jsonb_build_object('display_name',p.display_name,'role','trainer','branch_name',b.name) into r
 from academy.trainer_people p join academy.trainer_assignments z on z.staff_id=p.id and z.academy_id=p.academy_id and z.state='active'
 join academy.branches b on b.id=z.branch_id and b.academy_id=z.academy_id where p.id=g and p.academy_id=a;
 if r is null then raise exception 'Access denied' using errcode='42501';end if;return r;
end $$;
create function public.t4_delivery_v1(invitation uuid,proof jsonb,lease uuid default null,outcome text default null,provider text default null) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s' as $$
declare a uuid;v academy.trainer_invitations;claim uuid;begin
 if academy.m1_proof(proof,'delivery','trainer:'||invitation::text||':1:'||coalesce(lease::text,'claim')||':'||coalesce(outcome,''))<>'user_delivery_worker' then raise exception 'Access denied' using errcode='42501';end if;
 select academy_id into a from academy.trainer_invitations where id=invitation;if a is null then return '{"send":false}';end if;
 perform academy.t4_lock(a);select * into v from academy.trainer_invitations where id=invitation for update;
 if v.state<>'pending' or v.expires_at<=now() then return '{"send":false}';end if;
 perform academy.t4_approver(a,v.approved_by);
 if lease is not null then
 if v.lease_id is distinct from lease or v.lease_until is null or v.lease_until<=now() then raise exception 'Lease unavailable' using errcode='42501';end if;
 if outcome is null or outcome not in ('accepted','failed','unknown','blocked') or length(coalesce(provider,''))>160 then raise exception 'Invalid outcome' using errcode='22023';end if;
 update academy.trainer_invitations set delivery=outcome,provider_id=case when outcome='accepted' then provider else null end,lease_until=null where id=invitation;
 insert into academy.audit_events(actor,academy_id,action,operation_id,details) values('delivery-worker',a,'trainer.delivery',lease,jsonb_build_object('outcome',outcome));return '{"send":false}';end if;
 if v.delivery in ('accepted','unknown','blocked') or v.attempts>=5 then return '{"send":false}';end if;
 if v.lease_until>now() then return '{"send":false,"retry":true}';end if;
 if v.first_attempt_at<now()-interval '23 hours' then update academy.trainer_invitations set delivery='unknown' where id=invitation;return '{"send":false}';end if;
 claim:=gen_random_uuid();update academy.trainer_invitations set delivery='sending',attempts=attempts+1,lease_id=claim,lease_until=now()+interval '2 minutes',first_attempt_at=coalesce(first_attempt_at,now()) where id=invitation;
 return jsonb_build_object('send',true,'lease',claim,'recipient',v.recipient);
end $$;

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
 if method is distinct from 'POST' or path is null or path !~ '^/rpc/(m1_context_v1|m1_platform_list_v1|m1_setup_v1|m1_operation_v1|m1_create_v1|m1_save_setup_v1|m1_manage_invitation_v1|m1_invitation_v1|bootstrap_identity_v1|my_academy_memberships_v1|i2_people_v1|i2_candidates_v1|i2_profile_v1|i2_register_v1|i2_operation_v1|g3_owner_list_v1|g3_command_v1|g3_operation_v1|g3_invitation_v1|g3_links_v1|t4_owner_list_v1|t4_command_v1|t4_operation_v1|t4_invitation_v1|t4_profile_v1)$' then
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

revoke all on function academy.t4_lock(uuid),academy.t4_approver(uuid,text),academy.t4_trainer(uuid) from public,anon,authenticated;
do $$ declare f record;begin
 for f in select p.oid::regprocedure sig,p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 't4_%' loop
 execute format('revoke all on function %s from public,anon,authenticated',f.sig);
 if f.proname='t4_delivery_v1' then execute format('grant execute on function %s to anon',f.sig);
 else execute format('grant execute on function %s to authenticated',f.sig);end if;
 end loop;
end $$;
