-- Alternate names are visible in the Owner's full profile and searchable online.
alter table academy.players add column alternate_name text
 check (alternate_name is null or (length(alternate_name) between 1 and 160
    and length(academy.i2_normalize(alternate_name)) between 1 and 160));

create or replace function public.i2_people_v1(a uuid, after_id uuid default null, query text default '') returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s' as $$
declare s text:=academy.i2_owner(a); q text:=academy.i2_normalize(query); items jsonb; ctx jsonb; more boolean;begin
 if q is null or length(q)>160 or length(q)=1 then raise exception 'Invalid search' using errcode='22023';end if;
 select jsonb_build_object('academy_id',a,'academy_name',x.name,'branch_id',b.id,'branch_name',b.name) into ctx
 from academy.academies x join academy.initial_setup z on z.academy_id=x.id join academy.branches b on b.id=z.branch_id where x.id=a;
 select coalesce(jsonb_agg(to_jsonb(r)),'[]') into items from (
 select p.id,p.display_name,p.branch_id,b.name branch_name,p.created_at from academy.players p join academy.branches b on b.id=p.branch_id
 where p.academy_id=a and (after_id is null or p.id>after_id) and (q='' or starts_with(p.normalized_name,q)
   or starts_with(academy.i2_normalize(p.alternate_name),q)) order by p.id limit 26) r;
 more:=jsonb_array_length(items)>25;if more then items:=items-25;end if;
 return ctx||jsonb_build_object('items',items,'more',more);
end $$;

create or replace function public.i2_profile_v1(a uuid, player uuid) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s' as $$
declare s text:=academy.i2_owner(a); r jsonb;begin
 select jsonb_build_object('id',p.id,'display_name',p.display_name,'branch_name',b.name,'contact_email',p.contact_email,'version',p.version,'created_at',p.created_at)
  || case when p.alternate_name is null then '{}'::jsonb
     else jsonb_build_object('alternate_name',p.alternate_name) end into r
 from academy.players p join academy.branches b on b.id=p.branch_id where p.academy_id=a and p.id=player;
 if r is null then raise exception 'Access denied' using errcode='42501';end if;return r;
end $$;

create function academy.i2_register_player(a uuid, branch uuid, op uuid, display_name text, contact text, reviewed_revision bigint, different_person boolean, alternate text) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare s text:=academy.i2_owner(a); n text:=academy.i2_normalize(display_name); dn text:=trim(regexp_replace(display_name,'[[:space:]]+',' ','g')); email text:=nullif(lower(trim(contact)),''); alias_name text:=nullif(trim(regexp_replace(alternate,'[[:space:]]+',' ','g')),'');
 payload jsonb; fingerprint text; old academy.people_operations; rev bigint; player uuid; result jsonb;begin
 if op is null or branch is null or n is null or length(n) not between 1 and 160 or length(display_name)>160 or reviewed_revision is null or reviewed_revision<0 or reviewed_revision>9007199254740991 or different_person is null
 or length(alternate)>160 or (alias_name is not null and length(academy.i2_normalize(alias_name)) not between 1 and 160)
 or (email is not null and (length(email)>254 or email !~ '^[a-z0-9.!#$%&''*+/=?^_`{|}~-]+@example\.invalid$')) then raise exception 'Invalid registration' using errcode='22023';end if;
 perform 1 from academy.initial_setup where academy_id=a and branch_id=branch;
 if not found then raise exception 'Access denied' using errcode='42501';end if;
 -- An omitted alternate name preserves the fingerprint of existing receipts.
 payload:=jsonb_build_array(a,branch,dn,email,reviewed_revision,different_person);
 if alias_name is not null then payload:=payload||jsonb_build_array(alias_name);end if;
 fingerprint:=encode(extensions.digest(payload::text,'sha256'),'hex');
 perform pg_advisory_xact_lock(hashtextextended('people-op:'||s||op::text,0));
 select * into old from academy.people_operations where actor=s and id=op;
 if found then
 if old.academy_id<>a or old.fingerprint is distinct from fingerprint then raise exception 'Operation conflict' using errcode='23505';end if;
 return old.result;end if;
 perform pg_advisory_xact_lock(hashtextextended('people-name:'||a::text||':'||n,0));
 select revision into rev from academy.player_name_revisions where academy_id=a and normalized_name=n;
 rev:=coalesce(rev,0);
 if rev<>reviewed_revision or (rev>0 and not different_person) then raise exception 'Review required' using errcode='PT412';end if;
 insert into academy.players(academy_id,branch_id,display_name,normalized_name,contact_email,alternate_name) values(a,branch,dn,n,email,alias_name) returning id into player;
 insert into academy.player_name_revisions values(a,n,rev+1) on conflict(academy_id,normalized_name) do update set revision=excluded.revision;
 result:=jsonb_build_object('player_id',player,'version',1);
 insert into academy.people_operations(actor,id,academy_id,fingerprint,result) values(s,op,a,fingerprint,result);
 insert into academy.audit_events(actor,academy_id,action,operation_id,details) values(s,a,'player.register',op,result);
 return result;
end $$;

revoke all on function academy.i2_register_player(uuid,uuid,uuid,text,text,bigint,boolean,text)
 from public,anon,authenticated;

create or replace function public.i2_register_v1(a uuid, branch uuid, op uuid, display_name text, contact text,
 reviewed_revision bigint, different_person boolean) returns jsonb
language sql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s' as $$
 select academy.i2_register_player(a, branch, op, display_name, contact, reviewed_revision, different_person, null)
$$;

create function public.i2_register_v2(a uuid, branch uuid, op uuid, display_name text, contact text,
 reviewed_revision bigint, different_person boolean, alternate_name text) returns jsonb
language sql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s' as $$
 select academy.i2_register_player(a, branch, op, display_name, contact, reviewed_revision, different_person, alternate_name)
$$;

revoke all on function public.i2_register_v2(uuid,uuid,uuid,text,text,bigint,boolean,text)
 from public,anon,authenticated;
grant execute on function public.i2_register_v2(uuid,uuid,uuid,text,text,bigint,boolean,text)
 to authenticated;

do $$
declare definition text := pg_get_functiondef('academy.verified_subject()'::regprocedure);
begin
 if position('|i2_register_v1|' in definition)=0 or position('|i2_register_v2|' in definition)>0 then
  raise exception 'Unexpected People registration attestation boundary';
 end if;
 execute replace(definition,'|i2_register_v1|','|i2_register_v2|i2_register_v1|');
end $$;
