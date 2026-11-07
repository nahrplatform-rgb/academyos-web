import {openLocalRegister} from './local-register-repository';
import {identifier, record, refuse} from './local-register-codec';

export type RegisterContext = {subject: string; academy: string; event: string};
export type RegisterSlot = {device: string; event: string; namespace: string | null; generation: number;
  mode: 'reserved' | 'active' | 'sealed' | 'cleaning'};
export type RegisterCleanup = 'logout' | 'thirty_days' | 'known_denial';

function prefix(subject: string) {
  if (!/^user_[a-zA-Z0-9_]{1,120}$/.test(subject)) refuse('invalid_scope');
  return `academyos.register-slot.v1:${subject}:`;
}
function slotKey(subject: string, academy: string) {return prefix(subject)+identifier(academy);}

export function registerSlotLock<T>(subject: string, academy: string, work: () => T | Promise<T>) {
  if (!navigator.locks) refuse('protected_storage_unavailable');
  return navigator.locks.request(slotKey(subject,academy),work);
}
export function readRegisterSlot(subject: string, academy: string): RegisterSlot | null {
  const raw = localStorage.getItem(slotKey(subject,academy));
  if (raw === null) return null;
  const v = record(JSON.parse(raw));
  if (Object.keys(v).sort().join(',') !== 'device,event,generation,mode,namespace' ||
      !Number.isSafeInteger(v.generation) || Number(v.generation)<1 ||
      !['reserved','active','sealed','cleaning'].includes(String(v.mode))) refuse('register_locator_invalid');
  identifier(v.device); identifier(v.event);
  if (v.namespace !== null) identifier(v.namespace);
  if (v.mode === 'active' && v.namespace === null) refuse('register_locator_invalid');
  return v as RegisterSlot;
}
export function writeRegisterSlot(subject: string, academy: string, slot: RegisterSlot) {
  const key=slotKey(subject,academy);
  localStorage.setItem(key,JSON.stringify(slot));
  window.dispatchEvent(new Event(key));
}

/** Caller holds the slot lock. Keep the locator and original until recovery. */
export async function cleanRegisterSlot(subject: string, academy: string, slot: RegisterSlot, reason: RegisterCleanup) {
  const cleaning = {...slot, mode:'cleaning' as const, generation:slot.generation+1};
  let markerFailed = false;
  try {writeRegisterSlot(subject,academy,cleaning);} catch {markerFailed=true;}
  if (slot.namespace) {
    const repo = await openLocalRegister({environment:'staging',subject,academy,device:slot.device,
      namespace:slot.namespace,epoch:'fields_v1',capability:'owner-register-v1'});
    try {await repo.quarantine(reason);}
    finally {repo.dispose();}
  }
  if (markerFailed) refuse('register_locator_unavailable');
  writeRegisterSlot(subject,academy,{...cleaning,mode:'sealed'});
}

export async function cleanRegisterAccountSlots(subject: string, onlyInterrupted = false) {
  const stem = prefix(subject), academies = [];
  for (let index=0;index<localStorage.length;index++) {
    const key = localStorage.key(index);
    if (key?.startsWith(stem)) academies.push(identifier(key.slice(stem.length)));
  }
  let failed = false;
  // Finish independent slots even if one cleanup fails. Keep the account masked.
  for (const academy of academies) {
    try {
      await registerSlotLock(subject,academy,async () => {
        const slot = readRegisterSlot(subject,academy);
        if (slot && slot.mode !== 'sealed' && (!onlyInterrupted || slot.mode==='cleaning')) {
          await cleanRegisterSlot(subject,academy,slot,'logout');
        }
      });
    } catch {failed=true;}
  }
  if (failed) refuse('register_account_cleanup_incomplete');
}

export function subscribeRegisterSlot(subject:string,academy:string,listener:()=>void) {
  const key=slotKey(subject,academy);
  const storage=(event:StorageEvent)=>{if(event.key===key||event.key===null)listener();};
  window.addEventListener('storage',storage);
  window.addEventListener(key,listener);
  return ()=>{
    window.removeEventListener('storage',storage);
    window.removeEventListener(key,listener);
  };
}
