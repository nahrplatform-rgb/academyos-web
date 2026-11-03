import {AttendanceInputError, attendanceRequest, isRegisterReceipt, type AttendancePlayer, type AttendanceRoster,
  type RegisterReceipt} from './attendance';

export const REGISTER_LIMIT = 1000;
export const LOCAL_PAGE_LIMIT = 50;
export const WIRE_LIMIT = 131072;
export const LOCAL_RECORD_LIMIT = 2 * 1024 * 1024;
const encoder = new TextEncoder(), decoder = new TextDecoder('utf-8', {fatal: true});
export function refuse(code: string): never {throw new Error(code);}
export function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) refuse('invalid_record');
  return value as Record<string, unknown>;
}
function exact(value: Record<string, unknown>, keys: string[]) {
  if (Object.keys(value).sort().join(',') !== [...keys].sort().join(',')) refuse('invalid_fields');
}
export function opaque(value: unknown): string {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9_-]{1,160}$/.test(value)) refuse('invalid_scope');
  return value;
}
export function identifier(value: unknown): string {
  if (typeof value !== 'string' || !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(value)) refuse('invalid_identifier');
  return value;
}
function text(value: unknown, max = 500): string {
  if (typeof value !== 'string' || !value.trim() || value.length > max) refuse('invalid_text');
  return value;
}
function integer(value: unknown, max = REGISTER_LIMIT): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0 || value > max) refuse('invalid_count');
  return value;
}
function timestamp(value: unknown): string {
  if (typeof value !== 'string' || value.length > 40 || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,6})?(?:Z|[+-]\d\d:\d\d)$/.test(value) || !Number.isFinite(Date.parse(value))) refuse('invalid_timestamp');
  return value;
}
function day(value: unknown): string {
  if (typeof value !== 'string' || !/^\d{4}-\d\d-\d\d$/.test(value) ||
      !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value) refuse('invalid_day');
  return value;
}
export function jsonBytes(value: unknown, limit = LOCAL_RECORD_LIMIT): Uint8Array<ArrayBuffer> {
  const bytes = encoder.encode(JSON.stringify(value));
  if (!bytes.byteLength || bytes.byteLength > limit) refuse('record_size_exceeded');
  return bytes;
}
export function fromBytes(value: ArrayBuffer): unknown {
  if (!value.byteLength || value.byteLength > LOCAL_RECORD_LIMIT) refuse('record_size_exceeded');
  return JSON.parse(decoder.decode(value));
}
export async function digest(value: string): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return Array.from(new Uint8Array(hash), n => n.toString(16).padStart(2, '0')).join('');
}

export type RegisterPacket = {
  action: 'register'; academy: string; event: string; op: string; captured_at: string;
  marks: {player: string; status: 'present' | 'absent'; version: 0}[];
};
export function canonicalRegister(value: unknown): {packet: RegisterPacket; wire: string} {
  let command: ReturnType<typeof attendanceRequest>;
  try {command = attendanceRequest(value);}
  catch (error) {if (error instanceof AttendanceInputError) refuse('invalid_register'); throw error;}
  if (command.rpc !== 'a10_register_v1') refuse('register_only');
  const args = command.args;
  const packet = {action: 'register', academy: args.a, event: args.ev, marks: args.marks,
    captured_at: args.captured_at, op: args.op} as RegisterPacket;
  const bytes = jsonBytes(packet, WIRE_LIMIT);
  return {packet, wire: decoder.decode(bytes)};
}
export function exactReceipt(value: unknown, packet: RegisterPacket): RegisterReceipt {
  if (!isRegisterReceipt(value, packet.event, packet.op) || value.count !== packet.marks.length ||
      Object.keys(value).sort().join(',') !== 'count,event,kind,op') refuse('receipt_mismatch');
  return {kind: 'register', event: value.event, op: value.op, count: value.count};
}

export function rosterPage(value: unknown, byteLimit = 32768): AttendanceRoster {
  jsonBytes(value, byteLimit);
  const v = record(value);
  exact(v, ['event', 'program', 'day', 'scheduled_day', 'starts_at', 'ends_at', 'projection',
    'owner', 'server_now', 'closes_at', 'open', 'count', 'saved', 'players', 'more', 'protected']);
  identifier(v.event); identifier(v.program); day(v.day); day(v.scheduled_day);
  timestamp(v.starts_at); timestamp(v.ends_at); timestamp(v.server_now); timestamp(v.closes_at);
  if (Date.parse(v.ends_at as string) <= Date.parse(v.starts_at as string) ||
      Date.parse(v.closes_at as string) !== Date.parse(v.ends_at as string) + 86400000) refuse('invalid_window');
  if (v.owner !== true || typeof v.open !== 'boolean' || typeof v.more !== 'boolean' ||
      typeof v.protected !== 'boolean') refuse('owner_projection_required');
  const count = integer(v.count), saved = integer(v.saved);
  if (saved > count) refuse('invalid_count');
  const p = record(v.projection);
  exact(p, ['name', 'branch', 'timezone', 'sport', 'sport_ar']);
  for (const key of Object.keys(p)) text(p[key]);
  try {new Intl.DateTimeFormat('en', {timeZone: p.timezone as string});} catch {refuse('invalid_timezone');}
  if (!Array.isArray(v.players) || v.players.length > LOCAL_PAGE_LIMIT || v.players.length > count ||
      v.more && !v.players.length) refuse('invalid_page');
  let previous = '';
  for (const raw of v.players) {
    const player = record(raw);
    exact(player, ['id', 'name', 'status', 'version']);
    const id = identifier(player.id); text(player.name); integer(player.version, Number.MAX_SAFE_INTEGER);
    if (id <= previous || ![null, 'present', 'absent'].includes(player.status as null | string) ||
        (player.status === null) !== (player.version === 0)) refuse('invalid_player_basis');
    previous = id;
  }
  // Return a detached exact DTO; callers cannot mutate an in-flight validation basis.
  return JSON.parse(JSON.stringify(v)) as AttendanceRoster;
}
export type RosterHeader = Omit<AttendanceRoster, 'players' | 'more'>;
export function rosterHeader(page: AttendanceRoster): RosterHeader {
  const {players: _players, more: _more, ...header} = page;
  void _players; void _more;
  return header;
}
export function stableHeader(header: RosterHeader): string {
  // Current pages have no global snapshot ID. Per-row versions remain canonical.
  const p = header.projection;
  return JSON.stringify([header.event, header.program, header.day, header.scheduled_day,
    header.starts_at, header.ends_at, p.name, p.branch, p.timezone, p.sport, p.sport_ar,
    header.owner, header.closes_at, header.count, header.saved, header.protected]);
}
export type OriginalState = 'pending' | 'unknown' | 'needs_review' | 'confirmed';
export type Original = {
  v: 1; wire: string; hash: string; state: OriginalState; revision: number;
  display: {header: RosterHeader; players: AttendancePlayer[]};
  receipt: RegisterReceipt | null; refusal: 'conflict' | 'deadline' | 'denied' | null;
};
