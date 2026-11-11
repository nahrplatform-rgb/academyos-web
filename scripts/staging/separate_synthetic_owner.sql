-- PREPARED ONLY. Operator-only staging maintenance; no public transfer endpoint.
-- Requires exact Owner authorization and a verified no-pending-work preflight.
-- Caller must SET academy.operator_approval to the operation UUID below before running.
begin;
set local statement_timeout='8s';
set local lock_timeout='5s';
select academy.g3_lock('b2c7920d-d467-4e9f-9a68-809ac627399e');
lock table academy.memberships in share row exclusive mode;
do $$
declare
 a constant uuid:='b2c7920d-d467-4e9f-9a68-809ac627399e';
 b constant uuid:='c8a4045a-a636-4bad-86f3-68f2036666f6';
 op constant uuid:='f0e9ca53-7ecf-4c2b-aa83-47a496bfcf0b';
 old_subject constant text:='user_3L0kOSQNQmbTetNTefF6gqkNF64';
 new_subject constant text:='user_3L5mZMvNN95teSpCPM233gzC06S';
 old_member constant uuid:='889717c1-c317-4544-8aad-dfb48091c9e3';
 extra_guardian constant uuid:='e9a0266f-78cb-4bf4-8e17-4e778b3f75ce';
 b_member constant uuid:='67b04312-8952-4ebe-bf59-a02f0b7d93ea';
 old_identity uuid; new_identity uuid; new_member uuid;
begin
 if current_setting('academy.operator_approval',true) is distinct from op::text then
  raise exception 'Exact Owner authorization marker required' using errcode='42501';
 end if;
 select id into strict old_identity from academy.identities where clerk_subject=old_subject;
 select id into strict new_identity from academy.identities where clerk_subject=new_subject;
 if not exists(select 1 from academy.academies where id=a and name='AcademyOS M1 Synthetic Academy' and setup_complete)
 or not exists(select 1 from academy.academies where id=b and name='AcademyOS M1 Isolation Academy B' and setup_complete)
 or not exists(select 1 from academy.platform_grants where subject=old_subject and active)
 or exists(select 1 from academy.platform_grants where subject=new_subject and active)
 or not exists(select 1 from academy.memberships where id=b_member and identity_id=new_identity and academy_id=b and role='owner' and status='active') then
  raise exception 'Staging identity/academy/authority preflight changed';
 end if;
 if exists(select 1 from academy.audit_events where operation_id=op and action='staging.roles.separate') then
  if not exists(select 1 from academy.memberships where id=old_member and identity_id=old_identity and academy_id=a and role='owner' and status='ended')
  or not exists(select 1 from academy.memberships where id=extra_guardian and identity_id=new_identity and academy_id=a and role='guardian' and status='ended')
  or (select count(*) from academy.memberships where academy_id=a and role='owner' and status='active')<>1
  or not exists(select 1 from academy.memberships where identity_id=new_identity and academy_id=a and role='owner' and status='active') then
   raise exception 'Completed operation no longer matches current state';
  end if;
  return; -- Exact retry: no duplicate grant/audit, no reset of later state.
 end if;
 if not exists(select 1 from academy.memberships where id=old_member and identity_id=old_identity and academy_id=a and role='owner' and status='active')
 or not exists(select 1 from academy.memberships where id=extra_guardian and identity_id=new_identity and academy_id=a and role='guardian' and status='active')
 or exists(select 1 from academy.memberships where identity_id=new_identity and academy_id=a and role='owner')
 or (select count(*) from academy.memberships where academy_id=a and role='owner' and status='active')<>1
 or exists(select 1 from academy.guardian_links l join academy.guardian_people p on p.id=l.guardian_id and p.academy_id=l.academy_id where p.membership_id=extra_guardian and l.state='active') then
  raise exception 'Exact role or unused-link preflight changed';
 end if;
 -- Unique active-Owner index is satisfied within one invisible-until-commit transaction.
 update academy.memberships set status='ended' where id=old_member;
 insert into academy.memberships(identity_id,academy_id,role,status)
 values(new_identity,a,'owner','active') returning id into new_member;
 update academy.memberships set status='ended' where id=extra_guardian;
 insert into academy.audit_events(actor,academy_id,action,operation_id,details)
 values('Moamen Ghareeb / exact authorized staging role separation',a,'staging.roles.separate',op,
 jsonb_build_object('reason','Dedicated Platform-only Gmail and Academy-Owner-only iCloud staging personas',
 'previous_owner_subject',old_subject,'previous_owner_membership',old_member,
 'new_owner_subject',new_subject,'new_owner_membership',new_member,
 'ended_unused_guardian_membership',extra_guardian,'retained_b_owner_membership',b_member,
 'before',jsonb_build_object('previous_owner','active','unused_guardian','active'),
 'after',jsonb_build_object('previous_owner','ended','new_owner','active','unused_guardian','ended'),
 'preserved','identities, accepted invitations, operating rows, authors, receipts and prior audit history'));
end $$;
commit;
