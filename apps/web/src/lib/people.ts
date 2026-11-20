import { uuidPattern } from './onboarding';
const privateFieldLimits = { legacyId: 80, address: 300, schoolName: 160, nationalId: 80, medicalNotes: 500 } as const;
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
        case 'privateProfile':
            keys = ['action', 'academy', 'player', 'revealId'];
            if (b.revealId !== undefined && typeof b.revealId !== 'boolean') throw new PeopleInputError();
            name = 'i2_private_profile_v1';
            args = { a, player: id(b.player), reveal_id: b.revealId === true };
            break;
        case 'privatePhoto':
            keys = ['action', 'academy', 'player'];
            name = 'i2_private_photo_v1';
            args = { a, player: id(b.player) };
            break;
        case 'savePrivatePhoto':
            keys = ['action', 'academy', 'player', 'op', 'version', 'image'];
            if (!Number.isInteger(b.version) || (b.version as number) < 0 || (b.version as number) >= 2147483647 ||
                (b.image !== null && (typeof b.image !== 'string' || !b.image))) throw new PeopleInputError();
            name = 'i2_save_private_photo_v1';
            args = { a, player: id(b.player), op: id(b.op), expected_version: b.version, photo_base64: b.image };
            break;
        case 'findMember': {
            keys = ['action', 'academy', 'kind', 'reference'];
            const reference = text(b.reference, 80);
            if (!reference || (b.kind !== 'existing' && b.kind !== 'generated') ||
                (b.kind === 'generated' && !/^[1-9][0-9]{0,18}$/.test(reference))) throw new PeopleInputError();
            name = 'i2_find_member_v1';
            args = { a, id_kind: b.kind, reference };
            break;
        }
        case 'savePrivateProfile': {
            keys = ['action', 'academy', 'player', 'op', 'version', 'changes'];
            if (!Number.isInteger(b.version) || (b.version as number) < 0 || (b.version as number) >= 2147483647 ||
                !b.changes || typeof b.changes !== 'object' || Array.isArray(b.changes)) throw new PeopleInputError();
            const entries = Object.entries(b.changes);
            if (!entries.length) throw new PeopleInputError();
            const changes = Object.fromEntries(entries.map(([key, value]) => {
                if (!Object.hasOwn(privateFieldLimits, key)) throw new PeopleInputError();
                return [key, value === null ? null : text(value, privateFieldLimits[key as keyof typeof privateFieldLimits]) || null];
            }));
            name = 'i2_save_private_profile_v1';
            args = { a, player: id(b.player), op: id(b.op), expected_version: b.version, changes };
            break;
        }
        case 'create': {
            keys = ['action', 'academy', 'branch', 'op', 'name', 'alternateName', 'contact', 'revision', 'different'];
            const alternate = text(b.alternateName ?? '', 160);
            name = alternate ? 'i2_register_v2' : 'i2_register_v1';
            const display_name = text(b.name, 160), contact = text(b.contact ?? '', 254).toLowerCase();
            if (!display_name || (contact && !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@example\.invalid$/.test(contact)) || !Number.isSafeInteger(b.revision) || (b.revision as number) < 0 || typeof b.different !== 'boolean')
                throw new PeopleInputError();
            args = { a, branch: id(b.branch), op: id(b.op), display_name, contact, reviewed_revision: b.revision, different_person: b.different };
            if (alternate) args.alternate_name = alternate;
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
    return { rpc: name, args, mutating: b.action === 'create' || b.action === 'reconcile' || b.action === 'savePrivateProfile' || b.action === 'savePrivatePhoto' };
}
