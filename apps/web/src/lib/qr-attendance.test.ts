import test from 'node:test';
import assert from 'node:assert/strict';
import { qrRequest, QrInputError, newQrCode, qrCodePattern, isQrReceipt } from './qr-attendance';
const a = '00000000-0000-4000-8000-000000000001', b = '00000000-0000-4000-8000-000000000002', code = 'aos:qr:1:' + 'a'.repeat(43);
test('QR strict scope rejects actor injection, malformed code, duplicate/overlarge scope, invalid windows and dates', () => {
    const good = { action: 'capture', academy: a, branch: b, events: [a], chosen: null, code, op: b };
    assert.equal(qrRequest(good).rpc, 'q13_capture_v1');
    for (const input of [{ ...good, role: 'owner' }, { ...good, events: [] }, { ...good, events: [a, a] }, { ...good, events: Array.from({ length: 26 }, (_, i) => a.slice(0, -2) + String(i).padStart(2, '0')) }, { ...good, code: 'https://example.invalid/' }, { ...good, chosen: b }, { action: 'window_change', academy: a, event: null, version: 0, before: 181, after: 30, op: b }, { action: 'window_change', academy: a, event: null, version: 0, before: -1, after: 30, op: b }, { action: 'window_change', academy: a, event: null, version: 0, before: 0.5, after: 30, op: b }, { action: 'sessions', academy: a, branch: b, day: '2026-02-30' }, { action: 'reconcile', academy: a, context: 'card:bad', op: b }])
        assert.throws(() => qrRequest(input), QrInputError);
});
test('QR receipt must agree with pending kind, target and valid canonical status/version', () => {
    const p = { kind: 'scan' as const, context: 'scan:' + b, target: a, op: b }, r = { kind: 'scan', event: a, player: b, name: 'Demo', status: 'present', version: 1, already: false };
    assert.ok(isQrReceipt(r, p));
    for (const v of [{ ...r, event: b }, { ...r, kind: 'card' }, { ...r, status: 'absent' }, { ...r, version: 0 }, { ...r, already: null }, {}])
        assert.equal(isQrReceipt(v, p), false);
    assert.equal(isQrReceipt({ kind: 'settings', event: null, version: 1, before: 181, after: 0 }, { op: b, kind: 'settings', target: null, context: 'settings' }), false);
});
test('New player QR codes have256 random bits in strict non-URL format', () => {
    const codes = Array.from({ length: 100 }, newQrCode);
    assert.equal(new Set(codes).size, 100);
    for (const c of codes)
        assert.match(c, qrCodePattern);
});
