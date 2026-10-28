-- PREPARED ONLY. Requires explicit Owner authorization before execution.
-- Exact synthetic Guardian link only. Prepare closing fallback before enabling.
begin;
select academy.g3_lock('b2c7920d-d467-4e9f-9a68-809ac627399e');select academy.t4_lock('b2c7920d-d467-4e9f-9a68-809ac627399e');
do $$declare current_state text;current_version integer;begin
 if exists(select 1 from academy.audit_events where operation_id='fd0b9083-a6ab-4184-82df-8a88ab041deb'and action='operator.i4b.guardian.end'and academy_id='b2c7920d-d467-4e9f-9a68-809ac627399e')then return;end if;
 select l.state,v.version into current_state,current_version from academy.guardian_links l
 join academy.guardian_invitations v on v.id=l.invitation_id
 join academy.guardian_people g on g.id=l.guardian_id and g.academy_id=l.academy_id
 join academy.memberships m on m.id=g.membership_id and m.academy_id=l.academy_id and m.identity_id=g.identity_id
 join academy.identities i on i.id=g.identity_id
 where l.id='3eec2f21-b0d1-4cf7-89cd-84fd829f69c3'and l.invitation_id='21851334-f69c-4b0c-8fe3-73c8dbe80254'and l.academy_id='b2c7920d-d467-4e9f-9a68-809ac627399e'and l.player_id='95aa8c84-ea5a-41b5-bb9a-7dbfeedbd635'and v.player_id=l.player_id and v.academy_id=l.academy_id
 and v.state='accepted'and v.accepted_by=i.clerk_subject and i.clerk_subject='user_3L5mZMvNN95teSpCPM233gzC06S'and m.role='guardian'and m.status='active'
 for update of l,v,m;
 if not found then raise exception 'Exact approved synthetic tuple changed';end if;
 if current_state='active'and current_version=4 then
 update academy.guardian_links set state='ended',ended_at=clock_timestamp(),end_reason='Authorized I4b synthetic test ended'where id='3eec2f21-b0d1-4cf7-89cd-84fd829f69c3';
 update academy.guardian_invitations set version=version+1 where id='21851334-f69c-4b0c-8fe3-73c8dbe80254';
 elsif current_state<>'ended'or current_version<>5 then raise exception 'Ending precondition changed';end if;
 update academy.guardian_training_access set enabled=false where link_id='3eec2f21-b0d1-4cf7-89cd-84fd829f69c3';
 insert into academy.audit_events(actor,academy_id,action,operation_id,details)values('operator-owner-authorized','b2c7920d-d467-4e9f-9a68-809ac627399e','operator.i4b.guardian.end','fd0b9083-a6ab-4184-82df-8a88ab041deb',jsonb_build_object('link','3eec2f21-b0d1-4cf7-89cd-84fd829f69c3','player','95aa8c84-ea5a-41b5-bb9a-7dbfeedbd635'));
end$$;
commit;
