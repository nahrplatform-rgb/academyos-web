import { DATABASE_ORIGIN, GatewayError } from './onboarding-gateway';
import { signProof } from './onboarding';

const targets = new Map([
  ['x25_query_v1', false],
  ['x25_command_v1', true],
  ['x25_purge_receipts_v1', true],
  ['x25_variant_v1', true],
  ['x25_storage_exists_v1', false],
]);

export function localMediaDatabaseOrigin(value: string | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.origin === value && url.protocol === 'http:' && url.hostname === '127.0.0.1' && url.port ? value : null;
  } catch {
    return null;
  }
}

export function classMediaGateway(
  origin: string,
  subject: string,
  key: () => string,
  allowed: (write: boolean) => Promise<boolean>,
  send: typeof fetch = fetch,
): typeof fetch {
  if (origin !== DATABASE_ORIGIN && !localMediaDatabaseOrigin(origin)) throw new GatewayError('denied', 403);
  return async (input, init) => {
    const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url);
    const method = init?.method?.toUpperCase() ?? (input instanceof Request ? input.method : 'GET');
    const prefix = '/rest/v1/rpc/';
    const name = url.pathname.slice(prefix.length);
    const write = targets.get(name);
    if (url.origin !== origin || url.search || method !== 'POST' || !url.pathname.startsWith(prefix) || write === undefined)
      throw new GatewayError('denied', 403);
    if (!await allowed(write)) throw new GatewayError('limited', 429);
    const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
    headers.set('x-academyos-gateway', JSON.stringify(signProof('gateway', 'POST:/rpc/' + name, subject, [], key())));
    return send(input, { ...init, headers, cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(10000) });
  };
}
