-- I5a accepted narrative policy/design. Private tables, no test accounts or opt-ins seeded.
create table academy.development_access(link_id uuid primary key references academy.guardian_links,enabled boolean not null default false);
create table academy.development_assessments(
 id uuid primary key default gen_random_uuid(),academy_id uuid not null,event_id uuid not null references academy.publication_events,
 program_id uuid not null,day date not null,player_id uuid not null references academy.players,
 author text not null,staff_id uuid not null references academy.trainer_people,assignment_id uuid not null references academy.trainer_assignments,authority_revision uuid not null,
 state text not null check(state in('draft','submitted','returned','published','withdrawn')),version bigint not null default 1,revision int not null default 1,
 fields jsonb not null,language text not null check(language in('en','ar')),publication_id uuid,created_at timestamptz not null default clock_timestamp(),
 unique(program_id,day,player_id),foreign key(program_id,academy_id)references academy.training_programs(id,academy_id));
create index development_queue on academy.development_assessments(academy_id,id);
create index development_author on academy.development_assessments(academy_id,author,id);
create table academy.development_submissions(
 assessment_id uuid not null references academy.development_assessments,revision int not null,fields jsonb not null,language text not null,created_at timestamptz not null default clock_timestamp(),primary key(assessment_id,revision));
create table academy.development_publications(
 id uuid primary key default gen_random_uuid(),assessment_id uuid not null references academy.development_assessments,revision int not null,
 fields jsonb not null,language text not null,context jsonb not null,publisher text not null,created_at timestamptz not null default clock_timestamp(),unique(assessment_id,revision));
alter table academy.development_assessments add foreign key(publication_id)references academy.development_publications;
create index development_family on academy.development_assessments(academy_id,player_id,id)where publication_id is not null;
create table academy.development_history(
 id uuid primary key default gen_random_uuid(),assessment_id uuid not null references academy.development_assessments,version bigint not null,revision int not null,
 kind text not null,actor text not null,reason text,created_at timestamptz not null default clock_timestamp(),unique(assessment_id,version));
create table academy.development_operations(
 actor text not null,id uuid not null,academy_id uuid not null,event_id uuid not null references academy.publication_events,player_id uuid not null references academy.players,
 fingerprint text,result jsonb not null,created_at timestamptz not null default clock_timestamp(),primary key(actor,id));
do $$declare t text;begin foreach t in array array['development_access','development_assessments','development_submissions','development_publications','development_history','development_operations']loop
 execute format('alter table academy.%I enable row level security',t);execute format('revoke all on academy.%I from public,anon,authenticated',t);end loop;end$$;
create trigger development_submission_immutable before update or delete on academy.development_submissions for each row execute function academy.a10_history_immutable();
create trigger development_publication_immutable before update or delete on academy.development_publications for each row execute function academy.a10_history_immutable();
create trigger development_history_immutable before update or delete on academy.development_history for each row execute function academy.a10_history_immutable();
create function academy.e14_lock(a uuid)returns void language plpgsql security invoker set search_path=''as $$begin perform academy.g3_lock(a);perform academy.t4_lock(a);end$$;
create function academy.e14_staff(a uuid)returns jsonb language plpgsql security invoker set search_path=''as $$declare s text:=academy.verified_subject();staff uuid;begin
 if academy.a10_owner(a,s)then return jsonb_build_object('role','owner');end if;staff:=academy.t4_trainer(a);return jsonb_build_object('role','trainer','staff',staff);
end$$;
create function academy.e14_fields(f jsonb,complete boolean)returns boolean language sql immutable security invoker set search_path=''as $$
 select coalesce(jsonb_typeof(f)='object'and f?&array['strengths','focus','next','private']and(f-array['strengths','focus','next','private'])='{}'::jsonb
 and not exists(select 1 from jsonb_each(f)where jsonb_typeof(value)<>'string'or length(value#>>'{}')>2000)
 and octet_length(f::text)<=24576 and(not complete or length(trim(f->>'strengths'))>0 and length(trim(f->>'focus'))>0 and length(trim(f->>'next'))>0),false)
$$;
create function academy.e14_target(a uuid,ev uuid,player uuid)returns academy.publication_events language plpgsql security invoker set search_path=''as $$declare e academy.publication_events;begin
 e:=academy.a10_target(a,ev);
 perform 1 from academy.publication_rosters r join academy.players p on p.id=r.player_id and p.academy_id=a and p.branch_id=e.branch_id where r.event_id=ev and r.player_id=player for share of p,r;
 if not found then raise exception 'Access denied'using errcode='42501';end if;return e;
end$$;
create function academy.e14_access(a uuid,ev uuid,player uuid)returns boolean language plpgsql security invoker set search_path=''as $$declare own boolean;s text:=academy.verified_subject();r academy.development_assessments;begin
 own:=academy.a10_owner(a,s);
 if own then
  if not exists(select 1 from academy.publication_events e join academy.publication_rosters p on p.event_id=e.id where e.id=ev and e.academy_id=a and p.player_id=player)then raise exception 'Access denied'using errcode='42501';end if;
 else
  perform academy.e14_target(a,ev,player);select *into r from academy.development_assessments where academy_id=a and event_id=ev and player_id=player;
  if found and r.author<>s then raise exception 'Access denied'using errcode='42501';end if;
 end if;return own;
end$$;
create function academy.e14_author_current(r academy.development_assessments)returns boolean language sql stable security invoker set search_path=''as $$
 select exists(select 1 from academy.trainer_assignments z join academy.trainer_people p on p.id=z.staff_id join academy.identities i on i.id=p.identity_id
 join academy.publication_events e on e.id=r.event_id join academy.publication_heads h on h.event_id=e.id join academy.training_dates d on d.program_id=e.program_id and d.local_date=e.day
 join academy.publication_rosters ro on ro.event_id=e.id and ro.player_id=r.player_id join academy.players pl on pl.id=ro.player_id and pl.academy_id=r.academy_id and pl.branch_id=e.branch_id
 where z.id=r.assignment_id and z.authority_revision=r.authority_revision and z.academy_id=r.academy_id and p.id=r.staff_id and i.clerk_subject=r.author and e.trainer_id=r.staff_id
 and e.published and not d.canceled and d.starts_at=e.starts_at and d.ends_at=e.ends_at and e.ends_at<=clock_timestamp()and academy.q6_eligible(r.academy_id,e.branch_id,r.staff_id))
$$;
create function public.e14_context_v1(a uuid)returns jsonb language plpgsql security definer set search_path=''set statement_timeout='3s'set lock_timeout='2s'as $$begin perform academy.e14_lock(a);return academy.e14_staff(a);end$$;
create function public.e14_sessions_v1(a uuid,first_date date,after_at timestamptz default null,after_id uuid default null)returns jsonb language plpgsql security definer set search_path=''set statement_timeout='3s'set lock_timeout='2s'as $$
declare ctx jsonb;items jsonb:='[]';item jsonb;more boolean:=false;q record;begin
 perform academy.e14_lock(a);ctx:=academy.e14_staff(a);
 if first_date is null or not isfinite(first_date)or first_date<'0001-01-01'::date or first_date>'9999-12-18'::date or(after_at is null)<>(after_id is null)or after_at is not null and not isfinite(after_at)then raise exception 'Invalid cursor'using errcode='22023';end if;
 for q in select e.* from academy.publication_heads h join academy.publication_events e on e.id=h.event_id join academy.training_dates d on d.program_id=e.program_id and d.local_date=e.day
 where e.academy_id=a and e.published and not d.canceled and d.starts_at=e.starts_at and d.ends_at=e.ends_at and e.ends_at<=clock_timestamp()
 and(e.starts_at at time zone(e.projection->>'timezone'))::date between first_date and first_date+13
 and(ctx->>'role'='owner'or e.trainer_id=(ctx->>'staff')::uuid and academy.q6_eligible(a,e.branch_id,e.trainer_id))
 and(after_at is null or(e.starts_at,e.id)>(after_at,after_id))order by e.starts_at,e.id limit 21 loop
 item:=jsonb_build_object('id',q.id,'starts_at',q.starts_at,'ends_at',q.ends_at,'title',q.projection->>'name','branch',q.projection->>'branch','sport',q.projection->>'sport','timezone',q.projection->>'timezone');
 if jsonb_array_length(items)=20 or octet_length((items||jsonb_build_array(item))::text)>24576 then more:=true;exit;end if;items:=items||jsonb_build_array(item);end loop;
 return jsonb_build_object('items',items,'more',more);
end$$;
create function public.e14_roster_v1(a uuid,ev uuid,after_id uuid default null)returns jsonb language plpgsql security definer set search_path=''set statement_timeout='3s'set lock_timeout='2s'as $$
declare e academy.publication_events;items jsonb:='[]';item jsonb;more boolean:=false;own boolean;q record;begin
 perform academy.e14_lock(a);e:=academy.a10_target(a,ev);own:=academy.a10_owner(a,academy.verified_subject());
 if e.ends_at>clock_timestamp()then raise exception 'Session not ended'using errcode='PT409';end if;
 for q in select p.player_id id,p.name,r.id assessment,r.state,r.version,r.author from academy.publication_rosters p left join academy.development_assessments r on r.program_id=e.program_id and r.day=e.day and r.player_id=p.player_id
 where p.event_id=ev and(after_id is null or p.player_id>after_id)order by p.player_id limit 51 loop
 item:=jsonb_build_object('id',q.id,'name',q.name,'assessment',q.assessment,'state',q.state,'version',coalesce(q.version,0),'available',own or q.author is null or q.author=academy.verified_subject());
 if jsonb_array_length(items)=50 or octet_length((items||jsonb_build_array(item))::text)>24576 then more:=true;exit;end if;items:=items||jsonb_build_array(item);end loop;
 return jsonb_build_object('items',items,'more',more,'projection',jsonb_build_object('name',e.projection->>'name','branch',e.projection->>'branch','sport',e.projection->>'sport','timezone',e.projection->>'timezone'),'starts_at',e.starts_at,'ends_at',e.ends_at);
end$$;
create function public.e14_queue_v1(a uuid,scope text default 'all',after_id uuid default null)returns jsonb language plpgsql security definer set search_path=''set statement_timeout='3s'set lock_timeout='2s'as $$
declare items jsonb:='[]';item jsonb;more boolean:=false;q record;begin
 perform academy.e14_lock(a);perform academy.t4_approver(a,academy.verified_subject());if scope is null or scope not in('all','submitted')then raise exception 'Invalid scope'using errcode='22023';end if;
 for q in select r.id,r.event_id,r.player_id,p.name,r.state,r.version,r.revision from academy.development_assessments r join academy.publication_rosters p on p.event_id=r.event_id and p.player_id=r.player_id
 where r.academy_id=a and(scope='all'or r.state='submitted')and(after_id is null or r.id>after_id)order by r.id limit 21 loop
 item:=to_jsonb(q);if jsonb_array_length(items)=20 or octet_length((items||jsonb_build_array(item))::text)>24576 then more:=true;exit;end if;items:=items||jsonb_build_array(item);end loop;return jsonb_build_object('items',items,'more',more);
end$$;
create function public.e14_detail_v1(a uuid,ev uuid,player uuid)returns jsonb language plpgsql security definer set search_path=''set statement_timeout='3s'set lock_timeout='2s'as $$
declare own boolean;r academy.development_assessments;e academy.publication_events;result jsonb;begin
 perform academy.e14_lock(a);own:=academy.e14_access(a,ev,player);select *into e from academy.publication_events where id=ev and academy_id=a;
 select *into r from academy.development_assessments where academy_id=a and program_id=e.program_id and day=e.day and player_id=e14_detail_v1.player;
 if found and r.event_id<>ev then raise exception 'Access denied'using errcode='42501';end if;
 result:=jsonb_build_object('event',ev,'player',player,'name',(select name from academy.publication_rosters where event_id=ev and player_id=e14_detail_v1.player),'owner',own,'self',r.author=academy.verified_subject(),
 'title',e.projection->>'name','branch',e.projection->>'branch','sport',e.projection->>'sport','timezone',e.projection->>'timezone','starts_at',e.starts_at,'ends_at',e.ends_at,'ended',e.ends_at<=clock_timestamp(),
 'id',r.id,'state',r.state,'version',coalesce(r.version,0),'revision',coalesce(r.revision,1),'fields',r.fields,'language',r.language,'publication',case when r.publication_id is null then null else(select jsonb_build_object('id',p.id,'revision',p.revision,'fields',p.fields,'created_at',p.created_at)from academy.development_publications p where p.id=r.publication_id)end,
 'internal_reason',case when r.state in('returned','withdrawn')then(select h.reason from academy.development_history h where h.assessment_id=r.id and h.kind in('return','withdraw')order by h.version desc limit 1)else null end,
 'author_current',case when r.id is null then false else academy.e14_author_current(r)end);
 -- At most one full snapshot per read. Do not duplicate it in the response.
 if r.publication_id is not null then result:=jsonb_set(result,'{publication}',(result->'publication')-'fields');end if;
 return result;
end$$;
create function public.e14_command_v1(a uuid,ev uuid,player uuid,act text,expected bigint,f jsonb,lang text,reason text,op uuid)returns jsonb language plpgsql security definer set search_path=''set statement_timeout='3s'set lock_timeout='2s'as $$
declare s text;own boolean;r academy.development_assessments;e academy.publication_events;z academy.trainer_assignments;staff uuid;old academy.development_operations;fp text;result jsonb;pub uuid;begin
 perform academy.e14_lock(a);s:=academy.verified_subject();own:=academy.e14_access(a,ev,player);
 if op is null or expected is null or expected<0 or act is null or act not in('save','submit','amend','publish','return','withdraw')or lang is null or lang not in('en','ar')or reason is null or length(reason)>1000 then raise exception 'Invalid command'using errcode='22023';end if;
 if act in('save','submit')then if not academy.e14_fields(f,act='submit')or reason<>''then raise exception 'Invalid fields'using errcode='22023';end if;
 elsif f is distinct from '{}'::jsonb or(act in('return','withdraw')and length(trim(reason))=0)or(act in('amend','publish')and reason<>'')then raise exception 'Invalid payload'using errcode='22023';end if;
 if act in('save','submit','amend')and own or act in('publish','return','withdraw')and not own then raise exception 'Access denied'using errcode='42501';end if;
 perform pg_advisory_xact_lock(hashtextextended('development-op:'||s||':'||op,0));fp:=encode(extensions.digest(jsonb_build_object('event',ev,'player',player,'act',act,'expected',expected,'fields',f,'language',lang,'reason',reason)::text,'sha256'),'hex');
 select *into old from academy.development_operations where actor=s and id=op;if found then if old.academy_id<>a or old.event_id<>ev or old.player_id<>player or old.fingerprint is distinct from fp then return '{"error":"conflict"}';end if;return old.result;end if;
 select *into e from academy.publication_events where id=ev and academy_id=a;
 select *into r from academy.development_assessments where academy_id=a and program_id=e.program_id and day=e.day and player_id=e14_command_v1.player for update;
 if coalesce(r.version,0)<>expected then return '{"error":"stale"}';end if;
 if r.id is not null and r.event_id<>ev then raise exception 'Access denied'using errcode='42501';end if;
 if act in('save','submit','amend')then
  e:=academy.e14_target(a,ev,player);if e.ends_at>clock_timestamp()then return '{"error":"not_ended"}';end if;
  staff:=academy.t4_trainer(a);if r.id is not null and r.author<>s then raise exception 'Access denied'using errcode='42501';end if;
  select zz.*into z from academy.trainer_assignments zz join academy.trainer_people p on p.id=zz.staff_id join academy.memberships m on m.id=p.membership_id join academy.trainer_invitations v on v.id=zz.invitation_id
  where zz.staff_id=staff and zz.academy_id=a and zz.branch_id=e.branch_id and zz.state='active'and academy.q6_eligible(a,e.branch_id,staff) for share of zz,p,m,v;
  if z.id is null then raise exception 'Access denied'using errcode='42501';end if;
  if act='amend'and(r.id is null or r.state not in('published','withdrawn'))or act in('save','submit')and r.id is not null and r.state not in('draft','returned')then return '{"error":"state_changed"}';end if;
  if r.id is null then
   insert into academy.development_assessments(academy_id,event_id,program_id,day,player_id,author,staff_id,assignment_id,authority_revision,state,fields,language)
   values(a,ev,e.program_id,e.day,player,s,staff,z.id,z.authority_revision,'draft',f,lang)returning *into r;
  else
   update academy.development_assessments set fields=case when act='amend'then fields else f end,language=case when act='amend'then language else lang end,
    state='draft',revision=revision+case when act='amend'then 1 else 0 end,version=version+1,assignment_id=z.id,authority_revision=z.authority_revision where id=r.id returning *into r;
  end if;
  if act='submit'then
   insert into academy.development_submissions(assessment_id,revision,fields,language)values(r.id,r.revision,f,lang);
   update academy.development_assessments set state='submitted'where id=r.id returning *into r;
  end if;
 else
  if r.id is null then raise exception 'Access denied'using errcode='42501';end if;
  if act in('publish','return')and r.author=s then raise exception 'Different reviewer required'using errcode='42501';end if;
  if act in('publish','return')and r.state<>'submitted'or act='withdraw'and r.publication_id is null then return '{"error":"state_changed"}';end if;
  if act='publish'then
   -- Current authority and original assignment epoch must survive submission and review.
   perform 1 from academy.trainer_assignments zz join academy.trainer_people p on p.id=zz.staff_id join academy.memberships m on m.id=p.membership_id join academy.trainer_invitations v on v.id=zz.invitation_id where zz.id=r.assignment_id for share of zz,p,m,v;
   if not academy.e14_author_current(r)then return '{"error":"author_ineligible"}';end if;
   insert into academy.development_publications(assessment_id,revision,fields,language,context,publisher)
   values(r.id,r.revision,r.fields-'private',r.language,jsonb_build_object('event',ev,'name',(select name from academy.publication_rosters where event_id=ev and player_id=e14_command_v1.player),'title',e.projection->>'name','branch',e.projection->>'branch','sport',e.projection->>'sport','timezone',e.projection->>'timezone','starts_at',e.starts_at,'ends_at',e.ends_at,'schema','narrative-v1'),s)returning id into pub;
   update academy.development_assessments set publication_id=pub,state='published',version=version+1 where id=r.id returning *into r;
  elsif act='return'then update academy.development_assessments set state='returned',revision=revision+1,version=version+1 where id=r.id returning *into r;
  else update academy.development_assessments set publication_id=null,state=case when state='published'then'withdrawn'else state end,version=version+1 where id=r.id returning *into r;end if;
 end if;
 insert into academy.development_history(assessment_id,version,revision,kind,actor,reason)values(r.id,r.version,r.revision,act,s,nullif(trim(reason),''));
 result:=jsonb_build_object('id',r.id,'event',ev,'player',player,'state',r.state,'version',r.version,'revision',r.revision,'operation',op);
 insert into academy.development_operations values(s,op,a,ev,player,fp,result,clock_timestamp());
 insert into academy.audit_events(actor,academy_id,action,operation_id,details)values(s,a,'development.'||act,op,jsonb_build_object('assessment',r.id,'version',r.version,'revision',r.revision));return result;
end$$;
create function public.e14_operation_v1(a uuid,ev uuid,player uuid,op uuid)returns jsonb language plpgsql security definer set search_path=''set statement_timeout='3s'set lock_timeout='2s'as $$declare s text;old academy.development_operations;begin
 perform academy.e14_lock(a);perform academy.e14_access(a,ev,player);s:=academy.verified_subject();if op is null then raise exception 'Invalid operation'using errcode='22023';end if;
 perform pg_advisory_xact_lock(hashtextextended('development-op:'||s||':'||op,0));select *into old from academy.development_operations where actor=s and id=op;
 if found then if old.academy_id<>a or old.event_id<>ev or old.player_id<>player then raise exception 'Access denied'using errcode='42501';end if;return old.result;end if;
 insert into academy.development_operations values(s,op,a,ev,player,null,'{"cancelled":true}',clock_timestamp());
 insert into academy.audit_events(actor,academy_id,action,operation_id,details)values(s,a,'development.fence',op,jsonb_build_object('event',ev,'player',player));return '{"cancelled":true}';end$$;
create function public.e14_history_v1(a uuid,ev uuid,player uuid,before_version bigint default null)returns jsonb language plpgsql security definer set search_path=''set statement_timeout='3s'set lock_timeout='2s'as $$declare r academy.development_assessments;items jsonb:='[]';item jsonb;more boolean:=false;q record;begin
 perform academy.e14_lock(a);perform academy.e14_access(a,ev,player);select *into r from academy.development_assessments where academy_id=a and event_id=ev and player_id=e14_history_v1.player;if not found then raise exception 'Access denied'using errcode='42501';end if;
 if before_version is not null and before_version<1 then raise exception 'Invalid cursor'using errcode='22023';end if;
 for q in select h.version,h.revision,h.kind,h.reason,h.created_at,s.fields submitted_fields,p.fields published_fields
 from academy.development_history h left join academy.development_submissions s on s.assessment_id=h.assessment_id and s.revision=h.revision and h.kind='submit'
 left join academy.development_publications p on p.assessment_id=h.assessment_id and p.revision=h.revision and h.kind='publish'
 where h.assessment_id=r.id and(before_version is null or h.version<before_version)order by h.version desc limit 21 loop
 item:=to_jsonb(q);if jsonb_array_length(items)=20 or octet_length((items||jsonb_build_array(item))::text)>29000 then more:=true;exit;end if;items:=items||jsonb_build_array(item);end loop;
 return jsonb_build_object('items',items,'more',more);
end$$;
create function academy.e14_link(a uuid,link uuid)returns jsonb language plpgsql security invoker set search_path=''as $$declare g uuid;s text;ctx jsonb;begin
 g:=academy.g3_guardian(a);s:=academy.verified_subject();
 select jsonb_build_object('id',l.id,'player',p.id,'name',p.display_name,'branch',b.name)into ctx from academy.guardian_links l join academy.development_access c on c.link_id=l.id and c.enabled
 join academy.guardian_invitations v on v.id=l.invitation_id and v.state='accepted'and v.accepted_by=s and v.academy_id=a and v.player_id=l.player_id
 join academy.players p on p.id=l.player_id and p.academy_id=a join academy.branches b on b.id=p.branch_id and b.academy_id=a
 where l.id=link and l.academy_id=a and l.guardian_id=g and l.state='active';if ctx is null then raise exception 'Access denied'using errcode='42501';end if;return ctx;
end$$;
create function public.e14_links_v1(a uuid,after_id uuid default null)returns jsonb language plpgsql security definer set search_path=''set statement_timeout='3s'set lock_timeout='2s'as $$declare g uuid;s text;items jsonb;more boolean;begin
 perform academy.e14_lock(a);g:=academy.g3_guardian(a);s:=academy.verified_subject();
 select coalesce(jsonb_agg(to_jsonb(q)order by q.id),'[]')into items from(select l.id,p.display_name name,b.name branch from academy.guardian_links l join academy.development_access c on c.link_id=l.id and c.enabled
 join academy.guardian_invitations v on v.id=l.invitation_id and v.state='accepted'and v.accepted_by=s and v.academy_id=a and v.player_id=l.player_id
 join academy.players p on p.id=l.player_id and p.academy_id=a join academy.branches b on b.id=p.branch_id and b.academy_id=a
 where l.academy_id=a and l.guardian_id=g and l.state='active'and(after_id is null or l.id>after_id)order by l.id limit 21)q;
 more:=jsonb_array_length(items)>20;if more then items:=items-20;end if;while octet_length(items::text)>24576 and jsonb_array_length(items)>1 loop items:=items-(jsonb_array_length(items)-1);more:=true;end loop;
 return jsonb_build_object('items',items,'more',more);
end$$;
create function public.e14_family_list_v1(a uuid,link uuid,after_id uuid default null)returns jsonb language plpgsql security definer set search_path=''set statement_timeout='3s'set lock_timeout='2s'as $$declare ctx jsonb;items jsonb:='[]';item jsonb;more boolean:=false;q record;begin
 perform academy.e14_lock(a);ctx:=academy.e14_link(a,link);
 for q in select r.id,p.id publication,p.revision,p.created_at,p.context->>'title'title,p.context->>'sport'sport,p.context->>'starts_at'starts_at
 from academy.development_assessments r join academy.development_publications p on p.id=r.publication_id where r.academy_id=a and r.player_id=(ctx->>'player')::uuid and(after_id is null or r.id>after_id)order by r.id limit 21 loop
 item:=to_jsonb(q);if jsonb_array_length(items)=20 or octet_length((items||jsonb_build_array(item))::text)>24576 then more:=true;exit;end if;items:=items||jsonb_build_array(item);end loop;return jsonb_build_object('context',ctx,'items',items,'more',more);
end$$;
create function public.e14_family_detail_v1(a uuid,link uuid,assessment uuid)returns jsonb language plpgsql security definer set search_path=''set statement_timeout='3s'set lock_timeout='2s'as $$declare ctx jsonb;result jsonb;begin
 perform academy.e14_lock(a);ctx:=academy.e14_link(a,link);
 select jsonb_build_object('id',r.id,'revision',p.revision,'fields',p.fields,'language',p.language,'created_at',p.created_at,'context',p.context)into result from academy.development_assessments r join academy.development_publications p on p.id=r.publication_id
 where r.id=assessment and r.academy_id=a and r.player_id=(ctx->>'player')::uuid;
 if result is null then raise exception 'Access denied'using errcode='42501';end if;return result;
end$$;
do $$declare f record;begin for f in select p.oid::regprocedure sig,n.nspname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where p.proname like 'e14_%'and n.nspname in('academy','public')loop execute format('revoke all on function %s from public,anon,authenticated',f.sig);if f.nspname='public'then execute format('grant execute on function %s to authenticated',f.sig);end if;end loop;end$$;

create or replace function academy.verified_subject() returns text
language plpgsql stable security invoker set search_path = '' as $$
declare claims jsonb := auth.jwt(); headers jsonb; proof jsonb; path text; method text;
begin
 if claims->>'iss' is distinct from 'https://immune-grizzly-7875.clerk.accounts.dev'
    or coalesce(claims->>'sub','') !~ '^user_[a-zA-Z0-9_]+$'
    or claims->>'role' is distinct from 'authenticated' then
   raise exception 'Invalid identity' using errcode = '42501';
 end if;
 path := current_setting('request.path',true);
 method := current_setting('request.method',true);
 if method is distinct from 'POST' or path is null or path !~ '^/rpc/(m1_context_v1|m1_platform_list_v1|m1_setup_v1|m1_operation_v1|m1_create_v1|m1_save_setup_v1|m1_manage_invitation_v1|m1_invitation_v1|bootstrap_identity_v1|my_academy_memberships_v1|i2_people_v1|i2_candidates_v1|i2_profile_v1|i2_register_v1|i2_operation_v1|g3_owner_list_v1|g3_command_v1|g3_operation_v1|g3_invitation_v1|g3_links_v1|t4_owner_list_v1|t4_command_v1|t4_operation_v1|t4_invitation_v1|t4_profile_v1|p5_list_v1|p5_preview_v1|p5_create_v1|p5_read_v1|p5_step_v1|p5_operation_v1|p5_dates_v1|q6_read_v1|q6_candidates_v1|q6_review_v1|q6_save_v1|q6_operation_v1|r7_create_v1|r7_list_v1|r7_read_v1|r7_change_v1|r7_operation_v1|s8_create_v1|s8_read_v1|s8_jobs_v1|s8_change_v1|s8_operation_v1|s8_owner_dates_v1|s8_schedule_v1|s8_roster_v1|q6_review_v2|q6_save_v2|t9_read_v1|t9_review_v1|t9_save_v1|t9_operation_v1|a10_roster_v1|a10_history_v1|a10_mark_v1|a10_operation_v1|b11_links_v1|b11_schedule_v1|b11_detail_v1|c12_context_v1|c12_list_v1|c12_detail_v1|c12_history_v1|c12_submit_v1|c12_decide_v1|c12_operation_v1|q13_context_v1|q13_sessions_v1|q13_card_v1|q13_card_change_v1|q13_window_change_v1|q13_resolve_v1|q13_capture_v1|q13_operation_v1|e14_context_v1|e14_sessions_v1|e14_roster_v1|e14_queue_v1|e14_detail_v1|e14_command_v1|e14_operation_v1|e14_history_v1|e14_links_v1|e14_family_list_v1|e14_family_detail_v1)$' then
   raise exception 'Gateway required' using errcode='42501';
 end if;
 headers := nullif(current_setting('request.headers',true),'')::jsonb;
 if coalesce(length(headers->>'x-academyos-gateway'),0) not between 1 and 1024 then
   raise exception 'Gateway required' using errcode='42501';
 end if;
 proof := (headers->>'x-academyos-gateway')::jsonb;
 if academy.m1_proof(proof,'gateway',method||':'||path) is distinct from claims->>'sub' then
   raise exception 'Gateway required' using errcode='42501';
 end if;
 return claims->>'sub';
exception when invalid_text_representation or numeric_value_out_of_range then
 raise exception 'Gateway required' using errcode='42501';
end;
$$;
