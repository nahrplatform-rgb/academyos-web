import { createHmac, timingSafeEqual } from 'node:crypto';
import { isCivilDay } from './experience-format';

const paymobOrigin = 'https://accept.paymob.com';

type Fields = Record<string, unknown>;

function fields(value: unknown): Fields | undefined {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as Fields;
}

function positiveId(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isSafeInteger(value) && value > 0) return value;
}

function providerTime(value: unknown, confirmedOffset = '') {
  if (typeof value !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,6})?(?:Z|[+-]\d\d:\d\d)?$/.test(value)) return null;
  if (!isCivilDay(value.slice(0, 10)) || value.slice(11, 13) > '23') return null;
  const zoned = /(?:Z|[+-]\d\d:\d\d)$/.test(value);
  if (!zoned && !/^(?:Z|[+-]\d\d:\d\d)$/.test(confirmedOffset)) return null;
  const iso = zoned ? value : value + confirmedOffset;
  const time = Date.parse(iso);
  return Number.isFinite(time) ? { iso, time } : null;
}

function matchesSignature(message: string, signature: unknown, secret: string): boolean {
  if (!secret || typeof signature !== 'string' || !/^[a-f0-9]{128}$/i.test(signature)) return false;
  const expected = createHmac('sha512', secret).update(message).digest();
  return timingSafeEqual(expected, Buffer.from(signature, 'hex'));
}

export function verifyPaymobSubscriptionCallback(payload: unknown, secret: string) {
  const body = fields(payload);
  const subscriptionId = positiveId(fields(body?.subscription_data)?.id);
  const trigger = body?.trigger_type;
  if (!subscriptionId || typeof trigger !== 'string' || !/^[a-z _]{1,64}$/i.test(trigger)) return null;
  if (!matchesSignature(`${trigger}for${subscriptionId}`, body?.hmac, secret)) return null;
  // The subscription signature covers only these two values.
  return { subscriptionId, trigger };
}

export function verifyPaymobTransactionCallback(payload: unknown, signature: unknown, secret: string) {
  const body = fields(payload);
  const tx = fields(body?.obj);
  if (body?.type !== 'TRANSACTION' || !tx) return null;
  const id = positiveId(tx.id);
  const orderId = positiveId(fields(tx.order)?.id);
  const integrationId = positiveId(tx.integration_id);
  const source = fields(tx.source_data);
  if (!id || !orderId || !integrationId || !positiveId(tx.owner) ||
      typeof tx.amount_cents !== 'number' || !Number.isSafeInteger(tx.amount_cents) || tx.amount_cents < 0) return null;
  const values = [
    tx.amount_cents, tx.created_at, tx.currency, tx.error_occured, tx.has_parent_transaction,
    id, integrationId, tx.is_3d_secure, tx.is_auth, tx.is_capture, tx.is_refunded,
    tx.is_standalone_payment, tx.is_voided, orderId, tx.owner, tx.pending,
    source?.pan, source?.sub_type, source?.type, tx.success,
  ];
  if (values.some(value => !['string', 'boolean', 'number'].includes(typeof value))) return null;
  if (!matchesSignature(values.join(''), signature, secret)) return null;
  return { transactionId: id, orderId, integrationId };
}

type RenewalInvoice = {
  invoiceReference: string;
  merchantId: number;
  integrationId: number;
  amountMinor: number;
  periodStart: string;
  periodEndExclusive: string;
  confirmedProviderOffset?: string;
};

type RenewalBinding = RenewalInvoice & { subscriptionId: number; enrollmentTransactionId: number };

function paymobInquiry(authToken: string, transport: typeof fetch) {
  if (!authToken) throw new Error('Paymob test inquiry requires authentication');
  const signal = AbortSignal.timeout(10_000);
  return async (url: URL) => {
    const response = await transport(url, {
      headers: { Authorization: `Bearer ${authToken}`, Accept: 'application/json' },
      cache: 'no-store',
      redirect: 'error',
      signal,
    });
    if (!response.ok) throw new Error('Paymob test inquiry unavailable');
    return fields(await response.json());
  };
}

export async function verifyPaymobTestEnrollment(
  invoice: RenewalInvoice,
  expected: {
    subscriptionId: number;
    planId: number;
    enrollmentIntegrationId: number;
    enrollmentOrderReference: string;
  },
  authToken: string,
  transport: typeof fetch = fetch,
): Promise<RenewalBinding | null> {
  if (!positiveId(expected.subscriptionId) || !expected.enrollmentOrderReference) return null;
  const read = paymobInquiry(authToken, transport);
  const subscription = await read(new URL(`/api/acceptance/subscriptions/${expected.subscriptionId}`, paymobOrigin));
  const enrollmentTransactionId = positiveId(subscription?.initial_transaction);
  if (!enrollmentTransactionId || subscription?.id !== expected.subscriptionId ||
      subscription.plan_id !== expected.planId || subscription.state !== 'active' ||
      subscription.integration !== invoice.integrationId || subscription.amount_cents !== invoice.amountMinor) return null;

  const initial = await read(new URL(`/api/acceptance/transactions/${enrollmentTransactionId}`, paymobOrigin));
  if (initial?.id !== enrollmentTransactionId || initial.is_live !== false || initial.owner !== invoice.merchantId ||
      initial.integration_id !== expected.enrollmentIntegrationId || initial.currency !== 'EGP' ||
      initial.is_3d_secure !== true || initial.pending !== false || initial.success !== true ||
      initial.error_occured !== false || initial.is_voided !== false || initial.is_refunded !== false ||
      fields(initial.order)?.merchant_order_id !== expected.enrollmentOrderReference) return null;

  return { ...invoice, subscriptionId: expected.subscriptionId, enrollmentTransactionId };
}

// Both provider records come from authenticated reads. History is scoped to
// the requested subscription and can be supplied after paging through it.
function reconcilePaymobTestRenewal(
  binding: RenewalBinding,
  history: { subscriptionId: number; transactions: readonly unknown[] },
  inquiry: unknown,
) {
  const tx = fields(inquiry);
  const id = positiveId(tx?.id);
  const occurredAt = providerTime(tx?.created_at, binding.confirmedProviderOffset);
  const start = providerTime(binding.periodStart)?.time ?? NaN;
  const end = providerTime(binding.periodEndExclusive)?.time ?? NaN;
  const listed = fields(history.transactions.find(item => fields(item)?.id === id));
  if (!id || !tx || !binding.invoiceReference || history.subscriptionId !== binding.subscriptionId ||
      id === binding.enrollmentTransactionId || tx.owner !== binding.merchantId ||
      tx.integration_id !== binding.integrationId || tx.is_live !== false ||
      tx.amount_cents !== binding.amountMinor || tx.currency !== 'EGP' ||
      !occurredAt || !(occurredAt.time >= start && occurredAt.time < end) ||
      listed?.amount_cents !== tx.amount_cents || listed?.currency !== tx.currency ||
      providerTime(listed?.created_at, binding.confirmedProviderOffset)?.time !== occurredAt.time) {
    return { status: 'unmatched' } as const;
  }
  const receipt = { transactionId: id, invoiceReference: binding.invoiceReference, occurredAt: occurredAt.iso };
  if (tx.pending === true) return { status: 'pending', ...receipt } as const;
  const paidAt = providerTime(tx.paid_at, binding.confirmedProviderOffset);
  if (tx.pending !== false || tx.success !== true || tx.error_occured !== false ||
      tx.is_voided !== false || tx.is_refunded !== false || tx.refunded_amount_cents !== 0 ||
      typeof tx.is_auth !== 'boolean' || typeof tx.is_capture !== 'boolean' ||
      (tx.is_auth && !tx.is_capture) ||
      !paidAt || !(paidAt.time >= occurredAt.time && paidAt.time < end)) {
    return { status: 'review_required', ...receipt } as const;
  }
  return { status: 'verified_payment', ...receipt, paidAt: paidAt.iso } as const;
}

export async function inquirePaymobTestRenewal(
  binding: RenewalBinding,
  authToken: string,
  transactionId?: number,
  transport: typeof fetch = fetch,
) {
  if (!positiveId(binding.subscriptionId) || (transactionId !== undefined && !positiveId(transactionId))) {
    throw new Error('Invalid Paymob test inquiry');
  }
  const path = `/api/acceptance/subscriptions/${binding.subscriptionId}/transactions`;
  const read = paymobInquiry(authToken, transport);
  const transactions: unknown[] = [];
  let page = new URL(path, paymobOrigin);
  for (let pageNumber = 1; ; pageNumber++) {
    const data = await read(page);
    if (!Array.isArray(data?.results)) throw new Error('Invalid Paymob subscription history');
    transactions.push(...data.results);
    if (data.next === null) break;
    if (typeof data.next !== 'string' || pageNumber >= 5) throw new Error('Incomplete Paymob test history');
    page = new URL(data.next);
    if (page.origin !== paymobOrigin || page.pathname !== path || page.search !== `?page=${pageNumber + 1}` ||
        page.username || page.password || page.hash) throw new Error('Unexpected Paymob history page');
  }

  const history = { subscriptionId: binding.subscriptionId, transactions };
  const start = providerTime(binding.periodStart)?.time ?? NaN;
  const end = providerTime(binding.periodEndExclusive)?.time ?? NaN;
  const candidates = new Set<number>();
  for (const item of transactions) {
    const tx = fields(item);
    const id = positiveId(tx?.id);
    const occurred = providerTime(tx?.created_at, binding.confirmedProviderOffset)?.time ?? NaN;
    if (id && id !== binding.enrollmentTransactionId && occurred >= start && occurred < end &&
        (transactionId === undefined || transactionId === id)) candidates.add(id);
  }
  if (candidates.size !== 1) return { status: 'unmatched' } as const;
  const [id] = candidates;
  const tx = await read(new URL(`/api/acceptance/transactions/${id}`, paymobOrigin));
  if (tx?.id !== id) return { status: 'unmatched' } as const;
  return reconcilePaymobTestRenewal(binding, history, tx);
}
