-- Prepared ending for exact B fixture;retain all rows/history and existing Owner.
begin;
set local lock_timeout='2s';
set local statement_timeout='3s';
do $$begin
if exists(select 1 from academy.audit_events where operation_id='1fbeddc5-96a1-4b5d-8bd1-860a697184cc' and action='operator.ex07.B.trainer.end')then return;end if;
perform academy.t4_lock('c8a4045a-a636-4bad-86f3-68f2036666f6');
perform academy.t4_approver('c8a4045a-a636-4bad-86f3-68f2036666f6','user_3L5mZMvNN95teSpCPM233gzC06S');
perform 1 from academy.trainer_people p join academy.memberships m on m.id=p.membership_id and m.identity_id=p.identity_id and m.academy_id=p.academy_id join academy.trainer_assignments z on z.staff_id=p.id and z.academy_id=p.academy_id join academy.trainer_invitations v on v.id=z.invitation_id and v.academy_id=p.academy_id where p.id='45cbc7d0-fc23-420c-9bea-c4935e9c0d7c' and p.academy_id='c8a4045a-a636-4bad-86f3-68f2036666f6' and m.id='4ff087df-8874-4468-969e-862d97aaaee6' and m.role='trainer' and m.status='active' and z.id='6d3f48d0-f4a2-44ec-94bc-dde0729cd924' and z.state='active' and z.branch_id='aab4559c-33dc-49de-a0ee-e028fcd8922c' and v.id='33a95432-c6f7-4019-b8b3-a09d748609b0' and v.state='accepted' and v.version=1 and v.accepted_by='user_3L5mZMvNN95teSpCPM233gzC06S' for update of p,m,z,v;
if not found then raise exception 'Unexpected B trial appointment';end if;
update academy.memberships set status='ended' where id='4ff087df-8874-4468-969e-862d97aaaee6';
update academy.trainer_assignments set state='ended',end_reason='SDR-06 EX07 B fixture publication complete',ended_at=clock_timestamp() where id='6d3f48d0-f4a2-44ec-94bc-dde0729cd924';
update academy.trainer_invitations set version=version+1 where id='33a95432-c6f7-4019-b8b3-a09d748609b0';
insert into academy.audit_events(actor,academy_id,action,operation_id,details) values('user_3L5mZMvNN95teSpCPM233gzC06S','c8a4045a-a636-4bad-86f3-68f2036666f6','operator.ex07.B.trainer.end','1fbeddc5-96a1-4b5d-8bd1-860a697184cc',jsonb_build_object('membership','4ff087df-8874-4468-969e-862d97aaaee6','staff','45cbc7d0-fc23-420c-9bea-c4935e9c0d7c','basis','Owner SDR-06 synthetic test ended;final iCloud Owner-only,Gmail Platform-only;history/originals/keys retained'));
end$$;
commit;
