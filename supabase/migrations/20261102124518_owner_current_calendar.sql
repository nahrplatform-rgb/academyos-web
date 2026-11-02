-- EX-04: one cold Owner Calendar read, using current database authority and
-- the branch-local day. Existing explicit-period paging remains canonical.
create function public.x16_owner_current_calendar_v1(a uuid,mode text)returns jsonb
language plpgsql security definer set search_path=''set statement_timeout='3s'set lock_timeout='2s'as $$
declare ctx jsonb;anchor date;first_date date;last_date date;begin
 ctx:=academy.x15_context(a,'owner');
 if mode is null or mode not in('week','month')then raise exception 'Invalid calendar mode'using errcode='22023';end if;
 if coalesce((ctx->>'setup_required')::boolean,false)then
  return jsonb_build_object('context',ctx,'as_of',clock_timestamp(),'setup_required',true);
 end if;
 anchor:=(ctx->>'today')::date;
 if mode='month'then
  first_date:=date_trunc('month',anchor)::date;
  first_date:=first_date-extract(dow from first_date)::integer;
  last_date:=first_date+41;
 else first_date:=anchor;last_date:=anchor+6;end if;
 -- The existing projection rechecks current scope and owns totals, byte/page
 -- bounds and continuation. No Home aggregates or operating writes are added.
 return academy.x15_calendar(a,'owner',null,first_date,last_date,null,null,null)
  ||jsonb_build_object('anchor',anchor);
end$$;
revoke all on function public.x16_owner_current_calendar_v1(uuid,text)from public,anon,authenticated;
grant execute on function public.x16_owner_current_calendar_v1(uuid,text)to authenticated;

-- Extend the verified method/target allowlist without changing earlier gates.
do $$declare definition text;begin
 select pg_get_functiondef('academy.verified_subject()'::regprocedure)into definition;
 if position('|x15_owner_calendar_v1' in definition)=0 then raise exception 'Calendar proof target missing';end if;
 if position('|x16_owner_current_calendar_v1' in definition)>0 then raise exception 'Current calendar proof target already exists';end if;
 execute replace(definition,'|x15_owner_calendar_v1','|x16_owner_current_calendar_v1|x15_owner_calendar_v1');
end$$;
