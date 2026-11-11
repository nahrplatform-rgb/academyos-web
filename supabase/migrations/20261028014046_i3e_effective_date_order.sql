-- Effective chronological ordering; cursors still identify original occurrences.
create or replace function public.p5_dates_v1(a uuid,day_start date,after_day date default null,after_program uuid default null) returns jsonb language plpgsql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s' as $$
declare ctx jsonb:=academy.p5_context(a);items jsonb;more boolean;begin
 if day_start is null or (after_day is null)<>(after_program is null) then raise exception 'Invalid date cursor' using errcode='22023';end if;
 select coalesce(jsonb_agg(to_jsonb(q) order by q.scheduled_date,q.program_id,q.date),'[]') into items from (
 select d.local_date::text date,d.scheduled_date::text scheduled_date,d.canceled,d.program_id,(d.local_date-p.starts_on)/28 "window",p.definition->>'name' name,to_char(d.starts_local,'HH24:MI') start,to_char(d.ends_local,'HH24:MI') "end",p.timezone
 from academy.training_dates d join academy.training_programs p on p.id=d.program_id
 where d.academy_id=a and p.academy_id=a and p.state='ready' and d.scheduled_date between day_start and day_start+27
 and (after_day is null or (d.scheduled_date,d.program_id,d.local_date)>(select x.scheduled_date,x.program_id,x.local_date from academy.training_dates x where x.academy_id=a and x.program_id=after_program and x.local_date=after_day)) order by d.scheduled_date,d.program_id,d.local_date limit 26) q;
 more:=jsonb_array_length(items)>25;if more then items:=items-25;end if;return jsonb_build_object('items',items,'more',more,'from',day_start,'to',day_start+27);
end $$;
