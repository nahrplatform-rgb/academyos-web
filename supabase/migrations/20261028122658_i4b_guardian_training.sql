-- Accepted I4b read-only projection. No accounts, links, access opt-ins or marks seeded.
-- Exact-link rollout opt-in prevents earlier narrow grants silently expanding.
create table academy.guardian_training_access(
 link_id uuid primary key references academy.guardian_links(id),enabled boolean not null default false
);
alter table academy.guardian_training_access enable row level security;
revoke all on academy.guardian_training_access from public,anon,authenticated;
create index publication_rosters_player_event on academy.publication_rosters(player_id,event_id);
create index publication_events_family_time on academy.publication_events(academy_id,starts_at,id) where published;
create function academy.b11_player(a uuid,link uuid)returns jsonb language plpgsql security invoker set search_path=''as $$
declare g uuid;s text;result jsonb;begin
 perform academy.g3_lock(a);perform academy.t4_lock(a);g:=academy.g3_guardian(a);s:=academy.verified_subject();
 select jsonb_build_object('link',l.id,'player',p.id,'name',p.display_name,'branch',b.name,'academy',a,'academy_name',ac.name)into result
 from academy.guardian_links l join academy.guardian_training_access c on c.link_id=l.id and c.enabled
 join academy.guardian_invitations v on v.id=l.invitation_id and v.academy_id=a and v.player_id=l.player_id and v.state='accepted'and v.accepted_by=s
 join academy.players p on p.id=l.player_id and p.academy_id=a join academy.branches b on b.id=p.branch_id and b.academy_id=a join academy.academies ac on ac.id=a
 where l.id=link and l.academy_id=a and l.guardian_id=g and l.state='active';
 if result is null then raise exception 'Access denied'using errcode='42501';end if;return result;
end$$;
create function public.b11_links_v1(a uuid,after_id uuid default null)returns jsonb language plpgsql security definer set search_path=''set statement_timeout='3s'set lock_timeout='2s'as $$
declare g uuid;s text;items jsonb;more boolean;begin
 perform academy.g3_lock(a);g:=academy.g3_guardian(a);s:=academy.verified_subject();
 select coalesce(jsonb_agg(to_jsonb(q)order by q.id),'[]')into items from(
 select l.id,p.display_name,b.name branch_name,ac.name academy_name from academy.guardian_links l
 join academy.guardian_training_access c on c.link_id=l.id and c.enabled
 join academy.guardian_invitations v on v.id=l.invitation_id and v.academy_id=a and v.player_id=l.player_id and v.state='accepted'and v.accepted_by=s
 join academy.players p on p.id=l.player_id and p.academy_id=a join academy.branches b on b.id=p.branch_id and b.academy_id=a join academy.academies ac on ac.id=a
 where l.academy_id=a and l.guardian_id=g and l.state='active'and(after_id is null or l.id>after_id)order by l.id limit 26)q;
 more:=jsonb_array_length(items)>25;if more then items:=items-25;end if;
 while octet_length(items::text)>30000 and jsonb_array_length(items)>1 loop items:=items-(jsonb_array_length(items)-1);more:=true;end loop;
 if octet_length(items::text)>30000 then raise exception 'Projection too large'using errcode='54000';end if;
 return jsonb_build_object('items',items,'more',more);
end$$;
create function academy.b11_item(e academy.publication_events,player uuid)returns jsonb language sql stable security invoker set search_path=''as $$
 select jsonb_build_object('id',e.id,'starts_at',e.starts_at,'ends_at',e.ends_at,'date',to_char(e.starts_at at time zone(e.projection->>'timezone'),'YYYY-MM-DD'),
 'title',e.projection->>'name','branch',e.projection->>'branch','sport',e.projection->>'sport','sport_ar',e.projection->>'sport_ar','timezone',e.projection->>'timezone',
 'status',m.status,'corrected',coalesce(m.version>1,false),'updated_at',(select h.received_at from academy.attendance_history h where h.academy_id=e.academy_id and h.program_id=e.program_id and h.day=e.day and h.player_id=b11_item.player and h.version=m.version))
 from (select 1)dummy left join academy.attendance_marks m on m.academy_id=e.academy_id and m.program_id=e.program_id and m.day=e.day and m.player_id=b11_item.player
$$;
create function public.b11_schedule_v1(a uuid,link uuid,first_date date,after_at timestamptz default null,after_event uuid default null)returns jsonb language plpgsql security definer set search_path=''set statement_timeout='3s'set lock_timeout='2s'as $$
declare ctx jsonb;pid uuid;items jsonb:='[]';item jsonb;e academy.publication_events;more boolean:=false;next_item jsonb;begin
 ctx:=academy.b11_player(a,link);pid:=(ctx->>'player')::uuid;
 if first_date is null or not isfinite(first_date)or first_date<'0001-01-01'::date or first_date>'9999-12-24'::date or(after_at is null)<>(after_event is null)or(after_at is not null and not isfinite(after_at))then raise exception 'Invalid period/cursor'using errcode='22023';end if;
 for e in select x.*from academy.publication_heads h join academy.publication_events x on x.id=h.event_id and x.academy_id=h.academy_id
 join academy.publication_rosters r on r.event_id=x.id and r.player_id=pid
 where h.academy_id=a and x.published and(x.starts_at at time zone(x.projection->>'timezone'))::date between first_date and first_date+6
 and(after_at is null or(x.starts_at,x.id)>(after_at,after_event))order by x.starts_at,x.id limit 26 loop
 item:=academy.b11_item(e,pid);
 if jsonb_array_length(items)>=25 or octet_length((items||jsonb_build_array(item))::text)>28000 then more:=true;exit;end if;items:=items||jsonb_build_array(item);
 end loop;
 select academy.b11_item(x,pid)into next_item from academy.publication_heads h join academy.publication_events x on x.id=h.event_id and x.academy_id=h.academy_id join academy.publication_rosters r on r.event_id=x.id and r.player_id=pid
 where h.academy_id=a and x.published and x.starts_at>=clock_timestamp()order by x.starts_at,x.id limit 1;
 return jsonb_build_object('context',ctx,'from',first_date,'to',first_date+6,'items',items,'more',more,'next',next_item);
end$$;
create function public.b11_detail_v1(a uuid,link uuid,event uuid)returns jsonb language plpgsql security definer set search_path=''set statement_timeout='3s'set lock_timeout='2s'as $$
declare ctx jsonb;e academy.publication_events;begin
 ctx:=academy.b11_player(a,link);
 select x.*into e from academy.publication_heads h join academy.publication_events x on x.id=h.event_id and x.academy_id=h.academy_id join academy.publication_rosters r on r.event_id=x.id and r.player_id=(ctx->>'player')::uuid
 where h.academy_id=a and x.id=event and x.published;
 if not found then raise exception 'Access denied'using errcode='42501';end if;
 return jsonb_build_object('context',ctx,'item',academy.b11_item(e,(ctx->>'player')::uuid));
end$$;
revoke all on function academy.b11_player(uuid,uuid),academy.b11_item(academy.publication_events,uuid)from public,anon,authenticated;
revoke all on function public.b11_links_v1(uuid,uuid),public.b11_schedule_v1(uuid,uuid,date,timestamptz,uuid),public.b11_detail_v1(uuid,uuid,uuid)from public,anon;
grant execute on function public.b11_links_v1(uuid,uuid),public.b11_schedule_v1(uuid,uuid,date,timestamptz,uuid),public.b11_detail_v1(uuid,uuid,uuid)to authenticated;

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
 if method is distinct from 'POST' or path is null or path !~ '^/rpc/(m1_context_v1|m1_platform_list_v1|m1_setup_v1|m1_operation_v1|m1_create_v1|m1_save_setup_v1|m1_manage_invitation_v1|m1_invitation_v1|bootstrap_identity_v1|my_academy_memberships_v1|i2_people_v1|i2_candidates_v1|i2_profile_v1|i2_register_v1|i2_operation_v1|g3_owner_list_v1|g3_command_v1|g3_operation_v1|g3_invitation_v1|g3_links_v1|t4_owner_list_v1|t4_command_v1|t4_operation_v1|t4_invitation_v1|t4_profile_v1|p5_list_v1|p5_preview_v1|p5_create_v1|p5_read_v1|p5_step_v1|p5_operation_v1|p5_dates_v1|q6_read_v1|q6_candidates_v1|q6_review_v1|q6_save_v1|q6_operation_v1|r7_create_v1|r7_list_v1|r7_read_v1|r7_change_v1|r7_operation_v1|s8_create_v1|s8_read_v1|s8_jobs_v1|s8_change_v1|s8_operation_v1|s8_owner_dates_v1|s8_schedule_v1|s8_roster_v1|q6_review_v2|q6_save_v2|t9_read_v1|t9_review_v1|t9_save_v1|t9_operation_v1|a10_roster_v1|a10_history_v1|a10_mark_v1|a10_operation_v1|b11_links_v1|b11_schedule_v1|b11_detail_v1)$' then
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
