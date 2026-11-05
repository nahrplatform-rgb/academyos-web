import {cleanRegisterAccountSlots, type RegisterContext} from './register-device-slots';
import {cleanWorkspaceAccountSlots} from './workspace-device-slots';
import {identifier, record, refuse} from './local-register-codec';

export const REGISTER_ACCOUNT_KEY = 'academyos.register-account.v1';
export const REGISTER_DRAFT_EXIT_EVENT='academyos:register-draft-exit';
export const REGISTER_ACCOUNT_EVENT = 'academyos:prepared-account-changed';
type Account = {subject:string; generation:string; mode:'active'|'ending'; selection:{academy:string;event:string}|null};

export function readRegisterAccount(): Account | null {
  const raw = localStorage.getItem(REGISTER_ACCOUNT_KEY);
  if (!raw) return null;
  const state = record(JSON.parse(raw));
  if (Object.keys(state).sort().join(',')!=='generation,mode,selection,subject' ||
      typeof state.subject!=='string'||!/^user_[a-zA-Z0-9_]{1,120}$/.test(state.subject) ||
      !['active','ending'].includes(String(state.mode))) refuse('register_account_invalid');
  identifier(state.generation);
  if (state.selection!==null) {
    const selection=record(state.selection);
    if (Object.keys(selection).sort().join(',')!=='academy,event') refuse('register_account_invalid');
    identifier(selection.academy);identifier(selection.event);
  }
  return state as Account;
}
function update(account: Account | null) {
  if (account) localStorage.setItem(REGISTER_ACCOUNT_KEY,JSON.stringify(account));
  else localStorage.removeItem(REGISTER_ACCOUNT_KEY);
  window.dispatchEvent(new Event(REGISTER_ACCOUNT_EVENT));
}
function lock<T>(work: () => T | Promise<T>) {
  if (!navigator.locks) refuse('protected_storage_unavailable');
  return navigator.locks.request(REGISTER_ACCOUNT_KEY,work);
}
export function subscribeRegisterAccount(listener: () => void) {
  const storage = (event: StorageEvent) => {if (event.key===REGISTER_ACCOUNT_KEY || event.key===null) listener();};
  window.addEventListener('storage',storage);
  window.addEventListener(REGISTER_ACCOUNT_EVENT,listener);
  return () => {
    window.removeEventListener('storage',storage);
    window.removeEventListener(REGISTER_ACCOUNT_EVENT,listener);
  };
}

export function armRegisterAccount(subject: string) {
  return lock(() => {
    const account=readRegisterAccount();
    if (account && (account.subject!==subject || account.mode!=='active')) refuse('register_account_cleanup_required');
    if (account) return account.generation;
    const generation=crypto.randomUUID();
    update({subject,generation,mode:'active',selection:null});
    return generation;
  });
}
export function requireRegisterAccount(subject:string,generation:string) {
  const account=readRegisterAccount();
  if (!account || account.subject!==subject || account.generation!==generation || account.mode!=='active')
    refuse('scope_changed');
  return account;
}
export function rememberPreparedRegister(context:RegisterContext,generation:string) {
  return lock(() => {
    const account=requireRegisterAccount(context.subject,generation);
    update({...account,selection:{academy:context.academy,event:context.event}});
  });
}

/** Capability rollback leaves the shared account and other capability intact.
 * Slot cleanup fences held work before removing reads; register originals keep
 * the same protected recovery path used by logout. */
export function clearDisabledPreparedCapabilities(subject:string,
  enabled:{register:boolean;workspace:boolean}, onlyIfCurrent:()=>boolean) {
  return lock(async()=>{
    if(!onlyIfCurrent())return false;
    const account=readRegisterAccount();
    if(!account || account.subject!==subject || account.mode!=='active')return false;
    const cleanup=await Promise.allSettled([
      cleanRegisterAccountSlots(subject,enabled.register),
      cleanWorkspaceAccountSlots(subject,enabled.workspace),
    ]);
    if(cleanup.some(result=>result.status==='rejected'))refuse('prepared_capability_cleanup_incomplete');
    return true;
  });
}
export function clearRegisterAccount(subject:string, finish?:()=>Promise<unknown>, onlyIfDeparted?:()=>boolean) {
  return lock(async () => {
    if (onlyIfDeparted && !onlyIfDeparted()) return;
    const account=readRegisterAccount();
    if (account && account.subject!==subject) {
      if (finish) refuse('scope_changed');
      return;
    }
    // Fence first so tabs and a cold offline shell mask all of this account.
    update({subject,generation:crypto.randomUUID(),mode:'ending',selection:null});
    const cleanup = await Promise.allSettled([
      cleanRegisterAccountSlots(subject),
      cleanWorkspaceAccountSlots(subject),
    ]);
    if (cleanup.some(result => result.status === 'rejected')) refuse('prepared_account_cleanup_incomplete');
    if (finish) await finish();
    update(null);
  });
}
