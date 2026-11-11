export type WorkspaceCapability = 'owner' | 'trainer' | 'guardian';

export class WorkspaceReadFailure extends Error {
  constructor(public code: string) { super(code); }
}

type Subscriber = {
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
  detach: () => void;
};
type PendingRead = {
  key: string;
  capability: WorkspaceCapability;
  controller: AbortController;
  subscribers: Set<Subscriber>;
};

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(
    Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, canonical(item)]),
  );
  return value;
}

function isRead(capability: WorkspaceCapability, path: string, action: unknown) {
  if (path === '/api/experience') return typeof action === 'string' && (
    action === `${capability}_home` || action === `${capability}_calendar` ||
    capability === 'owner' && action === 'owner_current_calendar'
  );
  if (path === '/api/guardians') return capability === 'guardian' && action === 'links';
  return path === '/api/planning' && capability === 'owner' &&
    (action === 'read' || action === 'dates' || action === 'candidates');
}

const aborted = () => new DOMException('The read consumer left its scope.', 'AbortError');

/** In-flight reads only. No settled cache, credentials, authorization, disk or commands. */
export class WorkspaceReadOwner {
  private pending = new Map<string, PendingRead>();

  constructor(
    private subject: string,
    private academy: string,
    private transport: typeof fetch = (...args) => fetch(...args),
  ) {}

  matches(subject: string, academy: string) {
    return subject === this.subject && academy === this.academy;
  }

  async read<T>(capability: WorkspaceCapability, path: string, body: Record<string, unknown>, signal: AbortSignal): Promise<T> {
    if (signal.aborted) throw aborted();
    if (!isRead(capability, path, body.action) || body.academy !== undefined && body.academy !== this.academy) {
      throw new WorkspaceReadFailure('invalid');
    }
    const packet = JSON.stringify(canonical({ ...body, academy: this.academy }));
    // Exact parameters (including child/window/cursor) are private in-memory keys,
    // never diagnostics. Separate owners partition principal/academy/origin lifetime.
    const key = JSON.stringify([capability, path, packet]);
    let entry = this.pending.get(key);
    const start = !entry;
    if (!entry) {
      entry = { key, capability, controller: new AbortController(), subscribers: new Set() };
      this.pending.set(key, entry);
    }
    const current = entry;
    const result = new Promise<unknown>((resolve, reject) => {
      const leave = () => {
        current.subscribers.delete(subscriber);
        subscriber.detach();
        reject(aborted());
        if (!current.subscribers.size && this.pending.get(key) === current) {
          this.pending.delete(key);
          current.controller.abort();
        }
      };
      const subscriber: Subscriber = { resolve, reject, detach: () => signal.removeEventListener('abort', leave) };
      current.subscribers.add(subscriber);
      signal.addEventListener('abort', leave, { once: true });
    });
    if (start) void this.execute(current, path, packet);
    return await result as T;
  }

  cancelAll() {
    for (const entry of this.pending.values()) {
      this.finish(entry, { error: aborted() });
      entry.controller.abort();
    }
  }

  private invalidate(capability: WorkspaceCapability, reason: unknown) {
    for (const entry of this.pending.values()) {
      if (entry.capability !== capability) continue;
      this.finish(entry, { error: reason });
      entry.controller.abort();
    }
  }

  private finish(entry: PendingRead, result: { value: unknown } | { error: unknown }) {
    if (this.pending.get(entry.key) !== entry) return;
    this.pending.delete(entry.key);
    for (const subscriber of entry.subscribers) {
      subscriber.detach();
      if ('error' in result) subscriber.reject(result.error);
      else {
        // A consumer cannot mutate a second task's shared response object.
        try { subscriber.resolve(structuredClone(result.value)); }
        catch { subscriber.reject(new WorkspaceReadFailure('unavailable')); }
      }
    }
    entry.subscribers.clear();
  }

  private async execute(entry: PendingRead, path: string, packet: string) {
    try {
      const response = await this.transport(path, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, cache: 'no-store', body: packet,
        signal: AbortSignal.any([entry.controller.signal, AbortSignal.timeout(15000)]),
      });
      const value = await response.json();
      if (entry.controller.signal.aborted) throw aborted();
      if (!response.ok || value.error || value.data?.error) {
        throw new WorkspaceReadFailure(value.error ?? value.data?.error ?? 'unavailable');
      }
      this.finish(entry, { value: value.data });
    } catch (error) {
      if (error instanceof WorkspaceReadFailure && (error.code === 'denied' || error.code === 'setup_required')) {
        this.invalidate(entry.capability, error);
      } else this.finish(entry, { error });
    }
  }
}
