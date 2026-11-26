-- Extend the existing signed RPCs without changing any agreement, invoice,
-- claim, settlement, or original-operation row. Legacy empty publish intents
-- still mean v1, so a delayed request cannot inadvertently publish v2.
do $migration$
declare
  target regprocedure := 'public.x23_command_v1(uuid,uuid,text,jsonb)'::regprocedure;
  definition text := pg_get_functiondef(target);
  old_publish text := $old$
    if payload<>'{}'::jsonb then raise exception 'Invalid plan' using errcode='22023'; end if;
    insert into academy.platform_plan_versions(id,version,price,trial_days,program_limit,created_by)
      values(created,1,100000,14,2,subject_id);
$old$;
  new_publish text := $new$
    if payload not in ('{}'::jsonb,'{"version":2}'::jsonb) then
      raise exception 'Invalid plan' using errcode='22023';
    end if;
    perform pg_advisory_xact_lock(hashtextextended('platform-commerce-offer-catalog',0));
    if payload='{"version":2}'::jsonb and not exists(
      select 1 from academy.platform_plan_versions where version=1
    ) then
      raise exception 'Publish version 1 first' using errcode='PT412';
    end if;
    insert into academy.platform_plan_versions(id,version,price,trial_days,program_limit,created_by)
      values(created,coalesce((payload->>'version')::integer,1),100000,14,
        case when payload='{}'::jsonb then 2 else 3 end,subject_id);
$new$;
begin
  if strpos(definition,old_publish)=0 then
    raise exception 'Unexpected EX-23 publish implementation';
  end if;
  execute replace(definition,old_publish,new_publish);
end
$migration$;

do $migration$
declare
  definition text := pg_get_functiondef('public.x23_context_v1(uuid,text)'::regprocedure);
  old_projection text := '''plan'',sub.plan_id,''trialStart'',sub.trial_start';
begin
  if strpos(definition,old_projection)=0 then
    raise exception 'Unexpected EX-23 agreement projection';
  end if;
  execute replace(definition,old_projection,
    '''plan'',sub.plan_id,''planVersion'',p.version,''trialStart'',sub.trial_start');
end
$migration$;
