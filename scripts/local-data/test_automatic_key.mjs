// Actual isolated Chromium/WebCrypto/IndexedDB + fictional HTTP key authority.
// Never connects to AcademyOS, Clerk, Supabase, Vercel or an existing profile.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {randomBytes, createHash, randomUUID} from 'node:crypto';
import {readFile, writeFile, mkdir, mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {chromium} from '@playwright/test';

const root = resolve(import.meta.dirname, '../..');
const sourcePath = 'scripts/local-data/automatic-key-research.mjs';
const source = await readFile(join(root, sourcePath), 'utf8');
const evidence = join(root, 'docs/07-handoff/evidence/automatic-local-key-2026-11-03.json');
if (process.argv.includes('--check')) {
  const recorded = JSON.parse(await readFile(evidence, 'utf8'));
  for (const [path, hash] of Object.entries(recorded.hashes)) {
    assert.equal(createHash('sha256').update(await readFile(join(root, path))).digest('hex'), hash, path);
  }
  assert.equal(recorded.passed, true);
  assert.ok(recorded.checks.length && recorded.checks.every(c => c.status === 'passed'));
  console.log('PASS automatic-key research receipt matches its sources; private/security gates separate');
  process.exit(0);
}
const profiles = await mkdtemp(join(tmpdir(), 'academyos-automatic-keys-'));
const checks = [], errors = [], expectedDenials = [], externalRequests = [], timings = [];
const grants = new Map(), requests = [];
const active = new Map([['A', true], ['B', true]]);
let context, page, origin, browserVersion;
function scope(label, actor = 'A', academy = 'A', device = 'A') {
  const id = `fixture-${label}-${actor}-${academy}-${device}`;
  grants.set(id, {actor, academy, device, keyId: randomUUID(), material: randomBytes(32).toString('base64')});
  return id;
}
const initial = scope('initial'), abortScope = scope('abort'), lateScope = scope('late');
const activationAbortScope = scope('activation-abort');
const cleanupScope = scope('cleanup'), deniedScope = scope('denied');
const other = scope('other', 'B', 'B', 'B'), missingScope = scope('missing');
const orphanedScope = scope('orphaned');
const parallelScope = scope('parallel'), damagedScope = scope('damaged');
const unavailableScope = scope('unavailable');
const ids = Array.from({length: 18}, () => randomUUID());
const replica = {name: 'Synthetic Automatic Register', branch: 'Fictional Main Branch',
  timezone: 'Africa/Cairo', players: ids.map((id, i) => ({id, name: `Synthetic Auto Player ${i + 1}`,
    status: i === 17 ? 'present' : null, version: i === 17 ? 1 : 0}))};
const original = {action: 'register', academy: randomUUID(), event: randomUUID(), op: randomUUID(),
  captured_at: '2026-11-03T09:00:00Z', marks: ids.slice(0, 17).map((player, i) =>
    ({player, status: i % 2 ? 'absent' : 'present', version: 0}))};

const html = `<!doctype html><html lang="en"><meta charset="utf-8"><title>Automatic key mechanism test</title>
<h1>Isolated fictional-data mechanism test</h1><p>No real account, app API or credential prompt.</p>
<script type="module" src="/harness.mjs"></script></html>`;
const harness = `import {openResearchVault} from '/research.mjs';
window.openResearchVault=openResearchVault;window.vaults={};
window.use=async(scope,device='A')=>window.vaults[scope]=await openResearchVault(scope,device);
window.activate=async(scope,device='A')=>{const v=window.vaults[scope]||await window.use(scope,device);
 const attempt=await v.beginActivation();const response=await fetch('/fixture-key',{method:'POST',
 headers:{'Content-Type':'application/json'},body:JSON.stringify({scope,device})});
 if(!response.ok)throw new Error('fixture_authority_'+response.status);
 await v.activate(await response.json(),attempt);};
window.inspect=async scope=>{const r=indexedDB.open('academyos-automatic-key-research-v1');
 const db=await new Promise((ok,no)=>{r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)});
 const all=async store=>{const t=db.transaction(store),r=t.objectStore(store).getAll();return new Promise((ok,no)=>{r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)})};
 const controls=await all('control'),keys=await all('keys'),records=await all('records');db.close();
 const selected=records.filter(r=>r.scope===scope);let plain=JSON.stringify(selected);
 for(const row of selected)plain+=new TextDecoder().decode(row.cipher);
 const scopeControl=controls.find(c=>c.scope===scope);
 let extractable=0;for(const key of keys){try{await crypto.subtle.exportKey('raw',key);extractable++}catch{}}
 return {mode:scopeControl?.mode||null,pending:scopeControl?.pending||null,
 records:selected.length,replicas:selected.filter(r=>r.purpose==='replica').length,
 ciphertextBytes:selected.reduce((n,r)=>n+r.cipher.byteLength+r.iv.byteLength+
   (r.wrapped?r.wrapped.cipher.byteLength+r.wrapped.iv.byteLength:0),0),
 containsPlaintext:/Synthetic Auto|Fictional Main|captured_at|"marks"/.test(plain),extractable};};`;
const server = createServer(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'none'; script-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'");
  if (req.method === 'GET' && ['/', '/research.mjs', '/harness.mjs'].includes(req.url)) {
    res.setHeader('Content-Type', req.url.endsWith('.mjs') ? 'text/javascript' : 'text/html');
    res.end(req.url === '/research.mjs' ? source : req.url === '/harness.mjs' ? harness : html); return;
  }
  if (req.url === '/favicon.ico') { res.writeHead(204); res.end(); return; }
  if (req.method !== 'POST' || req.url !== '/fixture-key') { res.writeHead(404); res.end(); return; }
  let body = ''; for await (const chunk of req) { body += chunk; if (body.length > 1024) break; }
  // Identity is fixture-server owned, not an actor/role accepted from JSON.
  const actor = /(?:^|;\s*)fictional_session=([AB])(?:;|$)/.exec(req.headers.cookie || '')?.[1];
  let b; try { b = JSON.parse(body); } catch { /* Invalid request. */ }
  const grant = b && grants.get(b.scope);
  const allowed = body.length <= 1024 && b && Object.keys(b).sort().join(',') === 'device,scope' &&
    grant && grant.actor === actor && grant.device === b.device && active.get(actor);
  const measure = {allowed: Boolean(allowed), responseBytes: 2};
  requests.push(measure); // Never record bodies, cookies or key material.
  if (!allowed) { res.writeHead(403); res.end('{}'); return; }
  res.setHeader('Content-Type', 'application/json');
  const responseBody = JSON.stringify({scope: b.scope, device: b.device, keyId: grant.keyId,
    material: grant.material, verifiedAt: Date.now()});
  measure.responseBytes = Buffer.byteLength(responseBody);
  res.end(responseBody);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
origin = `http://127.0.0.1:${server.address().port}`;
const pass = name => { checks.push({name, status: 'passed'}); console.log('PASS ' + name); };
async function launch() {
  context = await chromium.launchPersistentContext(join(profiles, 'chromium'), {headless: true});
  browserVersion = context.browser().version();
  await context.addInitScript(() => {
    window.credentialCalls = 0;
    Object.defineProperty(navigator, 'credentials', {value: {
      create() { window.credentialCalls++; throw new Error('credential_prompt_forbidden'); },
      get() { window.credentialCalls++; throw new Error('credential_prompt_forbidden'); },
    }});
  });
  await context.addCookies([{name: 'fictional_session', value: 'A', url: origin,
    httpOnly: true, sameSite: 'Strict', expires: Math.floor(Date.now() / 1000) + 3600}]);
  page = context.pages()[0] || await context.newPage();
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => {
    if (m.type() === 'error' && m.location().url === origin + '/fixture-key' &&
        m.text() === 'Failed to load resource: the server responded with a status of 403 (Forbidden)') {
      expectedDenials.push('fixture-key:403'); return;
    }
    if (['error', 'warning'].includes(m.type())) errors.push(m.text());
  });
  page.on('request', r => { if (!r.url().startsWith(origin)) externalRequests.push(r.url()); });
  await page.goto(origin);
  await page.waitForFunction(() => window.openResearchVault);
}
async function use(s, d = 'A') { await page.evaluate(({s, d}) => window.use(s, d).then(() => null), {s, d}); }
async function activate(s, d = 'A') { await page.evaluate(({s, d}) => window.activate(s, d), {s, d}); }
async function call(s, method, args = []) {
  return page.evaluate(({s, method, args}) => window.vaults[s][method](...args), {s, method, args});
}
async function inspect(s) { return page.evaluate(s => window.inspect(s), s); }
async function cookie(actor) { await context.addCookies([{name: 'fictional_session', value: actor,
  url: origin, httpOnly: true, sameSite: 'Strict'}]); }
async function seed(s) { await use(s); await activate(s); await call(s, 'capture', [original.op, replica, original]); }

let failed;
try {
  await launch(); await use(initial);
  assert.equal((await inspect(initial)).records, 0);
  await assert.rejects(call(initial, 'readPending'), /account_verification_required/);
  const started = performance.now(); await activate(initial);
  await call(initial, 'capture', [original.op, replica, original]);
  const initialMs = performance.now() - started;
  assert.deepEqual(await call(initial, 'readReplica'), replica);
  assert.deepEqual(await call(initial, 'readPending'), original);
  const disk = await inspect(initial);
  assert.equal(disk.records, 2); assert.equal(disk.containsPlaintext, false); assert.equal(disk.extractable, 0);
  assert.equal(await page.evaluate(() => window.credentialCalls), 0);
  assert.equal(expectedDenials.length, requests.filter(r => !r.allowed).length,
    'Expected console denials must correspond exactly to actual refused key exchanges');
  pass('Automatic non-extractable keys seal the 18-player read and 17-mark original without credentials or plaintext storage');

  const beforeLocal = requests.length;
  for (let i = 0; i < 30; i++) { const t = performance.now(); await call(initial, 'readReplica'); timings.push(performance.now() - t); }
  assert.equal(requests.length, beforeLocal);
  await context.setOffline(true);
  assert.deepEqual(await call(initial, 'readPending'), original);
  await context.setOffline(false); await page.reload(); await page.waitForFunction(() => window.openResearchVault);
  await use(initial); await context.setOffline(true);
  assert.deepEqual(await call(initial, 'readReplica'), replica);
  assert.deepEqual(await call(initial, 'readPending'), original);
  assert.equal(requests.length, beforeLocal);
  pass('Covered reads and page reopening use retained keys with zero key exchanges and no unlock prompt');

  await context.close(); context = null;
  await launch(); await use(initial); await context.setOffline(true);
  assert.deepEqual(await call(initial, 'readPending'), original);
  assert.equal(requests.length, beforeLocal); await context.setOffline(false);
  pass('An actual browser-process restart retains the encrypted original and reopens automatically; no authenticator');

  await use(activationAbortScope);
  const activationAttempt = await call(activationAbortScope, 'beginActivation');
  const activationTicket = await page.evaluate(async s => (await fetch('/fixture-key', {method: 'POST',
    body: JSON.stringify({scope: s, device: 'A'})})).json(), activationAbortScope);
  await assert.rejects(call(activationAbortScope, 'activate', [activationTicket, activationAttempt, {abort: true}]), /transaction_aborted/);
  assert.equal((await inspect(activationAbortScope)).mode, null);
  await assert.rejects(call(activationAbortScope, 'readReplica'), /account_verification_required/);
  await call(activationAbortScope, 'activate', [activationTicket, activationAttempt]);
  await call(activationAbortScope, 'capture', [original.op, replica, original]);
  assert.deepEqual(await call(activationAbortScope, 'readPending'), original);
  pass('Aborted key provisioning acknowledges no active store or plaintext fallback and can retry without lost work');

  await use(abortScope); await activate(abortScope);
  await assert.rejects(call(abortScope, 'capture', [original.op, replica, original, {abort: true}]), /transaction_aborted/);
  assert.equal((await inspect(abortScope)).records, 0);
  await call(abortScope, 'capture', [original.op, replica, original]);
  await assert.rejects(call(abortScope, 'capture', [randomUUID(), replica, {...original, op: randomUUID()}]), /replacement_blocked/);
  assert.deepEqual(await call(abortScope, 'readPending'), original);
  pass('Aborted capture commits neither replica nor intent; an unsettled original cannot be replaced');

  await call(initial, 'quarantine', ['logout']);
  const quarantined = await inspect(initial);
  assert.equal(quarantined.mode, 'quarantined'); assert.equal(quarantined.records, 1);
  assert.equal(quarantined.replicas, 0); assert.equal(quarantined.pending, original.op);
  await assert.rejects(call(initial, 'readPending'), /account_verification_required/);
  const remaining = await page.evaluate(async s => {
    const r = indexedDB.open('academyos-automatic-key-research-v1');
    const db = await new Promise(ok => r.onsuccess = () => ok(r.result));
    const get = (store, k) => new Promise(ok => { const r = db.transaction(store).objectStore(store).get(k); r.onsuccess = () => ok(r.result); });
    const device = await get('keys', [s, 'device']), recovery = await get('keys', [s, 'recovery']);
    const read = await get('keys', [s, 'read']), row = await get('records', [s, 'pending']); db.close();
    const aad = new TextEncoder().encode(JSON.stringify([1, s, 'pending-key', row.id]));
    const stillWrapped = await crypto.subtle.decrypt({name: 'AES-GCM', iv: row.wrapped.iv, additionalData: aad}, device, row.wrapped.cipher);
    let guessed = false;
    try { const k = await crypto.subtle.importKey('raw', stillWrapped, 'AES-GCM', false, ['decrypt']);
      await crypto.subtle.decrypt({name: 'AES-GCM', iv: row.iv}, k, row.cipher); guessed = true; } catch {}
    return {deviceRetained: Boolean(device), recoveryRetained: Boolean(recovery), readRetained: Boolean(read), guessed};
  }, initial);
  assert.deepEqual(remaining, {deviceRetained: true, recoveryRetained: false, readRetained: false, guessed: false});
  pass('Logout deletes replicas/read/cached-recovery keys but retains pending ciphertext; device key alone cannot recover it');

  await cookie('B'); await assert.rejects(activate(initial), /fixture_authority_403/);
  await use(other, 'B'); await activate(other, 'B');
  const bypass = await page.evaluate(async ({s, wrongMaterial}) => {
    const v = window.vaults[s], attempt = await v.beginActivation();
    // Deliberately bypass JSON identity labels: correct scope/key ID, wrong cryptographic key.
    try { await v.activate({...wrongMaterial, scope: s, device: 'A'}, attempt); return false; }
    catch { return true; }
  }, {s: initial, wrongMaterial: {...grants.get(other), keyId: grants.get(initial).keyId, verifiedAt: Date.now()}});
  assert.equal(bypass, true); assert.equal((await inspect(initial)).mode, 'quarantined');
  await cookie('A'); await activate(initial);
  assert.deepEqual(await call(initial, 'readPending'), original);
  await assert.rejects(call(initial, 'readReplica'), /not_downloaded/);
  pass('Another authenticated account and even a wrong recovery key with forged correct labels cannot open retained work; original account recovers without restoring replicas');

  const foreignDevice = await page.evaluate(async s => {
    const v = await window.openResearchVault(s, 'B'), results = [];
    for (const action of [() => v.readPending(), () => v.beginActivation(), () => v.quarantine('logout')]) {
      try { await action(); results.push('allowed'); } catch (e) { results.push(e.message); }
    }
    v.close(); return results;
  }, initial);
  assert.deepEqual(foreignDevice, ['device_mismatch', 'device_mismatch', 'device_mismatch']);
  assert.deepEqual(await call(initial, 'readPending'), original);
  pass('An incompatible device handle cannot open, activate or clean another namespace; its original remains intact');

  await seed(lateScope);
  const attempt = await call(lateScope, 'beginActivation');
  const ticket = await page.evaluate(async s => (await fetch('/fixture-key', {method: 'POST',
    body: JSON.stringify({scope: s, device: 'A'})})).json(), lateScope);
  await call(lateScope, 'quarantine', ['logout']);
  await assert.rejects(call(lateScope, 'activate', [ticket, attempt]), /scope_changed/);
  assert.equal((await inspect(lateScope)).mode, 'quarantined');
  pass('A key response begun before logout cannot reactivate its durable scope fence');

  await seed(cleanupScope);
  await assert.rejects(call(cleanupScope, 'quarantine', ['thirty_days', {abort: true}]), /transaction_aborted/);
  assert.equal((await inspect(cleanupScope)).mode, 'cleaning');
  await assert.rejects(call(cleanupScope, 'readReplica'), /cleanup_incomplete/);
  await page.reload(); await page.waitForFunction(() => window.openResearchVault); await use(cleanupScope);
  await assert.rejects(call(cleanupScope, 'beginActivation'), /cleanup_incomplete/);
  await call(cleanupScope, 'quarantine', ['thirty_days']); await activate(cleanupScope);
  assert.deepEqual(await call(cleanupScope, 'readPending'), original);
  await assert.rejects(call(cleanupScope, 'readReplica'), /not_downloaded/);
  pass('Failed 30-day cleanup durably closes access across reload; retry removes read copies and preserves recoverable pending work');

  await seed(deniedScope); active.set('A', false);
  await call(deniedScope, 'quarantine', ['known_denial']);
  await assert.rejects(activate(deniedScope), /fixture_authority_403/);
  await assert.rejects(call(deniedScope, 'readPending'), /account_verification_required/);
  active.set('A', true); // Fictional authority only; no real membership restoration.
  await assert.rejects(activate(deniedScope, 'B'), /fixture_authority_403/);
  pass('Known denial stops local opening and server key release; a different device is denied');

  await seed(missingScope);
  await page.evaluate(async s => {
    const r = indexedDB.open('academyos-automatic-key-research-v1');
    const db = await new Promise(ok => r.onsuccess = () => ok(r.result));
    await new Promise((ok, no) => { const t = db.transaction('keys', 'readwrite');
      t.objectStore('keys').delete([s, 'device']); t.oncomplete = ok; t.onabort = () => no(t.error); }); db.close();
  }, missingScope);
  await assert.rejects(call(missingScope, 'readPending'), /local_key_missing/);
  await assert.rejects(activate(missingScope), /local_key_missing/);
  assert.equal((await inspect(missingScope)).records, 2);
  pass('Missing persisted device key refuses reopening/reenrollment and retains original ciphertext');

  await seed(orphanedScope);
  await page.evaluate(async s => {
    const r = indexedDB.open('academyos-automatic-key-research-v1');
    const db = await new Promise(ok => r.onsuccess = () => ok(r.result));
    await new Promise((ok, no) => { const t = db.transaction('control', 'readwrite');
      t.objectStore('control').delete(s); t.oncomplete = ok; t.onabort = () => no(t.error); }); db.close();
  }, orphanedScope);
  await assert.rejects(activate(orphanedScope), /scope_metadata_missing/);
  assert.equal((await inspect(orphanedScope)).records, 2);
  assert.equal((await inspect(orphanedScope)).mode, null);
  pass('Missing scope metadata cannot create an empty vault over orphaned keys/original ciphertext');

  await seed(damagedScope);
  await page.evaluate(async s => {
    const r = indexedDB.open('academyos-automatic-key-research-v1');
    const db = await new Promise(ok => r.onsuccess = () => ok(r.result));
    await new Promise((ok, no) => { const t = db.transaction('records', 'readwrite'), store = t.objectStore('records');
      const q = store.get([s, 'pending']); q.onsuccess = () => { const row = q.result;
        const bytes = new Uint8Array(row.cipher); bytes[0] ^= 1; store.put({...row, cipher: bytes.buffer}, [s, 'pending']); };
      t.oncomplete = ok; t.onabort = () => no(t.error); }); db.close();
  }, damagedScope);
  await assert.rejects(call(damagedScope, 'readPending'));
  assert.equal((await inspect(damagedScope)).records, 2);
  pass('Tampered authenticated ciphertext is refused without clearing the original');

  await use(parallelScope); await activate(parallelScope);
  const race = await page.evaluate(async ({s, op, replica, original}) => {
    const a = window.vaults[s], b = await window.openResearchVault(s, 'A');
    const r = await Promise.allSettled([a.capture(op, replica, original), b.capture(op, replica, original)]);
    b.close(); return r.map(x => x.status);
  }, {s: parallelScope, op: original.op, replica, original});
  assert.equal(race.filter(x => x === 'fulfilled').length, 1);
  assert.equal((await inspect(parallelScope)).records, 2);
  assert.deepEqual(await call(parallelScope, 'readPending'), original);
  pass('Competing storage connections commit one immutable pending capture without partial replica writes');

  await use(unavailableScope);
  const blocked = await page.evaluate(async s => {
    const old = IDBDatabase.prototype.transaction;
    IDBDatabase.prototype.transaction = function() { throw new DOMException('Synthetic blocked storage', 'QuotaExceededError'); };
    try { await window.vaults[s].beginActivation(); return false; } catch(e) { return e.name === 'QuotaExceededError'; }
    finally { IDBDatabase.prototype.transaction = old; }
  }, unavailableScope);
  assert.equal(blocked, true); assert.equal((await inspect(unavailableScope)).records, 0);
  pass('Storage failure is explicit without a plaintext or falsely acknowledged fallback; this is injected failure, not real disk exhaustion');

  assert.equal(await page.evaluate(() => window.credentialCalls), 0);
  assert.deepEqual(errors, []); assert.deepEqual(externalRequests, []);
  timings.sort((a, b) => a - b);
  const receipt = {date: new Date().toISOString(), scope: 'Isolated Chromium/WebCrypto/IndexedDB mechanism + fictional HTTP authority; NOT private app/Clerk/hosted/security proof',
    passed: true, checks, browser: browserVersion, node: process.version, platform: process.platform, arch: process.arch,
    data: {rosterPlayers: 18, selectedNewMarks: 17},
    metrics: {firstActivateCaptureMs: initialMs, localReadSamples: timings.length,
      localReadP50Ms: timings[Math.floor(timings.length * .5)], localReadP95Ms: timings[Math.floor(timings.length * .95)],
      coveredReadKeyExchanges: 0, keyExchanges: requests.length, allowed: requests.filter(r => r.allowed).length,
      denied: requests.filter(r => !r.allowed).length, credentialAPICalls: 0,
      initialReadAndPendingCiphertextBytes: disk.ciphertextBytes,
      keyResponseJsonBytes: requests.reduce((n, r) => n + r.responseBytes, 0)},
    errors, expectedHttp403ConsoleMessages: expectedDenials.length, externalRequests,
    hashes: {[sourcePath]: createHash('sha256').update(source).digest('hex'),
      'scripts/local-data/test_automatic_key.mjs': createHash('sha256').update(await readFile(new URL(import.meta.url))).digest('hex')},
    limitations: ['Fictional HTTP identity and in-memory key custody; no Clerk/current database/account proof',
      'Same-origin scripts before cleanup can use cached keys; no hardware/OS-keystore guarantee',
      'One read/pending research scope, not typed app repository/real register sync',
      'No real quota exhaustion, browser eviction, key rotation recovery or schema migration proof',
      '30-day cleanup invoked explicitly; trusted time/clock rollback integration remains',
      'Page assets served before offline; no hosted cold-offline boot/service worker',
      'No physical device/provider p75/p95 or Supabase/Redis cost measurement',
      'Not an independent security audit; private app enablement remains closed']};
  await mkdir(resolve(evidence, '..'), {recursive: true}); await writeFile(evidence, JSON.stringify(receipt, null, 2) + '\n');
  console.log(`PASS ${checks.length} automatic-key mechanism cases; no mandatory credential; 30 covered reads / 0 key exchanges`);
} catch (error) { failed = error; console.error(error); }
finally { await context?.close(); await new Promise(r => server.close(r)); await rm(profiles, {recursive: true, force: true}); }
if (failed) throw failed;
