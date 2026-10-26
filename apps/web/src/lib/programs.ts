const uuidPattern = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
export type ProgramReviewReceipt = { through: number; digest: string; signature: string };
export type ProgramRule = { day: number; start: string; end: string };
export type ProgramDefinition = { name: string; from: string; to: string; rules: ProgramRule[] };
export type ProgramRecord = { id: string; definition: ProgramDefinition; timezone: string; state: 'preparing' | 'paused' | 'failed' | 'ready'; completed: number; windows: number; prepared: number; total: number; version: number; context_version: number; failure: string | null; failure_date: string | null };
export type ProgramDate = { date: string; start: string; end: string; utcStart: string; utcEnd: string };
export type ProgramContext = { academy_id: string; academy_name: string; branch_id: string; branch_name: string; sport_id: string; sport_name: string; sport_name_ar: string; timezone: string; version: number };
export class ProgramInputError extends Error {}
function object(value: unknown): Record<string, unknown> { if (!value || typeof value !== 'object' || Array.isArray(value)) throw new ProgramInputError(); return value as Record<string, unknown>; }
function exact(value: Record<string, unknown>, keys: string[]) { if (Object.keys(value).some(key => !keys.includes(key))) throw new ProgramInputError(); }
function id(value: unknown) { if (typeof value !== 'string' || !uuidPattern.test(value)) throw new ProgramInputError(); return value.toLowerCase(); }
function integer(value: unknown, minimum = 0) { if (!Number.isSafeInteger(value) || (value as number) < minimum) throw new ProgramInputError(); return value as number; }
function calendarDate(v: unknown): string {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v) || v.startsWith('0000') || !Number.isFinite(Date.parse(v + 'T00:00:00Z')) || new Date(v + 'T00:00:00Z').toISOString().slice(0,10) !== v) throw new ProgramInputError();
  return v;
}
export function programDefinition(value: unknown): ProgramDefinition {
  const d = object(value); exact(d, ['name', 'from', 'to', 'rules']);
  if (typeof d.name !== 'string' || !d.name.trim() || d.name.length > 160 || !Array.isArray(d.rules) || d.rules.length < 1 || d.rules.length > 7) throw new ProgramInputError();

  const from = calendarDate(d.from), to = calendarDate(d.to); if (to < from) throw new ProgramInputError();
  const rules = d.rules.map(value => { const r = object(value); exact(r, ['day', 'start', 'end']); const day = integer(r.day); if (day > 6 || typeof r.start !== 'string' || typeof r.end !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(r.start) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(r.end) || r.end <= r.start) throw new ProgramInputError(); return { day, start: r.start, end: r.end }; }).sort((a, b) => a.day - b.day);
  if (new Set(rules.map(r => r.day)).size !== rules.length) throw new ProgramInputError();
  return { name: d.name.trim(), from, to, rules };
}
function reviewReceipt(value: unknown): ProgramReviewReceipt {
  const r=object(value);exact(r,['through','digest','signature']);
  if(typeof r.digest!=='string'||!/^[a-f0-9]{64}$/.test(r.digest)||typeof r.signature!=='string'||!/^[a-f0-9]{64}$/.test(r.signature))throw new ProgramInputError();
  return {through:integer(r.through),digest:r.digest,signature:r.signature};
}
export function programsRequest(value: unknown) {
  const b = object(value), a = id(b.academy); let keys: string[], rpc: string, args: Record<string, unknown>, mutating = false;
  switch (b.action) {
    case 'list': keys = ['action', 'academy', 'after']; rpc = 'p5_list_v1'; args = { a, after_id: b.after == null ? null : id(b.after) }; break;
    case 'dates': keys = ['action','academy','from','after_day','after_program']; rpc = 'p5_dates_v1'; if((b.after_day==null)!==(b.after_program==null))throw new ProgramInputError(); args={a,day_start:calendarDate(b.from),after_day:b.after_day==null?null:calendarDate(b.after_day),after_program:b.after_program==null?null:id(b.after_program)}; break;
    case 'preview': keys = ['action', 'academy', 'definition', 'context', 'window', 'receipt']; rpc = 'p5_preview_v1'; args = { a, definition: programDefinition(b.definition), expected_context: integer(b.context), idx: integer(b.window), previous:b.receipt==null?null:reviewReceipt(b.receipt) }; break;
    case 'create': keys = ['action', 'academy', 'definition', 'context', 'op', 'receipt']; rpc = 'p5_create_v1'; mutating = true; args = { a, definition: programDefinition(b.definition), expected_context: integer(b.context), op: id(b.op), review:reviewReceipt(b.receipt) }; break;
    case 'read': keys = ['action', 'academy', 'program', 'window']; rpc = 'p5_read_v1'; args = { a, program: id(b.program), idx: integer(b.window) }; break;
    case 'step': keys = ['action', 'academy', 'program', 'version', 'step']; rpc = 'p5_step_v1'; mutating = true; if (typeof b.step !== 'string' || !['prepare', 'pause', 'resume', 'finalize'].includes(b.step)) throw new ProgramInputError(); args = { a, program: id(b.program), expected_version: integer(b.version, 1), act: b.step }; break;
    case 'reconcile': keys = ['action', 'academy', 'op']; rpc = 'p5_operation_v1'; mutating = true; args = { a, op: id(b.op) }; break;
    default: throw new ProgramInputError();
  }
  exact(b, keys); return { rpc, args, mutating };
}

/** UI estimate only. The server derives authoritative counts and timestamps. */
export function proposedProgramCount(d: ProgramDefinition): number | null {
  const first = Date.parse(d.from + 'T00:00:00Z'), last = Date.parse(d.to + 'T00:00:00Z'), span = (last-first)/86400000+1;
  if (!Number.isFinite(span) || span < 1 || !d.rules.length) return null;
  const day = new Date(first).getUTCDay();
  return d.rules.reduce((n,r) => { const offset = (r.day-day+7)%7; return n + (offset<span ? 1+Math.floor((span-1-offset)/7) : 0); },0);
}
