-- EX-30 Phase 1g: serialize demo invitation redemption.
-- A possession link can be consumed once, even under concurrent requests.

create or replace function public.x30_use_invitation(p_token_hash text) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='8s' set lock_timeout='3s' as $$
declare inv academy.platform_demo_invitations; subject_id text;
begin
  subject_id := academy.verified_subject();
  if p_token_hash is null or p_token_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'Invalid or expired invitation' using errcode='22023';
  end if;
  select * into inv from academy.platform_demo_invitations
    where token_hash=p_token_hash and used_at is null and expires_at > now()
    for update;
  if not found then raise exception 'Invalid or expired invitation' using errcode='22023'; end if;
  update academy.platform_demo_invitations
    set used_at=now(), used_by=subject_id where id=inv.id;
  update academy.platform_demo_lifecycle
    set last_active_at=now() where academy_id=inv.academy_id;
  return jsonb_build_object('academyId',inv.academy_id,'prospectId',inv.prospect_id);
end $$;

revoke all on function public.x30_use_invitation(text) from public,anon,authenticated;
grant execute on function public.x30_use_invitation(text) to authenticated;
