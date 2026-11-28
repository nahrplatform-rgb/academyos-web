import { isCivilDay } from './experience-format';
import { uuidPattern } from './onboarding';
import { staffQrPattern } from './qr-attendance';

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
function frequency(value: unknown) {
  if (value !== 'week' && value !== 'month') throw new CompensationInputError();
  return value;
}

export function trainerCompensationRequest(input: unknown) {
  const request = fields(input);
  const a = id(request.academy);
  const common = ['action', 'academy'];
  const command = [...common, 'operation'];
  if (request.action === 'payslip') {
    fields(input, [...common, 'view', 'run', 'locale']);
    if ((request.view !== 'owner' && request.view !== 'trainer') ||
        (request.locale !== 'en' && request.locale !== 'ar')) throw new CompensationInputError();
    return { rpc: 'c22_payslip_v1', args: { a, v: request.view, r: id(request.run) }, locale: request.locale };
  }
  if (request.action === 'staff_context') {
    fields(input, [...common, 'branch']);
    return { rpc: 'c22_staff_context_v1', args: { a, b: id(request.branch) } };
  }
  if (request.action === 'context') {
    fields(input, [...common, 'view', 'month', 'period', 'staff', 'after']);
    if (request.view !== 'owner' && request.view !== 'trainer') throw new CompensationInputError();
    if (request.view === 'trainer' && (request.staff != null || request.after != null)) throw new CompensationInputError();
    if (request.period !== undefined) {
      if (request.month !== undefined) throw new CompensationInputError();
      return {
        rpc: 'c22_period_context_v1',
        args: { a, v: request.view, d: day(request.period), s: request.staff == null ? null : id(request.staff),
          after_id: request.after == null ? null : id(request.after) },
      };
    }
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
    case 'staff_card':
      fields(input, [...command, 'branch', 'staff', 'expected', 'code']);
      if (request.code !== null && (typeof request.code !== 'string' || !staffQrPattern.test(request.code))) throw new CompensationInputError();
      payload = { branch: id(request.branch), staff: id(request.staff), expected: request.expected == null ? null : id(request.expected), code: request.code };
      return { rpc: 'c22_staff_command_v1', args: { a, op, act, payload } };
    case 'staff_arrival':
      fields(input, [...command, 'branch', 'staff', 'code', 'event', 'reason']);
      if (request.code !== undefined && (typeof request.code !== 'string' || !staffQrPattern.test(request.code))) throw new CompensationInputError();
      payload = request.code === undefined
        ? { branch: id(request.branch), staff: id(request.staff), event: id(request.event), reason: reason(request.reason) }
        : { branch: id(request.branch), code: request.code, event: request.event == null ? null : id(request.event) };
      return { rpc: 'c22_staff_command_v1', args: { a, op, act, payload } };
    case 'staff_verify':
      fields(input, [...command, 'branch', 'arrival', 'coverage', 'reason']);
      if (!Array.isArray(request.coverage) || request.coverage.length < 1 || request.coverage.length > 42) throw new CompensationInputError();
      payload = { branch: id(request.branch), arrival: id(request.arrival), reason: reason(request.reason ?? '', true),
        coverage: request.coverage.map(value => {
          const entry = fields(value, ['event', 'staff', 'version']);
          return {event: id(entry.event), staff: id(entry.staff), version: integer(entry.version, 0, Number.MAX_SAFE_INTEGER)};
        }) };
      return { rpc: 'c22_staff_command_v1', args: { a, op, act, payload } };
    case 'operation':
      fields(input, command);
      return { rpc: 'c22_operation_v1', args: { a, op } };
    case 'terms':
      if (request.basis === undefined) {
        fields(input, [...command, 'staff', 'start', 'rate']);
        payload = { staff: id(request.staff), start: day(request.start), rate: integer(request.rate, 1, amountMax) };
      } else {
        fields(input, [...command, 'staff', 'start', 'end', 'rate', 'basis', 'fixed', 'fixedUnit', 'frequency']);
        const basis = request.basis;
        if (basis !== 'session' && basis !== 'fixed' && basis !== 'hybrid') throw new CompensationInputError();
        const start = day(request.start);
        const end = request.end == null ? null : day(request.end);
        if (end && end < start) throw new CompensationInputError();
        payload = { staff: id(request.staff), start, end, basis,
          rate: basis === 'fixed' ? integer(request.rate ?? 0, 0, 0) : integer(request.rate, 1, amountMax),
          fixed: basis === 'session' ? integer(request.fixed ?? 0, 0, 0) : integer(request.fixed, 1, amountMax),
          fixedUnit: basis === 'session' ? null : frequency(request.fixedUnit),
          frequency: request.frequency === undefined ? undefined : frequency(request.frequency) };
      }
      break;
    case 'default':
      fields(input, [...command, 'frequency']);
      payload = { frequency: frequency(request.frequency) };
      break;
    case 'extra':
      fields(input, [...command, 'event', 'staff', 'reason']);
      payload = { event: id(request.event), staff: id(request.staff), reason: reason(request.reason) };
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
      fields(input, [...command, 'staff', 'month', 'period']);
      if (request.period !== undefined && request.month !== undefined) throw new CompensationInputError();
      payload = { staff: id(request.staff), ...(request.period !== undefined ? { period: day(request.period) } : { month: month(request.month) }) };
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
