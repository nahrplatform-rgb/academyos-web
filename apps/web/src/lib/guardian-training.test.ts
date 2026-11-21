import test from 'node:test';
import assert from 'node:assert/strict';
import { guardianTrainingRequest, GuardianTrainingInputError } from './guardian-training';
import { gatewayRequest, DATABASE_ORIGIN } from './onboarding-gateway';
const a = '00000000-0000-4000-8000-000000000001', link = '00000000-0000-4000-8000-000000000002', event = '00000000-0000-4000-8000-000000000003';
test('Guardian reads accept only exact bounded scope and allowlisted read RPCs', () => { for (const command of [{ action: 'links', academy: a }, { action: 'schedule', academy: a, link, from: '2026-11-01' }, { action: 'detail', academy: a, link, event }]) {
    const r = guardianTrainingRequest(command);
    assert.equal(gatewayRequest(`${DATABASE_ORIGIN}/rest/v1/rpc/${r.rpc}`, { method: 'POST', body: JSON.stringify(r.args) }).mutating, false);
} });
test('Guardian query rejects widened payload, malformed dates and partial cursors', () => { for (const extra of [{ from: '2026-02-30' }, { from: '2026-01-01', to: '2027-01-01' }, { from: 'infinity' }, { from: '2026-01-01', after_at: '2026-01-01T12:00:00Z' }, { from: '2026-01-01', after_at: 'garbage', after_event: event }, { from: '2026-01-01', player: event }, { from: '2026-01-01', role: 'owner' }, { from: '2026-01-01', reason: 'private' }])
    assert.throws(() => guardianTrainingRequest({ action: 'schedule', academy: a, link, ...extra }), GuardianTrainingInputError); assert.throws(() => guardianTrainingRequest({ action: 'mark', academy: a, link, event }), GuardianTrainingInputError); });
