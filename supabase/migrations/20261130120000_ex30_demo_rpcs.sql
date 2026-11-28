-- EX-30 Phase 1g: Demo RPC functions.
-- Secure invitation links, prospect tracking, lifecycle management.

-- Create a demo prospect and invitation
create or replace function public.x30_create_demo(p_name text, p_email text, p_phone text) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='8s' set lock_timeout='3s' as $$
declare subject_id text; prospect_id uuid; academy_id uuid; invitation_id uuid;
  token_hash text; expires_at timestamptz;
begin
  subject_id := academy.m1_platform();
  prospect_id := gen_random_uuid();
  academy_id := gen_random_uuid();
  -- Create prospect
  insert into academy.platform_demo_prospects(id,name,email,phone,created_by)
    values(prospect_id,p_name,p_email,p_phone,subject_id);
  -- Create demo academy (simplified - actual seeding happens in app layer)
  insert into academy.academies(id,name,setup_complete,account_type,timezone)
    values(academy_id,coalesce(p_name,'Demo Academy')||' (Demo)',true,'demo','Africa/Cairo');
  -- Create invitation
  invitation_id := gen_random_uuid();
  token_hash := encode(extensions.digest(gen_random_uuid()::text,'sha256'),'hex');
  expires_at := now() + interval '7 days';
  insert into academy.platform_demo_invitations(id,prospect_id,academy_id,token_hash,expires_at,created_by)
    values(invitation_id,prospect_id,academy_id,token_hash,expires_at,subject_id);
  -- Create lifecycle record
  insert into academy.platform_demo_lifecycle(academy_id) values(academy_id);
  return jsonb_build_object('prospectId',prospect_id,'academyId',academy_id,
    'invitationId',invitation_id,'tokenHash',token_hash,'expiresAt',expires_at);
end $$;

-- Validate and use an invitation link
create or replace function public.x30_use_invitation(p_token_hash text) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='8s' set lock_timeout='3s' as $$
declare inv academy.platform_demo_invitations; subject_id text;
begin
  subject_id := academy.verified_subject();
  select * into inv from academy.platform_demo_invitations
    where token_hash=p_token_hash and used_at is null and expires_at > now();
  if not found then raise exception 'Invalid or expired invitation' using errcode='22023'; end if;
  -- Mark as used
  update academy.platform_demo_invitations
    set used_at=now(), used_by=subject_id where id=inv.id;
  -- Update lifecycle
  update academy.platform_demo_lifecycle
    set last_active_at=now() where academy_id=inv.academy_id;
  return jsonb_build_object('academyId',inv.academy_id,'prospectId',inv.prospect_id);
end $$;

-- Hold a demo (90 days inactive)
create or replace function public.x30_hold_demo(p_academy_id uuid) returns void
language plpgsql security definer set search_path='' set statement_timeout='8s' set lock_timeout='3s' as $$
begin
  perform academy.m1_platform();
  update academy.platform_demo_lifecycle
    set held_at=now() where academy_id=p_academy_id and held_at is null and deleted_at is null;
end $$;

-- Delete a held demo (180 days held)
create or replace function public.x30_delete_demo(p_academy_id uuid) returns void
language plpgsql security definer set search_path='' set statement_timeout='8s' set lock_timeout='3s' as $$
begin
  perform academy.m1_platform();
  update academy.platform_demo_lifecycle
    set deleted_at=now() where academy_id=p_academy_id and held_at is not null and deleted_at is null;
  -- Soft-delete the academy (mark as deleted, don't actually remove data)
  update academy.academies set name=name||' (deleted)' where id=p_academy_id;
end $$;

-- Revoke/grant
do $$
declare entry record;
begin
  for entry in select n.nspname,f.oid::regprocedure as signature from pg_proc f
    join pg_namespace n on n.oid=f.pronamespace where n.nspname in ('public','academy') and f.proname in ('x30_create_demo','x30_use_invitation','x30_hold_demo','x30_delete_demo')
  loop
    execute format('revoke all on function %s from public,anon,authenticated',entry.signature);
    if entry.nspname='public' then
      execute format('grant execute on function %s to authenticated',entry.signature);
    end if;
  end loop;
end $$;
