import { isCivilDay } from './experience-format';
import { uuidPattern } from './onboarding';

export class CompensationInputError extends Error {}

function fields(value: unknown, permitted?: readonly string[]) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new CompensationInputError();
  const record = value as Record<string, unknown>;
  if (permitted && Object.keys(record).some(key => !permitted.includes(key))) throw new CompensationInputError();
  return record;
}

function id(value: unknown): string {
  if (typeof value !== 'string' || !uuidPattern.test(value)) throw new CompensationInputError();
  return value.toLowerCase();
}

function day(value: unknown): string {
  if (!isCivilDay(value) || value > '9998-12-31') throw new CompensationInputError();
  return value;
}

function month(value: unknown): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}$/.test(value)) throw new CompensationInputError();
  return day(`${value}-01`);
}

function integer(value: unknown, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < min || value > max)
    throw new CompensationInputError();
  return value;
}

function reason(value: unknown, optional = false, max = 300): string {
  if (typeof value !== 'string' || value.length > max || /[\u0000-\u001f\u007f]/.test(value))
    throw new CompensationInputError();
  const clean = value.trim();
  if (!optional && !clean) throw new CompensationInputError();
  return clean;
}

const amountMax = 1_000_000_000;

export function trainerCompensationRequest(input: unknown) {
  const request = fields(input);
  const a = id(request.academy);
  const common = ['action', 'academy'];
  const command = [...common, 'operation'];
  if (request.action === 'context') {
    fields(input, [...common, 'view', 'month', 'staff', 'after']);
    if (request.view !== 'owner' && request.view !== 'trainer') throw new CompensationInputError();
    if (request.view === 'trainer' && (request.staff != null || request.after != null)) throw new CompensationInputError();
    return {
      rpc: 'c22_context_v1',
      args: { a, v: request.view, m: month(request.month), s: request.staff == null ? null : id(request.staff),
        after_id: request.after == null ? null : id(request.after) },
    };
  }

  const op = id(request.operation);
  const act = request.action;
  let payload: Record<string, unknown>;
  switch (act) {
    case 'operation':
      fields(input, command);
      return { rpc: 'c22_operation_v1', args: { a, op } };
    case 'terms':
      fields(input, [...command, 'staff', 'start', 'rate']);
      payload = { staff: id(request.staff), start: day(request.start), rate: integer(request.rate, 1, amountMax) };
      break;
    case 'coverage': {
      fields(input, [...command, 'event', 'staff', 'status', 'version']);
      const status = request.status;
      if (status !== 'present' && status !== 'absent') throw new CompensationInputError();
      if (status === 'absent' && request.staff != null) throw new CompensationInputError();
      payload = { event: id(request.event), staff: status === 'present' ? id(request.staff) : null,
        status, version: integer(request.version, 0, Number.MAX_SAFE_INTEGER) };
      break;
    }
    case 'prepare':
      fields(input, [...command, 'staff', 'month']);
      payload = { staff: id(request.staff), month: month(request.month) };
      break;
    case 'approve':
      fields(input, [...command, 'run', 'review', 'reason']);
      if (typeof request.review !== 'string' || !/^[a-f0-9]{64}$/.test(request.review)) throw new CompensationInputError();
      payload = { run: id(request.run), review: request.review, reason: reason(request.reason) };
      break;
    case 'request':
      fields(input, [...command, 'line', 'reason']);
      payload = { line: id(request.line), reason: reason(request.reason) };
      break;
    case 'adjust': {
      fields(input, [...command, 'line', 'amount', 'reason', 'request']);
      const amount = integer(request.amount, -amountMax, amountMax);
      if (amount === 0) throw new CompensationInputError();
      payload = { line: id(request.line), amount, reason: reason(request.reason),
        ...(request.request == null ? {} : { request: id(request.request) }) };
      break;
    }
    case 'payout': {
      fields(input, [...command, 'run', 'amount', 'method', 'date', 'reference']);
      if (request.method !== 'bank' && request.method !== 'cash') throw new CompensationInputError();
      payload = { run: id(request.run), amount: integer(request.amount, 1, amountMax), method: request.method,
        date: day(request.date), reference: reason(request.reference ?? '', request.method === 'cash', 120) };
      break;
    }
    default:
      throw new CompensationInputError();
  }
  return { rpc: 'c22_command_v1', args: { a, op, act, payload } };
}
