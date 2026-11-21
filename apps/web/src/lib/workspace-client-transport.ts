import {isCivilDay} from './experience-format';
import {identifier} from './local-register-codec';
import {readWorkspaceReceipt, sameWorkspaceVersion, verifyWorkspaceCompletion, workspaceBinding} from './local-workspace-codec';
import type {Collection, WorkspaceReceipt, WorkspaceRow, WorkspaceScope, WorkspaceTicket} from './local-workspace-codec';

export type WorkspaceTransportErrorKind = 'session_missing' | 'denied' | 'limited' | 'transient' | 'changed' | 'expired' | 'invalid_response';
export class WorkspaceTransportError extends Error {
  constructor(public readonly kind: WorkspaceTransportErrorKind) { super(`workspace_${kind}`); }
}
export type WorkspaceKeyInput = {academy: string; device: string; subject: string} &
  ({action: 'prepare'} | {action: 'recover'; namespace: string});
export type WorkspaceKeyResult = {scope: WorkspaceScope; ticket: WorkspaceTicket};
export type WorkspaceContext = {academy_id: string; academy_name: string; version: number; branch_id: string;
  branch_name: string; sport_id: string; sport_name: string; sport_name_ar: string; timezone: string};
export type WorkspaceManifest = {kind: 'manifest'; subject: string; namespace: string; device: string; field_epoch: 1;
  context: WorkspaceContext; scope: string; revisions: {people: string; calendar: string}; today: string; month: string;
  checked_at: number; collections: Array<{id: Collection; month?: string; receipt: WorkspaceReceipt}>};
export type WorkspacePage = {kind: 'page'; scope: string; dataset: 'people' | 'calendar'; revision: string;
  items: WorkspaceRow[]; total: number; seen: number; more: boolean; receipt: WorkspaceReceipt};
export type WorkspaceResume = {kind: 'resume'; scope: string; dataset: 'people' | 'calendar'; revision: string;
  receipt: WorkspaceReceipt; checked_at: number};
export type WorkspaceComplete = {kind: 'complete'; scope: string; dataset: 'people' | 'calendar'; revision: string;
  total: number; seen: number; root: string; receipt: WorkspaceReceipt; checked_at: number};

const invalid = (): never => { throw new WorkspaceTransportError('invalid_response'); };
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return invalid();
  return value as Record<string, unknown>;
}
function exact(value: Record<string, unknown>, fields: string[]) {
  if (Object.keys(value).length !== fields.length || fields.some(k => !Object.hasOwn(value,k))) invalid();
}
function positive(value: unknown): value is number { return typeof value === 'number' && Number.isSafeInteger(value) && value > 0; }
function hash(value: unknown): value is string { return typeof value === 'string' && /^[a-f0-9]{64}$/.test(value); }
function label(value: unknown): value is string { return typeof value === 'string' && value.trim().length > 0 && value.length <= 500; }
function monthOffset(month: string, delta: number) {
  const [year, mon] = month.split('-').map(Number);
  const n = year * 12 + mon - 1 + delta, y = Math.floor(n / 12), m = n % 12 + 1;
  if (y < 1 || y > 9999) return invalid();
  return `${String(y).padStart(4,'0')}-${String(m).padStart(2,'0')}-01`;
}
async function post(path: '/api/workspace-key' | '/api/workspace-download', body: unknown, headers: Record<string,string>, signal?: AbortSignal) {
  const timeout = AbortSignal.timeout(20000);
  const lifetime = signal ? AbortSignal.any([signal, timeout]) : timeout;
  let response: Response;
  try {
    response = await fetch(path, {method:'POST', credentials:'same-origin', cache:'no-store', redirect:'error',
      headers:{'content-type':'application/json',...headers}, body:JSON.stringify(body), signal:lifetime});
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new WorkspaceTransportError('transient');
  }
  if (response.status === 401) throw new WorkspaceTransportError('session_missing');

  if (response.status === 429) throw new WorkspaceTransportError('limited');
  if (!response.ok && response.status !== 403) throw new WorkspaceTransportError('transient');
  if (!response.body || !/^application\/json(?:\s*;|$)/i.test(response.headers.get('content-type') ?? '')) {
    if (response.status === 403) throw new WorkspaceTransportError('transient');
    return invalid();
  }
  const reader = response.body!.getReader(), chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.byteLength;
      if (size >= 32768) { await reader.cancel(); return invalid(); }
      chunks.push(part.value);
    }
  } catch (error) {
    if (signal?.aborted || error instanceof WorkspaceTransportError) throw error;
    throw new WorkspaceTransportError('transient');
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk,offset); offset += chunk.byteLength; }
  let envelope: Record<string, unknown>;
  try { envelope = object(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes))); }
  catch { return invalid(); }
  signal?.throwIfAborted();
  if (response.status === 403) {
    if (Object.keys(envelope).length === 1 && ['denied','account_changed'].includes(envelope.error as string)) {
      throw new WorkspaceTransportError('denied');
    }
    throw new WorkspaceTransportError('transient');
  }
  exact(envelope,['data']);
  const data = object(envelope.data);
  if (Object.hasOwn(data,'error')) {
    exact(data,['error']);
    if (data.error === 'changed' || data.error === 'expired') throw new WorkspaceTransportError(data.error);
    return invalid();
  }
  return data;
}
function scopedHeaders(scope: WorkspaceScope) {
  workspaceBinding(scope);
  return {'x-academyos-original-subject':scope.subject,'x-academyos-workspace-device':scope.device,
    'x-academyos-workspace-namespace':scope.namespace};
}
function validate<T>(fn: () => T): T {
  try { return fn(); } catch (error) { if (error instanceof WorkspaceTransportError) throw error; return invalid(); }
}
export async function workspaceKey(input: WorkspaceKeyInput, signal?: AbortSignal): Promise<WorkspaceKeyResult> {
  validate(() => { identifier(input.academy); identifier(input.device);
    if (!/^user_[a-zA-Z0-9_]{1,120}$/.test(input.subject)) invalid();
    if (input.action === 'recover') identifier(input.namespace); });
  const data = await post('/api/workspace-key',input,{},signal);
  return validate(() => {
    exact(data,['scope','ticket']);
    const scope = object(data.scope), ticket = object(data.ticket);
    exact(scope,['environment','subject','academy','device','epoch','capability','namespace']);
    exact(ticket,['material','verifiedAt']);
    workspaceBinding(scope as WorkspaceScope);
    if (scope.subject !== input.subject || scope.academy !== input.academy || scope.device !== input.device ||
        (input.action === 'recover' && scope.namespace !== input.namespace) ||
        typeof ticket.material !== 'string' || !/^[A-Za-z0-9+/]{43}=$/.test(ticket.material) || !positive(ticket.verifiedAt)) invalid();
    return data as WorkspaceKeyResult;
  });
}
export async function workspaceManifest(scope: WorkspaceScope, month?: string, signal?: AbortSignal): Promise<WorkspaceManifest> {
  const headers = validate(() => scopedHeaders(scope));
  if (month !== undefined && (!isCivilDay(month) || !month.endsWith('-01'))) invalid();
  const data = await post('/api/workspace-download',{action:'manifest',academy:scope.academy,...(month ? {month} : {})},headers,signal);
  return validate(() => {
    exact(data,['kind','subject','namespace','device','field_epoch','context','scope','revisions','today','month','checked_at','collections']);
    const context = object(data.context), revisions = object(data.revisions);
    exact(context,['academy_id','academy_name','version','branch_id','branch_name','sport_id','sport_name','sport_name_ar','timezone']);
    exact(revisions,['people','calendar']);
    identifier(context.academy_id); identifier(context.branch_id); identifier(context.sport_id);
    for (const k of ['academy_name','branch_name','sport_name','sport_name_ar','timezone']) if (!label(context[k])) invalid();
    if (!Number.isSafeInteger(context.version) || (context.version as number) < 0 || context.academy_id !== scope.academy ||
        data.kind !== 'manifest' || data.subject !== scope.subject || data.namespace !== scope.namespace || data.device !== scope.device ||
        data.field_epoch !== 1 || !hash(data.scope) || !positive(data.checked_at) || !isCivilDay(data.today) ||
        !isCivilDay(data.month) || !data.month.endsWith('-01') || data.month !== (month ?? data.today.slice(0,7)+'-01') ||
        !Array.isArray(data.collections) || data.collections.length !== 4) invalid();
    try { new Intl.DateTimeFormat('en',{timeZone:context.timezone as string}); } catch { return invalid(); }
    const selected = data.month as string;
    const expected = ['people', ...[0,1,-1].map(n => `calendar:${monthOffset(selected,n).slice(0,7)}`)];
    const seeds: string[] = [];
    (data.collections as unknown[]).forEach((raw: unknown, index: number) => {
      const entry = object(raw), id = expected[index] as Collection;
      exact(entry,index === 0 ? ['id','receipt'] : ['id','month','receipt']);
      if (entry.id !== id || (index > 0 && entry.month !== `${id.slice(9)}-01`)) invalid();
      const receipt = readWorkspaceReceipt(entry.receipt,scope,id), p = receipt.payload;
      if (p.phase !== 'seed' || p.scope !== data.scope || p.revision !== revisions[p.dataset]) invalid();
      seeds.push(p.acc);
    });
    if (new Set(seeds).size !== 4) invalid();
    return data as WorkspaceManifest;
  });
}
function phaseData(data: Record<string,unknown>, kind: string, scope: WorkspaceScope, collection: Collection, previous: WorkspaceReceipt, completed = false) {
  const receipt = readWorkspaceReceipt(data.receipt,scope,collection,completed), p = receipt.payload;
  if (data.kind !== kind || data.scope !== p.scope || data.dataset !== p.dataset || data.revision !== p.revision ||
      !sameWorkspaceVersion(previous,receipt)) invalid();
  return receipt;
}
async function phase(scope: WorkspaceScope, collection: Collection, receipt: WorkspaceReceipt, action: 'page' | 'resume' | 'complete', signal?: AbortSignal) {
  const headers = validate(() => { const h = scopedHeaders(scope); readWorkspaceReceipt(receipt,scope,collection); return h; });
  return post('/api/workspace-download',{action,academy:scope.academy,receipt},headers,signal);
}
export async function workspacePage(scope: WorkspaceScope, collection: Collection, previous: WorkspaceReceipt, signal?: AbortSignal): Promise<WorkspacePage> {
  const data = await phase(scope,collection,previous,'page',signal);
  try {
    exact(data,['kind','scope','dataset','revision','items','total','seen','more','receipt']);
    const next = phaseData(data,'page',scope,collection,previous);
    if (!Array.isArray(data.items) || data.items.length > (collection === 'people' ? 25 : 50) ||
        next.payload.phase !== 'transfer' || next.payload.seen !== previous.payload.seen+data.items.length ||
        data.total !== next.payload.total || data.seen !== next.payload.seen || typeof data.more !== 'boolean' ||
        data.more !== (next.payload.seen < next.payload.total!)) invalid();
    return data as WorkspacePage;
  } catch (error) { if (error instanceof WorkspaceTransportError) throw error; return invalid(); }
}
export async function workspaceResume(scope: WorkspaceScope, collection: Collection, previous: WorkspaceReceipt, signal?: AbortSignal): Promise<WorkspaceResume> {
  const data = await phase(scope,collection,previous,'resume',signal);
  return validate(() => {
    exact(data,['kind','scope','dataset','revision','receipt','checked_at']);
    const next = phaseData(data,'resume',scope,collection,previous);
    const {issued: oldIssued,...oldRest} = previous.payload, {issued: newIssued,...newRest} = next.payload;
    const keys = Object.keys(oldRest) as Array<keyof typeof oldRest>;
    if (!positive(data.checked_at) || newIssued < oldIssued || keys.some(key =>
      JSON.stringify(oldRest[key]) !== JSON.stringify(newRest[key]))) invalid();
    return data as WorkspaceResume;
  });
}
export async function workspaceComplete(scope: WorkspaceScope, collection: Collection, previous: WorkspaceReceipt, signal?: AbortSignal): Promise<WorkspaceComplete> {
  const data = await phase(scope,collection,previous,'complete',signal);
  return validate(() => {
    exact(data,['kind','scope','dataset','revision','total','seen','root','receipt','checked_at']);
    const next = phaseData(data,'complete',scope,collection,previous,true);
    verifyWorkspaceCompletion(previous,next);
    if (!positive(data.checked_at) || data.total !== next.payload.total || data.seen !== next.payload.seen || data.root !== next.payload.acc) invalid();
    return data as WorkspaceComplete;
  });
}
