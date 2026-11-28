export type WorkspaceStorageStatus = {
  supported: boolean;
  persistence: 'granted' | 'not-granted' | 'unsupported' | 'unavailable';
  persisted: boolean | null;
  usage?: number;
  quota?: number;
};

function defaultStorage(): StorageManager | undefined {
  return typeof navigator === 'undefined' ? undefined : navigator.storage;
}

export async function inspectWorkspaceStorage(storage: StorageManager | undefined = defaultStorage()): Promise<WorkspaceStorageStatus> {
  if (!storage) return { supported: false, persistence: 'unsupported', persisted: null };
  let persisted: boolean | null = null;
  let usage: number | undefined;
  let quota: number | undefined;
  try {
    if (typeof storage.persisted === 'function') persisted = await storage.persisted();
  } catch {
    return { supported: true, persistence: 'unavailable', persisted: null };
  }
  try {
    if (typeof storage.estimate === 'function') {
      const estimate = await storage.estimate();
      usage = estimate.usage;
      quota = estimate.quota;
    }
  } catch {
    // A quota estimate is advisory; preserve the persistence result.
  }
  return {
    supported: true,
    persistence: persisted === true ? 'granted' : persisted === false ? 'not-granted' : 'unsupported',
    persisted,
    ...(usage === undefined ? {} : { usage }),
    ...(quota === undefined ? {} : { quota }),
  };
}

export async function requestWorkspaceStoragePersistence(storage: StorageManager | undefined = defaultStorage()) {
  const before = await inspectWorkspaceStorage(storage);
  if (!storage || typeof storage.persist !== 'function') return before;
  try {
    await storage.persist();
  } catch {
    return { ...before, persistence: 'unavailable' as const };
  }
  return inspectWorkspaceStorage(storage);
}
