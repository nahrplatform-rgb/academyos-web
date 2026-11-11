-- PREPARED ONLY. Requires explicit Owner authorization before execution.
-- Exact synthetic Guardian link only. Prepare closing fallback before enabling.
begin;
select academy.g3_lock('b2c7920d-d467-4e9f-9a68-809ac627399e');select academy.t4_lock('b2c7920d-d467-4e9f-9a68-809ac627399e');
do $$declare current_state text;current_version integer;begin
 if exists(select 1 from academy.audit_events where operation_id='c92f7199-50bf-45db-8616-9d4b595e1d01'and action='operator.i4b.guardian.enable'and academy_id='b2c7920d-d467-4e9f-9a68-809ac627399e')then return;end if;
 select l.state,v.version into current_state,current_version from academy.guardian_links l
 join academy.guardian_invitations v on v.id=l.invitation_id
 join academy.guardian_people g on g.id=l.guardian_id and g.academy_id=l.academy_id
 join academy.memberships m on m.id=g.membership_id and m.academy_id=l.academy_id and m.identity_id=g.identity_id
 join academy.identities i on i.id=g.identity_id
 where l.id='3eec2f21-b0d1-4cf7-89cd-84fd829f69c3'and l.invitation_id='21851334-f69c-4b0c-8fe3-73c8dbe80254'and l.academy_id='b2c7920d-d467-4e9f-9a68-809ac627399e'and l.player_id='95aa8c84-ea5a-41b5-bb9a-7dbfeedbd635'and v.player_id=l.player_id and v.academy_id=l.academy_id
 and v.state='accepted'and v.accepted_by=i.clerk_subject and i.clerk_subject='user_3L5mZMvNN95teSpCPM233gzC06S'and m.role='guardian'and m.status='active'
 for update of l,v,m;
 if not found then raise exception 'Exact approved synthetic tuple changed';end if;
 if current_state<>'ended'or current_version<>3 or exists(select 1 from academy.guardian_training_access where link_id='3eec2f21-b0d1-4cf7-89cd-84fd829f69c3'and enabled)then raise exception 'Restore precondition changed';end if;
 update academy.guardian_links set state='active'where id='3eec2f21-b0d1-4cf7-89cd-84fd829f69c3';
 insert into academy.guardian_training_access(link_id,enabled)values('3eec2f21-b0d1-4cf7-89cd-84fd829f69c3',true)on conflict(link_id)do update set enabled=true;
 update academy.guardian_invitations set version=version+1 where id='21851334-f69c-4b0c-8fe3-73c8dbe80254';
 insert into academy.audit_events(actor,academy_id,action,operation_id,details)values('operator-owner-authorized','b2c7920d-d467-4e9f-9a68-809ac627399e','operator.i4b.guardian.enable','c92f7199-50bf-45db-8616-9d4b595e1d01',jsonb_build_object('link','3eec2f21-b0d1-4cf7-89cd-84fd829f69c3','player','95aa8c84-ea5a-41b5-bb9a-7dbfeedbd635'));
end$$;
commit;
