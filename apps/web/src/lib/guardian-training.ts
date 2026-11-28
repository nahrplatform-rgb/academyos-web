import { uuidPattern } from './onboarding';
export class GuardianTrainingInputError extends Error {
}
function id(v: unknown) { if (typeof v !== 'string' || !uuidPattern.test(v))
    throw new GuardianTrainingInputError(); return v.toLowerCase(); }
export function guardianTrainingRequest(value: unknown) {
    if (!value || typeof value !== 'object' || Array.isArray(value))
        throw new GuardianTrainingInputError();
    const b = value as Record<string, unknown>, a = id(b.academy);
    let keys: string[], rpc: string, args: Record<string, unknown>;
    if (b.action === 'links') {
        keys = ['action', 'academy', 'after'];
        rpc = 'b11_links_v1';
        args = { a, after_id: b.after == null ? null : id(b.after) };
    }
    else if (b.action === 'schedule') {
        keys = ['action', 'academy', 'link', 'from', 'after_at', 'after_event'];
        rpc = 'b11_schedule_v1';
        if (typeof b.from !== 'string' || !/^\d{4}-\d\d-\d\d$/.test(b.from) || !Number.isFinite(Date.parse(b.from)) || new Date(b.from).toISOString().slice(0, 10) !== b.from || b.from < '0001-01-01' || b.from > '9999-12-24' || (b.after_at == null) !== (b.after_event == null))
            throw new GuardianTrainingInputError();
        if (b.after_at != null && (typeof b.after_at !== 'string' || b.after_at.length > 35 || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,6})?(?:Z|[+-]\d\d:\d\d)$/.test(b.after_at) || !Number.isFinite(Date.parse(b.after_at))))
            throw new GuardianTrainingInputError();
        args = { a, link: id(b.link), first_date: b.from, after_at: b.after_at ?? null, after_event: b.after_event == null ? null : id(b.after_event) };
    }
    else if (b.action === 'detail') {
        keys = ['action', 'academy', 'link', 'event'];
        rpc = 'b11_detail_v1';
        args = { a, link: id(b.link), event: id(b.event) };
    }
    else
        throw new GuardianTrainingInputError();
    if (Object.keys(b).some(k => !keys.includes(k)))
        throw new GuardianTrainingInputError();
    return { rpc, args };
}
export type FamilyLink = {
    id: string;
    display_name: string;
    branch_name: string;
    academy_name: string;
};
export type FamilySession = {
    id: string;
    date: string;
    starts_at: string;
    ends_at: string;
    title: string;
    branch: string;
    sport: string;
    sport_ar: string | null;
    timezone: string;
    status: 'present' | 'absent' | null;
    corrected: boolean;
    updated_at: string | null;
};
export type FamilyContext = {
    link: string;
    player: string;
    name: string;
    branch: string;
    academy: string;
    academy_name: string;
};
export type FamilySchedule = {
    context: FamilyContext;
    from: string;
    to: string;
    items: FamilySession[];
    more: boolean;
    next: FamilySession | null;
};
