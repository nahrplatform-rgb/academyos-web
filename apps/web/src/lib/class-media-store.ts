import { randomUUID } from 'node:crypto';
import { link, mkdir, readdir, readFile, realpath, stat, unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, sep } from 'node:path';
import { uuidPattern } from './onboarding';
import { localMediaDatabaseOrigin } from './onboarding-gateway';

export type ClassMediaVariant = 'main' | 'thumbnail';
const variants: ClassMediaVariant[] = ['main', 'thumbnail'];
const locks = new Map<string, Promise<unknown>>();

export class ClassMediaStorageConflict extends Error {}

export function localClassMediaEnabled(env = process.env) {
  return env.APP_ENV === 'staging' && !env.VERCEL && Boolean(env.ACADEMY_CLASS_MEDIA_LOCAL_DIR &&
    env.ACADEMY_CLASS_MEDIA_LOCAL_ORIGIN && localMediaDatabaseOrigin(env.ACADEMY_CLASS_MEDIA_DATABASE_ORIGIN));
}

export function stagingClassMediaAcademy(env = process.env) {
  const academy = env.ACADEMY_CLASS_MEDIA_STAGING_ACADEMY;
  return env.VERCEL_ENV === 'production' && env.APP_ENV === 'staging' &&
    env.NEXT_PUBLIC_APP_URL === 'https://staging.academy.nahr.dev' && env.STORAGE_MEDIA_BUCKET === 'academy-media' &&
    env.ACADEMY_CLASS_MEDIA_STAGING_ENABLED === 'true' && academy && uuidPattern.test(academy) ? academy : null;
}

export async function localClassMediaRoot(env = process.env) {
  if (env.APP_ENV !== 'staging' || env.VERCEL || !env.ACADEMY_CLASS_MEDIA_LOCAL_DIR) return null;
  const base = await realpath(env.ACADEMY_CLASS_MEDIA_LOCAL_DIR).catch(() => null);
  if (!base || !base.startsWith(`${await realpath(tmpdir())}${sep}`)) return null;
  const info = await stat(base);
  return info.isDirectory() && (info.mode & 0o077) === 0 ? base : null;
}

export function classMediaItemDirectory(base: string, academy: string, event: string, item: string) {
  if (![academy, event, item].every(id => uuidPattern.test(id))) throw new TypeError('Invalid class media identity');
  return join(base, academy, event, item);
}

// The enabled local fixture runs a single application server. Serialize changes
// to each item so a confirmed removal cannot race a subsequent variant write.
export async function withClassMediaItem<T>(directory: string, operation: () => Promise<T>) {
  const previous = locks.get(directory);
  const next = Promise.resolve(previous).catch(() => {}).then(operation);
  locks.set(directory, next);
  try {
    return await next;
  } finally {
    if (locks.get(directory) === next) locks.delete(directory);
  }
}

function hasCode(error: unknown, code: string) {
  return Boolean(error && typeof error === 'object' && 'code' in error && error.code === code);
}

export async function putClassMediaVariant(directory: string, variant: ClassMediaVariant, data: Buffer) {
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const temporary = join(directory, `incoming-${randomUUID()}`);
  const destination = join(directory, variant);
  try {
    await writeFile(temporary, data, { mode: 0o600, flag: 'wx' });
    try {
      await link(temporary, destination);
    } catch (error) {
      if (!hasCode(error, 'EEXIST')) throw error;
      if (!(await readFile(destination)).equals(data)) throw new ClassMediaStorageConflict();
    }
  } finally {
    await unlink(temporary).catch(error => {
      if (!hasCode(error, 'ENOENT')) throw error;
    });
  }
}

export async function getClassMediaVariant(directory: string, variant: ClassMediaVariant) {
  return readFile(join(directory, variant)).catch(error => {
    if (hasCode(error, 'ENOENT')) return null;
    throw error;
  });
}

export async function classMediaVariantsExist(directory: string) {
  for (const variant of variants) {
    // These files are created under the disposable runtime directory and are never bundled.
    const path = join(/* turbopackIgnore: true */ directory, variant);
    const exists = await stat(/* turbopackIgnore: true */ path).then(value => value.isFile(), error => {
      if (hasCode(error, 'ENOENT')) return false;
      throw error;
    });
    if (!exists) return false;
  }
  return true;
}

export async function removeClassMediaVariants(directory: string) {
  const entries = await readdir(directory).catch(error => {
    if (hasCode(error, 'ENOENT')) return [];
    throw error;
  });
  const partialFiles = entries.filter(name => name.startsWith('incoming-') && uuidPattern.test(name.slice(9)));
  for (const variant of [...variants, ...partialFiles]) {
    const path = join(directory, variant);
    await unlink(path).catch(error => {
      if (!hasCode(error, 'ENOENT')) throw error;
    });
    await stat(path).then(() => { throw new ClassMediaStorageConflict(); }, error => {
      if (!hasCode(error, 'ENOENT')) throw error;
    });
  }
}
