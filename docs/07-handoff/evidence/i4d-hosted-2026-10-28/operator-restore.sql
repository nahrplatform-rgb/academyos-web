-- One explicitly authorized staging-only I4d operator test. Not an app migration or general restoration policy.
begin;
set local lock_timeout='2s';
set local statement_timeout='3s';
do $$begin
if exists(select 1 from academy.audit_events where operation_id='9fdbf954-7552-4be2-989c-ff41cd4566ff' and action='operator.i4d.trainer.restore')then return;end if;
if clock_timestamp()>='2026-10-28 20:30:00+00'::timestamptz then raise exception 'Test deadline closed';end if;
perform academy.t4_lock('b2c7920d-d467-4e9f-9a68-809ac627399e');
 perform 1 from academy.trainer_people p join academy.memberships m on m.id=p.membership_id and m.identity_id=p.identity_id and m.academy_id=p.academy_id join academy.identities i on i.id=p.identity_id join academy.trainer_assignments z on z.staff_id=p.id and z.academy_id=p.academy_id join academy.trainer_invitations v on v.id=z.invitation_id and v.academy_id=p.academy_id
 where p.id='562e1a3a-378c-4ea9-84ec-93b071de4670' and p.academy_id='b2c7920d-d467-4e9f-9a68-809ac627399e' and m.id='bc3dcbd0-59b6-4a49-8fea-9f128ad7bcc0' and m.role='trainer' and z.id='b36a5526-55d5-4783-81dc-70cc68578898' and z.branch_id='80007af1-7240-4f9c-8564-07fe12575a3c' and v.id='29d99cd2-5a51-4754-986c-42b4b9c52a0a' and v.state='accepted' and i.clerk_subject='user_3L5mZMvNN95teSpCPM233gzC06S' and v.accepted_by=i.clerk_subject and v.branch_id=z.branch_id and v.staff_id=p.id and m.status='ended' and z.state='ended' and v.version=9 for update of p,m,z,v;
 if not found then raise exception 'Unexpected test appointment state';end if;
update academy.memberships set status='active' where id='bc3dcbd0-59b6-4a49-8fea-9f128ad7bcc0';
update academy.trainer_assignments set state='active' where id='b36a5526-55d5-4783-81dc-70cc68578898';
update academy.trainer_invitations set version=version+1 where id='29d99cd2-5a51-4754-986c-42b4b9c52a0a';
insert into academy.audit_events(actor,academy_id,action,operation_id,details)values('user_3L0kOSQNQmbTetNTefF6gqkNF64','b2c7920d-d467-4e9f-9a68-809ac627399e','operator.i4d.trainer.restore','9fdbf954-7552-4be2-989c-ff41cd4566ff',jsonb_build_object('staff_id','562e1a3a-378c-4ea9-84ec-93b071de4670','membership_id','bc3dcbd0-59b6-4a49-8fea-9f128ad7bcc0','from','ended','to','active','basis','Moamen explicit I4d temporary QR attendance Trainer test and ending authorization 28Oct2026; existing synthetic recipient only'));
end$$;
commit;
