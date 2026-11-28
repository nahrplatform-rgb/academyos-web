import test from 'node:test';
import assert from 'node:assert/strict';
import { guardianRequest, GuardianInputError, guardianRecipientAllowed, guardianToken } from './guardians';
import { invitationToken } from './onboarding';
import { gatewayRequest, DATABASE_ORIGIN } from './onboarding-gateway';
const a = '00000000-0000-4000-8000-000000000001', id = '00000000-0000-4000-8000-000000000002';
const create = { action: 'appoint', academy: a, player: id, invitation: id, op: id, email: 'Guardian@example.invalid', confirmed: true };
test('guardian commands reject authority injection and require explicit review inputs', () => {
    assert.equal(guardianRequest(create).args.recipient, 'guardian@example.invalid');
    for (const body of [{ ...create, confirmed: false }, { ...create, proof: {} }, { ...create, role: 'owner' }, { ...create, email: 'a,b@example.invalid' }, { ...create, email: 'a\nb@example.invalid' }, { ...create, player: 'foreign' }, { action: 'end', academy: a, invitation: id, op: id, version: 1, reason: '' }, { action: 'accept', op: id, email: 'verified@example.invalid' }, { action: 'review', token: 'forged' }])
        assert.throws(() => guardianRequest(body), GuardianInputError);
    assert.equal(guardianRequest({ action: 'end', academy: a, invitation: id, op: id, version: 2, reason: 'Synthetic reason' }).args.reason, 'Synthetic reason');
});
test('actual guardian recipient and token scope is disabled by default and domain separated', () => {
    assert.equal(guardianRecipientAllowed('guardian@example.invalid', {}), false);
    assert.equal(guardianRecipientAllowed('guardian@example.invalid', { APP_ENV: 'production', GUARDIAN_STAGING_RECIPIENTS: 'guardian@example.invalid' }), false);
    assert.equal(guardianRecipientAllowed('guardian@example.invalid', { APP_ENV: 'staging', GUARDIAN_STAGING_RECIPIENTS: 'guardian@example.invalid' }), true);
    assert.equal(guardianRecipientAllowed('other@example.invalid', { APP_ENV: 'staging', GUARDIAN_STAGING_RECIPIENTS: 'guardian@example.invalid' }), false);
    assert.notEqual(guardianToken(id, 'a'.repeat(64)), invitationToken(id, 1, 'a'.repeat(64)));
    assert.notEqual(guardianToken(id, 'a'.repeat(64)), guardianToken(a, 'a'.repeat(64)));
});
test('guardian gateway charges recovery/accept as writes and review as read', () => {
    const call = (name: string, args: unknown = {}) => gatewayRequest(`${DATABASE_ORIGIN}/rest/v1/rpc/${name}`, { method: 'POST', body: JSON.stringify(args) }).mutating;
    assert.equal(call('g3_owner_list_v1'), false);
    assert.equal(call('g3_links_v1'), false);
    assert.equal(call('g3_command_v1'), true);
    assert.equal(call('g3_operation_v1'), true);
    assert.equal(call('g3_invitation_v1', { act: 'review' }), false);
    for (const act of ['accept', 'reconcile', null])
        assert.equal(call('g3_invitation_v1', { act }), true);
    assert.throws(() => call('g3_delivery_v1'));
});
