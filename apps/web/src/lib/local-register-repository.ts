/** Inactive Owner-register adapter. No product caller, network, timer or authority cache.
 * A future reviewed key authority must supply Scope/Ticket; labels are not permission.
 */
import {type AttendancePlayer, type RegisterReceipt} from './attendance';
import {checkLocalKey, newLocalKey, seal, unseal, protectOriginal, openOriginal,
  type SealedRecord, type ProtectedOriginal} from './local-register-crypto';
import {canonicalRegister, digest, exactReceipt, fromBytes, identifier, jsonBytes,
  LOCAL_PAGE_LIMIT, LOCAL_RECORD_LIMIT, opaque, record, refuse, rosterHeader, rosterPage, stableHeader,
  type Original, type RosterHeader} from './local-register-codec';
import {downloadChain, downloadSeed, downloadRoot, registerDownloadResult,
  type DownloadReceipt, type DownloadManifest, type DownloadPage, type DownloadComplete} from './register-download';

export const LOCAL_REGISTER_DATABASE = 'academyos-owner-register-v1';
export type RegisterScope = {
  namespace: string; environment: 'staging'; subject: string; academy: string;
  device: string; epoch: string; capability: 'owner-register-v1';
};
export type RecoveryTicket = {binding: string; keyId: string; material: string; verifiedAt: number};
export type ActivationAttempt = {binding: string; fence: number};
type Control = {binding: string; mode: 'active' | 'cleaning' | 'quarantined'; fence: number;
  keyId: string; verifiedAt: number; revision: number};
type Head = {namespace: string; event: string; generation: string; revision: number;
  invalid: boolean; sealed: SealedRecord};
type ImportRow = {namespace: string; event: string; transfer: string; revision: number;
  sealed: SealedRecord};
type ImportState = {header: RosterHeader | null; cursor: string | null; seen: number;
  saved: number; commandRevision: number; receipt?: DownloadReceipt};
type StoredPlayer = {namespace: string; event: string; generation: string; player: string; sealed: SealedRecord};
type StoredOriginal = {namespace: string; event: string; op: string; revision: number;
  active?: [string, string]; protected: ProtectedOriginal};
type DispatchAttempt = {binding: string; fence: number; op: string; revision: number};
type DispatchOutcome = {receipt: unknown} | {refusal: 'conflict' | 'deadline' | 'denied'};
const stores = ['control', 'keys', 'heads', 'imports', 'rows', 'originals'];
const req = <T>(r: IDBRequest<T>) => new Promise<T>((resolve, reject) => {
  r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error);
});
const range = (prefix: IDBValidKey[]) => IDBKeyRange.bound(prefix, [...prefix, []]);
const headId = (h: Head) => JSON.stringify([h.event, h.generation, h.revision, h.invalid]);
const importId = (i: ImportRow) => JSON.stringify([i.event, i.transfer, i.revision]);
const playerId = (event: string, generation: string, player: string) => JSON.stringify([event, generation, player]);
const originalId = (o: StoredOriginal) => JSON.stringify([o.op, o.event, o.revision, Boolean(o.active)]);

export async function openLocalRegister(scopeInput: RegisterScope) {
  if (!globalThis.indexedDB || !globalThis.crypto?.subtle) refuse('protected_storage_unavailable');
  const scope = structuredClone(scopeInput);
  opaque(scope.namespace); opaque(scope.subject); opaque(scope.device); opaque(scope.epoch); identifier(scope.academy);
  if (scope.environment !== 'staging' || scope.capability !== 'owner-register-v1' ||
      Object.keys(scope).sort().join(',') !== 'academy,capability,device,environment,epoch,namespace,subject') refuse('unsupported_scope');
  const namespace = scope.namespace;
  const binding = JSON.stringify([1, scope.environment, scope.subject, scope.academy,
    scope.device, scope.epoch, scope.capability, namespace]);
  let disposed = false;
  const live = () => {if (disposed) refuse('repository_disposed');};
  const opening = indexedDB.open(LOCAL_REGISTER_DATABASE, 1);
  opening.onupgradeneeded = () => {
    const db = opening.result;
    for (const name of stores) {
      const store = db.createObjectStore(name);
      if (!['control', 'keys'].includes(name)) store.createIndex('namespace', 'namespace');
      if (name === 'originals') store.createIndex('activeEvent', 'active', {unique: true});
    }
  };
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    let rejected = false;
    opening.onsuccess = () => {if (rejected) opening.result.close(); else resolve(opening.result);};
    opening.onerror = () => reject(opening.error);
    opening.onblocked = () => {rejected = true; reject(new Error('storage_upgrade_blocked'));};
  });
  const dispose = () => {disposed = true; db.close();};
  db.onversionchange = dispose;

  async function tx<T>(names: string[], mode: IDBTransactionMode, work: (t: IDBTransaction) => Promise<T>): Promise<T> {
    live();
    const t = db.transaction(names, mode, mode === 'readwrite' ? {durability: 'strict'} : {});
    if (mode === 'readwrite' && t.durability !== 'strict') {
      t.abort(); refuse('strict_storage_durability_unavailable');
    }
    const done = new Promise<void>((resolve, reject) => {
      t.oncomplete = () => resolve();
      t.onabort = () => reject(t.error || new Error('transaction_aborted'));
      t.onerror = () => {}; // Transaction completion, never request success, owns acknowledgement.
    });
    void done.catch(() => {});
    try {
      const result = await work(t);
      await done;
      live();
      return result;
    } catch (error) {
      try {t.abort();} catch { /* Already committed/aborted; original discovery is retained. */ }
      await done.catch(() => {});
      throw error;
    }
  }
  async function control(t: IDBTransaction, active = false): Promise<Control | undefined> {
    const c: Control | undefined = await req(t.objectStore('control').get(namespace));
    if (c && (c.binding !== binding || !Number.isSafeInteger(c.fence) || c.fence < 1 ||
        !Number.isSafeInteger(c.revision) || !['active', 'cleaning', 'quarantined'].includes(c.mode))) refuse('scope_metadata_mismatch');
    if (c?.mode === 'cleaning') refuse('cleanup_incomplete');
    if (active && c?.mode !== 'active') refuse('account_verification_required');
    return c;
  }
  function unchanged(before: Control, now?: Control) {
    if (!now || now.mode !== 'active' || now.fence !== before.fence) refuse('scope_changed');
  }
  const key = (kind: string) => [namespace, kind];
  async function snapshot() {
    return tx(['control', 'keys'], 'readonly', async t => {
      const c = (await control(t, true))!;
      const [device, read, recovery] = await Promise.all(['device', 'read', 'recovery'].map(k => req(t.objectStore('keys').get(key(k)))));
      checkLocalKey(device); checkLocalKey(read);
      if (!(recovery instanceof CryptoKey) || recovery.extractable || recovery.algorithm.name !== 'AES-KW') refuse('recovery_key_missing');
      return {c, device: device as CryptoKey, read: read as CryptoKey, recovery};
    });
  }
  async function verify(c: Control) {
    await tx(['control'], 'readonly', async t => unchanged(c, await control(t, true)));
  }
  async function noOrphans(t: IDBTransaction) {
    const remaining = await Promise.all([
      req(t.objectStore('keys').count(range([namespace]))),
      ...stores.filter(s => !['control', 'keys'].includes(s)).map(s => req(t.objectStore(s).index('namespace').count(namespace))),
    ]);
    if (remaining.some(Boolean)) refuse('scope_metadata_missing');
  }
  async function beginActivation(): Promise<ActivationAttempt> {
    const device = await newLocalKey(), read = await newLocalKey();
    return tx(stores, 'readwrite', async t => {
      let c = await control(t);
      if (!c) {
        await noOrphans(t);
        c = {binding, mode: 'quarantined', fence: 1, revision: 1, keyId: '', verifiedAt: 0};
        t.objectStore('keys').put(device, key('device'));
        t.objectStore('keys').put(read, key('read'));
        t.objectStore('control').put(c, namespace);
      }
      // Reserve a durable scope before the first key exchange, so logout can
      // fence even a first-ever late key response.
      return {binding, fence: c.fence};
    });
  }
  async function activate(ticket: RecoveryTicket, attempt: ActivationAttempt) {
    if (!attempt || attempt.binding !== binding || ticket.binding !== binding ||
        !/^[A-Za-z0-9+/]{43}=$/.test(ticket.material) ||
        !Number.isSafeInteger(ticket.verifiedAt) || ticket.verifiedAt <= 0) refuse('key_ticket_mismatch');
    opaque(ticket.keyId);
    const bytes = Uint8Array.from(atob(ticket.material), c => c.charCodeAt(0));
    let recovery: CryptoKey;
    try {recovery = await crypto.subtle.importKey('raw', bytes, 'AES-KW', false, ['wrapKey', 'unwrapKey']);}
    finally {bytes.fill(0);}
    const before = await tx(stores, 'readonly', async t => {
      const c = await control(t);
      if (!c) await noOrphans(t);
      const device = await req(t.objectStore('keys').get(key('device')));
      const read = await req(t.objectStore('keys').get(key('read')));
      const original: StoredOriginal | undefined = await req(t.objectStore('originals').index('namespace').get(namespace));
      if (c?.keyId && c.keyId !== ticket.keyId) refuse('key_rotation_requires_recovery');
      if (c) checkLocalKey(device);
      if (c?.mode === 'active') checkLocalKey(read);
      return {c, device: device as CryptoKey | undefined, read: read as CryptoKey | undefined, original};
    });
    if ((before.c?.fence ?? 0) !== attempt.fence) refuse('scope_changed');
    // Key rotation is refused. One retained envelope proves the same fixed
    // recovery key without loading every event's pending/history payload.
    if (before.original) {
      const o = before.original;
      await decodeOriginal(o, await openOriginal(before.device!, recovery, binding, originalId(o), o.protected));
    }
    const device = before.device || await newLocalKey(), read = before.read || await newLocalKey();
    await tx(stores, 'readwrite', async t => {
      const c = await control(t);
      if ((c?.fence ?? 0) !== attempt.fence || (c?.revision ?? 0) !== (before.c?.revision ?? 0)) refuse('scope_changed');
      if (!c) await noOrphans(t);
      const keys = t.objectStore('keys');
      keys.put(device, key('device')); keys.put(read, key('read')); keys.put(recovery, key('recovery'));
      t.objectStore('control').put({binding, mode: 'active', fence: attempt.fence + 1,
        keyId: ticket.keyId, verifiedAt: ticket.verifiedAt, revision: (c?.revision ?? 0) + 1} satisfies Control, namespace);
    });
  }
  async function loadHead(event: string) {
    identifier(event);
    const s = await snapshot();
    const head: Head | undefined = await tx(['control', 'heads'], 'readonly', async t => {
      unchanged(s.c, await control(t, true)); return req(t.objectStore('heads').get([namespace, event]));
    });
    if (!head) refuse('not_downloaded');
    const value = record(fromBytes(await unseal(s.read, binding, 'header', headId(head), head.sealed)));
    if (value.event !== event || value.namespace !== namespace || value.generation !== head.generation ||
        value.invalid !== head.invalid) refuse('head_mismatch');
    const header = value.header as RosterHeader;
    rosterPage({...header, count: 0, saved: 0, players: [], more: false});
    let verification: DownloadComplete | null = null;
    if (value.verification) {
      verification = await registerDownloadResult({kind: 'complete', revision: (value.verification as DownloadReceipt).payload.revision,
        header, receipt: value.verification}, scope.academy, event) as DownloadComplete;
    }
    await verify(s.c);
    return {...s, head, header, verification};
  }
  async function verifyHead(t: IDBTransaction, before: Head) {
    const h: Head | undefined = await req(t.objectStore('heads').get([namespace, before.event]));
    if (!h || h.revision !== before.revision || h.generation !== before.generation || h.invalid !== before.invalid) refuse('basis_changed');
  }
  async function beginImport(event: string, transfer: string, manifest?: DownloadManifest) {
    identifier(event); opaque(transfer);
    if (manifest) {
      manifest = await registerDownloadResult(manifest, scope.academy, event) as DownloadManifest;
      const p = manifest.receipt.payload;
      if (manifest.kind !== 'manifest' || p.seen !== 0 || p.saved !== 0 || p.cursor !== null ||
          p.acc !== await downloadSeed(p.head)) refuse('download_initial_basis');
    }
    const s = await snapshot();
    const row: ImportRow = {namespace, event, transfer, revision: 0, sealed: undefined as unknown as SealedRecord};
    row.sealed = await seal(s.read, binding, 'import', importId(row), jsonBytes({header: manifest?.header ?? null,
      cursor: null, seen: 0, saved: 0, commandRevision: s.c.revision,
      ...(manifest ? {receipt: manifest.receipt} : {})}));
    await tx(['control', 'imports', 'heads', 'rows'], 'readwrite', async t => {
      const c = (await control(t, true))!; unchanged(s.c, c);
      if (c.revision !== s.c.revision) refuse('import_basis_changed');
      const old: ImportRow | undefined = await req(t.objectStore('imports').get([namespace, event]));
      if (old) refuse('import_already_started');
      const head: Head | undefined = await req(t.objectStore('heads').get([namespace, event]));
      if (head?.generation === transfer || await req(t.objectStore('rows').count(range([namespace, event, transfer])))) refuse('generation_reuse');
      t.objectStore('imports').add(row, [namespace, event]);
    });
  }
  async function importStatus(event: string) {
    identifier(event);
    const s = await snapshot();
    const row: ImportRow | undefined = await tx(['control', 'imports'], 'readonly', async t => {
      unchanged(s.c, await control(t, true)); return req(t.objectStore('imports').get([namespace, event]));
    });
    if (!row) return null;
    const value = fromBytes(await unseal(s.read, binding, 'import', importId(row), row.sealed)) as ImportState;
    await verify(s.c);
    return {transfer: row.transfer, cursor: value.cursor, seen: value.seen};
  }
  async function abandonImport(event: string, transfer: string) {
    identifier(event); opaque(transfer);
    const s = await snapshot();
    await tx(['control', 'imports', 'rows'], 'readwrite', async t => {
      unchanged(s.c, await control(t, true));
      const row: ImportRow | undefined = await req(t.objectStore('imports').get([namespace, event]));
      if (!row || row.transfer !== transfer) refuse('import_mismatch');
      t.objectStore('rows').delete(range([namespace, event, transfer]));
      t.objectStore('imports').delete([namespace, event]);
    });
  }
  async function appendPage(event: string, transfer: string, after: string | null, input: unknown, proof?: DownloadPage) {
    identifier(event); opaque(transfer); if (after !== null) identifier(after);
    const page = rosterPage(input);
    if (page.event !== event) refuse('page_event_mismatch');
    const s = await snapshot();
    const before: ImportRow | undefined = await tx(['control', 'imports'], 'readonly', async t => {
      unchanged(s.c, await control(t, true)); return req(t.objectStore('imports').get([namespace, event]));
    });
    if (!before || before.transfer !== transfer) refuse('import_mismatch');
    const prior = fromBytes(await unseal(s.read, binding, 'import', importId(before), before.sealed)) as ImportState;
    if (prior.commandRevision !== s.c.revision) refuse('import_basis_changed');
    if (Boolean(prior.receipt) !== Boolean(proof)) refuse('verified_transfer_required');
    if (proof) {
      proof = await registerDownloadResult(proof, scope.academy, event) as DownloadPage;
      if (proof.kind !== 'page' || JSON.stringify(proof.roster) !== JSON.stringify(page) ||
          proof.revision !== prior.receipt!.payload.revision ||
          proof.receipt.payload.head !== prior.receipt!.payload.head ||
          proof.receipt.payload.acc !== await downloadChain(prior.receipt!.payload.acc, page.players)) refuse('download_chain_mismatch');
    }
    const header = rosterHeader(page);
    if (prior.cursor !== after || page.players.some(p => p.id <= (after ?? '')) ||
        prior.header && stableHeader(prior.header) !== stableHeader(header)) refuse('page_basis_changed');
    const state: ImportState = {header, seen: prior.seen + page.players.length,
      saved: prior.saved + page.players.filter(p => p.status !== null).length,
      cursor: page.players.at(-1)?.id ?? prior.cursor, commandRevision: prior.commandRevision};
    if (proof) {
      const p = proof.receipt.payload;
      if (p.seen !== state.seen || p.saved !== state.saved || p.cursor !== state.cursor) refuse('download_progress_mismatch');
      state.receipt = proof.receipt;
    }
    if (state.seen > page.count || state.saved > page.saved || page.more && state.seen >= page.count ||
        !page.more && (state.seen !== page.count || state.saved !== page.saved)) refuse('coverage_mismatch');
    const next = {...before, revision: before.revision + 1};
    next.sealed = await seal(s.read, binding, 'import', importId(next), jsonBytes(state));
    const rows = await Promise.all(page.players.map(async p => ({namespace, event, generation: transfer, player: p.id,
      sealed: await seal(s.read, binding, 'player', playerId(event, transfer, p.id), jsonBytes(p))} satisfies StoredPlayer)));
    const head: Head = {namespace, event, generation: transfer, revision: 1, invalid: false, sealed: undefined as unknown as SealedRecord};
    if (!page.more && !proof) head.sealed = await seal(s.read, binding, 'header', headId(head), jsonBytes({namespace, event, generation: transfer, invalid: false, header}));
    await tx(['control', 'imports', 'rows', 'heads'], 'readwrite', async t => {
      const c = (await control(t, true))!; unchanged(s.c, c);
      if (c.revision !== prior.commandRevision) refuse('import_basis_changed');
      const current: ImportRow | undefined = await req(t.objectStore('imports').get([namespace, event]));
      if (!current || current.transfer !== transfer || current.revision !== before.revision) refuse('import_changed');
      for (const row of rows) t.objectStore('rows').add(row, [namespace, event, transfer, row.player]);
      if (page.more || proof) t.objectStore('imports').put(next, [namespace, event]);
      else {
        const old: Head | undefined = await req(t.objectStore('heads').get([namespace, event]));
        if (old) t.objectStore('rows').delete(range([namespace, event, old.generation]));
        t.objectStore('heads').put(head, [namespace, event]);
        t.objectStore('imports').delete([namespace, event]);
      }
    });
    return {complete: !page.more && !proof, cursor: state.cursor, seen: state.seen};
  }
  async function readPage(event: string, after: string | null = null) {
    if (after !== null) identifier(after);
    const s = await loadHead(event);
    const lower = [namespace, event, s.head.generation, after ?? ''];
    const rows: StoredPlayer[] = await tx(['control', 'heads', 'rows'], 'readonly', async t => {
      unchanged(s.c, await control(t, true)); await verifyHead(t, s.head);
      return req(t.objectStore('rows').getAll(IDBKeyRange.bound(lower,
        [namespace, event, s.head.generation, []], true), LOCAL_PAGE_LIMIT + 1));
    });
    const more = rows.length > LOCAL_PAGE_LIMIT;
    const players = await Promise.all(rows.slice(0, LOCAL_PAGE_LIMIT).map(async row =>
      fromBytes(await unseal(s.read, binding, 'player', playerId(event, s.head.generation, row.player), row.sealed)) as AttendancePlayer));
    // Local pages combine rows from potentially smaller byte-bounded API pages.
    rosterPage({...s.header, players, more}, LOCAL_RECORD_LIMIT);
    await tx(['control', 'heads'], 'readonly', async t => {unchanged(s.c, await control(t, true)); await verifyHead(t, s.head);});
    return {header: s.header, players, more, needsCurrentRead: s.head.invalid,
      complete: true as const, coherence: s.verification ? 'verified-transfer' as const : 'per-row-only' as const};
  }
  async function transferState(event: string) {
    identifier(event);
    const s = await snapshot();
    const row: ImportRow | undefined = await tx(['control', 'imports'], 'readonly', async t => {
      unchanged(s.c, await control(t, true)); return req(t.objectStore('imports').get([namespace, event]));
    });
    if (!row) return null;
    const value = fromBytes(await unseal(s.read, binding, 'import', importId(row), row.sealed)) as ImportState;
    if (!value.receipt || !value.header) refuse('unversioned_import');
    await registerDownloadResult({kind: 'manifest', revision: value.receipt.payload.revision,
      header: value.header, receipt: value.receipt, unchanged: true}, scope.academy, event);
    if (value.commandRevision !== s.c.revision || value.seen !== value.receipt.payload.seen ||
        value.saved !== value.receipt.payload.saved || value.cursor !== value.receipt.payload.cursor) refuse('import_basis_changed');
    await verify(s.c);
    return {...s, row, value};
  }
  async function transferCheckpoint(event: string) {
    const s = await transferState(event);
    return s ? {transfer: s.row.transfer, receipt: s.value.receipt!} : null;
  }
  async function refreshTransfer(event: string, transfer: string, manifest: DownloadManifest) {
    manifest = await registerDownloadResult(manifest, scope.academy, event) as DownloadManifest;
    const s = await transferState(event);
    if (!s || s.row.transfer !== transfer) refuse('import_mismatch');
    const before = s.value.receipt!.payload, next = manifest.receipt.payload;
    if (manifest.kind !== 'manifest' || before.revision !== next.revision || before.head !== next.head ||
        before.acc !== next.acc || before.cursor !== next.cursor || before.seen !== next.seen ||
        before.saved !== next.saved) refuse('download_resume_mismatch');
    const row = {...s.row, revision: s.row.revision + 1};
    row.sealed = await seal(s.read, binding, 'import', importId(row), jsonBytes({...s.value,
      header: manifest.header, receipt: manifest.receipt}));
    await tx(['control', 'imports'], 'readwrite', async t => {
      const c = (await control(t, true))!; unchanged(s.c, c);
      const current: ImportRow | undefined = await req(t.objectStore('imports').get([namespace, event]));
      if (c.revision !== s.value.commandRevision || current?.transfer !== transfer ||
          current.revision !== s.row.revision) refuse('import_changed');
      t.objectStore('imports').put(row, [namespace, event]);
    });
  }
  async function finalizeTransfer(event: string, transfer: string, complete: DownloadComplete, signal?: AbortSignal) {
    complete = await registerDownloadResult(complete, scope.academy, event) as DownloadComplete;
    const s = await transferState(event);
    if (!s || s.row.transfer !== transfer) refuse('import_mismatch');
    const p = s.value.receipt!.payload, final = complete.receipt.payload;
    if (complete.kind !== 'complete' || p.revision !== final.revision || p.head !== final.head || p.acc !== final.acc ||
        p.cursor !== final.cursor || s.value.seen !== final.count || s.value.saved !== final.total_saved) refuse('download_incomplete');
    // Re-read and authenticate the actual staged rows in bounded pages, rather
    // than treating counters or receipt metadata as evidence of disk coverage.
    let cursor: string | null = null, seen = 0, saved = 0, acc = await downloadSeed(p.head);
    while (seen < p.count) {
      signal?.throwIfAborted();
      const rows: StoredPlayer[] = await tx(['control', 'imports', 'rows'], 'readonly', async t => {
        unchanged(s.c, await control(t, true));
        const current: ImportRow | undefined = await req(t.objectStore('imports').get([namespace, event]));
        if (current?.transfer !== transfer || current.revision !== s.row.revision) refuse('import_changed');
        return req(t.objectStore('rows').getAll(IDBKeyRange.bound([namespace, event, transfer, cursor ?? ''],
          [namespace, event, transfer, []], true), LOCAL_PAGE_LIMIT));
      });
      if (!rows.length) refuse('download_disk_coverage');
      const players = await Promise.all(rows.map(async row =>
        fromBytes(await unseal(s.read, binding, 'player', playerId(event, transfer, row.player), row.sealed)) as AttendancePlayer));
      rosterPage({...complete.header, players, more: seen + players.length < p.count}, LOCAL_RECORD_LIMIT);
      if (players.some((player, i) => player.id !== rows[i].player || player.id <= (cursor ?? ''))) refuse('download_disk_coverage');
      seen += players.length; saved += players.filter(player => player.status !== null).length;
      cursor = players.at(-1)!.id; acc = await downloadChain(acc, players);
    }
    if (seen !== p.count || saved !== p.total_saved || cursor !== p.cursor ||
        acc !== p.acc || await downloadRoot(p.head, acc) !== p.revision) refuse('download_disk_coverage');
    const head: Head = {namespace, event, generation: transfer, revision: 1, invalid: false, sealed: undefined as unknown as SealedRecord};
    head.sealed = await seal(s.read, binding, 'header', headId(head), jsonBytes({namespace, event,
      generation: transfer, invalid: false, header: complete.header, verification: complete.receipt}));
    signal?.throwIfAborted();
    await tx(['control', 'imports', 'rows', 'heads'], 'readwrite', async t => {
      signal?.throwIfAborted();
      const abort = () => {try {t.abort();} catch { /* Transaction may have completed. */ }};
      signal?.addEventListener('abort', abort, {once: true});
      t.addEventListener('complete', () => signal?.removeEventListener('abort', abort), {once: true});
      t.addEventListener('abort', () => signal?.removeEventListener('abort', abort), {once: true});
      const c = (await control(t, true))!; unchanged(s.c, c);
      const current: ImportRow | undefined = await req(t.objectStore('imports').get([namespace, event]));
      if (c.revision !== s.value.commandRevision || current?.transfer !== transfer || current.revision !== s.row.revision ||
          await req(t.objectStore('rows').count(range([namespace, event, transfer]))) !== p.count) refuse('import_changed');
      const old: Head | undefined = await req(t.objectStore('heads').get([namespace, event]));
      if (old) t.objectStore('rows').delete(range([namespace, event, old.generation]));
      t.objectStore('heads').put(head, [namespace, event]);
      t.objectStore('imports').delete([namespace, event]);
    });
  }
  async function transferBasis(event: string) {
    try {
      const s = await loadHead(event);
      return s.verification && !s.head.invalid ? {revision: s.verification.revision} : null;
    } catch (e) {if (e instanceof Error && e.message === 'not_downloaded') return null; throw e;}
  }
  async function refreshUnchanged(event: string, manifest: DownloadManifest) {
    manifest = await registerDownloadResult(manifest, scope.academy, event) as DownloadManifest;
    const s = await loadHead(event);
    if (manifest.kind !== 'manifest' || !manifest.unchanged || s.head.invalid ||
        !s.verification || manifest.revision !== s.verification.revision ||
        stableHeader(manifest.header) !== stableHeader(s.header)) refuse('download_unchanged_mismatch');
    const head = {...s.head, revision: s.head.revision + 1};
    head.sealed = await seal(s.read, binding, 'header', headId(head), jsonBytes({namespace, event,
      generation: head.generation, invalid: false, header: manifest.header, verification: s.verification.receipt}));
    await tx(['control', 'heads'], 'readwrite', async t => {
      const c = (await control(t, true))!; unchanged(s.c, c);
      if (c.revision !== s.c.revision) refuse('basis_changed');
      await verifyHead(t, s.head); t.objectStore('heads').put(head, [namespace, event]);
    });
  }
  async function decodeOriginal(row: StoredOriginal, bytes: ArrayBuffer): Promise<Original> {
    const value = fromBytes(bytes) as Original;
    if (row.namespace !== namespace || !Number.isSafeInteger(row.revision) || row.revision < 1 ||
        row.active && (row.active[0] !== namespace || row.active[1] !== row.event || row.active.length !== 2) ||
        !value || value.v !== 1 || value.revision !== row.revision ||
        !['pending', 'unknown', 'needs_review', 'confirmed'].includes(value.state) ||
        Boolean(row.active) !== (value.state !== 'confirmed')) refuse('original_corrupt');
    const {packet, wire} = canonicalRegister(JSON.parse(value.wire));
    if (wire !== value.wire || value.hash !== await digest(wire) || packet.op !== row.op ||
        packet.event !== row.event || packet.academy !== scope.academy ||
        value.display.header.event !== row.event || value.display.players.length !== packet.marks.length) refuse('original_mismatch');
    const players = new Map(value.display.players.map(p => [p.id, p]));
    if (players.size !== packet.marks.length || packet.marks.some(m => !players.has(m.player) ||
        players.get(m.player)!.version !== 0 || players.get(m.player)!.status !== null)) refuse('original_basis_mismatch');
    for (let i = 0; i < value.display.players.length; i += LOCAL_PAGE_LIMIT) {
      // Selection order need not be the roster's UUID order.
      rosterPage({...value.display.header, players: value.display.players.slice(i, i + LOCAL_PAGE_LIMIT)
        .sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0), more: false}, LOCAL_RECORD_LIMIT);
    }
    if (value.state === 'confirmed') exactReceipt(value.receipt, packet);
    else if (value.receipt !== null) refuse('original_corrupt');
    if (value.state === 'needs_review' ? !['conflict', 'deadline', 'denied'].includes(String(value.refusal)) : value.refusal !== null) refuse('original_corrupt');
    return value;
  }
  async function originalSnapshot(op: string) {
    identifier(op);
    const s = await snapshot();
    const row: StoredOriginal | undefined = await tx(['control', 'originals'], 'readonly', async t => {
      unchanged(s.c, await control(t, true)); return req(t.objectStore('originals').get([namespace, op]));
    });
    if (!row) refuse('original_missing');
    const value = await decodeOriginal(row, await openOriginal(s.device, s.recovery, binding, originalId(row), row.protected));
    await tx(['control', 'originals'], 'readonly', async t => {
      unchanged(s.c, await control(t, true));
      const current: StoredOriginal | undefined = await req(t.objectStore('originals').get([namespace, op]));
      if (current?.revision !== row.revision) refuse('original_changed');
    });
    return {...s, row, value};
  }
  async function readOriginal(op: string) {return (await originalSnapshot(op)).value;}
  async function listOriginals(after: string | null = null) {
    if (after !== null) identifier(after);
    const s = await snapshot();
    const rows: StoredOriginal[] = await tx(['control', 'originals'], 'readonly', async t => {
      unchanged(s.c, await control(t, true));
      return req(t.objectStore('originals').getAll(IDBKeyRange.bound([namespace, after ?? ''],
        [namespace, []], true), LOCAL_PAGE_LIMIT + 1));
    });
    return {items: rows.slice(0, LOCAL_PAGE_LIMIT).map(row => ({op: row.op, event: row.event})),
      more: rows.length > LOCAL_PAGE_LIMIT};
  }
  async function activeOriginalSnapshot(event: string) {
    identifier(event);
    const s = await snapshot();
    const row: StoredOriginal | undefined = await tx(['control', 'originals'], 'readonly', async t => {
      unchanged(s.c, await control(t, true));
      return req(t.objectStore('originals').index('activeEvent').get([namespace, event]));
    });
    if (!row) return null;
    const original = await originalSnapshot(row.op);
    unchanged(s.c, original.c);
    if (original.row.event !== event) refuse('original_mismatch');
    return original.value.state === 'confirmed' ? null : original;
  }
  async function readActiveOriginal(event: string) {
    return (await activeOriginalSnapshot(event))?.value ?? null;
  }
  async function captureRegister(input: unknown) {
    const {packet, wire} = canonicalRegister(input);
    if (packet.academy !== scope.academy) refuse('academy_mismatch');
    const s = await loadHead(packet.event);
    if (s.head.invalid || !s.header.open) refuse('current_basis_required');
    const rows: (StoredPlayer | undefined)[] = await tx(['control', 'heads', 'rows', 'originals'], 'readonly', async t => {
      unchanged(s.c, await control(t, true)); await verifyHead(t, s.head);
      if (await req(t.objectStore('originals').index('activeEvent').count([namespace, packet.event]))) refuse('original_pending_replacement_blocked');
      return Promise.all(packet.marks.map(m => req(t.objectStore('rows').get([namespace, packet.event, s.head.generation, m.player]))));
    });
    const players = await Promise.all(rows.map(async (row, i) => {
      if (!row) refuse('player_not_rostered');
      const p = fromBytes(await unseal(s.read, binding, 'player', playerId(packet.event, s.head.generation, packet.marks[i].player), row.sealed)) as AttendancePlayer;
      if (p.id !== packet.marks[i].player || p.status !== null || p.version !== 0) refuse('saved_mark_requires_correction');
      return p;
    }));
    const row: StoredOriginal = {namespace, event: packet.event, op: packet.op, revision: 1,
      active: [namespace, packet.event], protected: undefined as unknown as ProtectedOriginal};
    const value: Original = {v: 1, wire, hash: await digest(wire), state: 'pending', revision: 1,
      display: {header: s.header, players}, receipt: null, refusal: null};
    row.protected = await protectOriginal(s.device, s.recovery, binding, originalId(row), jsonBytes(value));
    await tx(['control', 'heads', 'originals'], 'readwrite', async t => {
      unchanged(s.c, await control(t, true)); await verifyHead(t, s.head);
      if (await req(t.objectStore('originals').index('activeEvent').count([namespace, packet.event]))) refuse('original_pending_replacement_blocked');
      t.objectStore('originals').add(row, [namespace, packet.op]);
      const c = (await control(t, true))!;
      t.objectStore('control').put({...c, revision: c.revision + 1}, namespace);
    });
    return {savedOnDevice: true as const, op: packet.op, count: packet.marks.length};
  }
  async function transitionOriginal(s: Awaited<ReturnType<typeof originalSnapshot>>,
    state: 'unknown' | 'needs_review' | 'confirmed', reply?: unknown, signal?: AbortSignal) {
    signal?.throwIfAborted();
    const op = s.row.op;
    const packet = canonicalRegister(JSON.parse(s.value.wire)).packet;
    const receipt: RegisterReceipt | null = state === 'confirmed' ? exactReceipt(reply, packet) : null;
    if (s.value.state === 'confirmed') {
      if (state !== 'confirmed') refuse('already_confirmed');
      return s.value;
    }
    if (state === 'unknown' && s.value.state === 'unknown') return s.value;
    if (state === 'unknown' && s.value.state === 'needs_review') refuse('review_required');
    if (state === 'confirmed' && s.value.state === 'pending') refuse('original_not_dispatched');
    if (state === 'needs_review' && !['conflict', 'deadline', 'denied'].includes(String(reply))) refuse('invalid_refusal');
    const value: Original = {...s.value, state, revision: s.row.revision + 1, receipt,
      refusal: state === 'needs_review' ? reply as Original['refusal'] : null};
    const next: StoredOriginal = {...s.row, revision: value.revision};
    if (state === 'confirmed') delete next.active;
    next.protected = await protectOriginal(s.device, s.recovery, binding, originalId(next), jsonBytes(value));
    let invalidHead: Head | undefined;
    if (state === 'confirmed') {
      const h: Head | undefined = await tx(['control', 'heads'], 'readonly', async t => {
        unchanged(s.c, await control(t, true)); return req(t.objectStore('heads').get([namespace, s.row.event]));
      });
      if (h) {
        const plain = fromBytes(await unseal(s.read, binding, 'header', headId(h), h.sealed)) as Record<string, unknown>;
        invalidHead = {...h, invalid: true, revision: h.revision + 1};
        invalidHead.sealed = await seal(s.read, binding, 'header', headId(invalidHead), jsonBytes({...plain, invalid: true}));
      }
    }
    await tx(['control', 'originals', 'heads'], 'readwrite', async t => {
      signal?.throwIfAborted();
      const abort = () => {try {t.abort();} catch { /* The transaction already completed. */ }};
      signal?.addEventListener('abort', abort, {once: true});
      t.addEventListener('complete', () => signal?.removeEventListener('abort', abort), {once: true});
      t.addEventListener('abort', () => signal?.removeEventListener('abort', abort), {once: true});
      unchanged(s.c, await control(t, true));
      const current: StoredOriginal | undefined = await req(t.objectStore('originals').get([namespace, op]));
      if (current?.revision !== s.row.revision) refuse('original_changed');
      if (state === 'confirmed') {
        const h: Head | undefined = await req(t.objectStore('heads').get([namespace, s.row.event]));
        if (invalidHead) {
          if (h?.generation !== invalidHead.generation || h.revision !== invalidHead.revision - 1) refuse('basis_changed');
          t.objectStore('heads').put(invalidHead, [namespace, s.row.event]);
        } else if (h) refuse('basis_changed');
      }
      t.objectStore('originals').put(next, [namespace, op]);
      const c = (await control(t, true))!;
      t.objectStore('control').put({...c, revision: c.revision + 1}, namespace);
    });
    return value;
  }
  async function transition(op: string, state: 'unknown' | 'needs_review' | 'confirmed', reply?: unknown) {
    return transitionOriginal(await originalSnapshot(op), state, reply);
  }
  async function beginOriginalDispatch(event: string, signal: AbortSignal) {
    signal.throwIfAborted();
    const original = await activeOriginalSnapshot(event);
    signal.throwIfAborted();
    if (!original) return {kind: 'none' as const};
    if (original.value.state === 'needs_review')
      return {kind: 'needs_review' as const, refusal: original.value.refusal!};
    const value = await transitionOriginal(original, 'unknown', undefined, signal);
    signal.throwIfAborted();
    return {kind: 'send' as const, wire: value.wire, subject: scope.subject,
      attempt: {binding, fence: original.c.fence, op: original.row.op, revision: value.revision} satisfies DispatchAttempt};
  }
  async function finishOriginalDispatch(attempt: DispatchAttempt, outcome: DispatchOutcome, signal: AbortSignal) {
    signal.throwIfAborted();
    if (attempt.binding !== binding) refuse('scope_changed');
    const original = await originalSnapshot(attempt.op);
    if (attempt.fence !== original.c.fence) refuse('scope_changed');
    // Another tab may already have persisted the same definitive receipt.
    if ('receipt' in outcome && original.value.state === 'confirmed') {
      exactReceipt(outcome.receipt, canonicalRegister(JSON.parse(original.value.wire)).packet);
      signal.throwIfAborted();
      return;
    }
    if (original.row.revision !== attempt.revision || original.value.state !== 'unknown') refuse('original_changed');
    if ('receipt' in outcome) await transitionOriginal(original, 'confirmed', outcome.receipt, signal);
    else await transitionOriginal(original, 'needs_review', outcome.refusal, signal);
    signal.throwIfAborted();
  }
  async function quarantine(reason: 'logout' | 'thirty_days' | 'known_denial') {
    if (!['logout', 'thirty_days', 'known_denial'].includes(reason)) refuse('invalid_cleanup');
    const fence = await tx(['control'], 'readwrite', async t => {
      // Cleanup can resume Cleaning. It must still verify binding on every attempt.
      const c: Control | undefined = await req(t.objectStore('control').get(namespace));
      if (!c) return null;
      if (c.binding !== binding) refuse('scope_metadata_mismatch');
      const next: Control = {...c, mode: 'cleaning', fence: c.fence + 1, revision: c.revision + 1};
      t.objectStore('control').put(next, namespace); return next.fence;
    });
    if (fence === null) return;
    await tx(stores, 'readwrite', async t => {
      const c: Control | undefined = await req(t.objectStore('control').get(namespace));
      if (!c || c.binding !== binding || c.fence !== fence || c.mode !== 'cleaning') refuse('scope_changed');
      for (const kind of ['read', 'recovery']) t.objectStore('keys').delete(key(kind));
      for (const store of ['heads', 'imports', 'rows']) {
        const cursor = t.objectStore(store).index('namespace').openCursor(namespace);
        cursor.onsuccess = () => {const c = cursor.result; if (c) {c.delete(); c.continue();}};
      }
      t.objectStore('control').put({...c, mode: 'quarantined'}, namespace);
    });
  }
  return {beginActivation, activate, beginImport, importStatus, abandonImport, appendPage, readPage,
    transferCheckpoint, refreshTransfer, finalizeTransfer, transferBasis, refreshUnchanged,
    captureRegister, readOriginal, listOriginals, readActiveOriginal, beginOriginalDispatch, finishOriginalDispatch,
    beginOriginal: async (op: string) => (await transition(op, 'unknown')).wire,
    refuseOriginal: (op: string, reason: 'conflict' | 'deadline' | 'denied') => transition(op, 'needs_review', reason),
    settleOriginal: (op: string, receipt: unknown) => transition(op, 'confirmed', receipt),
    quarantine, dispose};
}
export type LocalRegisterRepository = Awaited<ReturnType<typeof openLocalRegister>>;
