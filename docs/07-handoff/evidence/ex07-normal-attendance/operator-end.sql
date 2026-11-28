-- One bounded existing-account staging test under SDR-06. Prepared ending precedes restoration; no app migration or production authority.
begin;
set local lock_timeout='2s';
set local statement_timeout='3s';
do $$begin
if exists(select 1 from academy.audit_events where operation_id='6c4b0209-ff18-47e5-9398-b8498bbb5f32' and action='operator.ex07.trainer.end')then return;end if;
perform academy.t4_lock('b2c7920d-d467-4e9f-9a68-809ac627399e');
perform academy.t4_approver('b2c7920d-d467-4e9f-9a68-809ac627399e','user_3L5mZMvNN95teSpCPM233gzC06S');
 perform 1 from academy.trainer_people p join academy.memberships m on m.id=p.membership_id and m.identity_id=p.identity_id and m.academy_id=p.academy_id join academy.identities i on i.id=p.identity_id join academy.trainer_assignments z on z.staff_id=p.id and z.academy_id=p.academy_id join academy.trainer_invitations v on v.id=z.invitation_id and v.academy_id=p.academy_id
 where p.id='562e1a3a-378c-4ea9-84ec-93b071de4670' and p.academy_id='b2c7920d-d467-4e9f-9a68-809ac627399e' and m.id='bc3dcbd0-59b6-4a49-8fea-9f128ad7bcc0' and m.role='trainer' and z.id='b36a5526-55d5-4783-81dc-70cc68578898' and z.branch_id='80007af1-7240-4f9c-8564-07fe12575a3c' and v.id='29d99cd2-5a51-4754-986c-42b4b9c52a0a' and v.state='accepted' and v.accepted_by=i.clerk_subject and v.branch_id=z.branch_id and v.staff_id=p.id and m.status='active' and z.state='active' and v.version=20 for update of p,m,z,v;
 if not found then raise exception 'Unexpected test appointment state';end if;
update academy.memberships set status='ended' where id='bc3dcbd0-59b6-4a49-8fea-9f128ad7bcc0';
update academy.trainer_assignments set state='ended' ,end_reason='SDR-06 EX07 fixture publication test ended',ended_at=clock_timestamp() where id='b36a5526-55d5-4783-81dc-70cc68578898';
update academy.trainer_invitations set version=version+1 where id='29d99cd2-5a51-4754-986c-42b4b9c52a0a';
insert into academy.audit_events(actor,academy_id,action,operation_id,details)values('user_3L5mZMvNN95teSpCPM233gzC06S','b2c7920d-d467-4e9f-9a68-809ac627399e','operator.ex07.trainer.end','6c4b0209-ff18-47e5-9398-b8498bbb5f32',jsonb_build_object('staff_id','562e1a3a-378c-4ea9-84ec-93b071de4670','membership_id','bc3dcbd0-59b6-4a49-8fea-9f128ad7bcc0','from','active','to','ended','basis','Owner SDR-06 standing synthetic trial authority 4Nov2026; existing Casey role only for fresh EX07 normal-route register publication; final dedicated Owner-only persona restored'));
end$$;
commit;
