-- Approved I2a synthetic registration. No memberships, invitations or grants are seeded.
create function academy.i2_normalize(value text) returns text
language sql immutable strict security invoker set search_path='' as $$
 select lower(trim(regexp_replace(normalize(value,NFKC),'[[:space:]]+',' ','g')))
$$;
create table academy.players (
 id uuid primary key default gen_random_uuid(), academy_id uuid not null references academy.academies,
 branch_id uuid not null, display_name text not null check(length(display_name) between 1 and 160),
 normalized_name text not null check(length(normalized_name) between 1 and 160),
 contact_email text check(contact_email is null or (length(contact_email)<=254 and contact_email ~ '^[a-z0-9.!#$%&''*+/=?^_`{|}~-]+@example\.invalid$')),
 version integer not null default 1 check(version=1), created_at timestamptz not null default now(),
 foreign key(branch_id,academy_id) references academy.branches(id,academy_id)
);
create index players_academy_cursor on academy.players(academy_id,id);
create index players_academy_name on academy.players(academy_id,normalized_name,id);
create table academy.player_name_revisions (
 academy_id uuid not null references academy.academies, normalized_name text not null,
 revision bigint not null check(revision between 1 and 9007199254740991), primary key(academy_id,normalized_name)
);
-- Separate from M1 receipts: its generic operation lookup must never expose people results.
create table academy.people_operations (
 actor text not null, id uuid not null, academy_id uuid not null references academy.academies,
 fingerprint text, result jsonb not null, created_at timestamptz not null default now(),primary key(actor,id)
);
create index people_operations_academy on academy.people_operations(academy_id);
do $$ declare t text;begin
 foreach t in array array['players','player_name_revisions','people_operations'] loop
 execute format('alter table academy.%I enable row level security',t);
 execute format('revoke all on academy.%I from public,anon,authenticated',t);
 end loop;
end $$;

create function academy.i2_owner(a uuid) returns text language plpgsql security invoker set search_path='' as $$
declare s text:=academy.m1_owner(a);begin
 perform 1 from academy.academies x join academy.initial_setup z on z.academy_id=x.id
 join academy.branches b on b.id=z.branch_id and b.academy_id=x.id
 where x.id=a and x.setup_complete for share of x,z,b;
 if not found then raise exception 'Initial setup required' using errcode='PT428';end if;
 return s;
end $$;
create function public.i2_people_v1(a uuid, after_id uuid default null, query text default '') returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s' as $$
declare s text:=academy.i2_owner(a); q text:=academy.i2_normalize(query); items jsonb; ctx jsonb; more boolean;begin
 if q is null or length(q)>160 or length(q)=1 then raise exception 'Invalid search' using errcode='22023';end if;
 select jsonb_build_object('academy_id',a,'academy_name',x.name,'branch_id',b.id,'branch_name',b.name) into ctx
 from academy.academies x join academy.initial_setup z on z.academy_id=x.id join academy.branches b on b.id=z.branch_id where x.id=a;
 select coalesce(jsonb_agg(to_jsonb(r)),'[]') into items from (
 select p.id,p.display_name,p.branch_id,b.name branch_name,p.created_at from academy.players p join academy.branches b on b.id=p.branch_id
 where p.academy_id=a and (after_id is null or p.id>after_id) and (q='' or starts_with(p.normalized_name,q)) order by p.id limit 26) r;
 more:=jsonb_array_length(items)>25;if more then items:=items-25;end if;
 return ctx||jsonb_build_object('items',items,'more',more);
end $$;
create function public.i2_candidates_v1(a uuid, display_name text, after_id uuid default null) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s' as $$
declare s text:=academy.i2_owner(a); n text:=academy.i2_normalize(display_name); rev bigint; items jsonb; more boolean;begin
 if n is null or length(n) not between 1 and 160 or length(display_name)>160 then raise exception 'Invalid name' using errcode='22023';end if;
 perform pg_advisory_xact_lock(hashtextextended('people-name:'||a::text||':'||n,0));
 select revision into rev from academy.player_name_revisions where academy_id=a and normalized_name=n;
 select coalesce(jsonb_agg(to_jsonb(r)),'[]') into items from (
 select p.id,p.display_name,b.name branch_name,p.created_at from academy.players p join academy.branches b on b.id=p.branch_id
 where p.academy_id=a and p.normalized_name=n and (after_id is null or p.id>after_id) order by p.id limit 26) r;
 more:=jsonb_array_length(items)>25;if more then items:=items-25;end if;
 return jsonb_build_object('items',items,'more',more,'revision',coalesce(rev,0));
end $$;
create function public.i2_profile_v1(a uuid, player uuid) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s' as $$
declare s text:=academy.i2_owner(a); r jsonb;begin
 select jsonb_build_object('id',p.id,'display_name',p.display_name,'branch_name',b.name,'contact_email',p.contact_email,'version',p.version,'created_at',p.created_at) into r
 from academy.players p join academy.branches b on b.id=p.branch_id where p.academy_id=a and p.id=player;
 if r is null then raise exception 'Access denied' using errcode='42501';end if;return r;
end $$;
create function public.i2_register_v1(a uuid, branch uuid, op uuid, display_name text, contact text, reviewed_revision bigint, different_person boolean) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s' as $$
declare s text:=academy.i2_owner(a); n text:=academy.i2_normalize(display_name); dn text:=trim(regexp_replace(display_name,'[[:space:]]+',' ','g')); email text:=nullif(lower(trim(contact)),''); fingerprint text; old academy.people_operations; rev bigint; player uuid; result jsonb;begin
 if op is null or branch is null or n is null or length(n) not between 1 and 160 or length(display_name)>160 or reviewed_revision is null or reviewed_revision<0 or reviewed_revision>9007199254740991 or different_person is null
 or (email is not null and (length(email)>254 or email !~ '^[a-z0-9.!#$%&''*+/=?^_`{|}~-]+@example\.invalid$')) then raise exception 'Invalid registration' using errcode='22023';end if;
 perform 1 from academy.initial_setup where academy_id=a and branch_id=branch;
 if not found then raise exception 'Access denied' using errcode='42501';end if;
 fingerprint:=encode(extensions.digest(jsonb_build_array(a,branch,dn,email,reviewed_revision,different_person)::text,'sha256'),'hex');
 perform pg_advisory_xact_lock(hashtextextended('people-op:'||s||op::text,0));
 select * into old from academy.people_operations where actor=s and id=op;
 if found then
 if old.academy_id<>a or old.fingerprint is distinct from fingerprint then raise exception 'Operation conflict' using errcode='23505';end if;
 return old.result;end if;
 perform pg_advisory_xact_lock(hashtextextended('people-name:'||a::text||':'||n,0));
 select revision into rev from academy.player_name_revisions where academy_id=a and normalized_name=n;
 rev:=coalesce(rev,0);
 if rev<>reviewed_revision or (rev>0 and not different_person) then raise exception 'Review required' using errcode='PT412';end if;
 insert into academy.players(academy_id,branch_id,display_name,normalized_name,contact_email) values(a,branch,dn,n,email) returning id into player;
 insert into academy.player_name_revisions values(a,n,rev+1) on conflict(academy_id,normalized_name) do update set revision=excluded.revision;
 result:=jsonb_build_object('player_id',player,'version',1);
 insert into academy.people_operations(actor,id,academy_id,fingerprint,result) values(s,op,a,fingerprint,result);
 insert into academy.audit_events(actor,academy_id,action,operation_id,details) values(s,a,'player.register',op,result);
 return result;
end $$;
-- A missing receipt is fenced under the same lock. A delayed create cannot land
-- after this recovery returns cancelled, so replacement intent is safe.
create function public.i2_operation_v1(a uuid, op uuid) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s' as $$
declare s text:=academy.i2_owner(a); old academy.people_operations;begin
 if op is null then raise exception 'Operation required' using errcode='22023';end if;
 perform pg_advisory_xact_lock(hashtextextended('people-op:'||s||op::text,0));
 select * into old from academy.people_operations where actor=s and id=op;
 if found then
 if old.academy_id<>a then raise exception 'Access denied' using errcode='42501';end if;
 return old.result;end if;
 insert into academy.people_operations(actor,id,academy_id,result) values(s,op,a,'{"cancelled":true}');
 insert into academy.audit_events(actor,academy_id,action,operation_id) values(s,a,'player.reconcile_cancel',op);
 return jsonb_build_object('cancelled',true);
end $$;
-- Named extension of the existing attested caller boundary, retaining all M1 checks.
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
 if method is distinct from 'POST' or path is null or path !~ '^/rpc/(m1_context_v1|m1_platform_list_v1|m1_setup_v1|m1_operation_v1|m1_create_v1|m1_save_setup_v1|m1_manage_invitation_v1|m1_invitation_v1|bootstrap_identity_v1|my_academy_memberships_v1|i2_people_v1|i2_candidates_v1|i2_profile_v1|i2_register_v1|i2_operation_v1)$' then
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
-- CREATE OR REPLACE preserves existing owner/ACL. Restate the private boundary.
revoke all on function academy.verified_subject() from public, anon, authenticated;

revoke all on function academy.i2_normalize(text),academy.i2_owner(uuid) from public,anon,authenticated;
revoke all on function public.i2_people_v1(uuid,uuid,text),public.i2_candidates_v1(uuid,text,uuid),public.i2_profile_v1(uuid,uuid),public.i2_register_v1(uuid,uuid,uuid,text,text,bigint,boolean),public.i2_operation_v1(uuid,uuid) from public,anon,authenticated;
grant execute on function public.i2_people_v1(uuid,uuid,text),public.i2_candidates_v1(uuid,text,uuid),public.i2_profile_v1(uuid,uuid),public.i2_register_v1(uuid,uuid,uuid,text,text,bigint,boolean),public.i2_operation_v1(uuid,uuid) to authenticated;
