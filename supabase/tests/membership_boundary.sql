-- Disposable PostgreSQL harness supplies auth.jwt() from request.jwt.claims.
begin;
insert into academy.identities(clerk_subject) values('user_a'),('user_b');
insert into academy.academies(name) values('Synthetic A'),('Synthetic B');
insert into academy.memberships(identity_id,academy_id,role,status)
select i.id,a.id,'owner','active' from academy.identities i cross join academy.academies a
where (i.clerk_subject='user_a' and a.name='Synthetic A') or (i.clerk_subject='user_b' and a.name='Synthetic B');
set local role authenticated;
select set_config('request.jwt.claims','{"iss":"https://immune-grizzly-7875.clerk.accounts.dev","sub":"user_a","role":"authenticated"}',true);
do $$ declare first_id uuid; second_id uuid; begin
 first_id:=public.bootstrap_identity_v1(); second_id:=public.bootstrap_identity_v1();
 if first_id<>second_id then raise exception 'bootstrap not idempotent'; end if;
 if (select count(*) from public.my_academy_memberships_v1())<>1 or (select academy_name from public.my_academy_memberships_v1())<>'Synthetic A' then raise exception 'tenant leak'; end if;
 begin perform * from academy.memberships; raise exception 'direct table read allowed'; exception when insufficient_privilege then null; end;
end $$;
reset role;
update academy.memberships set status='suspended' where identity_id=(select id from academy.identities where clerk_subject='user_a');
set local role authenticated;
do $$ begin if exists(select from public.my_academy_memberships_v1()) then raise exception 'revoked access persists'; end if; end $$;
select set_config('request.jwt.claims','{"iss":"https://wrong.example","sub":"user_a","role":"authenticated"}',true);
do $$ begin begin perform public.bootstrap_identity_v1();raise exception 'wrong issuer allowed';exception when insufficient_privilege then null;end;end $$;
reset role;
set local role anon;
do $$ begin begin perform public.bootstrap_identity_v1();raise exception 'anonymous bootstrap allowed';exception when insufficient_privilege then null;end;end $$;
rollback;
