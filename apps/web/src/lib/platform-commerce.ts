import { isCivilDay } from './experience-format';
import { uuidPattern } from './onboarding';

export class CommerceInputError extends Error {}

function uuid(value: unknown) {
  if (typeof value !== 'string' || !uuidPattern.test(value)) throw new CommerceInputError();
  return value.toLowerCase();
}

function text(value: unknown, max: number) {
  if (typeof value !== 'string' || value.length > max || /[\u0000-\u001f\u007f]/.test(value) || !value.trim())
    throw new CommerceInputError();
  return value.trim();
}

function positiveInteger(value: unknown, max: number) {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 1 || value > max)
    throw new CommerceInputError();
  return value;
}

export function platformCommerceRequest(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new CommerceInputError();
  const request = input as Record<string, unknown>;
  const common = ['action', 'academy'];
  const command = [...common, 'operation'];
  function allow(fields: string[], extra: string[] = []) {
    if (Object.keys(request).some(key => !fields.includes(key) && !extra.includes(key))) throw new CommerceInputError();
  }

  const a = request.academy === undefined ? null : uuid(request.academy);
  if (request.action === 'context') {
    allow(common, ['view']);
    if (request.view !== 'platform' && (request.view !== 'owner' || !a)) throw new CommerceInputError();
    return { rpc: 'x23_context_v1', args: { a, v: request.view } };
  }

  const op = uuid(request.operation);
  const act = request.action;
  if (act === 'operation') {
    allow(command);
    return { rpc: 'x23_operation_v1', args: { a, op } };
  }

  if ((act === 'publish_plan') !== (a === null)) throw new CommerceInputError();
  if (act === 'create_demo' && a !== null) throw new CommerceInputError();
  if (act === 'use_invitation' && a === null) throw new CommerceInputError();
  if (act === 'convert_demo' && a === null) throw new CommerceInputError();
  let payload: Record<string, unknown>;
  switch (act) {
    case 'publish_plan':
      allow(command, ['version']);
      if (request.version !== undefined && request.version !== 2) throw new CommerceInputError();
      payload = request.version === 2 ? { version: 2 } : {};
      break;
    case 'assign':
      allow(command, ['plan', 'start']);
      if (!isCivilDay(request.start) || request.start < '2020-01-01' || request.start > '9998-01-01')
        throw new CommerceInputError();
      payload = { plan: uuid(request.plan), start: request.start };
      break;
    case 'issue':
      allow(command, ['subscription']);
      payload = { subscription: uuid(request.subscription) };
      break;
    case 'claim':
      allow(command, ['invoice', 'amount', 'reference']);
      payload = { invoice: uuid(request.invoice), amount: positiveInteger(request.amount, 1_000_000_000),
        reference: text(request.reference, 120) };
      break;
    case 'review':
      allow(command, ['claim', 'version', 'decision', 'reason']);
      if (request.decision !== 'accepted' && request.decision !== 'rejected') throw new CommerceInputError();
      payload = { claim: uuid(request.claim), version: positiveInteger(request.version, 2_147_483_647),
        decision: request.decision, reason: text(request.reason, 300) };
      break;
    case 'create_demo':
      allow(command, ['name', 'email', 'phone']);
      payload = { name: text(request.name ?? 'Demo Academy', 120), email: request.email ? text(request.email, 200) : null, phone: request.phone ? text(request.phone, 40) : null };
      break;
    case 'use_invitation':
      allow(command, ['token']);
      payload = { token: text(request.token, 200) };
      break;
    case 'convert_demo':
      allow(command, ['demoAcademy', 'verifiedEmail', 'academyName', 'language', 'sport']);
      payload = {
        demoAcademy: uuid(request.demoAcademy),
        verifiedEmail: text(request.verifiedEmail, 200),
        academyName: text(request.academyName ?? 'New Academy', 120),
        language: text(request.language ?? 'en', 10),
        sport: text(request.sport ?? 'football', 40),
      };
      break;
    default:
      throw new CommerceInputError();
  }
  if (act === 'create_demo') {
    return { rpc: 'x30_create_demo', args: { name: payload.name, email: payload.email, phone: payload.phone } };
  }
  if (act === 'use_invitation') {
    return { rpc: 'x30_use_invitation', args: { token: payload.token } };
  }
  if (act === 'convert_demo') {
    return { rpc: 'x30_convert_demo', args: {
      demoAcademy: payload.demoAcademy,
      verifiedEmail: payload.verifiedEmail,
      academyName: payload.academyName,
      language: payload.language,
      sport: payload.sport,
    } };
  }
  return { rpc: 'x23_command_v1', args: { a, op, act, payload } };
}

// Dunning management helpers
export type DunningState = 'none' | 'grace' | 'read_only' | 'retention' | 'archived';

export function dunningStateLabel(state: DunningState, locale: 'en' | 'ar'): string {
  const labels: Record<DunningState, { en: string; ar: string }> = {
    none: { en: 'Current', ar: 'حالية' },
    grace: { en: 'Grace period', ar: 'فترة السماح' },
    read_only: { en: 'Read-only', ar: 'للقراءة فقط' },
    retention: { en: 'Retention', ar: 'احتفاظ' },
    archived: { en: 'Archived', ar: 'مؤرشفة' },
  };
  return labels[state][locale];
}
