/** Accepted QR card/window/scan input and domain receipt contract. No actor supplied. */
export class QrInputError extends Error {
}
export const qrCodePattern = /^aos:qr:1:[A-Za-z0-9_-]{43}$/;
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
function id(v: unknown) {
    if (typeof v !== 'string' || !uuid.test(v))
        throw new QrInputError();
    return v.toLowerCase();
}
function integer(v: unknown, max = Number.MAX_SAFE_INTEGER) {
    if (!Number.isSafeInteger(v) || (v as number) < 0 || (v as number) > max)
        throw new QrInputError();
    return v as number;
}
export function qrRequest(value: unknown) {
    if (!value || typeof value !== 'object' || Array.isArray(value))
        throw new QrInputError();
    const v = value as Record<string, unknown>, a = id(v.academy);
    let rpc: string, keys: string[], args: Record<string, unknown>, mutating = false;
    switch (v.action) {
        case 'context':
            rpc = 'q13_context_v1';
            keys = ['action', 'academy'];
            args = { a };
            break;
        case 'sessions': {
            rpc = 'q13_sessions_v1';
            keys = ['action', 'academy', 'branch', 'day', 'after_at', 'after_id'];
            if (typeof v.day !== 'string' || !/^\d{4}-\d\d-\d\d$/.test(v.day) || !Number.isFinite(Date.parse(v.day)) || new Date(v.day).toISOString().slice(0, 10) !== v.day)
                throw new QrInputError();
            if ((v.after_at == null) !== (v.after_id == null) || v.after_at != null && (typeof v.after_at !== 'string' || !/^\d{4}-\d\d-\d\dT/.test(v.after_at) || v.after_at.length > 40 || !Number.isFinite(Date.parse(v.after_at))))
                throw new QrInputError();
            args = { a, b: id(v.branch), on_day: v.day, after_at: v.after_at ?? null, after_id: v.after_id == null ? null : id(v.after_id) };
            break;
        }
        case 'card':
            rpc = 'q13_card_v1';
            keys = ['action', 'academy', 'player'];
            args = { a, pid: id(v.player) };
            break;
        case 'card_change': {
            rpc = 'q13_card_change_v1';
            keys = ['action', 'academy', 'player', 'choice', 'version', 'code', 'op'];
            if (!['issue', 'replace', 'revoke'].includes(String(v.choice)) || (v.choice === 'revoke' ? v.code !== null : typeof v.code !== 'string' || !qrCodePattern.test(v.code)))
                throw new QrInputError();
            args = { a, pid: id(v.player), act: v.choice, expected: integer(v.version), code: v.code, op: id(v.op) };
            mutating = true;
            break;
        }
        case 'window_change':
            rpc = 'q13_window_change_v1';
            keys = ['action', 'academy', 'event', 'version', 'before', 'after', 'op'];
            args = { a, ev: v.event == null ? null : id(v.event), expected: integer(v.version), before_minutes: integer(v.before, 180), after_minutes: integer(v.after, 180), op: id(v.op) };
            mutating = true;
            break;
        case 'resolve':
        case 'capture': {
            keys = ['action', 'academy', 'branch', 'events', 'code', ...(v.action === 'capture' ? ['chosen', 'op'] : [])];
            if (!Array.isArray(v.events) || v.events.length < 1 || v.events.length > 25 || typeof v.code !== 'string' || !qrCodePattern.test(v.code))
                throw new QrInputError();
            const events = v.events.map(id);
            if (new Set(events).size !== events.length)
                throw new QrInputError();
            args = { a, b: id(v.branch), events, code: v.code };
            rpc = v.action === 'capture' ? 'q13_capture_v1' : 'q13_resolve_v1';
            if (v.action === 'capture') {
                mutating = true;
                args.chosen = v.chosen == null ? null : id(v.chosen);
                if (args.chosen && !events.includes(String(args.chosen)))
                    throw new QrInputError();
                args.op = id(v.op);
            }
            break;
        }
        case 'reconcile': {
            keys = ['action', 'academy', 'context', 'op'];
            if (typeof v.context !== 'string' || !(v.context === 'settings' || /^(?:card|scan):[a-f0-9-]{36}$/.test(v.context)))
                throw new QrInputError();
            if (v.context !== 'settings')
                id(v.context.slice(5));
            rpc = 'q13_operation_v1';
            args = { a, context: v.context, op: id(v.op) };
            mutating = true;
            break;
        }
        default: throw new QrInputError();
    }
    if (Object.keys(v).some(k => !keys.includes(k)))
        throw new QrInputError();
    return { rpc, args, mutating };
}
export type QrWindow = {
    version: number;
    before: number;
    after: number;
    override?: boolean;
    opens_at?: string;
    closes_at?: string;
};
export type QrContext = {
    owner: boolean;
    branch: string;
    branch_name: string;
    timezone: string;
    server_now: string;
    settings: QrWindow;
};
export type QrSession = {
    id: string;
    starts_at: string;
    ends_at: string;
    projection: {
        name: string;
        branch: string;
        timezone: string;
        sport: string;
        sport_ar: string;
    };
    roster_count: number;
    present: number;
    window: QrWindow;
};
export type QrSessions = {
    items: QrSession[];
    more: boolean;
    server_now: string;
};
export type QrMatch = {
    event: string;
    player: string;
    name: string;
    starts_at: string;
    ends_at: string;
    projection: QrSession['projection'];
    status: 'present' | 'absent' | null;
    version: number;
    card: string;
    window: QrWindow;
};
export type QrCard = {
    player: string;
    name: string;
    branch: string;
    version: number;
    card: string | null;
    active: boolean;
};
export type QrReceipt = {
    kind: 'card';
    player: string;
    version: number;
    card: string;
    active: boolean;
} | {
    kind: 'settings';
    event: string | null;
    version: number;
    before: number;
    after: number;
} | {
    kind: 'scan';
    event: string;
    player: string;
    name: string;
    status: 'present';
    version: number;
    already: boolean;
};
export type QrPending = {
    op: string;
    context: string;
    kind: 'card' | 'settings' | 'scan';
    target: string | null;
};
export function isQrReceipt(v: unknown, p: QrPending): v is QrReceipt {
    if (!v || typeof v !== 'object' || Array.isArray(v))
        return false;
    const r = v as Record<string, unknown>;
    if (r.kind !== p.kind || !Number.isSafeInteger(r.version) || (r.version as number) < 1)
        return false;
    if (r.kind === 'card')
        return r.player === p.target && typeof r.card === 'string' && uuid.test(r.card) && typeof r.active === 'boolean';
    if (r.kind === 'settings')
        return r.event === p.target && Number.isInteger(r.before) && Number.isInteger(r.after) && (r.before as number) >= 0 && (r.before as number) <= 180 && (r.after as number) >= 0 && (r.after as number) <= 180;
    return typeof r.event === 'string' && uuid.test(r.event) && (p.target === null || r.event === p.target) && typeof r.player === 'string' && uuid.test(r.player) && typeof r.name === 'string' && r.name.length <= 160 && r.status === 'present' && typeof r.already === 'boolean';
}
export function newQrCode() { const bytes = crypto.getRandomValues(new Uint8Array(32)); return 'aos:qr:1:' + btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
