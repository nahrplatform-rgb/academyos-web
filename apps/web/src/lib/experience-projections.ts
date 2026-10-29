/** Read selectors only. Each named database operation independently verifies current authority. */
export class ExperienceInputError extends Error {}
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
function id(value: unknown): string {
  if (typeof value !== 'string' || !uuid.test(value)) throw new ExperienceInputError();
  return value.toLowerCase();
}
function day(value: unknown): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000')) throw new ExperienceInputError();
  const time = Date.parse(`${value}T00:00:00Z`);
  if (!Number.isFinite(time) || new Date(time).toISOString().slice(0, 10) !== value) throw new ExperienceInputError();
  return value;
}
export function experienceRequest(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new ExperienceInputError();
  const body = value as Record<string, unknown>;
  const a = id(body.academy);
  const actions = {
    owner_home: 'x15_owner_home_v1', trainer_home: 'x15_trainer_home_v1', guardian_home: 'x15_guardian_home_v1',
    owner_calendar: 'x15_owner_calendar_v1', trainer_calendar: 'x15_trainer_calendar_v1', guardian_calendar: 'x15_guardian_calendar_v1',
  } as const;
  if (typeof body.action !== 'string' || !Object.hasOwn(actions, body.action)) throw new ExperienceInputError();
  const action = body.action as keyof typeof actions;
  const calendar = action.endsWith('_calendar'), guardian = action.startsWith('guardian_');
  const allowed = ['action', 'academy', ...(guardian ? ['link'] : []), ...(calendar ? ['from', 'to', 'cursor'] : [])];
  if (Object.keys(body).some(key => !allowed.includes(key))) throw new ExperienceInputError();
  const args: Record<string, unknown> = { a };
  if (guardian) args.link = id(body.link);
  if (calendar) {
    const from = day(body.from), to = day(body.to);
    const span = (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000;
    if (span < 0 || span > 41) throw new ExperienceInputError();
    args.first_date = from; args.last_date = to;
    args.after_at = null; args.after_id = null; args.after_day = null;
    if (body.cursor != null) {
      if (typeof body.cursor !== 'object' || Array.isArray(body.cursor)) throw new ExperienceInputError();
      const cursor = body.cursor as Record<string, unknown>;
      if (Object.keys(cursor).sort().join(',') !== 'at,day,from,id,to' || cursor.from !== from || cursor.to !== to || typeof cursor.at !== 'string' || cursor.at.length > 40 || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(cursor.at) || !Number.isFinite(Date.parse(cursor.at))) throw new ExperienceInputError();
      args.after_at = cursor.at; args.after_id = id(cursor.id); args.after_day = day(cursor.day);
    }
  }
  return { rpc: actions[action], args, mutating: false as const };
}
export type CalendarCursor = { at: string; id: string; day: string; from: string; to: string };
export type ExperienceContext = { academy_id: string; academy_name: string; branch_id?: string; branch_name?: string; timezone: string; today: string };
export type CalendarSession = {
  id: string; program: string; day: string; date: string; starts_at: string; ends_at: string;
  title: string; branch: string; sport: string; sport_ar: string; timezone: string;
  state: 'draft' | 'published' | 'moved' | 'cancelled'; published: boolean;
  capacity: number | null; roster_count: number | null; cursor: CalendarCursor;
};
export type CalendarProjection = { context: ExperienceContext; as_of: string; from: string; to: string; total: number; items: CalendarSession[]; more: boolean; next: CalendarCursor | null };
