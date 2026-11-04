/** Inactive lifecycle for the approved personal-device register. The future
 * workspace owns the verified subject, lifetime and immediate UI masking. */
import {openLocalRegister, type LocalRegisterRepository, type RegisterScope, type RecoveryTicket} from './local-register-repository';
import {registerDownloadCoordinator} from './register-download-coordinator';
import {registerOriginalDispatch} from './register-original-dispatch';
import {registerScopeHeaders} from './register-scope-transport';
import {identifier, record, refuse} from './local-register-codec';
import {readRegisterSlot, writeRegisterSlot, registerSlotLock, cleanRegisterSlot,
  type RegisterSlot, type RegisterCleanup, type RegisterContext} from './register-device-slots';

class RegisterAuthorityLoss extends Error {
  constructor(readonly reason: 'withdrawn' | 'scope_lost') {super(reason);}
}

async function post(path: string, body: unknown, signal: AbortSignal, scope?: RegisterScope) {
  const response = await fetch(path, {method:'POST', body:JSON.stringify(body), signal,
    credentials:'same-origin', cache:'no-store', redirect:'error',
    headers:{'content-type':'application/json', ...(scope ? registerScopeHeaders(scope) : {})}});
  const limit = path === '/api/register-key' ? 2048 : 32768 + 32;
  const reader = response.body?.getReader();
  if (!reader || Number(response.headers.get('content-length')) > limit) {
    await reader?.cancel();
    refuse('register_response_invalid');
  }
  const bytes = new Uint8Array(limit);
  let size = 0;
  for (;;) {
    const {done,value} = await reader.read();
    if (done) break;
    if (size + value.length > limit) {await reader.cancel(); refuse('register_response_invalid');}
    bytes.set(value,size);
    size += value.length;
  }
  signal.throwIfAborted();
  const reply = record(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes.subarray(0,size))));
  if (Object.keys(reply).length !== 1) refuse('register_response_invalid');
  if (response.status === 410 && reply.error === 'withdrawn') throw new RegisterAuthorityLoss('withdrawn');
  if ((response.status === 401 || response.status === 403) &&
      (reply.error === 'denied' || reply.error === 'account_changed')) throw new RegisterAuthorityLoss('scope_lost');
  if (!response.ok || !('data' in reply)) refuse('register_unavailable');
  return reply.data;
}

export function ownerRegisterPilot(input: RegisterContext, scopeSignal: AbortSignal, assertAccount = () => {}) {
  const ended = new AbortController(), lifetime = AbortSignal.any([scopeSignal,ended.signal]);
  const {subject, academy, event} = {...input};
  identifier(academy); identifier(event);
  if (!/^user_[a-zA-Z0-9_]{1,120}$/.test(subject)) refuse('invalid_scope');
  if (!navigator.locks) refuse('protected_storage_unavailable');
  const underLock = <T>(work: () => T | Promise<T>) => registerSlotLock(subject,academy,work);
  const load = () => readRegisterSlot(subject,academy);
  const save = (slot: RegisterSlot) => writeRegisterSlot(subject,academy,slot);
  function scopeOf(slot: RegisterSlot): RegisterScope {
    return {environment:'staging', subject, academy, device:slot.device,
      namespace:identifier(slot.namespace), epoch:'fields_v1', capability:'owner-register-v1'};
  }
  function current(slot: RegisterSlot) {
    lifetime.throwIfAborted();
    assertAccount();
    const stored = load();
    if (!stored || stored.generation !== slot.generation || stored.mode !== slot.mode ||
        stored.device !== slot.device || stored.event !== slot.event || stored.namespace !== slot.namespace) refuse('scope_changed');
  }
  const clean = (slot: RegisterSlot, reason: RegisterCleanup) => cleanRegisterSlot(subject,academy,slot,reason);
  async function lose(slot: RegisterSlot, reason: RegisterCleanup) {
    await underLock(async () => {
      current(slot);
      await clean(slot,reason);
    });
  }
  async function activation(recover: boolean) {
    const slot = await underLock(async () => {
      lifetime.throwIfAborted();
      assertAccount();
      let existing = load();
      if (existing && existing.event !== event) refuse('different_registered_event');
      if (existing?.mode === 'cleaning') {
        await clean(existing,'known_denial');
        existing = load();
      }
      if (!recover && existing?.mode === 'active') return existing;
      if (recover && !existing?.namespace) refuse('register_not_prepared');
      const pending: RegisterSlot = existing ?
        {...existing, generation:existing.generation + 1, mode:'reserved'} :
        {device:crypto.randomUUID(), event, namespace:null, generation:1, mode:'reserved'};
      assertAccount();
      save(pending);
      return pending;
    });
    if (slot.mode === 'active') return slot;
    const recoverScope = slot.namespace ? {action:'recover',namespace:slot.namespace} : {action:'prepare'};
    let grant: Record<string,unknown>;
    try {
      grant = record(await post('/api/register-key',{subject,academy,event,device:slot.device,...recoverScope},
        AbortSignal.any([lifetime,AbortSignal.timeout(20000)])));
    } catch (error) {
      if (error instanceof RegisterAuthorityLoss) await lose(slot,'known_denial');
      throw error;
    }
    return underLock(async () => {
      current(slot);
      const granted = record(grant.scope);
      const namespace = identifier(granted.namespace);
      const reservation = {...slot, namespace};
      const scope = scopeOf(reservation);
      if (grant.event !== event || slot.namespace && slot.namespace !== namespace ||
          Object.keys(granted).length !== Object.keys(scope).length ||
          Object.entries(scope).some(([key,value])=>granted[key]!==value)) refuse('key_ticket_mismatch');
      // Persist the locator before activation so a crash or logout can still find
      // the original namespace. The material is never written to this locator.
      save(reservation);
      const repo = await openLocalRegister(scope);
      try {
        await repo.activate(record(grant.ticket) as RecoveryTicket,await repo.beginActivation(),lifetime);
        current(reservation);
        const active = {...reservation, mode:'active' as const};
        save(active);
        return active;
      } finally {repo.dispose();}
    });
  }
  async function operate<T>(work: (repo: LocalRegisterRepository, scope: RegisterScope, fence: number, slotGeneration:number)=>Promise<T>) {
    lifetime.throwIfAborted();
    assertAccount();
    const slot = load();
    if (!slot || slot.event !== event || slot.mode !== 'active') refuse('account_verification_required');
    const scope = scopeOf(slot), repo = await openLocalRegister(scope);
    try {
      current(slot);
      const access = await repo.checkReplicaAccess();
      current(slot);
      if (access.state === 'expired') {await lose(slot,'thirty_days'); refuse('account_verification_required');}
      if (access.state === 'verify_online') refuse('clock_verification_required');
      const result = await work(repo,scope,access.fence,slot.generation);
      current(slot);
      return result;
    } catch (error) {
      if (error instanceof RegisterAuthorityLoss) await lose(slot,'known_denial');
      throw error;
    } finally {repo.dispose();}
  }
  let preparing: ReturnType<typeof prepare> | undefined;
  let syncing: ReturnType<typeof sync> | undefined;
  async function prepare() {
    await activation(false);
    return operate(async (repo,scope,fence) => {
      const result = await registerDownloadCoordinator(repo,academy,(command,signal)=>
        post('/api/register-download',command,AbortSignal.any([signal,AbortSignal.timeout(20000)]),scope),lifetime).prepare(event);
      await repo.noteReplicaVerification(result.verifiedAt,fence);
      return result.kind;
    });
  }
  async function sync() {
    return operate(async repo => {
      const result = await registerOriginalDispatch(repo,lifetime)(event);
      if (result.kind === 'withdrawn' || result.kind === 'scope_lost') throw new RegisterAuthorityLoss(result.kind);
      if (result.kind === 'needs_review' && result.refusal === 'denied') throw new RegisterAuthorityLoss('scope_lost');
      return result;
    });
  }
  return {
    prepare: () => preparing ??= prepare().finally(()=>{preparing=undefined;}),
    recover: async () => {await activation(true);},
    read: (after?:string) => operate(async (repo,_scope,_fence,slotGeneration) => {
      const original = await repo.readActiveOriginal(event);
      const page = await repo.readPage(event,after).catch((error: unknown) => {
        if (error instanceof Error && error.message === 'not_downloaded') return null;
        throw error;
      });
      return {original,page,slotGeneration};
    }),
    capture: (op: string, captured_at: string, marks: unknown) => operate(repo =>
      repo.captureRegister({action:'register',academy,event,op,captured_at,marks})),
    sync: () => syncing ??= sync().finally(()=>{syncing=undefined;}),
    logout: () => {
      ended.abort();
      return underLock(async () => {
        const slot = load();
        if (slot) await clean(slot,'logout');
      });
    },
  };
}
