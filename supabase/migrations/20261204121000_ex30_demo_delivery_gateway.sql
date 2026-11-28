-- EX-30 Phase 1g follow-up: gateway and redemption rules for synthetic delivery.

do $migration$
declare definition text := pg_get_functiondef('academy.verified_subject()'::regprocedure);
begin
  if strpos(definition, 'x30_create_demo') = 0 then
    raise exception 'Unexpected gateway path contract';
  end if;
  definition := replace(definition, 'x30_create_demo|x30_use_invitation|x30_hold_demo|x30_delete_demo',
    'x30_create_demo|x30_use_invitation|x30_hold_demo|x30_delete_demo|x30_prepare_demo_delivery|x30_set_demo_delivery');
  execute definition;
end
$migration$;

create or replace function public.x30_use_invitation(p_token_hash text) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='8s' set lock_timeout='3s' as $$
declare inv academy.platform_demo_invitations; delivery_status text; subject_id text;
begin
  subject_id := academy.verified_subject();
  if p_token_hash is null or p_token_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'Invalid or expired invitation' using errcode='22023';
  end if;
  select i.* into inv
    from academy.platform_demo_invitations i
    join academy.platform_demo_deliveries d on d.invitation_id=i.id
    where i.token_hash=p_token_hash and i.used_at is null and i.expires_at > now()
    for update of i;
  select d.status into delivery_status
    from academy.platform_demo_deliveries d where d.invitation_id=inv.id;
  if not found or delivery_status not in ('sent','recovered') then
    raise exception 'Invalid or undelivered invitation' using errcode='22023';
  end if;
  update academy.platform_demo_invitations
    set used_at=now(), used_by=subject_id where id=inv.id;
  update academy.platform_demo_lifecycle
    set last_active_at=now() where academy_id=inv.academy_id;
  return jsonb_build_object('academyId',inv.academy_id,'prospectId',inv.prospect_id);
end $$;

revoke all on function public.x30_use_invitation(text) from public,anon,authenticated;
grant execute on function public.x30_use_invitation(text) to authenticated;
