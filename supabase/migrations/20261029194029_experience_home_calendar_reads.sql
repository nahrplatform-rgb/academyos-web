-- Approved read-only experience projections. No account/link/opt-in or business record changes.
create function academy.x15_context(a uuid,actor text,link uuid default null) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare ctx jsonb;staff uuid;g uuid;begin
 perform academy.e14_lock(a);
 if actor='owner' then
  perform academy.m1_owner(a);
  if not exists(select 1 from academy.academies where id=a and setup_complete)then
   return jsonb_build_object('academy_id',a,'academy_name',(select name from academy.academies where id=a),'setup_required',true);
  end if;
  ctx:=academy.p5_context(a);
 elsif actor='trainer' then
  staff:=academy.t4_trainer(a);
  select jsonb_build_object('academy_id',a,'academy_name',ac.name,'branch_id',b.id,'branch_name',b.name,'timezone',ac.timezone,'staff',staff)
  into ctx from academy.trainer_assignments z join academy.branches b on b.id=z.branch_id and b.academy_id=a join academy.academies ac on ac.id=a
  where z.staff_id=staff and z.academy_id=a and z.state='active' and academy.q6_eligible(a,z.branch_id,staff);
 elsif actor='guardian' then
  g:=academy.g3_guardian(a);
  -- Minimal link identity does not imply either expanded view opt-in.
  select jsonb_build_object('academy_id',a,'academy_name',ac.name,'branch_id',b.id,'branch_name',b.name,'timezone',ac.timezone,'link',l.id,'player',p.id,'player_name',p.display_name,
   'training_enabled',coalesce(t.enabled,false),'development_enabled',coalesce(d.enabled,false)) into ctx
  from academy.guardian_links l join academy.guardian_invitations v on v.id=l.invitation_id and v.academy_id=a and v.player_id=l.player_id and v.state='accepted' and v.accepted_by=academy.verified_subject()
  join academy.players p on p.id=l.player_id and p.academy_id=a join academy.branches b on b.id=p.branch_id and b.academy_id=a join academy.academies ac on ac.id=a
  left join academy.guardian_training_access t on t.link_id=l.id left join academy.development_access d on d.link_id=l.id
  where l.id=link and l.academy_id=a and l.guardian_id=g and l.state='active';
 else raise exception 'Access denied'using errcode='42501';end if;
 if ctx is null or ctx->>'timezone' is null then raise exception 'Access denied'using errcode='42501';end if;
 return ctx||jsonb_build_object('today',(clock_timestamp()at time zone(ctx->>'timezone'))::date);
end$$;

-- Shared private query; public wrappers supply a fixed actor. No client table/view grants.
create function academy.x15_rows(a uuid,actor text,ctx jsonb,first_date date,last_date date)
returns table(id uuid,program uuid,day date,scheduled date,starts_at timestamptz,ends_at timestamptz,title text,branch text,sport text,sport_ar text,timezone text,state text,published boolean,capacity integer,roster_count integer)
language plpgsql security invoker set search_path='' as $$begin
 if actor='owner' then return query
  select coalesce(e.id,d.program_id),d.program_id,d.local_date,d.scheduled_date,d.starts_at,d.ends_at,p.definition->>'name',ctx->>'branch_name',ctx->>'sport_name',ctx->>'sport_name_ar',p.timezone,
   case when d.canceled then 'cancelled' when d.scheduled_date<>d.local_date then 'moved' when coalesce(e.published,false)then 'published' else 'draft'end,
   coalesce(e.published,false),q.capacity,coalesce(q.roster_count,0)
  from academy.training_dates d join academy.training_programs p on p.id=d.program_id and p.academy_id=a and p.state='ready' and p.branch_id=(ctx->>'branch_id')::uuid
  left join academy.date_plans q on q.program_id=d.program_id and q.local_date=d.local_date and q.academy_id=a
  left join academy.publication_heads h on h.program_id=d.program_id and h.day=d.local_date and h.academy_id=a
  left join academy.publication_events e on e.id=h.event_id and e.academy_id=a
  where d.academy_id=a and d.scheduled_date between first_date and last_date;
 elsif actor in('trainer','guardian')then return query
  select e.id,e.program_id,e.day,(e.starts_at at time zone(e.projection->>'timezone'))::date,e.starts_at,e.ends_at,e.projection->>'name',e.projection->>'branch',e.projection->>'sport',e.projection->>'sport_ar',e.projection->>'timezone',
   case when d.scheduled_date<>d.local_date then 'moved' else 'published'end,true,e.capacity,e.roster_count
  from academy.publication_heads h join academy.publication_events e on e.id=h.event_id and e.academy_id=h.academy_id
  join academy.training_dates d on d.program_id=e.program_id and d.local_date=e.day and d.academy_id=a and not d.canceled and d.starts_at=e.starts_at and d.ends_at=e.ends_at
  where h.academy_id=a and e.published and(e.starts_at at time zone(e.projection->>'timezone'))::date between first_date and last_date
  and case when actor='trainer'then e.trainer_id=(ctx->>'staff')::uuid and academy.q6_eligible(a,e.branch_id,e.trainer_id)
   else exists(select 1 from academy.publication_rosters r where r.event_id=e.id and r.player_id=(ctx->>'player')::uuid)end;
 else raise exception 'Access denied'using errcode='42501';end if;
end$$;

create function academy.x15_calendar(a uuid,actor text,link uuid,first_date date,last_date date,after_at timestamptz,after_id uuid,after_day date)returns jsonb
language plpgsql security invoker set search_path=''as $$
declare ctx jsonb;items jsonb:='[]';item jsonb;q record;total bigint;more boolean:=false;cursor jsonb:=null;candidates jsonb;valid_cursor boolean;begin
 ctx:=academy.x15_context(a,actor,link);
 if coalesce((ctx->>'setup_required')::boolean,false)then raise exception 'Setup required'using errcode='PT428';end if;
 if actor='guardian'then perform academy.b11_player(a,link);end if;
 if first_date is null or last_date is null or not isfinite(first_date)or not isfinite(last_date)or first_date<'0001-01-01'::date or last_date>'9999-12-31'::date or last_date<first_date or last_date-first_date>41
 or (after_at is null)<>(after_id is null)or(after_id is null)<>(after_day is null)or(after_at is not null and not isfinite(after_at))then raise exception 'Invalid period/cursor'using errcode='22023';end if;
 -- One materialized read snapshot supplies the total, cursor validation and page.
 -- Concurrent program completion cannot make an independently counted page look complete.
 with scoped as materialized(select *from academy.x15_rows(a,actor,ctx,first_date,last_date)),
 page as(select *from scoped r where after_at is null or(r.starts_at,r.program,r.day)>(after_at,after_id,after_day)order by r.starts_at,r.program,r.day limit 51)
 select(select count(*)from scoped),coalesce((select jsonb_agg(to_jsonb(r)order by r.starts_at,r.program,r.day)from page r),'[]'),
 after_at is null or exists(select 1 from scoped r where(r.starts_at,r.program,r.day)=(after_at,after_id,after_day))
 into total,candidates,valid_cursor;
 if not valid_cursor then raise exception 'Invalid current cursor'using errcode='22023';end if;
 for q in select *from jsonb_to_recordset(candidates)as r(id uuid,program uuid,day date,scheduled date,starts_at timestamptz,ends_at timestamptz,title text,branch text,sport text,sport_ar text,timezone text,state text,published boolean,capacity integer,roster_count integer)order by r.starts_at,r.program,r.day loop
  item:=jsonb_build_object('id',q.id,'program',q.program,'day',q.day,'date',q.scheduled,'starts_at',q.starts_at,'ends_at',q.ends_at,'title',q.title,'branch',q.branch,'sport',q.sport,'sport_ar',q.sport_ar,'timezone',q.timezone,'state',q.state,'published',q.published,
   'capacity',case when actor='guardian'then null else q.capacity end,'roster_count',case when actor='guardian'then null else q.roster_count end,
   'cursor',jsonb_build_object('at',q.starts_at,'id',q.program,'day',q.day,'from',first_date,'to',last_date));
  if jsonb_array_length(items)>=50 or octet_length((items||jsonb_build_array(item))::text)>26000 then more:=true;exit;end if;
  items:=items||jsonb_build_array(item);cursor:=item->'cursor';
 end loop;
 if more and jsonb_array_length(items)=0 then raise exception 'Projection too large'using errcode='54000';end if;
 return jsonb_build_object('context',ctx,'as_of',clock_timestamp(),'from',first_date,'to',last_date,'total',total,'items',items,'more',more,'next',case when more then cursor else null end);
end$$;

create function public.x15_owner_calendar_v1(a uuid,first_date date,last_date date,after_at timestamptz default null,after_id uuid default null,after_day date default null)returns jsonb
language sql security definer set search_path=''set statement_timeout='3s'set lock_timeout='2s'as $$select academy.x15_calendar(a,'owner',null,first_date,last_date,after_at,after_id,after_day)$$;
create function public.x15_trainer_calendar_v1(a uuid,first_date date,last_date date,after_at timestamptz default null,after_id uuid default null,after_day date default null)returns jsonb
language sql security definer set search_path=''set statement_timeout='3s'set lock_timeout='2s'as $$select academy.x15_calendar(a,'trainer',null,first_date,last_date,after_at,after_id,after_day)$$;
create function public.x15_guardian_calendar_v1(a uuid,link uuid,first_date date,last_date date,after_at timestamptz default null,after_id uuid default null,after_day date default null)returns jsonb
language sql security definer set search_path=''set statement_timeout='3s'set lock_timeout='2s'as $$select academy.x15_calendar(a,'guardian',link,first_date,last_date,after_at,after_id,after_day)$$;

create function academy.x15_home(a uuid,actor text,link uuid default null)returns jsonb
language plpgsql security invoker set search_path=''as $$
declare ctx jsonb;s text:=academy.verified_subject();today date;cal jsonb;sessions jsonb;panels jsonb:='{}';n bigint;pending bigint;next_item jsonb;feedback jsonb;tasks jsonb;begin
 ctx:=academy.x15_context(a,actor,link);
 if coalesce((ctx->>'setup_required')::boolean,false)then return jsonb_build_object('context',ctx,'as_of',clock_timestamp(),'setup_required',true);end if;
 today:=(ctx->>'today')::date;
 if actor<>'guardian'or coalesce((ctx->>'training_enabled')::boolean,false)then
  cal:=academy.x15_calendar(a,actor,link,today,today,null,null,null);
  select coalesce(jsonb_agg(v),'[]')into sessions from(select value v from jsonb_array_elements(cal->'items')limit 5)q;
  panels:=panels||jsonb_build_object('today',jsonb_build_object('state','ready','count',cal->'total','items',sessions,'more',(cal->>'total')::bigint>jsonb_array_length(sessions)));
 else panels:=panels||jsonb_build_object('today',jsonb_build_object('state','unavailable'));end if;
 if actor='owner'then
  select count(*)into n from academy.training_programs p where p.academy_id=a and p.branch_id=(ctx->>'branch_id')::uuid and p.state<>'ready';
  panels:=panels||jsonb_build_object('unfinished_programs',jsonb_build_object('state','ready','count',n));
  select count(*)into n from academy.publication_jobs j where j.academy_id=a and j.actor=s and j.state in('preparing','ready');
  panels:=panels||jsonb_build_object('private_publication_reviews',jsonb_build_object('state','ready','count',n));
  select count(*)into n from academy.correction_requests r where r.academy_id=a and r.requester<>s and academy.c12_state(r)='pending';
  panels:=panels||jsonb_build_object('corrections',jsonb_build_object('state','ready','count',n));
  select count(*)into n from academy.development_assessments r where r.academy_id=a and r.state='submitted' and r.author<>s;
  panels:=panels||jsonb_build_object('feedback_reviews',jsonb_build_object('state','ready','count',n));
  select count(*)into n from academy.trainer_invitations i where i.academy_id=a and i.state='pending' and i.expires_at>clock_timestamp();
  select count(*)into pending from academy.guardian_invitations i where i.academy_id=a and i.state='pending' and i.expires_at>clock_timestamp();
  panels:=panels||jsonb_build_object('invitations',jsonb_build_object('state','ready','count',n+pending));
 elsif actor='trainer'then
  select count(*)into n from academy.development_assessments r where r.academy_id=a and r.author=s and r.state in('draft','returned')and academy.e14_author_current(r);
  panels:=panels||jsonb_build_object('feedback_drafts',jsonb_build_object('state','ready','count',n));
  select count(*)into n from academy.correction_requests r where r.academy_id=a and r.requester=s and academy.c12_state(r)='pending';
  panels:=panels||jsonb_build_object('corrections',jsonb_build_object('state','ready','count',n));
  select jsonb_build_object('id',e.id,'title',e.projection->>'name','starts_at',e.starts_at,'ends_at',e.ends_at,'timezone',e.projection->>'timezone')into next_item
  from academy.publication_heads h join academy.publication_events e on e.id=h.event_id and e.academy_id=a
  join academy.training_dates d on d.program_id=e.program_id and d.local_date=e.day and d.academy_id=a and not d.canceled and d.starts_at=e.starts_at and d.ends_at=e.ends_at
  where h.academy_id=a and e.published and e.trainer_id=(ctx->>'staff')::uuid and e.ends_at>=clock_timestamp()and academy.q6_eligible(a,e.branch_id,e.trainer_id)order by e.starts_at,e.id limit 1;
  panels:=panels||jsonb_build_object('next_session',jsonb_build_object('state','ready','item',next_item));
 elsif actor='guardian'then
  if coalesce((ctx->>'training_enabled')::boolean,false)then
   perform academy.b11_player(a,link);
   select academy.b11_item(e,(ctx->>'player')::uuid)into next_item from academy.publication_heads h join academy.publication_events e on e.id=h.event_id and e.academy_id=a
   join academy.publication_rosters ro on ro.event_id=e.id and ro.player_id=(ctx->>'player')::uuid
   join academy.training_dates d on d.program_id=e.program_id and d.local_date=e.day and d.academy_id=a and not d.canceled and d.starts_at=e.starts_at and d.ends_at=e.ends_at
   where h.academy_id=a and e.published and e.ends_at>=clock_timestamp()order by e.starts_at,e.id limit 1;
   panels:=panels||jsonb_build_object('next_session',jsonb_build_object('state','ready','item',next_item));
   select academy.b11_item(e,(ctx->>'player')::uuid)into next_item from academy.publication_heads h join academy.publication_events e on e.id=h.event_id and e.academy_id=a
   join academy.publication_rosters ro on ro.event_id=e.id and ro.player_id=(ctx->>'player')::uuid
   join academy.training_dates d on d.program_id=e.program_id and d.local_date=e.day and d.academy_id=a and not d.canceled and d.starts_at=e.starts_at and d.ends_at=e.ends_at
   where h.academy_id=a and e.published and e.ends_at<clock_timestamp()order by e.ends_at desc,e.id desc limit 1;
   panels:=panels||jsonb_build_object('recent_attendance',jsonb_build_object('state','ready','item',next_item));
  else panels:=panels||jsonb_build_object('next_session',jsonb_build_object('state','unavailable'),'recent_attendance',jsonb_build_object('state','unavailable'));end if;
  if coalesce((ctx->>'development_enabled')::boolean,false)then
   perform academy.e14_link(a,link);
   select jsonb_build_object('id',r.id,'publication',p.id,'revision',p.revision,'created_at',p.created_at,'title',p.context->>'title')into feedback
   from academy.development_assessments r join academy.development_publications p on p.id=r.publication_id
   where r.academy_id=a and r.player_id=(ctx->>'player')::uuid order by p.created_at desc,p.id desc limit 1;
   panels:=panels||jsonb_build_object('latest_feedback',jsonb_build_object('state','ready','item',feedback));
  else panels:=panels||jsonb_build_object('latest_feedback',jsonb_build_object('state','unavailable'));end if;
 end if;
 if actor='owner'then
  select coalesce(jsonb_agg(to_jsonb(q)),'[]')into tasks from(select p.id,p.definition->>'name'title,'program'kind from academy.training_programs p where p.academy_id=a and p.branch_id=(ctx->>'branch_id')::uuid and p.state<>'ready'order by p.id limit 5)q;
  panels:=jsonb_set(panels,'{unfinished_programs,tasks}',tasks);
  select coalesce(jsonb_agg(to_jsonb(q)),'[]')into tasks from(select j.id,j.program_id program,j.kind title,'publication'kind from academy.publication_jobs j where j.academy_id=a and j.actor=s and j.state in('preparing','ready')order by j.created_at,j.id limit 5)q;
  panels:=jsonb_set(panels,'{private_publication_reviews,tasks}',tasks);
  select coalesce(jsonb_agg(to_jsonb(q)),'[]')into tasks from(select r.id,r.event_id event,r.player_id player,'correction'kind from academy.correction_requests r where r.academy_id=a and r.requester<>s and academy.c12_state(r)='pending'order by r.created_at,r.id limit 5)q;
  panels:=jsonb_set(panels,'{corrections,tasks}',tasks);
  select coalesce(jsonb_agg(to_jsonb(q)),'[]')into tasks from(select r.id,r.event_id event,r.player_id player,'feedback'kind from academy.development_assessments r where r.academy_id=a and r.state='submitted'and r.author<>s order by r.created_at,r.id limit 5)q;
  panels:=jsonb_set(panels,'{feedback_reviews,tasks}',tasks);
 elsif actor='trainer'then
  select coalesce(jsonb_agg(to_jsonb(q)),'[]')into tasks from(select r.id,r.event_id event,r.player_id player,'feedback'kind from academy.development_assessments r where r.academy_id=a and r.author=s and r.state in('draft','returned')and academy.e14_author_current(r)order by r.created_at,r.id limit 5)q;
  panels:=jsonb_set(panels,'{feedback_drafts,tasks}',tasks);
  select coalesce(jsonb_agg(to_jsonb(q)),'[]')into tasks from(select r.id,r.event_id event,r.player_id player,'correction'kind from academy.correction_requests r where r.academy_id=a and r.requester=s and academy.c12_state(r)='pending'order by r.created_at,r.id limit 5)q;
  panels:=jsonb_set(panels,'{corrections,tasks}',tasks);
 end if;
 if actor in('owner','trainer')then
  select count(*)into n from academy.publication_heads h join academy.publication_events e on e.id=h.event_id and e.academy_id=a
  join academy.training_dates d on d.program_id=e.program_id and d.local_date=e.day and d.academy_id=a and not d.canceled and d.starts_at=e.starts_at and d.ends_at=e.ends_at
  where h.academy_id=a and e.published and e.starts_at<=clock_timestamp()and e.ends_at+interval '24 hours'>=clock_timestamp()
  and(actor='owner'or e.trainer_id=(ctx->>'staff')::uuid and academy.q6_eligible(a,e.branch_id,e.trainer_id))
  and exists(select 1 from academy.publication_rosters ro where ro.event_id=e.id and not exists(select 1 from academy.attendance_marks m where m.academy_id=a and m.program_id=e.program_id and m.day=e.day and m.player_id=ro.player_id));
  panels:=panels||jsonb_build_object('incomplete_attendance',jsonb_build_object('state','ready','count',n));
  select coalesce(jsonb_agg(to_jsonb(q)),'[]')into tasks from(
   select e.id,e.projection->>'name'title,'attendance'kind from academy.publication_heads h join academy.publication_events e on e.id=h.event_id and e.academy_id=a
   join academy.training_dates d on d.program_id=e.program_id and d.local_date=e.day and d.academy_id=a and not d.canceled and d.starts_at=e.starts_at and d.ends_at=e.ends_at
   where h.academy_id=a and e.published and e.starts_at<=clock_timestamp()and e.ends_at+interval '24 hours'>=clock_timestamp()
   and(actor='owner'or e.trainer_id=(ctx->>'staff')::uuid and academy.q6_eligible(a,e.branch_id,e.trainer_id))
   and exists(select 1 from academy.publication_rosters ro where ro.event_id=e.id and not exists(select 1 from academy.attendance_marks m where m.academy_id=a and m.program_id=e.program_id and m.day=e.day and m.player_id=ro.player_id))
   order by e.starts_at,e.id limit 5)q;
  panels:=jsonb_set(panels,'{incomplete_attendance,tasks}',tasks);
 end if;
 return jsonb_build_object('context',ctx,'as_of',clock_timestamp(),'panels',panels);
end$$;
create function public.x15_owner_home_v1(a uuid)returns jsonb language sql security definer set search_path=''set statement_timeout='3s'set lock_timeout='2s'as $$select academy.x15_home(a,'owner')$$;
create function public.x15_trainer_home_v1(a uuid)returns jsonb language sql security definer set search_path=''set statement_timeout='3s'set lock_timeout='2s'as $$select academy.x15_home(a,'trainer')$$;
create function public.x15_guardian_home_v1(a uuid,link uuid)returns jsonb language sql security definer set search_path=''set statement_timeout='3s'set lock_timeout='2s'as $$select academy.x15_home(a,'guardian',link)$$;

-- Extend the latest verified method/target proof gate; do not replace earlier authority checks.
do $$declare definition text;begin
 select pg_get_functiondef('academy.verified_subject()'::regprocedure)into definition;
 if position('|a10_register_v1' in definition)=0 then raise exception 'Latest register proof target missing';end if;
 execute replace(definition,'|a10_register_v1','|x15_owner_calendar_v1|x15_trainer_calendar_v1|x15_guardian_calendar_v1|x15_owner_home_v1|x15_trainer_home_v1|x15_guardian_home_v1|a10_register_v1');
end$$;

do $$declare f record;begin
 for f in select p.oid::regprocedure sig,n.nspname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where p.proname like 'x15_%'and n.nspname in('academy','public')loop
  execute format('revoke all on function %s from public,anon,authenticated',f.sig);
  if f.nspname='public'then execute format('grant execute on function %s to authenticated',f.sig);end if;
 end loop;
end$$;
