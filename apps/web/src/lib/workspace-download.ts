import {identifier} from './local-register-codec';
import {addCivilDays, isCivilDay} from './experience-format';

export class WorkspaceDownloadInputError extends Error {}
const fail = (): never => {throw new WorkspaceDownloadInputError();};
const hash = (value: unknown): value is string => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const uint = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fail();
  return value as Record<string, unknown>;
}
function keys(value: Record<string, unknown>, allowed: string[], required = allowed) {
  if (Object.keys(value).some(k => !allowed.includes(k)) || required.some(k => !Object.hasOwn(value,k))) fail();
}
function id(value: unknown) {
  try {return identifier(value);} catch {return fail();}
}

/** HTTP shape checks only. The database verifies signature, current scope and version. */
export function workspaceReceipt(value: unknown, completed = false) {
  const receipt = object(value);
  keys(receipt,['payload','signature']);
  const p = object(receipt.payload);
  keys(p,['v','a','device','ns','epoch','scope','dataset','first','last','revision','total','seen','cursor','acc','issued','phase']);
  if (!hash(receipt.signature) || !hash(p.scope) || !hash(p.acc) || p.v !== 1 || p.epoch !== 1 ||
      !uint(p.seen) || !uint(p.issued) || !['people','calendar'].includes(p.dataset as string) ||
      !(completed ? ['complete'] : ['seed','transfer']).includes(p.phase as string) || typeof p.revision !== 'string' ||
      !/^(0|[1-9][0-9]{0,18})$/.test(p.revision) || BigInt(p.revision) > 9223372036854775807n) fail();
  id(p.a); id(p.device); id(p.ns);
  if (p.phase === 'seed') {
    if (p.total !== null || p.seen !== 0 || p.cursor !== null) fail();
  } else if (!uint(p.total) || (p.seen as number) > p.total || (completed && p.seen !== p.total)) fail();
  if (p.dataset === 'people') {
    if (p.first !== null || p.last !== null) fail();
  } else if (!isCivilDay(p.first) || !isCivilDay(p.last) || addCivilDays(p.first,41) !== p.last) fail();
  if (p.seen === 0) {
    if (p.cursor !== null) fail();
  } else {
    const cursor = object(p.cursor);
    if (p.dataset === 'people') {keys(cursor,['id']); id(cursor.id);}
    else {
      keys(cursor,['date','at','program','day']); id(cursor.program);
      if (!isCivilDay(cursor.date) || !isCivilDay(cursor.day) || cursor.date < (p.first as string) ||
          cursor.date > (p.last as string) || typeof cursor.at !== 'string' ||
          !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z$/.test(cursor.at) || !Number.isFinite(Date.parse(cursor.at))) fail();
    }
  }
  return receipt;
}

export function workspaceDownloadRequest(value: unknown) {
  const b = object(value), academy = id(b.academy);
  let previous: Record<string, unknown> | null = null, month: string | null = null;
  if (b.action === 'manifest') {
    keys(b,['action','academy','month'],['action','academy']);
    if (Object.hasOwn(b,'month')) {
      if (!isCivilDay(b.month) || !b.month.endsWith('-01')) fail();
      month = b.month as string;
    }
  } else if (b.action === 'page' || b.action === 'resume' || b.action === 'complete') {
    keys(b,['action','academy','receipt']);
    previous = workspaceReceipt(b.receipt);
    const p = previous.payload as Record<string, unknown>;
    if (b.action === 'complete' && (p.phase !== 'transfer' || p.seen !== p.total)) fail();
  } else return fail();
  return {rpc:'x21_workspace_transfer_v1', args:{a:academy,act:b.action,previous,month_anchor:month}};
}

/** Separate workspace headers cannot accidentally select the one-register namespace. */
export function workspaceScopeArguments(headers: Headers) {
  const expected_subject = headers.get('x-academyos-original-subject');
  if (!expected_subject || !/^user_[a-zA-Z0-9_]{1,120}$/.test(expected_subject)) return null;
  try {
    return {device:identifier(headers.get('x-academyos-workspace-device')),
      ns:identifier(headers.get('x-academyos-workspace-namespace')),expected_subject};
  } catch {return null;}
}
