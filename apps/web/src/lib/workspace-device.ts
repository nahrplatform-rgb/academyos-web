import {identifier, refuse} from './local-register-codec';
import {openLocalWorkspace} from './local-workspace-repository';
import {requireRegisterAccount, subscribeRegisterAccount} from './register-device-account';
import {cleanWorkspaceSlot, readWorkspaceSlot, saveWorkspaceSlot, subscribeWorkspaceSlot,
  workspaceSlotLock, workspaceSlotScope, type WorkspaceDeviceContext, type WorkspaceDeviceSlot} from './workspace-device-slots';
import {workspaceComplete, workspaceKey, workspaceManifest, workspacePage, workspaceResume,
  WorkspaceTransportError} from './workspace-client-transport';
import {sameWorkspaceVersion, type Collection} from './local-workspace-codec';

const PAGE_BUDGET = 12;
const dataEvent = 'academyos:workspace-coverage';
const dataChannel = 'academyos.workspace-coverage.v1';

function publishCoverage() {
  window.dispatchEvent(new Event(dataEvent));
  if (typeof BroadcastChannel !== 'undefined') {
    const channel = new BroadcastChannel(dataChannel);
    channel.postMessage('changed');
    channel.close();
  }
}
export function subscribeWorkspaceCoverage(callback: () => void) {
  window.addEventListener(dataEvent, callback);
  const channel = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel(dataChannel);
  if (channel) channel.onmessage = event => { if (event.data === 'changed') callback(); };
  return () => {
    window.removeEventListener(dataEvent, callback);
    channel?.close();
  };
}

/** The normal UI calls this only after personal-device approval and verified Owner entry. */
export async function approveWorkspaceDevice(context: WorkspaceDeviceContext, accountGeneration: string) {
  return workspaceSlotLock(context, () => {
    requireRegisterAccount(context.subject, accountGeneration);
    const slot = readWorkspaceSlot(context);
    if (slot?.mode === 'cleaning') refuse('workspace_cleanup_required');
    if (!slot) saveWorkspaceSlot(context, {
      device: crypto.randomUUID(), namespace: null, generation: crypto.randomUUID(), mode: 'reserved',
    });
  });
}

export function workspaceDevice(input: WorkspaceDeviceContext, accountGeneration: string, lifetime: AbortSignal) {
  const context = {subject: input.subject, academy: identifier(input.academy)};
  const load = () => readWorkspaceSlot(context);
  function requireAccount() {
    lifetime.throwIfAborted();
    requireRegisterAccount(context.subject, accountGeneration);
  }
  function requireSlot(expected: WorkspaceDeviceSlot) {
    requireAccount();
    const actual = load();
    if (!actual || actual.generation !== expected.generation || actual.mode !== expected.mode ||
        actual.device !== expected.device || actual.namespace !== expected.namespace) refuse('workspace_scope_changed');
  }

  async function remove(slot: WorkspaceDeviceSlot, keepApproval: boolean) {
    await workspaceSlotLock(context, async () => {
      requireSlot(slot);
      await cleanWorkspaceSlot(context, slot, keepApproval);
    });
    publishCoverage();
  }

  function watchSlot(expected: WorkspaceDeviceSlot, parent: AbortSignal) {
    const revoked = new AbortController();
    const check = () => {
      try { requireSlot(expected); }
      catch { revoked.abort(new Error('workspace_scope_changed')); }
    };
    const account = subscribeRegisterAccount(check);
    const slot = subscribeWorkspaceSlot(context, check);
    check();
    return {
      signal: AbortSignal.any([lifetime, parent, revoked.signal]),
      dispose() { account(); slot(); },
    };
  }

  async function activate(slot: WorkspaceDeviceSlot, signal: AbortSignal) {
    if (slot.mode === 'active') {
      const repo = await openLocalWorkspace(workspaceSlotScope(context, slot));
      try {
        if (await repo.hasKey()) {
          requireSlot(slot);
          return slot;
        }
      } finally { repo.close(); }
    }
    const guard = watchSlot(slot, signal);
    let grant: Awaited<ReturnType<typeof workspaceKey>>;
    try {
      const {device, namespace} = slot;
      grant = await workspaceKey(namespace
        ? {...context, action: 'recover', device, namespace}
        : {...context, action: 'prepare', device}, guard.signal);
      guard.signal.throwIfAborted();
    } finally { guard.dispose(); }

    return workspaceSlotLock(context, async () => {
      signal.throwIfAborted();
      requireSlot(slot);
      // Record the namespace before any local activation so logout can find
      // ciphertext even if the browser exits between activation and publishing.
      const reserved = {...slot, namespace: grant.scope.namespace, mode: 'reserved' as const};
      saveWorkspaceSlot(context, reserved);
      const repo = await openLocalWorkspace(grant.scope);
      try {
        requireSlot(reserved);
        await repo.activate(grant.ticket);
        signal.throwIfAborted();
        requireSlot(reserved);
        const active = {...reserved, mode: 'active' as const};
        saveWorkspaceSlot(context, active);
        return active;
      } finally { repo.close(); }
    });
  }

  async function run(month: string | undefined, priority: 'people' | 'calendar', signal: AbortSignal) {
    requireAccount();
    let slot = load();
    if (!slot) return {kind: 'approval_required' as const};
    if (slot.mode === 'cleaning') refuse('workspace_cleanup_required');

    try {
      slot = await activate(slot, signal);
      const guard = watchSlot(slot, signal);
      const scope = workspaceSlotScope(context, slot);
      let repo: Awaited<ReturnType<typeof openLocalWorkspace>> | undefined;
      let discard = false;
      const checked = () => { guard.signal.throwIfAborted(); requireSlot(slot!); };
      try {
        repo = await openLocalWorkspace(scope);
        checked();
        const manifest = await workspaceManifest(scope, month, guard.signal);
        checked();
        if (!await repo.acceptsScope(manifest.scope)) {
          discard = true;
          return {kind: 'rebuild_required' as const};
        }
        const [people, current, ...adjacent] = manifest.collections;
        const tasks = priority === 'people' ? [people, current, ...adjacent] : [current, people, ...adjacent];
        const completed: Collection[] = [];
        let pages = 0;
        for (const {id, receipt: seed} of tasks) {
          checked();
          if (await repo.refresh(id, seed, manifest.checked_at)) {
            completed.push(id);
            continue;
          }
          if (pages >= PAGE_BUDGET) return {kind: 'partial' as const, manifest, completed, pages};
          const checkpoint = await repo.checkpoint(id);
          checked();
          let generation: string;
          let receipt = seed;
          if (checkpoint && sameWorkspaceVersion(checkpoint.receipt, seed)) {
            generation = checkpoint.generation;
            receipt = checkpoint.receipt;
          } else {
            generation = await repo.begin(id, seed);
          }

          async function renew() {
            const result = await workspaceResume(scope, id, receipt, guard.signal);
            checked();
            await repo!.renew(id, generation, result.receipt);
            receipt = result.receipt;
          }
          async function ifExpired<T>(request: () => Promise<T>) {
            checked();
            try { return await request(); }
            catch (error) {
              if (!(error instanceof WorkspaceTransportError) || error.kind !== 'expired') throw error;
              await renew();
              checked();
              return request();
            }
          }
          while (receipt.payload.phase === 'seed' || receipt.payload.seen < receipt.payload.total!) {
            if (pages >= PAGE_BUDGET) return {kind: 'partial' as const, manifest, completed, pages};
            const page = await ifExpired(() => workspacePage(scope, id, receipt, guard.signal));
            checked();
            await repo.append(id, generation, page.receipt, page.items);
            pages++;
            receipt = page.receipt;
          }
          const complete = await ifExpired(() => workspaceComplete(scope, id, receipt, guard.signal));
          checked();
          await repo.complete(id, generation, complete.receipt, complete.checked_at);
          checked();
          completed.push(id);
          publishCoverage();
        }
        checked();
        publishCoverage();
        return {kind: 'current' as const, manifest, completed, pages};
      } finally {
        repo?.close();
        guard.dispose();
        if (discard) await remove(slot, true);
      }
    } catch (error) {
      if (error instanceof WorkspaceTransportError && error.kind === 'denied') {
        await remove(slot, false);
        return {kind: 'denied' as const};
      }
      throw error;
    }
  }

  return {
    async read(...args: Parameters<Awaited<ReturnType<typeof openLocalWorkspace>>['read']>) {
      requireAccount();
      const slot = load();
      if (slot?.mode !== 'active') return null;
      const repo = await openLocalWorkspace(workspaceSlotScope(context, slot));
      try {
        requireSlot(slot);
        const result = await repo.read(...args);
        requireSlot(slot);
        return result;
      } finally { repo.close(); }
    },
    async sync(month?: string, priority: 'people' | 'calendar' = 'people', request = lifetime) {
      requireAccount();
      const signal = AbortSignal.any([lifetime, request]);
      signal.throwIfAborted();
      if (!navigator.locks) refuse('workspace_storage_unavailable');
      // Use a separate lock from cleanup. The account fence can cancel a held
      // request without waiting for the browser doing background preparation.
      return navigator.locks.request(`academyos.workspace-sync:${context.subject}:${context.academy}`,
        {ifAvailable: true}, lock => lock ? run(month, priority, signal) : {kind: 'following' as const});
    },
    async remove() {
      requireAccount();
      const slot = load();
      if (slot) await remove(slot, false);
    },
  };
}
