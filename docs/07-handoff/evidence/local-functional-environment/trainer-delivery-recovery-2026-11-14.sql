-- One synthetic invitation only. This file defaults to ROLLBACK.
-- Do not apply before the Owner redeploys the checked aedb3ad source with the
-- corrected email configuration and that release is independently verified.
-- Standing authority: SDR-06 and the Owner's exact Outlook recipient approval.
-- This is an operator repair packet, not an application migration or retry API.
begin;
set local lock_timeout = '2s';
set local statement_timeout = '5s';
do $repair$
declare
  a constant uuid := 'b2c7920d-d467-4e9f-9a68-809ac627399e';
  invitation constant uuid := '460d1ea9-96da-456d-9373-597e720d405f';
  marker constant uuid := '53d19589-9a6b-4354-8d1f-a9e11a9519e1';
  v academy.trainer_invitations;
  before_fields jsonb;
  after_fields jsonb;
  changed integer;
begin
  perform academy.t4_lock(a);
  select * into v from academy.trainer_invitations
    where id = invitation and academy_id = a for update;
  if not found then raise exception 'Exact synthetic invitation missing'; end if;
  perform academy.t4_approver(a, v.approved_by);
  if exists(select 1 from academy.audit_events where operation_id = marker) then
    if (select count(*) from academy.audit_events where operation_id = marker) <> 1
      or not exists(select 1 from academy.audit_events where operation_id = marker
        and academy_id = a and action = 'trainer.delivery_config_requeue'
        and details->>'invitation_id' = invitation::text) then
      raise exception 'Recovery marker collision';
    end if;
    return; -- Already applied: no further update, audit or provider request.
  end if;
  if encode(sha256(convert_to(v.recipient, 'UTF8')), 'hex') <>
      'cb0085ec3ee14748bae091f0ae4c594b0af805c59becfc989622235d69f04a80'
    or v.state <> 'pending' or v.version <> 1 or v.delivery <> 'blocked'
    or v.attempts <> 1 or v.provider_id is not null
    or v.lease_id is null or v.lease_until is not null
    or v.first_attempt_at is distinct from timestamptz '2026-11-14 02:55:52.389551+00'
    or v.first_attempt_at < now() - interval '23 hours'
    or v.expires_at <= now() or v.accepted_by is not null
    or exists(select 1 from academy.trainer_assignments where invitation_id = invitation)
    or not exists(select 1 from academy.trainer_people
      where id = v.staff_id and academy_id = a
        and display_name = 'Synthetic Offline Trainer 2026-11-14'
        and identity_id is null and membership_id is null)
    or (select count(*) from academy.audit_events
      where action = 'trainer.delivery' and operation_id = v.lease_id
        and actor = 'delivery-worker' and academy_id = a
        and details->>'outcome' = 'blocked') <> 1 then
    raise exception 'Recovery conditions changed; inspect instead of forcing retry';
  end if;
  before_fields := to_jsonb(v) - 'delivery';
  update academy.trainer_invitations set delivery = 'queued'
    where id = invitation and academy_id = a;
  get diagnostics changed = row_count;
  select to_jsonb(ti) - 'delivery' into after_fields
    from academy.trainer_invitations ti where ti.id = invitation;
  if changed <> 1 or after_fields is distinct from before_fields then
    raise exception 'Recovery changed more than the delivery flag';
  end if;
  insert into academy.audit_events(actor, academy_id, action, operation_id, details)
    values('operator:codex-synthetic-staging', a, 'trainer.delivery_config_requeue', marker,
      jsonb_build_object('invitation_id', invitation, 'from', 'blocked', 'to', 'queued',
        'basis', 'SDR-06; exact recipient approved; configuration failure before provider send',
        'provider_send_performed', false, 'attempts_preserved', v.attempts,
        'version_preserved', v.version, 'original_idempotency_key_preserved', true));
end
$repair$;
select current_timestamp as checked_at, delivery, attempts, version,
  provider_id is not null as has_provider_receipt,
  (select count(*) from academy.audit_events
    where operation_id = '53d19589-9a6b-4354-8d1f-a9e11a9519e1') as recovery_audit_count
from academy.trainer_invitations where id = '460d1ea9-96da-456d-9373-597e720d405f';
rollback;
