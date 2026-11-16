import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectWorkspaceStorage, requestWorkspaceStoragePersistence } from './workspace-storage';

test('storage inspection records persistence and quota estimates without treating them as guarantees', async () => {
  const storage = {
    persisted: async () => true,
    estimate: async () => ({ usage: 120, quota: 1000 }),
  } as unknown as StorageManager;
  assert.deepEqual(await inspectWorkspaceStorage(storage), {
    supported: true,
    persistence: 'granted',
    persisted: true,
    usage: 120,
    quota: 1000,
  });
});

test('storage inspection distinguishes unsupported APIs', async () => {
  assert.deepEqual(await inspectWorkspaceStorage(undefined), {
    supported: false,
    persistence: 'unsupported',
    persisted: null,
  });
});

test('persistence request reports refusal without blocking device preparation', async () => {
  const storage = {
    persisted: async () => false,
    persist: async () => false,
    estimate: async () => ({ usage: 0, quota: 500 }),
  } as unknown as StorageManager;
  assert.deepEqual(await requestWorkspaceStoragePersistence(storage), {
    supported: true,
    persistence: 'not-granted',
    persisted: false,
    usage: 0,
    quota: 500,
  });
});

// Integration-level scenarios: the approve callback in owner-workspace-device.tsx fires
// requestWorkspaceStoragePersistence() as a detached promise (.then/.catch) so that
// setPhase('preparing') runs immediately after approveWorkspaceDevice. The tests below
// verify that the fire-and-forget contract holds at the utility boundary — the utility
// never throws synchronously and always resolves, regardless of internal timing.

test('persistence request resolving after a delay does not throw synchronously', async () => {
  let resolveOuter!: (v: boolean) => void;
  const delayed = new Promise<boolean>(r => { resolveOuter = r; });
  const storage = {
    persisted: async () => false,
    persist: () => delayed,
    estimate: async () => ({ usage: 0, quota: 100 }),
  } as unknown as StorageManager;
  // Start the request but do not await — simulates fire-and-forget in approve callback.
  const pending = requestWorkspaceStoragePersistence(storage);
  // The sync continuation (setPhase) would run here in the real component.
  // The pending promise is still unresolved at this point, but setPhase already ran.
  resolveOuter(false);
  const result = await pending;
  assert.equal(result.persistence, 'not-granted', 'resolves when persist() eventually returns false');
  assert.equal(result.persisted, false);
});

test('persistence request that rejects is caught and returns unavailable', async () => {
  const storage = {
    persisted: async () => { throw new Error('unavailable'); },
    persist: async () => { throw new Error('unavailable'); },
  } as unknown as StorageManager;
  // Should resolve rather than reject — the caller uses .catch to absorb errors.
  const result = await requestWorkspaceStoragePersistence(storage);
  assert.equal(result.persistence, 'unavailable', 'returns unavailable when storage APIs throw');
  assert.equal(result.persisted, null);
});

test('persistence request with no persist() method reports not-granted', async () => {
  const storage = {
    persisted: async () => false,
    estimate: async () => ({ usage: 50, quota: 200 }),
    // persist is absent — simulates a browser that exposes storage.persisted but not storage.persist
  } as unknown as StorageManager;
  const result = await requestWorkspaceStoragePersistence(storage);
  assert.equal(result.persistence, 'not-granted');
});
