import { createHmac } from 'node:crypto';
import { uuidPattern } from './onboarding';
export class TrainerInputError extends Error {
}
export function trainerToken(id: string, key: string) {
    if (!uuidPattern.test(id))
        throw new TrainerInputError();
    return createHmac('sha256', key).update(`trainer-invitation:v1:${id.toLowerCase()}:1`).digest('hex');
}
/** Disabled until an exact recipient is separately authorized/configured. */
export function trainerRecipientAllowed(email: string, env: Record<string, string | undefined> = process.env) {
    return env.APP_ENV === 'staging' && (env.TRAINER_STAGING_RECIPIENTS ?? '').split(',').map(x => x.trim().toLowerCase()).filter(Boolean).includes(email);
}
export function trainerRequest(body: unknown): {
    rpc: string;
    args: Record<string, unknown>;
    mutating: boolean;
    recipient: boolean;
    dispatch?: string;
} {
    if (!body || typeof body !== 'object' || Array.isArray(body))
        throw new TrainerInputError();
    const b = body as Record<string, unknown>;
    function id(v: unknown) { if (typeof v !== 'string' || !uuidPattern.test(v))
        throw new TrainerInputError(); return v.toLowerCase(); }
    function optional(v: unknown) { return v == null ? null : id(v); }
    function text(v: unknown, max: number) { if (typeof v !== 'string' || !v.trim() || v.length > max)
        throw new TrainerInputError(); return v.trim(); }
    let keys: string[], rpc: string, args: Record<string, unknown>, mutating = false, recipient = false, dispatch: string | undefined;
    switch (b.action) {
        case 'owner-list':
            keys = ['action', 'academy', 'after', 'inspect'];
            rpc = 't4_owner_list_v1';
            args = { a: id(b.academy), after_id: optional(b.after), inspect_id: optional(b.inspect) };
            break;
        case 'profile':
            keys = ['action', 'academy'];
            rpc = 't4_profile_v1';
            args = { a: id(b.academy) };
            break;
        case 'operation':
            keys = ['action', 'academy', 'op'];
            rpc = 't4_operation_v1';
            args = { a: id(b.academy), op: id(b.op) };
            mutating = true;
            break;
        case 'appoint': {
            keys = ['action', 'academy', 'branch', 'name', 'invitation', 'op', 'email', 'confirmed'];
            rpc = 't4_command_v1';
            const email = text(b.email, 254).toLowerCase();
            if (b.confirmed !== true || !/^[^\s,@]+@[^\s,@]+\.[^\s,@]+$/.test(email))
                throw new TrainerInputError();
            args = { a: id(b.academy), op: id(b.op), act: 'appoint', invitation: id(b.invitation), branch: id(b.branch), display_name: text(b.name, 160), recipient: email };
            mutating = true;
            dispatch = args.invitation as string;
            break;
        }
        case 'end':
        case 'revoke':
        case 'retry':
            keys = ['action', 'academy', 'invitation', 'op', 'version', ...(b.action === 'retry' ? [] : ['reason'])];
            rpc = 't4_command_v1';
            if (!Number.isSafeInteger(b.version) || (b.version as number) < 1)
                throw new TrainerInputError();
            args = { a: id(b.academy), op: id(b.op), act: b.action, invitation: id(b.invitation), expected_version: b.version, ...(b.action === 'retry' ? {} : { reason: text(b.reason, 240) }) };
            mutating = true;
            if (b.action === 'retry')
                dispatch = args.invitation as string;
            break;
        case 'review':
        case 'accept':
        case 'reconcile-accept':
            keys = ['action', ...(b.action === 'review' ? [] : ['op'])];
            rpc = 't4_invitation_v1';
            args = { act: b.action === 'reconcile-accept' ? 'reconcile' : b.action, op: b.action === 'review' ? null : id(b.op) };
            mutating = b.action !== 'review';
            recipient = true;
            break;
        default: throw new TrainerInputError();
    }
    if (Object.keys(b).some(k => !keys.includes(k)))
        throw new TrainerInputError();
    return { rpc, args, mutating, recipient, dispatch };
}
