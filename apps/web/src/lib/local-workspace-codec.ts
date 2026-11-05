import {addCivilDays, isCivilDay} from './experience-format';
import {digest, identifier, jsonBytes, record, refuse} from './local-register-codec';
import {workspaceReceipt} from './workspace-download';

export type WorkspaceScope = {
  environment: 'staging'; subject: string; academy: string; device: string;
  epoch: 1; capability: 'owner-workspace-v1'; namespace: string;
};
export type WorkspaceTicket = {material: string; verifiedAt: number};
export type Collection = 'people' | `calendar:${string}`;
export type PersonSummary = {id: string; display_name: string; branch_id: string; branch_name: string};
export type SessionSummary = {
  id: string; program: string; day: string; date: string; starts_at: string; ends_at: string;
  title: string; branch: string; sport: string; sport_ar: string; timezone: string;
  state: 'cancelled' | 'moved' | 'published' | 'draft'; published: boolean;
  capacity: number | null; roster_count: number;
};
export type WorkspaceRow = PersonSummary | SessionSummary;
type Cursor = {id: string} | {date: string; at: string; program: string; day: string};
export type WorkspaceReceipt = {signature: string; payload: {
  v: 1; a: string; device: string; ns: string; epoch: 1; scope: string; dataset: 'people' | 'calendar';
  first: string | null; last: string | null; revision: string; total: number | null; seen: number;
  cursor: Cursor | null; acc: string; issued: number; phase: 'seed' | 'transfer' | 'complete';
}};

const peopleFields = ['id','display_name','branch_id','branch_name'] as const;
const sessionFields = ['id','program','day','date','starts_at','ends_at','title','branch','sport','sport_ar',
  'timezone','state','published','capacity','roster_count'] as const;

function exact(value: Record<string, unknown>, fields: readonly string[]) {
  if (Object.keys(value).length !== fields.length || fields.some(field => !Object.hasOwn(value,field))) {
    refuse('workspace_invalid_fields');
  }
}
function label(value: unknown) {
  if (typeof value !== 'string' || !value.trim() || value.length > 500) refuse('workspace_invalid_label');
}
function count(value: unknown) {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) refuse('workspace_invalid_count');
}
export function workspaceBinding(scope: WorkspaceScope) {
  exact(record(scope), ['environment','subject','academy','device','epoch','capability','namespace']);
  identifier(scope.academy); identifier(scope.device); identifier(scope.namespace);
  if (scope.environment !== 'staging' || scope.epoch !== 1 || scope.capability !== 'owner-workspace-v1' ||
      typeof scope.subject !== 'string' || !/^user_[a-zA-Z0-9_]{1,120}$/.test(scope.subject)) refuse('workspace_invalid_scope');
  return JSON.stringify([1,scope.environment,scope.subject,scope.academy,scope.device,scope.epoch,scope.capability,scope.namespace]);
}

export function readWorkspaceReceipt(raw: unknown, scope: WorkspaceScope, collection: Collection, completed = false) {
  jsonBytes(raw, 8192);
  const receipt = workspaceReceipt(raw, completed) as unknown as WorkspaceReceipt;
  const p = receipt.payload;
  if (p.a !== scope.academy || p.device !== scope.device || p.ns !== scope.namespace || p.epoch !== scope.epoch) {
    refuse('workspace_wrong_receipt_scope');
  }
  if (collection === 'people' && p.dataset === 'people') return receipt;
  const month = collection.startsWith('calendar:') ? collection.slice(9) + '-01' : '';
  if (!isCivilDay(month) || p.dataset !== 'calendar') refuse('workspace_wrong_collection');
  const first = addCivilDays(month, -new Date(month+'T00:00:00Z').getUTCDay());
  if (p.first !== first || p.last !== addCivilDays(first,41)) refuse('workspace_wrong_window');
  return receipt;
}

export function sameWorkspaceVersion(a: WorkspaceReceipt, b: WorkspaceReceipt) {
  const x=a.payload, y=b.payload;
  return x.scope===y.scope && x.dataset===y.dataset && x.revision===y.revision &&
    x.first===y.first && x.last===y.last;
}

function cursorFor(row: WorkspaceRow): Cursor {
  return 'program' in row ? {date:row.date,at:row.starts_at,program:row.program,day:row.day} : {id:row.id};
}
function cursorKey(cursor: Cursor | null) {
  if (!cursor) return '';
  return 'id' in cursor ? cursor.id : [cursor.date,cursor.at,cursor.program,cursor.day].join('|');
}
function pageRows(raw: unknown, first: string | null, last: string | null): WorkspaceRow[] {
  jsonBytes(raw,24576);
  if (!Array.isArray(raw) || raw.length > (first===null?25:50)) refuse('workspace_invalid_page');
  for (const item of raw) {
    const row=record(item);
    identifier(row.id);
    if (first===null) {
      exact(row,peopleFields); identifier(row.branch_id); label(row.display_name); label(row.branch_name);
      continue;
    }
    exact(row,sessionFields);
    identifier(row.program);
    if (!isCivilDay(row.day) || !isCivilDay(row.date) || row.date < first || row.date > last!) refuse('workspace_invalid_day');
    for (const time of [row.starts_at,row.ends_at]) {
      if (typeof time!=='string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{6}Z$/.test(time) ||
          !Number.isFinite(Date.parse(time))) refuse('workspace_invalid_time');
    }
    if ((row.ends_at as string) <= (row.starts_at as string) ||
        !['cancelled','moved','published','draft'].includes(row.state as string) ||
        typeof row.published !== 'boolean') refuse('workspace_invalid_session');
    for (const field of ['title','branch','sport','sport_ar','timezone']) label(row[field]);
    if (row.capacity!==null) count(row.capacity);
    count(row.roster_count);
  }
  return raw as WorkspaceRow[];
}

const encoder = new TextEncoder();
function frame(value: unknown) {
  if (value===null) return 'n;';
  const text=String(value);
  return 's'+encoder.encode(text).byteLength+':'+text;
}
export async function verifyWorkspacePage(previous: WorkspaceReceipt, next: WorkspaceReceipt, input: unknown) {
  const before=previous.payload, after=next.payload;
  const rows=pageRows(input,before.first,before.last);
  if (!sameWorkspaceVersion(previous,next) || after.phase!=='transfer' ||
      (before.total!==null && before.total!==after.total) || after.seen!==before.seen+rows.length ||
      (!rows.length && (before.phase!=='seed'||after.total!==0))) refuse('workspace_invalid_progress');
  let root=before.acc, cursor=cursorKey(before.cursor);
  for (const row of rows) {
    const current=cursorKey(cursorFor(row));
    if (current<=cursor) refuse('workspace_invalid_row_order');
    cursor=current;
    const fields='program' in row ? sessionFields : peopleFields;
    const values=record(row);
    root=await digest('x21-row-v1'+frame(root)+frame(before.dataset)+fields.map(field=>frame(values[field])).join(''));
  }
  if (cursor!==cursorKey(after.cursor) || root!==after.acc) refuse('workspace_page_chain_mismatch');
  return rows;
}

export function verifyWorkspaceCompletion(last: WorkspaceReceipt, final: WorkspaceReceipt) {
  const a=last.payload,b=final.payload;
  if (a.phase!=='transfer' || b.phase!=='complete' || !sameWorkspaceVersion(last,final) ||
      a.total!==a.seen || b.total!==a.total || b.seen!==a.seen || b.acc!==a.acc ||
      cursorKey(a.cursor)!==cursorKey(b.cursor)) refuse('workspace_completion_mismatch');
}
