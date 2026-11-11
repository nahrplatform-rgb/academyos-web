import { uuidPattern } from './onboarding';
export class PeopleInputError extends Error {
}
export function peopleRequest(body: unknown): {
    rpc: string;
    args: Record<string, unknown>;
    mutating: boolean;
} {
    if (!body || typeof body !== 'object' || Array.isArray(body))
        throw new PeopleInputError();
    const b = body as Record<string, unknown>;
    function id(value: unknown) { if (typeof value !== 'string' || !uuidPattern.test(value))
        throw new PeopleInputError(); return value.toLowerCase(); }
    function text(value: unknown, max: number) { if (typeof value !== 'string' || value.length > max)
        throw new PeopleInputError(); return value.trim(); }
    const a = id(b.academy), after_id = b.after == null ? null : id(b.after);
    let keys: string[], name: string, args: Record<string, unknown>;
    switch (b.action) {
        case 'list':
            keys = ['action', 'academy', 'after', 'query'];
            name = 'i2_people_v1';
            {
                const query = text(b.query ?? '', 160);
                if (query.normalize('NFKC').trim().length === 1)
                    throw new PeopleInputError();
                args = { a, after_id, query };
            }
            break;
        case 'candidates':
            keys = ['action', 'academy', 'after', 'name'];
            name = 'i2_candidates_v1';
            args = { a, after_id, display_name: text(b.name, 160) };
            if (!args.display_name)
                throw new PeopleInputError();
            break;
        case 'profile':
            keys = ['action', 'academy', 'player'];
            name = 'i2_profile_v1';
            args = { a, player: id(b.player) };
            break;
        case 'create': {
            keys = ['action', 'academy', 'branch', 'op', 'name', 'contact', 'revision', 'different'];
            name = 'i2_register_v1';
            const display_name = text(b.name, 160), contact = text(b.contact ?? '', 254).toLowerCase();
            if (!display_name || (contact && !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@example\.invalid$/.test(contact)) || !Number.isSafeInteger(b.revision) || (b.revision as number) < 0 || typeof b.different !== 'boolean')
                throw new PeopleInputError();
            args = { a, branch: id(b.branch), op: id(b.op), display_name, contact, reviewed_revision: b.revision, different_person: b.different };
            break;
        }
        case 'reconcile':
            keys = ['action', 'academy', 'op'];
            name = 'i2_operation_v1';
            args = { a, op: id(b.op) };
            break;
        default: throw new PeopleInputError();
    }
    if (Object.keys(b).some(k => !keys.includes(k)))
        throw new PeopleInputError();
    return { rpc: name, args, mutating: b.action === 'create' || b.action === 'reconcile' };
}
