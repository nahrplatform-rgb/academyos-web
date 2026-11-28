import { isCivilDay } from './experience-format';
import { uuidPattern } from './onboarding';

export class BillingInputError extends Error {}

function object(value: unknown, keys?: string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new BillingInputError();
  const record = value as Record<string, unknown>;
  if (keys && Object.keys(record).some(key => !keys.includes(key))) throw new BillingInputError();
  return record;
}

function id(value: unknown) {
  if (typeof value !== 'string' || !uuidPattern.test(value)) throw new BillingInputError();
  return value.toLowerCase();
}

function day(value: unknown) {
  if (!isCivilDay(value) || value > '9998-12-31') throw new BillingInputError();
  return value;
}

function month(value: unknown) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}$/.test(value)) throw new BillingInputError();
  return day(value + '-01');
}

function amount(value: unknown) {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 1 || value > 1_000_000_000)
    throw new BillingInputError();
  return value;
}

function boundedText(value: unknown, max: number) {
  if (typeof value !== 'string' || value.length > max || /[\u0000-\u001f\u007f]/.test(value))
    throw new BillingInputError();
  return value.trim();
}

function sequence(value: unknown) {
  if (value == null) return null;
  if (typeof value !== 'string' || !/^(0|[1-9]\d{0,18})$/.test(value) || BigInt(value) > 9223372036854775807n)
    throw new BillingInputError();
  return value;
}

const read = (rpc: string, args: Record<string, unknown>) => ({ rpc, args, mutating: false });

export function billingRequest(input: unknown) {
  const request = object(input);
  const a = id(request.academy);
  const common = ['action', 'academy'];
  const scope = [...common, 'player', 'link'];
  const mutation = [...scope, 'operation'];

  switch (request.action) {
    case 'players':
    case 'payers':
    case 'grants': {
      const payers = request.action === 'payers';
      object(input, payers ? [...common, 'player', 'after'] : [...common, 'after']);
      return read(`f21_${request.action}_v1`, {
        a, after_id: request.after == null ? null : id(request.after), ...(payers ? { p: id(request.player) } : {})
      });
    }
    case 'statement':
      object(input, [...common, 'link', 'after', 'snapshot']);
      return read('f21_statement_v1', { a, l: id(request.link), after_seq: sequence(request.after), snapshot_seq: sequence(request.snapshot) });
    case 'preview':
      object(input, [...scope, 'month']);
      return read('f21_preview_v1', { a, p: id(request.player), l: id(request.link), m: month(request.month) });
    case 'operation':
      object(input, mutation);
      return { rpc: 'f21_operation_v1', args: { a, p: id(request.player), l: id(request.link), op: id(request.operation) }, mutating: true };
  }

  let payload: Record<string, unknown>;
  switch (request.action) {
    case 'grant':
      object(input, [...mutation, 'enabled']);
      if (typeof request.enabled !== 'boolean') throw new BillingInputError();
      payload = { enabled: request.enabled };
      break;
    case 'assign': {
      object(input, [...mutation, 'start', 'end', 'amount']);
      const start = day(request.start), end = request.end == null ? null : day(request.end);
      if (end !== null && end < start) throw new BillingInputError();
      payload = { start, end, amount: amount(request.amount) };
      break;
    }
    case 'issue':
      object(input, [...mutation, 'month', 'review']);
      if (typeof request.review !== 'string' || !/^[a-f0-9]{64}$/.test(request.review)) throw new BillingInputError();
      payload = { month: month(request.month), review: request.review };
      break;
    case 'receipt': {
      object(input, [...mutation, 'received', 'method', 'reference', 'amount', 'allocations']);
      const reference = boundedText(request.reference ?? '', 120);
      if ((request.method !== 'cash' && request.method !== 'bank') || (request.method === 'bank' && !reference))
        throw new BillingInputError();
      if (!Array.isArray(request.allocations) || request.allocations.length > 50) throw new BillingInputError();
      const receivedAmount = amount(request.amount);
      const allocations = request.allocations.map(value => {
        const line = object(value, ['bill', 'amount']);
        return { bill: id(line.bill), amount: amount(line.amount) };
      });
      if (new Set(allocations.map(line => line.bill)).size !== allocations.length ||
          allocations.reduce((total, line) => total + line.amount, 0) > receivedAmount)
        throw new BillingInputError();
      payload = { received: day(request.received), method: request.method, reference, amount: receivedAmount, allocations };
      break;
    }
    case 'credit':
    case 'unapply': {
      const target = request.action === 'credit' ? 'bill' : 'allocation';
      object(input, [...mutation, target, 'amount', 'reason']);
      const reason = boundedText(request.reason, 300);
      if (!reason) throw new BillingInputError();
      payload = { [target]: id(request[target]), amount: amount(request.amount), reason };
      break;
    }
    default:
      throw new BillingInputError();
  }
  return {
    rpc: 'f21_command_v1',
    args: { a, p: id(request.player), l: id(request.link), op: id(request.operation), act: request.action, payload },
    mutating: true
  };
}
