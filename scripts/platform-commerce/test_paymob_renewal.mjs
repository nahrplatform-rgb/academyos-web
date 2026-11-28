import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import {
  inquirePaymobTestRenewal, verifyPaymobSubscriptionCallback, verifyPaymobTestEnrollment, verifyPaymobTransactionCallback,
} from '../../apps/web/src/lib/paymob-renewal.ts';

const invoiceReference = process.argv[2];
assert.match(invoiceReference ?? '', /^[a-f\d-]{36}$/i);
const secret = 'fictional-paymob-signing-secret';
const sign = message => createHmac('sha512', secret).update(message).digest('hex');
const invoice = {
  invoiceReference, merchantId: 100, integrationId: 300, amountMinor: 100000,
  periodStart: '2026-12-15T00:00:00+02:00', periodEndExclusive: '2027-01-15T00:00:00+02:00',
};
const subscriptionCallback = {
  subscription_data: { id: 200, amount_cents: 1, initial_transaction: 999 },
  trigger_type: 'Successful Transaction', hmac: sign('Successful Transactionfor200'),
};
assert.deepEqual(verifyPaymobSubscriptionCallback(subscriptionCallback, secret),
  { subscriptionId: 200, trigger: 'Successful Transaction' });
assert.equal(verifyPaymobSubscriptionCallback({ ...subscriptionCallback, subscription_data: { id: 201 } }, secret), null);
assert.equal(verifyPaymobSubscriptionCallback({ ...subscriptionCallback, trigger_type: 'Failed Transaction' }, secret), null);

const transaction = {
  id: 401, integration_id: 300, owner: 100, amount_cents: 100000, currency: 'EGP',
  created_at: '2026-12-15T11:59:58.998123+02:00', paid_at: '2026-12-15T12:00:00.000999+02:00',
  pending: false, success: true, error_occured: false, is_live: false,
  is_auth: false, is_capture: false, is_voided: false, is_refunded: false, refunded_amount_cents: 0,
  has_parent_transaction: false, is_3d_secure: false, is_standalone_payment: true,
  order: { id: 1000 }, source_data: { pan: '0000', sub_type: 'MasterCard', type: 'card' },
};
const signedText = '1000002026-12-15T11:59:58.998123+02:00EGPfalsefalse401300falsefalsefalsefalsetruefalse1000100false0000MasterCardcardtrue';
const signature = sign(signedText);
const notification = verifyPaymobTransactionCallback({ type: 'TRANSACTION', obj: transaction }, signature, secret);
assert.deepEqual(notification, { transactionId: 401, orderId: 1000, integrationId: 300 });
assert.equal(verifyPaymobTransactionCallback({ type: 'TRANSACTION', obj: { ...transaction, amount_cents: 1 } },
  signature, secret), null);
assert.equal(verifyPaymobTransactionCallback({ type: 'TRANSACTION', obj: transaction }, '00', secret), null);

const origin = 'https://accept.paymob.com';
const historyUrl = origin + '/api/acceptance/subscriptions/200/transactions';
const inquiryUrl = origin + '/api/acceptance/transactions/';
const enrollment = {
  ...transaction, id: 400, integration_id: 301, is_3d_secure: true, created_at: '2026-11-15T10:00:00Z',
  order: { id: 900, merchant_order_id: 'fixture-enrollment-order' },
};
const auth = 'fictional-paymob-auth';
const subscription = { id: 200, plan_id: 600, state: 'active', integration: 300, amount_cents: 100000, initial_transaction: 400 };
const enrollmentExpected = {
  subscriptionId: subscriptionCallback.subscription_data.id,
  planId: 600, enrollmentIntegrationId: 301, enrollmentOrderReference: 'fixture-enrollment-order',
};

function verifyEnrollment(expected = enrollmentExpected, initial = enrollment, details = subscription) {
  return verifyPaymobTestEnrollment(invoice, expected, auth, async (url, init) => {
    assert.equal(new Headers(init.headers).get('authorization'), 'Bearer ' + auth);
    assert.equal(init.method ?? 'GET', 'GET');
    if (url.href === origin + '/api/acceptance/subscriptions/200') return Response.json(details);
    if (url.href === inquiryUrl + '400') return Response.json(initial);
    throw new Error('Unexpected Paymob enrollment inquiry');
  });
}

const binding = await verifyEnrollment();
assert.deepEqual(binding, { ...invoice, subscriptionId: 200, enrollmentTransactionId: 400 });
assert.equal(await verifyEnrollment({ ...enrollmentExpected, enrollmentOrderReference: 'other-order' }), null);
assert.equal(await verifyEnrollment(enrollmentExpected, { ...enrollment, is_live: true }), null);
assert.equal(await verifyEnrollment(enrollmentExpected, { ...enrollment, is_3d_secure: false }), null);
assert.equal(await verifyEnrollment(enrollmentExpected, enrollment, { ...subscription, integration: 301 }), null);

async function verify(details = transaction, options = {}) {
  const requests = [];
  const listed = options.listed ?? { ...transaction, ...details };
  const following = historyUrl + '?page=2';
  const result = await inquirePaymobTestRenewal(
    options.binding ?? binding,
    auth,
    options.transactionId,
    async (url, init) => {
      assert.equal(new Headers(init.headers).get('authorization'), 'Bearer ' + auth);
      assert.equal(init.redirect, 'error');
      assert.equal(init.method ?? 'GET', 'GET');
      const address = url.href;
      requests.push(address);
      if (address === historyUrl) return Response.json({ results: [enrollment], next: options.next ?? following });
      if (address === following) return Response.json({ results: [listed, ...(options.additional ?? [])], next: null });
      if (address === inquiryUrl + listed.id) return Response.json(details);
      throw new Error('Unexpected provider request');
    },
  );
  assert.deepEqual(requests.slice(0, 2), [historyUrl, following]);
  assert.equal(requests.length, result.status === 'unmatched' ? (options.expectedReads ?? 3) : 3);
  return result;
}

const callback = await verify(transaction, { transactionId: notification.transactionId });
const inquiry = await verify();
assert.deepEqual(callback, inquiry);
assert.deepEqual(inquiry, {
  status: 'verified_payment', transactionId: 401, invoiceReference,
  occurredAt: transaction.created_at, paidAt: transaction.paid_at,
});
const pending = await verify({ ...transaction, pending: true, success: false, paid_at: null });
const declined = await verify({ ...transaction, id: 403, success: false, error_occured: true, paid_at: null });
assert.equal(pending.status, 'pending');
assert.equal(declined.status, 'review_required');
assert.equal((await verify({ ...transaction, is_live: true })).status, 'unmatched');
assert.equal((await verify({ ...transaction, amount_cents: 1 })).status, 'unmatched');
assert.equal((await verify({ ...transaction, owner: 101 })).status, 'unmatched');
assert.equal((await verify({ ...transaction, integration_id: 301 })).status, 'unmatched');
assert.equal((await verify({ ...transaction, is_auth: true })).status, 'review_required');
assert.equal((await verify({ ...transaction, refunded_amount_cents: 1 })).status, 'review_required');
assert.equal((await verify({ ...transaction, created_at: '2026-12-15T11:59:58' }, { expectedReads: 2 })).status, 'unmatched');
assert.equal((await verify({ ...transaction, created_at: '2026-12-15T11:59:58' },
  { binding: { ...binding, confirmedProviderOffset: '+02:00' } })).status, 'verified_payment');
assert.equal((await verify(transaction, { transactionId: 400, expectedReads: 2 })).status, 'unmatched');
assert.equal((await verify(transaction, { additional: [{ ...transaction, id: 402 }], expectedReads: 2 })).status, 'unmatched');
await assert.rejects(verify(transaction, { next: 'https://wrong.example/?page=2' }), /Unexpected Paymob history page/);
const competing = await verify({ ...transaction, id: 402 }, { transactionId: 402 });
console.log(JSON.stringify({ binding, pending, declined, callback, inquiry, competing }));
