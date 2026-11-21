-- EX-04: bounded read-only Owner register transfer. No local key, grant or writer change.
-- Not applied to hosted staging by this checkpoint.
create function academy.x17_hash(v text) returns text language sql immutable security invoker set search_path='' as $$
 select encode(extensions.digest(convert_to(v,'UTF8'),'sha256'),'hex')
$$;
create function academy.x17_frame(v text) returns text language sql immutable security invoker set search_path='' as $$
 select case when v is null then 'n;' else 's'||octet_length(convert_to(v,'UTF8'))::text||':'||v end
$$;
create function academy.x17_header(a uuid,e academy.publication_events,n integer,saved integer) returns jsonb
language sql volatile security invoker set search_path='' as $$
 select jsonb_build_object('event',e.id,'program',e.program_id,'day',e.day,
 'scheduled_day',coalesce(e.projection->>'scheduled_day',e.day::text),
 'starts_at',to_char(e.starts_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
 'ends_at',to_char(e.ends_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
 'projection',jsonb_build_object('name',e.projection->>'name','branch',e.projection->>'branch',
 'timezone',e.projection->>'timezone','sport',e.projection->>'sport','sport_ar',e.projection->>'sport_ar'),
 'owner',true,'count',n,'saved',saved,'protected',saved>0,
 'closes_at',to_char((e.ends_at+interval '24 hours')at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
 'server_now',to_char(clock_timestamp()at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
 'open',clock_timestamp()>=e.starts_at and clock_timestamp()<=e.ends_at+interval '24 hours')
$$;
create function academy.x17_header_hash(a uuid,h jsonb) returns text language plpgsql immutable security invoker set search_path='' as $$
declare v text;msg text:='x17-header-v1';begin
 foreach v in array array[a::text,h->>'event',h->>'program',h->>'day',h->>'scheduled_day',h->>'starts_at',h->>'ends_at',
 h#>>'{projection,name}',h#>>'{projection,branch}',h#>>'{projection,timezone}',h#>>'{projection,sport}',h#>>'{projection,sport_ar}',
 h->>'owner',h->>'closes_at',h->>'count',h->>'saved',h->>'protected'] loop msg:=msg||academy.x17_frame(v);end loop;
 return academy.x17_hash(msg);
end$$;
create function academy.x17_chain(previous text,players jsonb) returns text language plpgsql immutable security invoker set search_path='' as $$
declare p jsonb;root text:=previous;begin
 for p in select value from jsonb_array_elements(players) loop
  if (p->>'version')::numeric>9007199254740991 then raise exception 'Version exceeds client bound'using errcode='22023';end if;
  root:=academy.x17_hash('x17-row-v1'||academy.x17_frame(root)||academy.x17_frame(p->>'id')||
   academy.x17_frame(p->>'name')||academy.x17_frame(p->>'status')||academy.x17_frame(p->>'version'));
 end loop;return root;
end$$;
create function academy.x17_signature(s text,p jsonb) returns text language sql stable security invoker set search_path='' as $$
 select encode(extensions.hmac(jsonb_build_array('x17-register-download-v1',s,p)::text,k.secret,'sha256'),'hex')
 from academy.m1_secrets k where k.purpose='onboarding'
$$;
create function academy.x17_receipt(s text,p jsonb) returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare sig text:=academy.x17_signature(s,p);begin
 if sig is null then raise exception 'Signing unavailable'using errcode='XX000';end if;
 return jsonb_build_object('payload',p,'signature',sig);
end$$;
create function academy.x17_proof(r jsonb,s text,a uuid,ev uuid) returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare p jsonb:=r->'payload';k text;begin
 if jsonb_typeof(r)is distinct from'object'or r-array['payload','signature']<>'{}'::jsonb or
 jsonb_typeof(p)is distinct from'object'or p-array['v','a','ev','revision','head','acc','count','total_saved','seen','saved','cursor','issued','phase']<>'{}'::jsonb or
 p->>'v'is distinct from'1'or p->>'a'is distinct from a::text or p->>'ev'is distinct from ev::text or
 p->>'phase'is distinct from'transfer'or coalesce(r->>'signature','')!~'^[a-f0-9]{64}$'then
 raise exception 'Invalid transfer receipt'using errcode='22023';end if;
 foreach k in array array['revision','head','acc']loop
 if jsonb_typeof(p->k)is distinct from'string'or coalesce(p->>k,'')!~'^[a-f0-9]{64}$'then raise exception 'Invalid transfer receipt'using errcode='22023';end if;end loop;
 foreach k in array array['count','total_saved','seen','saved']loop
 if jsonb_typeof(p->k)is distinct from'number'or coalesce(p->>k,'')!~'^[0-9]{1,4}$'or(p->>k)::integer>1000 then raise exception 'Invalid transfer receipt'using errcode='22023';end if;end loop;
 if (p->>'total_saved')::integer>(p->>'count')::integer or(p->>'seen')::integer>(p->>'count')::integer or
 (p->>'saved')::integer>(p->>'seen')::integer or(p->>'saved')::integer>(p->>'total_saved')::integer or
 jsonb_typeof(p->'issued')is distinct from'number'or coalesce(p->>'issued','')!~'^[0-9]{10,12}$'or
 ((p->>'seen')::integer=0 and p->'cursor'is distinct from'null'::jsonb)or
 ((p->>'seen')::integer>0 and(jsonb_typeof(p->'cursor')is distinct from'string'or coalesce(p->>'cursor','')!~'^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$'))then
 raise exception 'Invalid transfer receipt'using errcode='22023';end if;
 if academy.x17_signature(s,p)is null or r->>'signature'is distinct from academy.x17_signature(s,p)then raise exception 'Invalid transfer receipt'using errcode='22023';end if;
 return p;
end$$;
-- At most1001 scoped rows are materialized; no persistent server snapshot or new counter.
create function academy.x17_scan(a uuid,e academy.publication_events) returns jsonb language plpgsql volatile security invoker set search_path='' as $$
declare rows jsonb;h jsonb;head text;acc text;n integer;saved integer;begin
 if e.roster_count>1000 then raise exception 'Register transfer exceeds bound'using errcode='22023';end if;
 select coalesce(jsonb_agg(to_jsonb(q)order by q.id),'[]'::jsonb)into rows from(
 select r.player_id id,r.name,m.status,coalesce(m.version,0)version
 from(select player_id,name from academy.publication_rosters where event_id=e.id order by player_id limit 1001)r
 left join academy.attendance_marks m on m.academy_id=a and m.event_id=e.id and m.program_id=e.program_id and m.day=e.day and m.player_id=r.player_id)q;
 n:=jsonb_array_length(rows);if n>1000 or n<>e.roster_count then raise exception 'Register transfer count invariant'using errcode='22023';end if;
 select count(*)into saved from jsonb_array_elements(rows)r where r->>'status'is not null;
 h:=academy.x17_header(a,e,n,saved);head:=academy.x17_header_hash(a,h);
 acc:=academy.x17_chain(academy.x17_hash('x17-seed-v1'||head),rows);
 return jsonb_build_object('header',h,'head',head,'acc',acc,'revision',academy.x17_hash('x17-root-v1'||head||acc),'rows',rows);
end$$;
create function public.x17_register_download_v1(a uuid,ev uuid,act text,previous jsonb default null,expected text default null,after_id uuid default null)
returns jsonb language plpgsql security definer set search_path=''set statement_timeout='3s'set lock_timeout='2s'as $$
declare s text;e academy.publication_events;scan jsonb;h jsonb;p jsonb;receipt jsonb;items jsonb;prefix jsonb;
 head text;acc text;revision text;seen integer:=0;saved integer:=0;more boolean;cursor_id uuid;stamp bigint;begin
 if a is null or ev is null or act is null or act not in('manifest','page','complete')or
 (act='manifest'and previous is not null)or(act<>'manifest'and(expected is not null or after_id is not null))or
 (expected is not null and expected!~'^[a-f0-9]{64}$')or(after_id is not null and expected is null)then
 raise exception 'Invalid download command'using errcode='22023';end if;
 perform academy.t4_lock(a);s:=academy.m1_owner(a);e:=academy.a10_target(a,ev);
 stamp:=floor(extract(epoch from clock_timestamp()))::bigint;
 if act='manifest'then
  scan:=academy.x17_scan(a,e);h:=scan->'header';head:=scan->>'head';revision:=scan->>'revision';
  acc:=academy.x17_hash('x17-seed-v1'||head);
  if after_id is not null then
   if expected<>revision then return jsonb_build_object('error','changed');end if;
   select coalesce(jsonb_agg(r order by(r->>'id')::uuid),'[]'::jsonb)into prefix from jsonb_array_elements(scan->'rows')r where(r->>'id')::uuid<=after_id;
   if prefix->-1->>'id'is distinct from after_id::text then raise exception 'Invalid resume cursor'using errcode='22023';end if;
   seen:=jsonb_array_length(prefix);select count(*)into saved from jsonb_array_elements(prefix)r where r->>'status'is not null;
   acc:=academy.x17_chain(acc,prefix);
  end if;
  p:=jsonb_build_object('v',1,'a',a,'ev',ev,'revision',revision,'head',head,'acc',acc,
   'count',h->'count','total_saved',h->'saved','seen',seen,'saved',saved,'cursor',after_id,'issued',stamp,'phase','transfer');
  return jsonb_build_object('kind','manifest','revision',revision,'header',h,'receipt',academy.x17_receipt(s,p),'unchanged',expected is not null and expected=revision);
 end if;
 p:=academy.x17_proof(previous,s,a,ev);
 if(p->>'issued')::bigint>stamp+5 then raise exception 'Invalid transfer time'using errcode='22023';end if;
 if(p->>'issued')::bigint<stamp-600 then return jsonb_build_object('error','expired');end if;
 head:=p->>'head';revision:=p->>'revision';h:=academy.x17_header(a,e,(p->>'count')::integer,(p->>'total_saved')::integer);
 if academy.x17_header_hash(a,h)<>head then return jsonb_build_object('error','changed');end if;
 if act='complete'then
  if(p->>'seen')::integer<>(p->>'count')::integer or(p->>'saved')::integer<>(p->>'total_saved')::integer then raise exception 'Incomplete transfer'using errcode='22023';end if;
  if academy.x17_hash('x17-root-v1'||head||(p->>'acc'))<>revision then return jsonb_build_object('error','changed');end if;
  scan:=academy.x17_scan(a,e);
  if scan->>'revision'<>revision then return jsonb_build_object('error','changed');end if;
  p:=p||jsonb_build_object('phase','complete','issued',stamp);
  return jsonb_build_object('kind','complete','revision',revision,'header',scan->'header','receipt',academy.x17_receipt(s,p));
 end if;
 if(p->>'seen')::integer>=(p->>'count')::integer then raise exception 'Transfer already covered'using errcode='22023';end if;
 cursor_id:=(p->>'cursor')::uuid;
 select coalesce(jsonb_agg(to_jsonb(q)order by q.id),'[]'::jsonb)into items from(
 select r.player_id id,r.name,m.status,coalesce(m.version,0)version
 from(select player_id,name from academy.publication_rosters where event_id=ev and(cursor_id is null or player_id>cursor_id)order by player_id limit 51)r
 left join academy.attendance_marks m on m.academy_id=a and m.event_id=ev and m.program_id=e.program_id and m.day=e.day and m.player_id=r.player_id)q;
 more:=jsonb_array_length(items)>50;if more then items:=items-50;end if;
 while jsonb_array_length(items)>1 and octet_length(items::text)>24576 loop items:=items-(jsonb_array_length(items)-1);more:=true;end loop;
 seen:=(p->>'seen')::integer+jsonb_array_length(items);
 select count(*)into saved from jsonb_array_elements(items)r where r->>'status'is not null;saved:=saved+(p->>'saved')::integer;
 if jsonb_array_length(items)=0 or seen>(p->>'count')::integer or saved>(p->>'total_saved')::integer or
 (not more and seen<>(p->>'count')::integer)or(more and seen>=(p->>'count')::integer)then return jsonb_build_object('error','changed');end if;
 acc:=academy.x17_chain(p->>'acc',items);p:=p||jsonb_build_object('seen',seen,'saved',saved,'cursor',items->-1->>'id','acc',acc);
 receipt:=academy.x17_receipt(s,p);
 if octet_length((jsonb_build_object('kind','page','revision',revision,'roster',h||jsonb_build_object('players',items,'more',more),'receipt',receipt))::text)>=32768 then raise exception 'Transfer page exceeds response bound'using errcode='22023';end if;
 return jsonb_build_object('kind','page','revision',revision,'roster',h||jsonb_build_object('players',items,'more',more),'receipt',receipt);
end$$;
revoke all on function public.x17_register_download_v1(uuid,uuid,text,jsonb,text,uuid)from public,anon,authenticated;
grant execute on function public.x17_register_download_v1(uuid,uuid,text,jsonb,text,uuid)to authenticated;
revoke all on function academy.x17_hash(text),academy.x17_frame(text),academy.x17_header(uuid,academy.publication_events,integer,integer),academy.x17_header_hash(uuid,jsonb),academy.x17_chain(text,jsonb),academy.x17_signature(text,jsonb),academy.x17_receipt(text,jsonb),academy.x17_proof(jsonb,text,uuid,uuid),academy.x17_scan(uuid,academy.publication_events)from public,anon,authenticated;
-- Extend only this exact method/path target, retaining all earlier caller gates.
do $$declare definition text;begin
 select pg_get_functiondef('academy.verified_subject()'::regprocedure)into definition;
 if position('|a10_roster_v1'in definition)=0 or position('|x17_register_download_v1'in definition)>0 then raise exception 'Unexpected gateway definition';end if;
 execute replace(definition,'|a10_roster_v1','|x17_register_download_v1|a10_roster_v1');
end$$;
