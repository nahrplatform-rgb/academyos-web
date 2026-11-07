-- SDR-06 operator-only synthetic fixture on existing verified identity. Not normal invitation/recipient proof. No email or Owner change.
begin;
set local lock_timeout='2s';
set local statement_timeout='3s';
do $$begin
if exists(select 1 from academy.audit_events where operation_id='f7f346ba-0abf-4e6f-b747-050c9e9c8d9c' and action='operator.ex07.B.trainer.setup')then return;end if;
perform academy.t4_lock('c8a4045a-a636-4bad-86f3-68f2036666f6');
perform academy.t4_approver('c8a4045a-a636-4bad-86f3-68f2036666f6','user_3L5mZMvNN95teSpCPM233gzC06S');
if not exists(select 1 from academy.identities where id='5c6eb9b4-ca6e-424b-bd62-22b23b2ac1c7' and clerk_subject='user_3L5mZMvNN95teSpCPM233gzC06S') or not exists(select 1 from academy.branches where id='aab4559c-33dc-49de-a0ee-e028fcd8922c' and academy_id='c8a4045a-a636-4bad-86f3-68f2036666f6') then raise exception 'Unexpected fixture identity/branch';end if;
if exists(select 1 from academy.trainer_people where academy_id='c8a4045a-a636-4bad-86f3-68f2036666f6' and identity_id='5c6eb9b4-ca6e-424b-bd62-22b23b2ac1c7') or exists(select 1 from academy.memberships where academy_id='c8a4045a-a636-4bad-86f3-68f2036666f6' and identity_id='5c6eb9b4-ca6e-424b-bd62-22b23b2ac1c7' and role='trainer') or exists(select 1 from academy.owner_register_keys where subject='user_3L5mZMvNN95teSpCPM233gzC06S' and academy_id='c8a4045a-a636-4bad-86f3-68f2036666f6') then raise exception 'Existing B trial state must be preserved';end if;
insert into academy.memberships(id,identity_id,academy_id,role,status) values('4ff087df-8874-4468-969e-862d97aaaee6','5c6eb9b4-ca6e-424b-bd62-22b23b2ac1c7','c8a4045a-a636-4bad-86f3-68f2036666f6','trainer','active');
insert into academy.trainer_people(id,academy_id,display_name,identity_id,membership_id) values('45cbc7d0-fc23-420c-9bea-c4935e9c0d7c','c8a4045a-a636-4bad-86f3-68f2036666f6','Synthetic EX07 B Trainer','5c6eb9b4-ca6e-424b-bd62-22b23b2ac1c7','4ff087df-8874-4468-969e-862d97aaaee6');
insert into academy.trainer_invitations(id,academy_id,staff_id,branch_id,recipient,approved_by,token_hash,state,version,accepted_by,delivery) values('33a95432-c6f7-4019-b8b3-a09d748609b0','c8a4045a-a636-4bad-86f3-68f2036666f6','45cbc7d0-fc23-420c-9bea-c4935e9c0d7c','aab4559c-33dc-49de-a0ee-e028fcd8922c','moamen_ghareeb@icloud.com','user_3L5mZMvNN95teSpCPM233gzC06S',encode(extensions.digest(gen_random_uuid()::text,'sha256'),'hex'),'accepted',1,'user_3L5mZMvNN95teSpCPM233gzC06S','blocked');
insert into academy.trainer_assignments(id,invitation_id,academy_id,staff_id,branch_id,state) values('6d3f48d0-f4a2-44ec-94bc-dde0729cd924','33a95432-c6f7-4019-b8b3-a09d748609b0','c8a4045a-a636-4bad-86f3-68f2036666f6','45cbc7d0-fc23-420c-9bea-c4935e9c0d7c','aab4559c-33dc-49de-a0ee-e028fcd8922c','active');
insert into academy.audit_events(actor,academy_id,action,operation_id,details) values('user_3L5mZMvNN95teSpCPM233gzC06S','c8a4045a-a636-4bad-86f3-68f2036666f6','operator.ex07.B.trainer.setup','f7f346ba-0abf-4e6f-b747-050c9e9c8d9c',jsonb_build_object('membership','4ff087df-8874-4468-969e-862d97aaaee6','staff','45cbc7d0-fc23-420c-9bea-c4935e9c0d7c','basis','Owner SDR-06 necessary synthetic trial role setup;existing verified account;direct operator fixture,not normal invitation acceptance or delivery proof;no email/new identity/Owner transfer;ending prepared;preserve A originals/keys'));
end$$;
commit;
