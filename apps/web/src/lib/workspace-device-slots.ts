import {identifier, record, refuse} from './local-register-codec';
import {openLocalWorkspace} from './local-workspace-repository';
import type {WorkspaceScope} from './local-workspace-codec';

export type WorkspaceDeviceContext = {subject: string; academy: string};
export type WorkspaceDeviceSlot = {
  device: string;
  namespace: string | null;
  generation: string;
  mode: 'reserved' | 'active' | 'cleaning';
};

function prefix(subject: string) {
  if (!/^user_[a-zA-Z0-9_]{1,120}$/.test(subject)) refuse('workspace_invalid_account');
  return `academyos.workspace-slot.v1:${subject}:`;
}
function slotKey(context: WorkspaceDeviceContext) {
  return prefix(context.subject) + identifier(context.academy);
}
export function workspaceSlotLock<T>(context: WorkspaceDeviceContext, work: () => T | Promise<T>) {
  if (!navigator.locks) refuse('workspace_storage_unavailable');
  return navigator.locks.request(slotKey(context), work);
}
export function readWorkspaceSlot(context: WorkspaceDeviceContext): WorkspaceDeviceSlot | null {
  const raw = localStorage.getItem(slotKey(context));
  if (raw === null) return null;
  const slot = record(JSON.parse(raw));
  if (Object.keys(slot).sort().join(',') !== 'device,generation,mode,namespace' ||
      !['reserved', 'active', 'cleaning'].includes(String(slot.mode)) ||
      (slot.mode === 'active' && slot.namespace === null)) refuse('workspace_locator_invalid');
  identifier(slot.device);
  identifier(slot.generation);
  if (slot.namespace !== null) identifier(slot.namespace);
  return slot as WorkspaceDeviceSlot;
}
export function workspaceSlotScope(context: WorkspaceDeviceContext, slot: WorkspaceDeviceSlot): WorkspaceScope {
  return {...context, device: slot.device, namespace: identifier(slot.namespace),
    environment: 'staging', epoch: 1, capability: 'owner-workspace-v1'};
}
export function saveWorkspaceSlot(context: WorkspaceDeviceContext, slot: WorkspaceDeviceSlot | null) {
  const key = slotKey(context);
  if (slot) localStorage.setItem(key, JSON.stringify(slot));
  else localStorage.removeItem(key);
  window.dispatchEvent(new Event(key));
}
export function subscribeWorkspaceSlot(context: WorkspaceDeviceContext, callback: () => void) {
  const key = slotKey(context);
  const storage = (event: StorageEvent) => { if (event.key === key || event.key === null) callback(); };
  window.addEventListener('storage', storage);
  window.addEventListener(key, callback);
  return () => {
    window.removeEventListener('storage', storage);
    window.removeEventListener(key, callback);
  };
}

/** Caller holds the locator lock. The cleanup marker survives an interrupted purge. */
export async function cleanWorkspaceSlot(context: WorkspaceDeviceContext, slot: WorkspaceDeviceSlot,
  keepApproval = false) {
  const cleaning = {...slot, generation: crypto.randomUUID(), mode: 'cleaning' as const};
  saveWorkspaceSlot(context, cleaning);
  if (slot.namespace) {
    const repository = await openLocalWorkspace(workspaceSlotScope(context, slot));
    try { await repository.retire(); }
    finally { repository.close(); }
  }
  saveWorkspaceSlot(context, keepApproval ? {...cleaning, namespace: null, mode: 'reserved'} : null);
}

export async function cleanWorkspaceAccountSlots(subject: string) {
  const stem = prefix(subject);
  const academies: string[] = [];
  for (let index = 0; index < localStorage.length; index++) {
    const key = localStorage.key(index);
    if (key?.startsWith(stem)) academies.push(identifier(key.slice(stem.length)));
  }
  let failed = false;
  for (const academy of academies) {
    const context = {subject, academy};
    try {
      await workspaceSlotLock(context, async () => {
        const slot = readWorkspaceSlot(context);
        if (slot) await cleanWorkspaceSlot(context, slot);
      });
    } catch { failed = true; }
  }
  if (failed) refuse('workspace_account_cleanup_incomplete');
}
