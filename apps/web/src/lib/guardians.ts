import { createHmac } from 'node:crypto';
import { uuidPattern } from './onboarding';
export class GuardianInputError extends Error {
}
export function guardianToken(id: string, key: string) {
    if (!uuidPattern.test(id))
        throw new GuardianInputError();
    return createHmac('sha256', key).update(`guardian-invitation:v1:${id.toLowerCase()}:1`).digest('hex');
}
/** Disabled until an exact recipient is separately authorized/configured. */
export function guardianRecipientAllowed(email: string, env: Record<string, string | undefined> = process.env) {
    return env.APP_ENV === 'staging' && (env.GUARDIAN_STAGING_RECIPIENTS ?? '').split(',').map(x => x.trim().toLowerCase()).filter(Boolean).includes(email);
}
export function guardianRequest(body: unknown): {
    rpc: string;
    args: Record<string, unknown>;
    mutating: boolean;
    recipient: boolean;
    dispatch?: string;
} {
    if (!body || typeof body !== 'object' || Array.isArray(body))
        throw new GuardianInputError();
    const b = body as Record<string, unknown>;
    function id(v: unknown) { if (typeof v !== 'string' || !uuidPattern.test(v))
        throw new GuardianInputError(); return v.toLowerCase(); }
    function optional(v: unknown) { return v == null ? null : id(v); }
    function text(v: unknown, max: number) { if (typeof v !== 'string' || !v.trim() || v.length > max)
        throw new GuardianInputError(); return v.trim(); }
    let keys: string[], rpc: string, args: Record<string, unknown>, mutating = false, recipient = false, dispatch: string | undefined;
    switch (b.action) {
        case 'owner-list':
            keys = ['action', 'academy', 'player', 'after', 'inspect'];
            rpc = 'g3_owner_list_v1';
            args = { a: id(b.academy), player: id(b.player), after_id: optional(b.after), inspect_id: optional(b.inspect) };
            break;
        case 'links':
            keys = ['action', 'academy', 'after', 'link'];
            rpc = 'g3_links_v1';
            args = { a: id(b.academy), after_id: optional(b.after), link: optional(b.link) };
            break;
        case 'operation':
            keys = ['action', 'academy', 'op'];
            rpc = 'g3_operation_v1';
            args = { a: id(b.academy), op: id(b.op) };
            mutating = true;
            break;
        case 'appoint': {
            keys = ['action', 'academy', 'player', 'invitation', 'op', 'email', 'confirmed'];
            rpc = 'g3_command_v1';
            const email = text(b.email, 254).toLowerCase();
            if (b.confirmed !== true || !/^[^\s,@]+@[^\s,@]+\.[^\s,@]+$/.test(email))
                throw new GuardianInputError();
            args = { a: id(b.academy), op: id(b.op), act: 'appoint', invitation: id(b.invitation), player: id(b.player), recipient: email };
            mutating = true;
            dispatch = args.invitation as string;
            break;
        }
        case 'end':
        case 'revoke':
        case 'retry':
            keys = ['action', 'academy', 'invitation', 'op', 'version', ...(b.action === 'retry' ? [] : ['reason'])];
            rpc = 'g3_command_v1';
            if (!Number.isSafeInteger(b.version) || (b.version as number) < 1)
                throw new GuardianInputError();
            args = { a: id(b.academy), op: id(b.op), act: b.action, invitation: id(b.invitation), expected_version: b.version, ...(b.action === 'retry' ? {} : { reason: text(b.reason, 240) }) };
            mutating = true;
            if (b.action === 'retry')
                dispatch = args.invitation as string;
            break;
        case 'review':
        case 'accept':
        case 'reconcile-accept':
            keys = ['action', ...(b.action === 'review' ? [] : ['op'])];
            rpc = 'g3_invitation_v1';
            args = { act: b.action === 'reconcile-accept' ? 'reconcile' : b.action, op: b.action === 'review' ? null : id(b.op) };
            mutating = b.action !== 'review';
            recipient = true;
            break;
        default: throw new GuardianInputError();
    }
    if (Object.keys(b).some(k => !keys.includes(k)))
        throw new GuardianInputError();
    return { rpc, args, mutating, recipient, dispatch };
}
