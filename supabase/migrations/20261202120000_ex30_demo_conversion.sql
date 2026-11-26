-- EX-30 Phase 4: Demo to real academy conversion.
-- Clean academy creation on subscribe. Demo data is not copied.

-- Conversion tracking table
create table if not exists academy.platform_demo_conversions (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references academy.platform_demo_prospects,
  demo_academy_id uuid not null references academy.academies,
  new_academy_id uuid not null references academy.academies,
  verified_email text not null,
  carried_name text,
  carried_language text,
  carried_sport text,
  converted_at timestamptz not null default now(),
  converted_by text not null
);

-- Function to convert demo to real academy
create or replace function public.x30_convert_demo(p_demo_academy_id uuid, p_verified_email text,
  p_academy_name text, p_language text, p_sport text) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='8s' set lock_timeout='3s' as $$
declare subject_id text; demo_lifecycle academy.platform_demo_lifecycle;
  prospect_id uuid; new_academy_id uuid; conversion_id uuid;
begin
  subject_id := academy.verified_subject();
  -- Verify demo exists and is active
  select * into demo_lifecycle from academy.platform_demo_lifecycle where academy_id=p_demo_academy_id;
  if not found then raise exception 'Demo not found' using errcode='22023'; end if;
  if demo_lifecycle.converted_at is not null then raise exception 'Demo already converted' using errcode='23505'; end if;
  if demo_lifecycle.deleted_at is not null then raise exception 'Demo has been deleted' using errcode='22023'; end if;
  -- Get prospect ID
  select prospect_id into prospect_id from academy.platform_demo_invitations
    where academy_id=p_demo_academy_id limit 1;
  -- Create new clean academy (not a copy of demo data)
  new_academy_id := gen_random_uuid();
  insert into academy.academies(id,name,setup_complete,account_type,timezone)
    values(new_academy_id,coalesce(p_academy_name,'New Academy'),false,'free','Africa/Cairo');
  -- Record conversion
  conversion_id := gen_random_uuid();
  insert into academy.platform_demo_conversions(id,prospect_id,demo_academy_id,new_academy_id,
    verified_email,carried_name,carried_language,carried_sport,converted_by)
    values(conversion_id,prospect_id,p_demo_academy_id,new_academy_id,p_verified_email,
      p_academy_name,p_language,p_sport,subject_id);
  -- Mark demo as converted
  update academy.platform_demo_lifecycle
    set converted_at=now(), converted_academy_id=new_academy_id
    where academy_id=p_demo_academy_id;
  -- Schedule demo for cleanup (30 days)
  -- (cleanup is handled by a separate job)
  return jsonb_build_object('conversionId',conversion_id,'newAcademyId',new_academy_id,
    'demoAcademyId',p_demo_academy_id,'verifiedEmail',p_verified_email);
end $$;

-- Revoke/grant
do $$
declare entry record;
begin
  for entry in select n.nspname,f.oid::regprocedure as signature from pg_proc f
    join pg_namespace n on n.oid=f.pronamespace where n.nspname in ('public','academy') and f.proname in ('x30_convert_demo')
  loop
    execute format('revoke all on function %s from public,anon,authenticated',entry.signature);
    if entry.nspname='public' then
      execute format('grant execute on function %s to authenticated',entry.signature);
    end if;
  end loop;
end $$;
