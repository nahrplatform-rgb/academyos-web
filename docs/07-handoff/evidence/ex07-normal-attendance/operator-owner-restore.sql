-- REJECTED REHEARSAL ONLY: one-active-Owner constraint;never applied. Final ROLLBACK prevents mutation.
-- SDR-06 existing synthetic trial identity only. Preserve current iCloud Owner and every key/original. Ending prepared before restoration.
begin;
set local lock_timeout='2s';
set local statement_timeout='3s';
do $$begin
if exists(select 1 from academy.audit_events where operation_id='2d4bac83-418f-47b4-ab12-8bb716093459' and action='operator.ex07.owner.restore') then return;end if;
perform academy.t4_lock('b2c7920d-d467-4e9f-9a68-809ac627399e');
perform academy.t4_approver('b2c7920d-d467-4e9f-9a68-809ac627399e','user_3L5mZMvNN95teSpCPM233gzC06S');
perform 1 from academy.memberships m join academy.identities i on i.id=m.identity_id where m.id='889717c1-c317-4544-8aad-dfb48091c9e3' and m.academy_id='b2c7920d-d467-4e9f-9a68-809ac627399e' and m.role='owner' and m.status='ended' and i.clerk_subject='user_3L0kOSQNQmbTetNTefF6gqkNF64' for update of m;
if not found then raise exception 'Unexpected trial Owner membership';end if;
if exists(select 1 from academy.owner_register_keys where subject='user_3L0kOSQNQmbTetNTefF6gqkNF64' and academy_id='b2c7920d-d467-4e9f-9a68-809ac627399e') then raise exception 'Existing trial register must be preserved;stop setup';end if;
update academy.memberships set status='active' where id='889717c1-c317-4544-8aad-dfb48091c9e3';
insert into academy.audit_events(actor,academy_id,action,operation_id,details) values('user_3L5mZMvNN95teSpCPM233gzC06S','b2c7920d-d467-4e9f-9a68-809ac627399e','operator.ex07.owner.restore','2d4bac83-418f-47b4-ab12-8bb716093459',jsonb_build_object('membership','889717c1-c317-4544-8aad-dfb48091c9e3','target_subject','user_3L0kOSQNQmbTetNTefF6gqkNF64','from','ended','to','active','basis','Owner SDR-06 standing synthetic trial authority;temporary restoration of existing Gmail Academy A Owner only for fresh normal Attendance test because iCloud first-pilot server key is bound;preserve all keys/originals;iCloud remains Owner;final Gmail Platform-only'));
end$$;
rollback;
