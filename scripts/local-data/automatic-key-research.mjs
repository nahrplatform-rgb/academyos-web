/* Isolated fictional-data mechanism research; NOT imported by the app.
 * A RecoveryTicket must come from an authenticated authority. The companion
 * harness models that boundary, not Clerk or production key custody.
 */
import {seal, unseal, newLocalKey as newKey, checkLocalKey} from '../../apps/web/src/lib/local-register-crypto.ts';
const encode = new TextEncoder(), decode = new TextDecoder();
const DB = 'academyos-automatic-key-research-v1';
const stores = ['control', 'keys', 'records'];
const valid = v => typeof v === 'string' && /^[a-zA-Z0-9_-]{1,160}$/.test(v);
const fail = code => { throw new Error(code); };
const request = r => new Promise((resolve, reject) => {
  r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error);
});

async function transaction(db, names, mode, work, abort = false) {
  const tx = db.transaction(names, mode);
  const done = new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onabort = () => reject(tx.error || new Error('transaction_aborted'));
    tx.onerror = () => {}; // onabort owns acknowledgement, not request success.
  });
  done.catch(() => {});
  try {
    const value = await work(tx);
    if (abort) tx.abort();
    await done;
    return value;
  } catch (error) {
    try { tx.abort(); } catch { /* Already completed/aborted. */ }
    await done.catch(() => {});
    throw error;
  }
}

function payload(value) {
  const bytes = encode.encode(JSON.stringify(value));
  if (!bytes.byteLength || bytes.byteLength > 131072) fail('research_record_size');
  return bytes;
}

export async function openResearchVault(scope, device) {
  if (!valid(scope) || !valid(device)) fail('invalid_scope');
  const opening = indexedDB.open(DB, 1);
  opening.onupgradeneeded = () => {
    for (const name of stores) opening.result.createObjectStore(name);
  };
  const db = await new Promise((resolve, reject) => {
    opening.onsuccess = () => resolve(opening.result);
    opening.onerror = () => reject(opening.error);
    opening.onblocked = () => reject(new Error('storage_upgrade_blocked'));
  });
  db.onversionchange = () => db.close();
  const key = kind => [scope, kind];
  const current = async tx => {
    const control = await request(tx.objectStore('control').get(scope));
    if (control && control.device !== device) fail('device_mismatch');
    return control;
  };
  const requireActive = c => {
    if (c?.mode === 'cleaning') fail('cleanup_incomplete');
    if (!c || c.mode !== 'active') fail('account_verification_required');
    return c;
  };
  const unchanged = (before, after) => {
    requireActive(after);
    if (before.fence !== after.fence) fail('scope_changed');
  };
  const verifyAfterCrypto = async before => transaction(db, ['control'], 'readonly',
    async tx => unchanged(before, await current(tx)));

  async function activeSnapshot() {
    return transaction(db, stores, 'readonly', async tx => {
      const control = requireActive(await current(tx));
      const [deviceKey, readKey, recoveryKey] = await Promise.all([
        request(tx.objectStore('keys').get(key('device'))),
        request(tx.objectStore('keys').get(key('read'))),
        request(tx.objectStore('keys').get(key('recovery'))),
      ]);
      return {control, deviceKey, readKey, recoveryKey};
    });
  }

  return {
    async beginActivation() {
      const c = await transaction(db, ['control'], 'readonly', current);
      if (c?.mode === 'cleaning') fail('cleanup_incomplete');
      return {scope, device, fence: c?.fence || 0};
    },

    async activate(ticket, attempt, {abort = false} = {}) {
      if (!attempt || attempt.scope !== scope || attempt.device !== device ||
          !ticket || ticket.scope !== scope || ticket.device !== device ||
          !valid(ticket.keyId) || typeof ticket.material !== 'string' ||
          !/^[A-Za-z0-9+/]{43}=$/.test(ticket.material) ||
          !Number.isSafeInteger(ticket.verifiedAt)) fail('key_ticket_mismatch');
      const bytes = Uint8Array.from(atob(ticket.material), c => c.charCodeAt(0));
      let recoveryKey;
      try { recoveryKey = await crypto.subtle.importKey('raw', bytes, 'AES-KW', false,
        ['wrapKey', 'unwrapKey']); } finally { bytes.fill(0); }
      const old = await transaction(db, stores, 'readonly', async tx => ({
        control: await current(tx),
        deviceKey: await request(tx.objectStore('keys').get(key('device'))),
        pending: await request(tx.objectStore('records').get(key('pending'))),
      }));
      if (old.control?.mode === 'cleaning') fail('cleanup_incomplete');
      if (old.control?.pending) {
        checkLocalKey(old.deviceKey);
        const wrapped = await unseal(old.deviceKey, scope, 'pending-key',
          old.control.pending, old.pending?.wrapped);
        // Verify the released recovery key against retained data before making
        // the store active or replacing a cached key. Wrong keys preserve work.
        await crypto.subtle.unwrapKey('raw', wrapped, recoveryKey, 'AES-KW',
          {name: 'AES-GCM', length: 256}, false, ['decrypt']);
      }
      const freshDevice = await newKey(), freshRead = await newKey();
      await transaction(db, stores, 'readwrite', async tx => {
        const c = await current(tx);
        if ((c?.fence || 0) !== attempt.fence) fail('scope_changed');
        if (c?.mode === 'cleaning') fail('cleanup_incomplete');
        if (c && c.device !== device) fail('device_mismatch');
        if (c && c.recoveryKeyId !== ticket.keyId) fail('key_rotation_requires_recovery');
        const keys = tx.objectStore('keys');
        const existingDevice = await request(keys.get(key('device')));
        if (!c) {
          const orphaned = await Promise.all([
            request(keys.get(key('read'))), request(keys.get(key('recovery'))),
            request(tx.objectStore('records').get(key('replica'))),
            request(tx.objectStore('records').get(key('pending'))),
          ]);
          if (existingDevice || orphaned.some(Boolean)) fail('scope_metadata_missing');
        }
        // Missing persisted keys never reset a namespace with pending ciphertext.
        if (c && !existingDevice) fail('local_key_missing_or_invalid');
        if (existingDevice) checkLocalKey(existingDevice);
        const existingRead = await request(keys.get(key('read')));
        if (c?.mode === 'active' && !existingRead) fail('local_key_missing_or_invalid');
        if (existingRead) checkLocalKey(existingRead);
        keys.put(existingDevice || freshDevice, key('device'));
        keys.put(existingRead || freshRead, key('read'));
        keys.put(recoveryKey, key('recovery'));
        tx.objectStore('control').put({scope, device, mode: 'active',
          fence: attempt.fence + 1, verifiedAt: ticket.verifiedAt,
          recoveryKeyId: ticket.keyId, pending: c?.pending || null}, scope);
      }, abort);
    },

    async capture(id, replica, original, {abort = false} = {}) {
      if (!valid(id)) fail('invalid_operation');
      const {control, deviceKey, readKey, recoveryKey} = await activeSnapshot();
      checkLocalKey(deviceKey); checkLocalKey(readKey);
      if (!recoveryKey) fail('account_verification_required');
      if (control.pending) fail('original_pending_replacement_blocked');
      const local = await seal(readKey, scope, 'replica', 'register', payload(replica));
      // The transient exportable data key is only used to create a wrapped key;
      // raw data-key bytes are never persisted. Reopened keys are non-extractable.
      const dataKey = await crypto.subtle.generateKey({name: 'AES-GCM', length: 256},
        true, ['encrypt', 'decrypt']);
      const pending = await seal(dataKey, scope, 'pending', id, payload(original));
      const wrapped = await crypto.subtle.wrapKey('raw', dataKey, recoveryKey, 'AES-KW');
      pending.wrapped = await seal(deviceKey, scope, 'pending-key', id, wrapped);
      await transaction(db, ['control', 'records'], 'readwrite', async tx => {
        const now = await current(tx); unchanged(control, now);
        if (now.pending) fail('original_pending_replacement_blocked');
        tx.objectStore('records').put(local, key('replica'));
        tx.objectStore('records').put(pending, key('pending'));
        tx.objectStore('control').put({...now, pending: id}, scope);
      }, abort);
      return {savedOnDevice: true, originalId: id};
    },

    async readReplica() {
      const {control, readKey} = await activeSnapshot();
      checkLocalKey(readKey);
      const row = await transaction(db, ['records'], 'readonly',
        tx => request(tx.objectStore('records').get(key('replica'))));
      if (!row) fail('not_downloaded');
      const bytes = await unseal(readKey, scope, 'replica', 'register', row);
      await verifyAfterCrypto(control);
      return JSON.parse(decode.decode(bytes));
    },

    async readPending() {
      const {control, deviceKey, recoveryKey} = await activeSnapshot();
      checkLocalKey(deviceKey);
      if (!control.pending || !recoveryKey) fail('account_verification_required');
      const row = await transaction(db, ['records'], 'readonly',
        tx => request(tx.objectStore('records').get(key('pending'))));
      const wrapped = await unseal(deviceKey, scope, 'pending-key', control.pending, row?.wrapped);
      const dataKey = await crypto.subtle.unwrapKey('raw', wrapped, recoveryKey, 'AES-KW',
        {name: 'AES-GCM', length: 256}, false, ['decrypt']);
      const bytes = await unseal(dataKey, scope, 'pending', control.pending, row);
      await verifyAfterCrypto(control);
      return JSON.parse(decode.decode(bytes));
    },

    async quarantine(reason = 'logout', {abort = false} = {}) {
      if (!['logout', 'thirty_days', 'known_denial'].includes(reason)) fail('invalid_cleanup');
      // Durable intent closes every tab before deletion. If cleanup then aborts,
      // a restart sees cleaning and cannot silently reopen residual cached keys.
      const checkpoint = await transaction(db, ['control'], 'readwrite', async tx => {
        const c = await current(tx);
        if (!c) return null;
        const next = {...c, mode: 'cleaning', reason, fence: c.fence + 1};
        tx.objectStore('control').put(next, scope);
        return next;
      });
      if (!checkpoint) return;
      await transaction(db, stores, 'readwrite', async tx => {
        const c = await current(tx);
        if (!c || c.fence !== checkpoint.fence || c.mode !== 'cleaning') fail('scope_changed');
        tx.objectStore('keys').delete(key('read'));
        tx.objectStore('keys').delete(key('recovery'));
        tx.objectStore('records').delete(key('replica'));
        tx.objectStore('control').put({...c, mode: 'quarantined'}, scope);
      }, abort);
    },

    close() { db.close(); },
  };
}
