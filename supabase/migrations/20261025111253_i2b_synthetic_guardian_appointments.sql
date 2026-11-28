-- I2b: narrow synthetic appointments. No accounts, memberships or recipients seeded.
create table academy.guardian_people (
 id uuid primary key default gen_random_uuid(), academy_id uuid not null references academy.academies,
 identity_id uuid not null references academy.identities, membership_id uuid not null references academy.memberships,
 unique(academy_id,identity_id), unique(id,academy_id)
);
create table academy.guardian_invitations (
 id uuid primary key, academy_id uuid not null references academy.academies, player_id uuid not null references academy.players,
 recipient text not null check(length(recipient) between 3 and 254), approved_by text not null,
 token_hash text not null check(token_hash ~ '^[a-f0-9]{64}$'),
 state text not null default 'pending' check(state in ('pending','accepted','revoked')),
 version integer not null default 1 check(version>0), expires_at timestamptz not null default now()+interval '72 hours',
 accepted_by text, revoke_reason text, created_at timestamptz not null default now(),
 delivery text not null default 'queued' check(delivery in ('queued','sending','accepted','failed','unknown','blocked')),
 attempts integer not null default 0, lease_id uuid, lease_until timestamptz, first_attempt_at timestamptz, provider_id text
);
create index guardian_invites_owner_cursor on academy.guardian_invitations(academy_id,player_id,id);
create index guardian_invites_player on academy.guardian_invitations(player_id);
create table academy.guardian_links (
 id uuid primary key default gen_random_uuid(), invitation_id uuid not null unique references academy.guardian_invitations,
 academy_id uuid not null references academy.academies, guardian_id uuid not null, player_id uuid not null references academy.players,
 state text not null default 'active' check(state in ('active','ended')), end_reason text, ended_at timestamptz,
 foreign key(guardian_id,academy_id) references academy.guardian_people(id,academy_id)
);
create unique index guardian_links_one_active on academy.guardian_links(academy_id,guardian_id,player_id) where state='active';
create index guardian_links_player on academy.guardian_links(player_id);
create index guardian_links_cursor on academy.guardian_links(academy_id,guardian_id,id);
create index guardian_people_identity on academy.guardian_people(identity_id);
create index guardian_people_membership on academy.guardian_people(membership_id);
create table academy.guardian_operations (
 actor text not null, id uuid not null, academy_id uuid not null references academy.academies,
 invitation_id uuid, fingerprint text, result jsonb not null, created_at timestamptz not null default now(), primary key(actor,id)
);
create index guardian_operations_academy on academy.guardian_operations(academy_id);
do $$ declare t text; begin foreach t in array array['guardian_people','guardian_invitations','guardian_links','guardian_operations'] loop
 execute format('alter table academy.%I enable row level security',t);
 execute format('revoke all on academy.%I from public,anon,authenticated',t); end loop; end $$;
-- All guardian lifecycle calls acquire this lock before membership/operation locks.
-- Bounded per-academy serialization prevents revoke/accept/read races; no global lock.
create function academy.g3_lock(a uuid) returns void language sql volatile security invoker set search_path='' as $$
 select pg_advisory_xact_lock(hashtextextended('guardian-scope:'||a::text,0))
$$;
create function academy.g3_approver(a uuid, subject text) returns void language plpgsql security invoker set search_path='' as $$
begin
 perform 1 from academy.memberships m join academy.identities i on i.id=m.identity_id
 where m.academy_id=a and i.clerk_subject=subject and m.role='owner' and m.status='active' for share of m;
 if not found then raise exception 'Access denied' using errcode='42501';end if;
end $$;
create function academy.g3_guardian(a uuid) returns uuid language plpgsql security invoker set search_path='' as $$
declare s text:=academy.verified_subject();g uuid;begin
 select p.id into g from academy.guardian_people p join academy.identities i on i.id=p.identity_id
 join academy.memberships m on m.id=p.membership_id and m.identity_id=i.id and m.academy_id=p.academy_id
 where p.academy_id=a and i.clerk_subject=s and m.role='guardian' and m.status='active' for share of m;
 if g is null then raise exception 'Access denied' using errcode='42501';end if;return g;
end $$;
create function public.g3_owner_list_v1(a uuid, player uuid, after_id uuid default null, inspect_id uuid default null) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s' as $$
declare s text;items jsonb;more boolean;r jsonb;begin
 perform academy.g3_lock(a);s:=academy.i2_owner(a);
 select jsonb_build_object('id',p.id,'display_name',p.display_name,'branch_name',b.name) into r from academy.players p join academy.branches b on b.id=p.branch_id where p.id=player and p.academy_id=a;
 if r is null then raise exception 'Access denied' using errcode='42501';end if;
 select coalesce(jsonb_agg(to_jsonb(x)),'[]') into items from (
 select v.id,v.version,case when v.state='pending' and v.expires_at<=now() then 'expired' when l.state='ended' then 'ended' else v.state end state,
 case when inspect_id=v.id then v.recipient else left(v.recipient,1)||'***@'||split_part(v.recipient,'@',2) end recipient,
 v.delivery,v.expires_at,l.id link_id from academy.guardian_invitations v left join academy.guardian_links l on l.invitation_id=v.id
 where v.academy_id=a and v.player_id=player and (after_id is null or v.id>after_id) and (inspect_id is null or v.id=inspect_id) order by v.id limit 26) x;
 more:=jsonb_array_length(items)>25;if more then items:=items-25;end if;
 return jsonb_build_object('player',r,'items',items,'more',more);
end $$;
create function public.g3_command_v1(a uuid, op uuid, act text, invitation uuid, player uuid default null, recipient text default null, token_hash text default null, expected_version integer default null, reason text default null) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s' as $$
declare s text;fp text;old academy.guardian_operations;v academy.guardian_invitations;r jsonb;begin
 perform academy.g3_lock(a);s:=academy.i2_owner(a);
 if op is null or invitation is null or act is null or act not in ('appoint','revoke','end','retry') then raise exception 'Invalid command' using errcode='22023';end if;
 recipient:=lower(trim(recipient));reason:=trim(reason);
 fp:=encode(extensions.digest(jsonb_build_array(act,a,invitation,player,recipient,token_hash,expected_version,reason)::text,'sha256'),'hex');
 perform pg_advisory_xact_lock(hashtextextended('guardian-op:'||s||op::text,0));
 select * into old from academy.guardian_operations where actor=s and id=op;
 if found then
 if old.academy_id<>a or old.fingerprint is distinct from fp then raise exception 'Operation conflict' using errcode='23505';end if;
 return old.result;end if;
 if act='appoint' then
 if player is null or recipient is null or length(recipient)>254 or recipient !~ '^[^[:space:],@]+@[^[:space:],@]+\.[^[:space:],@]+$' or token_hash is null or token_hash !~ '^[a-f0-9]{64}$' then raise exception 'Invalid appointment' using errcode='22023';end if;
 perform 1 from academy.players p where p.id=player and p.academy_id=a;
 if not found then raise exception 'Access denied' using errcode='42501';end if;
 -- Pending duplicates require inspection/revocation; never mint parallel authority.
 perform 1 from academy.guardian_invitations gi left join academy.guardian_links gl on gl.invitation_id=gi.id where gi.academy_id=a and gi.player_id=player and gi.recipient=g3_command_v1.recipient and ((gi.state='pending' and gi.expires_at>now()) or (gi.state='accepted' and gl.state='active'));
 if found then raise exception 'Existing appointment' using errcode='23505';end if;
 insert into academy.guardian_invitations(id,academy_id,player_id,recipient,approved_by,token_hash) values(invitation,a,player,recipient,s,token_hash);
 r:=jsonb_build_object('invitation_id',invitation,'version',1,'state','pending');
 else
 select * into v from academy.guardian_invitations where id=invitation and academy_id=a for update;
 if not found then raise exception 'Access denied' using errcode='42501';end if;
 if expected_version is distinct from v.version then raise exception 'Stale appointment' using errcode='PT409';end if;
 if act in ('end','revoke') then
 if reason is null or length(reason) not between 1 and 240 then raise exception 'Reason required' using errcode='22023';end if;
 if act='revoke' then
 if v.state<>'pending' then raise exception 'Stale appointment' using errcode='PT409';end if;
 update academy.guardian_invitations set state='revoked',revoke_reason=reason,version=version+1 where id=invitation;
 else
 update academy.guardian_links set state='ended',end_reason=reason,ended_at=now() where invitation_id=invitation and state='active';
 if not found then raise exception 'Stale appointment' using errcode='PT409';end if;
 update academy.guardian_invitations set version=version+1 where id=invitation;
 end if;
 else
 if v.state<>'pending' or v.expires_at<=now() or v.delivery not in ('queued','failed') or v.attempts>=5 or v.lease_until>now() then raise exception 'Delivery unavailable' using errcode='PT409';end if;
 end if;
 r:=jsonb_build_object('invitation_id',invitation,'version',v.version+case when act='retry' then 0 else 1 end,'state',case act when 'revoke' then 'revoked' when 'end' then 'ended' else 'pending' end);
 end if;
 insert into academy.guardian_operations(actor,id,academy_id,invitation_id,fingerprint,result) values(s,op,a,invitation,fp,r);
 insert into academy.audit_events(actor,academy_id,action,operation_id,details) values(s,a,'guardian.'||act,op,r||case when act='appoint' then '{"basis":"synthetic-owner-confirmation"}'::jsonb else '{}'::jsonb end);

 return r;
end $$;
create function public.g3_operation_v1(a uuid,op uuid) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s' as $$
declare s text;old academy.guardian_operations;begin
 perform academy.g3_lock(a);s:=academy.i2_owner(a);
 if op is null then raise exception 'Operation required' using errcode='22023';end if;
 perform pg_advisory_xact_lock(hashtextextended('guardian-op:'||s||op::text,0));
 select * into old from academy.guardian_operations where actor=s and id=op;
 if found then if old.academy_id<>a then raise exception 'Access denied' using errcode='42501';end if;return old.result;end if;
 insert into academy.guardian_operations(actor,id,academy_id,result) values(s,op,a,'{"cancelled":true}');
 insert into academy.audit_events(actor,academy_id,action,operation_id) values(s,a,'guardian.reconcile_cancel',op);
 return '{"cancelled":true}';
end $$;
create function public.g3_invitation_v1(invitation uuid,token text,proof jsonb,act text default 'review',op uuid default null) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s' as $$
declare s text:=academy.verified_subject();v academy.guardian_invitations;who uuid;m academy.memberships;g uuid;l uuid;fp text;old academy.guardian_operations;r jsonb;begin
 if invitation is null or token is null or token !~ '^[a-f0-9]{64}$' or act is null or act not in ('review','accept','reconcile') or (act<>'review' and op is null) then raise exception 'Invalid invitation' using errcode='22023';end if;
 if academy.m1_proof(proof,'recipient',invitation::text||':'||encode(extensions.digest(token,'sha256'),'hex')) is distinct from s then raise exception 'Access denied' using errcode='42501';end if;
 select academy_id into who from academy.guardian_invitations where id=invitation;
 if who is null then raise exception 'Access denied' using errcode='42501';end if;perform academy.g3_lock(who);
 select * into v from academy.guardian_invitations where id=invitation for update;
 if v.token_hash is distinct from encode(extensions.digest(token,'sha256'),'hex') or not(v.recipient=any(string_to_array(proof->>'emails',','))) or v.state='revoked' then raise exception 'Access denied' using errcode='42501';end if;
 if v.state='pending' then
 if v.expires_at<=now() then raise exception 'Access denied' using errcode='42501';end if;
 perform academy.g3_approver(v.academy_id,v.approved_by);
 else
 if v.accepted_by is distinct from s then raise exception 'Access denied' using errcode='42501';end if;
 g:=academy.g3_guardian(v.academy_id);
 perform 1 from academy.guardian_links where invitation_id=v.id and guardian_id=g and state='active';
 if not found then raise exception 'Access denied' using errcode='42501';end if;
 end if;
 if act='review' then
 select jsonb_build_object('display_name',p.display_name,'branch_name',b.name,'academy_id',v.academy_id,'state',v.state,'expires_at',v.expires_at) into r from academy.players p join academy.branches b on b.id=p.branch_id where p.id=v.player_id and p.academy_id=v.academy_id;
 return r;end if;
 perform pg_advisory_xact_lock(hashtextextended('guardian-op:'||s||op::text,0));
 fp:=encode(extensions.digest(jsonb_build_array('accept',invitation)::text,'sha256'),'hex');
 select * into old from academy.guardian_operations where actor=s and id=op;
 if found then
 if old.academy_id<>v.academy_id or old.invitation_id is distinct from invitation or (act='accept' and old.fingerprint is distinct from fp) then raise exception 'Operation conflict' using errcode='23505';end if;
 return old.result;end if;
 if act='reconcile' then
 insert into academy.guardian_operations(actor,id,academy_id,invitation_id,result) values(s,op,v.academy_id,invitation,'{"cancelled":true}');
 insert into academy.audit_events(actor,academy_id,action,operation_id) values(s,v.academy_id,'guardian.accept_cancel',op);return '{"cancelled":true}';end if;
 if v.state<>'pending' then raise exception 'Already accepted' using errcode='PT409';end if;
 insert into academy.identities(clerk_subject) values(s) on conflict(clerk_subject) do nothing;
 select id into who from academy.identities where clerk_subject=s;
 insert into academy.memberships(identity_id,academy_id,role,status) values(who,v.academy_id,'guardian','active') on conflict(identity_id,academy_id,role) do nothing;
 select * into m from academy.memberships where identity_id=who and academy_id=v.academy_id and role='guardian' for update;
 if m.status<>'active' then raise exception 'Access denied' using errcode='42501';end if;
 insert into academy.guardian_people(academy_id,identity_id,membership_id) values(v.academy_id,who,m.id) on conflict(academy_id,identity_id) do nothing;
 select id into g from academy.guardian_people where academy_id=v.academy_id and identity_id=who;
 insert into academy.guardian_links(invitation_id,academy_id,guardian_id,player_id) values(v.id,v.academy_id,g,v.player_id) returning id into l;
 update academy.guardian_invitations set state='accepted',accepted_by=s,version=version+1 where id=v.id;
 r:=jsonb_build_object('academy_id',v.academy_id,'link_id',l,'accepted',true);
 insert into academy.guardian_operations(actor,id,academy_id,invitation_id,fingerprint,result) values(s,op,v.academy_id,invitation,fp,r);
 insert into academy.audit_events(actor,academy_id,action,operation_id,details) values(s,v.academy_id,'guardian.accept',op,jsonb_build_object('link_id',l));return r;
end $$;
create function public.g3_links_v1(a uuid,after_id uuid default null,link uuid default null) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s' as $$
declare g uuid;items jsonb;more boolean;begin
 perform academy.g3_lock(a);g:=academy.g3_guardian(a);
 select coalesce(jsonb_agg(to_jsonb(r)),'[]') into items from (
 select l.id,p.display_name,b.name branch_name from academy.guardian_links l join academy.players p on p.id=l.player_id and p.academy_id=l.academy_id join academy.branches b on b.id=p.branch_id
 where l.academy_id=a and l.guardian_id=g and l.state='active' and (after_id is null or l.id>after_id) and (link is null or l.id=link) order by l.id limit 26) r;
 if link is not null and jsonb_array_length(items)=0 then raise exception 'Access denied' using errcode='42501';end if;
 more:=jsonb_array_length(items)>25;if more then items:=items-25;end if;return jsonb_build_object('items',items,'more',more);
end $$;
create function public.g3_delivery_v1(invitation uuid,proof jsonb,lease uuid default null,outcome text default null,provider text default null) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s' as $$
declare a uuid;v academy.guardian_invitations;claim uuid;begin
 if academy.m1_proof(proof,'delivery','guardian:'||invitation::text||':1:'||coalesce(lease::text,'claim')||':'||coalesce(outcome,''))<>'user_delivery_worker' then raise exception 'Access denied' using errcode='42501';end if;
 select academy_id into a from academy.guardian_invitations where id=invitation;if a is null then return '{"send":false}';end if;
 perform academy.g3_lock(a);select * into v from academy.guardian_invitations where id=invitation for update;
 if v.state<>'pending' or v.expires_at<=now() then return '{"send":false}';end if;
 perform academy.g3_approver(a,v.approved_by);
 if lease is not null then
 if v.lease_id is distinct from lease or v.lease_until is null or v.lease_until<=now() then raise exception 'Lease unavailable' using errcode='42501';end if;
 if outcome is null or outcome not in ('accepted','failed','unknown','blocked') or length(coalesce(provider,''))>160 then raise exception 'Invalid outcome' using errcode='22023';end if;
 update academy.guardian_invitations set delivery=outcome,provider_id=case when outcome='accepted' then provider else null end,lease_until=null where id=invitation;
 insert into academy.audit_events(actor,academy_id,action,operation_id,details) values('delivery-worker',a,'guardian.delivery',lease,jsonb_build_object('outcome',outcome));return '{"send":false}';end if;
 if v.delivery in ('accepted','unknown','blocked') or v.attempts>=5 then return '{"send":false}';end if;
 if v.lease_until>now() then return '{"send":false,"retry":true}';end if;
 if v.first_attempt_at<now()-interval '23 hours' then update academy.guardian_invitations set delivery='unknown' where id=invitation;return '{"send":false}';end if;
 claim:=gen_random_uuid();update academy.guardian_invitations set delivery='sending',attempts=attempts+1,lease_id=claim,lease_until=now()+interval '2 minutes',first_attempt_at=coalesce(first_attempt_at,now()) where id=invitation;
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
 if method is distinct from 'POST' or path is null or path !~ '^/rpc/(m1_context_v1|m1_platform_list_v1|m1_setup_v1|m1_operation_v1|m1_create_v1|m1_save_setup_v1|m1_manage_invitation_v1|m1_invitation_v1|bootstrap_identity_v1|my_academy_memberships_v1|i2_people_v1|i2_candidates_v1|i2_profile_v1|i2_register_v1|i2_operation_v1|g3_owner_list_v1|g3_command_v1|g3_operation_v1|g3_invitation_v1|g3_links_v1)$' then
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

revoke all on function academy.g3_lock(uuid),academy.g3_approver(uuid,text),academy.g3_guardian(uuid) from public,anon,authenticated;
do $$ declare f record;begin
 for f in select p.oid::regprocedure sig,p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'g3_%' loop
 execute format('revoke all on function %s from public,anon,authenticated',f.sig);
 if f.proname='g3_delivery_v1' then execute format('grant execute on function %s to anon',f.sig);
 else execute format('grant execute on function %s to authenticated',f.sig);end if;
 end loop;
end $$;
