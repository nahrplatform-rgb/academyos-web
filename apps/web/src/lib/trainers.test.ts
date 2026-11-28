import test from 'node:test';
import assert from 'node:assert/strict';
import { trainerRequest, TrainerInputError, trainerRecipientAllowed, trainerToken } from './trainers';
import { invitationToken } from './onboarding';
import { gatewayRequest, DATABASE_ORIGIN } from './onboarding-gateway';
const a = '00000000-0000-4000-8000-000000000001', id = '00000000-0000-4000-8000-000000000002';
const create = { action: 'appoint', academy: a, branch: id, name: 'Casey Demo', invitation: id, op: id, email: 'Trainer@example.invalid', confirmed: true };
test('trainer commands reject authority injection and require explicit review inputs', () => {
    assert.equal(trainerRequest(create).args.recipient, 'trainer@example.invalid');
    for (const body of [{ ...create, confirmed: false }, { ...create, proof: {} }, { ...create, role: 'owner' }, { ...create, email: 'a,b@example.invalid' }, { ...create, email: 'a\nb@example.invalid' }, { ...create, branch: 'foreign' }, { action: 'end', academy: a, invitation: id, op: id, version: 1, reason: '' }, { action: 'accept', op: id, email: 'verified@example.invalid' }, { action: 'review', token: 'forged' }])
        assert.throws(() => trainerRequest(body), TrainerInputError);
    assert.equal(trainerRequest({ action: 'end', academy: a, invitation: id, op: id, version: 2, reason: 'Synthetic reason' }).args.reason, 'Synthetic reason');
});
test('actual trainer recipient and token scope is disabled by default and domain separated', () => {
    assert.equal(trainerRecipientAllowed('trainer@example.invalid', {}), false);
    assert.equal(trainerRecipientAllowed('trainer@example.invalid', { APP_ENV: 'production', TRAINER_STAGING_RECIPIENTS: 'trainer@example.invalid' }), false);
    assert.equal(trainerRecipientAllowed('trainer@example.invalid', { APP_ENV: 'staging', TRAINER_STAGING_RECIPIENTS: 'trainer@example.invalid' }), true);
    assert.equal(trainerRecipientAllowed('other@example.invalid', { APP_ENV: 'staging', TRAINER_STAGING_RECIPIENTS: 'trainer@example.invalid' }), false);
    assert.notEqual(trainerToken(id, 'a'.repeat(64)), invitationToken(id, 1, 'a'.repeat(64)));
    assert.notEqual(trainerToken(id, 'a'.repeat(64)), trainerToken(a, 'a'.repeat(64)));
});
test('trainer gateway charges recovery/accept as writes and review as read', () => {
    const call = (name: string, args: unknown = {}) => gatewayRequest(`${DATABASE_ORIGIN}/rest/v1/rpc/${name}`, { method: 'POST', body: JSON.stringify(args) }).mutating;
    assert.equal(call('t4_owner_list_v1'), false);
    assert.equal(call('t4_profile_v1'), false);
    assert.equal(call('t4_command_v1'), true);
    assert.equal(call('t4_operation_v1'), true);
    assert.equal(call('t4_invitation_v1', { act: 'review' }), false);
    for (const act of ['accept', 'reconcile', null])
        assert.equal(call('t4_invitation_v1', { act }), true);
    assert.throws(() => call('t4_delivery_v1'));
});
