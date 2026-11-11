-- Business version conflicts must return HTTP 409, never trigger serialization retries.
-- Preserves grants, transaction/authorization checks, records and operation receipts.
create or replace function public.m1_save_setup_v1(a uuid, op uuid, expected_version integer, step text, fields jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare s text:=academy.m1_owner(a); v integer; z academy.initial_setup; r jsonb; id uuid; payload jsonb:=jsonb_build_array(a,expected_version,step,fields);begin
 r:=academy.m1_replay(s,op,'setup.'||step,payload);if r is not null then return r;end if;
 select setup_version into v from academy.academies where academy.academies.id=a for update;
 if expected_version is distinct from v then raise exception 'Version conflict' using errcode='PT409';end if;
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

create or replace function public.m1_manage_invitation_v1(invitation_id uuid, op uuid, expected_generation integer, act text, token_hash text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare s text:=academy.m1_platform(); inv academy.owner_invitations;r jsonb;payload jsonb:=jsonb_build_array(invitation_id,expected_generation,act,token_hash);begin
 r:=academy.m1_replay(s,op,'invitation.'||act,payload);if r is not null then return r;end if;
 select * into inv from academy.owner_invitations where id=invitation_id for update;
 if not found or inv.redeemed_by is not null then raise exception 'Invitation unavailable' using errcode='22023';end if;
 if expected_generation is distinct from inv.generation then raise exception 'Version conflict' using errcode='PT409';end if;
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
