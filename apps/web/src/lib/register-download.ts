/** Versioned read contract only. No credentials, storage, network or product activation. */
import type {AttendancePlayer, AttendanceRoster} from './attendance';
import {digest, identifier, jsonBytes, record, refuse, rosterHeader, rosterPage,
  type RosterHeader} from './local-register-codec';
export type DownloadPayload = {v: 1; a: string; ev: string; revision: string; head: string;
  acc: string; count: number; total_saved: number; seen: number; saved: number;
  cursor: string | null; issued: number; phase: 'transfer' | 'complete'};
export type DownloadReceipt = {payload: DownloadPayload; signature: string};
export type DownloadManifest = {kind: 'manifest'; revision: string; header: RosterHeader;
  receipt: DownloadReceipt; unchanged: boolean};
export type DownloadPage = {kind: 'page'; revision: string; roster: AttendanceRoster; receipt: DownloadReceipt};
export type DownloadComplete = {kind: 'complete'; revision: string; header: RosterHeader; receipt: DownloadReceipt};
export type DownloadResult = DownloadManifest | DownloadPage | DownloadComplete | {error: 'changed' | 'expired'};
export type DownloadCommand = {action: 'manifest'; academy: string; event: string; expected: string | null; after: string | null}
  | {action: 'page' | 'complete'; academy: string; event: string; receipt: DownloadReceipt};
export class DownloadInputError extends Error {constructor() {super('invalid_download');}}
const hashPattern = /^[a-f0-9]{64}$/;
function exact(v: Record<string, unknown>, keys: string[]) {
  if (Object.keys(v).sort().join(',') !== [...keys].sort().join(',')) refuse('invalid_download_fields');
}
export function downloadHash(v: unknown): string {
  if (typeof v !== 'string' || !hashPattern.test(v)) refuse('invalid_download_hash'); return v;
}
export function downloadReceipt(value: unknown, academy: string, event: string): DownloadReceipt {
  jsonBytes(value, 3072);
  const v = record(value), p = record(v.payload); exact(v, ['payload', 'signature']);
  exact(p, ['v', 'a', 'ev', 'revision', 'head', 'acc', 'count', 'total_saved', 'seen', 'saved', 'cursor', 'issued', 'phase']);
  if (p.v !== 1 || p.a !== academy || p.ev !== event || !['transfer', 'complete'].includes(String(p.phase)) ||
      !Number.isSafeInteger(p.issued) || (p.issued as number) < 1000000000) refuse('download_scope_mismatch');
  for (const k of ['revision', 'head', 'acc']) downloadHash(p[k]); downloadHash(v.signature);
  for (const k of ['count', 'total_saved', 'seen', 'saved']) {
    if (!Number.isSafeInteger(p[k]) || (p[k] as number) < 0 || (p[k] as number) > 1000) refuse('invalid_download_count');
  }
  if ((p.total_saved as number) > (p.count as number) || (p.saved as number) > (p.seen as number) ||
      (p.saved as number) > (p.total_saved as number) || (p.seen as number) > (p.count as number) ||
      p.seen === 0 && p.cursor !== null) refuse('invalid_download_count');
  if (p.seen !== 0) identifier(p.cursor);
  return structuredClone(v) as DownloadReceipt;
}
export function registerDownloadRequest(value: unknown) {
  try {
    jsonBytes(value, 4096); const v = record(value), a = identifier(v.academy), ev = identifier(v.event);
    if (v.action === 'manifest') {
      exact(v, ['action', 'academy', 'event', 'expected', 'after']);
      if (v.expected !== null) downloadHash(v.expected);
      if (v.after !== null) {identifier(v.after); if (v.expected === null) refuse('resume_requires_revision');}
      return {rpc: 'x20_register_download_v1', mutating: false as const,
        args: {a, ev, act: 'manifest', previous: null, expected: v.expected, after_id: v.after}};
    }
    if (!['page', 'complete'].includes(String(v.action))) refuse('invalid_download_action');
    exact(v, ['action', 'academy', 'event', 'receipt']);
    const receipt = downloadReceipt(v.receipt, a, ev);
    if (receipt.payload.phase !== 'transfer') refuse('invalid_download_phase');
    return {rpc: 'x20_register_download_v1', mutating: false as const,
      args: {a, ev, act: v.action, previous: receipt, expected: null, after_id: null}};
  } catch {throw new DownloadInputError();}
}

const encoder = new TextEncoder();
const frame = (v: string | number | boolean | null) => v === null ? 'n;' : `s${encoder.encode(String(v)).byteLength}:${v}`;
export async function downloadHeaderHash(academy: string, h: RosterHeader): Promise<string> {
  const p = h.projection;
  return digest('x17-header-v1' + [academy, h.event, h.program, h.day, h.scheduled_day, h.starts_at,
    h.ends_at, p.name, p.branch, p.timezone, p.sport, p.sport_ar, h.owner, h.closes_at,
    h.count, h.saved, h.protected].map(frame).join(''));
}
export const downloadSeed = (head: string) => digest('x17-seed-v1' + downloadHash(head));
export const downloadRoot = (head: string, acc: string) => digest('x17-root-v1' + downloadHash(head) + downloadHash(acc));
export async function downloadChain(acc: string, players: AttendancePlayer[]): Promise<string> {
  let current = downloadHash(acc);
  for (const p of players) current = await digest('x17-row-v1' + [current, p.id, p.name, p.status, p.version].map(frame).join(''));
  return current;
}
function header(value: unknown): RosterHeader {
  const h = record(value);
  exact(h, ['event', 'program', 'day', 'scheduled_day', 'starts_at', 'ends_at', 'projection', 'owner',
    'server_now', 'closes_at', 'open', 'count', 'saved', 'protected']);
  return rosterHeader(rosterPage({...h, players: [], more: false}));
}
export async function registerDownloadResult(value: unknown, academy: string, event: string): Promise<DownloadResult> {
  jsonBytes(value, 32768); const v = record(structuredClone(value));
  if ('error' in v) {
    exact(v, ['error']); if (!['changed', 'expired'].includes(String(v.error))) refuse('invalid_download_error');
    return {error: v.error as 'changed' | 'expired'};
  }
  const revision = downloadHash(v.revision), receipt = downloadReceipt(v.receipt, academy, event);
  if (receipt.payload.revision !== revision) refuse('download_revision_mismatch');
  let h: RosterHeader;
  if (v.kind === 'page') {exact(v, ['kind', 'revision', 'roster', 'receipt']); h = rosterHeader(rosterPage(v.roster));}
  else if (v.kind === 'manifest') {
    exact(v, ['kind', 'revision', 'header', 'receipt', 'unchanged']); h = header(v.header);
    if (typeof v.unchanged !== 'boolean') refuse('invalid_download_manifest');
  } else if (v.kind === 'complete') {exact(v, ['kind', 'revision', 'header', 'receipt']); h = header(v.header);}
  else refuse('invalid_download_result');
  const p = receipt.payload;
  if (h.event !== event || p.count !== h.count || p.total_saved !== h.saved ||
      p.head !== await downloadHeaderHash(academy, h) || p.phase !== (v.kind === 'complete' ? 'complete' : 'transfer')) refuse('download_header_mismatch');
  if (v.kind === 'complete' && (p.seen !== p.count || p.saved !== p.total_saved ||
      await downloadRoot(p.head, p.acc) !== revision)) refuse('download_incomplete');
  return structuredClone(v) as DownloadManifest | DownloadPage | DownloadComplete;
}
