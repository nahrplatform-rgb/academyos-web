-- Rollback-only synthetic SQL authorization checks. Requires the applied M1 migration
-- and its private attestation key. Creates no real accounts, emails or durable grants.
begin;
set local academy.operator_subject='M1-rollback-only-engineering-check';
insert into academy.platform_grants(subject,granted_by,reason) values('user_m1_sql_platform','M1-rollback-test','Synthetic transaction; rolled back');
create temp table m1_fixtures(label text primary key,invite uuid default gen_random_uuid(),op uuid default gen_random_uuid(),token text default repeat('b',64),hash text,result jsonb,proof jsonb);
insert into m1_fixtures(label) values('A'),('B');
update m1_fixtures set hash=encode(extensions.digest(token,'sha256'),'hex');
grant select,update on m1_fixtures to authenticated;
set local request.jwt.claims='{"iss":"https://immune-grizzly-7875.clerk.accounts.dev","sub":"user_m1_sql_platform","role":"authenticated"}';
set local role authenticated;
update m1_fixtures set result=public.m1_create_v1(op,invite,'M1 rollback synthetic '||label,'owner@academy.example',hash);
do $$ declare f record;begin
 for f in select * from m1_fixtures loop
 if public.m1_create_v1(f.op,f.invite,'M1 rollback synthetic '||f.label,'owner@academy.example',f.hash)<>f.result then raise exception 'Create replay mismatch';end if;
 end loop;
end $$;
reset role;
update m1_fixtures set proof=jsonb_build_object('purpose','recipient','target',invite::text||':'||hash,'subject',case label when 'A' then 'user_m1_sql_owner_a' else 'user_m1_sql_owner_b' end,'emails','owner@academy.example','issued',floor(extract(epoch from clock_timestamp()))::bigint);
update m1_fixtures set proof=proof||jsonb_build_object('signature',encode(extensions.hmac((proof->>'purpose')||E'\n'||(proof->>'target')||E'\n'||(proof->>'subject')||E'\n'||(proof->>'issued')||E'\n'||(proof->>'emails'),(select secret from academy.m1_secrets where purpose='onboarding'),'sha256'),'hex'));
set local role authenticated;
do $$ declare f record;begin
 for f in select * from m1_fixtures loop
 perform set_config('request.jwt.claims',jsonb_build_object('iss','https://immune-grizzly-7875.clerk.accounts.dev','sub',f.proof->>'subject','role','authenticated')::text,true);
 if not (public.m1_invitation_v1(f.invite,f.token,f.proof,gen_random_uuid())->>'accepted')::boolean then raise exception 'Acceptance failed';end if;
 end loop;
end $$;
set local request.jwt.claims='{"iss":"https://immune-grizzly-7875.clerk.accounts.dev","sub":"user_m1_sql_owner_a","role":"authenticated"}';
do $$ declare a uuid:=(select (result->>'academy_id')::uuid from m1_fixtures where label='A'); b uuid:=(select (result->>'academy_id')::uuid from m1_fixtures where label='B'); r jsonb; v integer;begin
 begin perform public.m1_setup_v1(b);raise exception 'Foreign academy read allowed';exception when insufficient_privilege then null;end;
 begin perform public.m1_save_setup_v1(b,gen_random_uuid(),0,'branch','{"name":"foreign","timezone":"Africa/Cairo"}');raise exception 'Foreign write allowed';exception when insufficient_privilege then null;end;
 begin perform * from academy.owner_invitations;raise exception 'Private invitation read allowed';exception when insufficient_privilege then null;end;
 begin perform public.m1_platform_list_v1();raise exception 'Tenant owner platform access allowed';exception when insufficient_privilege then null;end;
 begin perform public.m1_save_setup_v1(a,gen_random_uuid(),0,'complete','{}');raise exception 'Incomplete setup completed';exception when invalid_parameter_value then null;end;
 r:=public.m1_save_setup_v1(a,gen_random_uuid(),0,'branch','{"name":"M1 synthetic branch","timezone":"Africa/Cairo"}');
 if (r->>'version')::integer<>1 then raise exception 'Branch not persisted';end if;
 begin perform public.m1_save_setup_v1(a,gen_random_uuid(),0,'branch','{"name":"stale","timezone":"Africa/Cairo"}');raise exception 'Stale edit allowed';exception when sqlstate 'PT409' then null;end;
 r:=public.m1_save_setup_v1(a,gen_random_uuid(),1,'sport','{"label_en":"Synthetic sport","label_ar":"رياضة اختبار"}');
 r:=public.m1_save_setup_v1(a,gen_random_uuid(),2,'complete','{}');
 if not (r->>'complete')::boolean then raise exception 'Completion missing';end if;
 if public.m1_setup_v1(a)<>r then raise exception 'Resume differs from receipt';end if;
end $$;
reset role;
update academy.memberships set status='suspended' where academy_id=(select (result->>'academy_id')::uuid from m1_fixtures where label='A');
set local role authenticated;
do $$ declare a uuid:=(select (result->>'academy_id')::uuid from m1_fixtures where label='A');begin
 begin perform public.m1_setup_v1(a);raise exception 'Suspended membership read allowed';exception when insufficient_privilege then null;end;
 begin perform public.m1_save_setup_v1(a,gen_random_uuid(),3,'complete','{}');raise exception 'Suspended membership write allowed';exception when insufficient_privilege then null;end;
end $$;
reset role;
set local role anon;
do $$ begin
 begin perform public.m1_context_v1();raise exception 'Anonymous context allowed';exception when insufficient_privilege then null;end;
 begin perform public.m1_delivery_v1(gen_random_uuid(),1,'{}');raise exception 'Unsigned delivery allowed';exception when insufficient_privilege then null;end;
end $$;
reset role;
select jsonb_build_object('synthetic_sql_checks','passed','scope','database logic under simulated JWT claims; no gateway or browser proof','durable_changes',false);
rollback;
