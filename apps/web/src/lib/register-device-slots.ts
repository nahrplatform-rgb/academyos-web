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
function eventPrefix(subject: string) {return prefix(subject).replace('register-slot.v1:', 'register-slot.v2:');}
function eventKey(subject: string, academy: string, event: string) {
  return eventPrefix(subject)+identifier(academy)+':'+identifier(event);
}

export function registerSlotLock<T>(subject: string, academy: string, work: () => T | Promise<T>) {
  if (!navigator.locks) refuse('protected_storage_unavailable');
  return navigator.locks.request(slotKey(subject,academy),work);
}
function parseSlot(raw: string | null): RegisterSlot | null {
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
export function readRegisterSlot(subject: string, academy: string, event: string): RegisterSlot | null {
  const legacy=parseSlot(localStorage.getItem(slotKey(subject,academy)));
  const current=parseSlot(localStorage.getItem(eventKey(subject,academy,event)));
  if (current && current.event!==event) refuse('register_locator_invalid');
  if (legacy?.event===event && current) refuse('register_locator_ambiguous');
  return legacy?.event===event ? legacy : current;
}
export function writeRegisterSlot(subject: string, academy: string, slot: RegisterSlot) {
  const serialized=JSON.stringify(slot);
  const valid=parseSlot(serialized)!;
  const legacyKey=slotKey(subject,academy), currentKey=eventKey(subject,academy,valid.event);
  const legacy=parseSlot(localStorage.getItem(legacyKey));
  const current=parseSlot(localStorage.getItem(currentKey));
  if (current && current.event!==valid.event) refuse('register_locator_invalid');
  if (legacy?.event===valid.event && current) refuse('register_locator_ambiguous');
  const key=legacy?.event===valid.event ? legacyKey : currentKey;
  localStorage.setItem(key,serialized);
  window.dispatchEvent(new Event(currentKey));
}

/** Caller holds the slot lock. Keep the locator and original until recovery. */
export async function cleanRegisterSlot(subject: string, academy: string, slot: RegisterSlot, reason: RegisterCleanup) {
  return cleanSlot(subject,academy,slot,reason,writeRegisterSlot);
}
async function cleanSlot(subject: string, academy: string, slot: RegisterSlot, reason: RegisterCleanup,
  write: (subject:string,academy:string,slot:RegisterSlot)=>void) {
  const cleaning = {...slot, mode:'cleaning' as const, generation:slot.generation+1};
  let markerFailed = false;
  try {write(subject,academy,cleaning);} catch {markerFailed=true;}
  if (slot.namespace) {
    const repo = await openLocalRegister({environment:'staging',subject,academy,device:slot.device,
      namespace:slot.namespace,epoch:'fields_v1',capability:'owner-register-v1'});
    try {await repo.quarantine(reason);}
    finally {repo.dispose();}
  }
  if (markerFailed) refuse('register_locator_unavailable');
  write(subject,academy,{...cleaning,mode:'sealed'});
}

export async function cleanRegisterAccountSlots(subject: string, onlyInterrupted = false) {
  const stem = prefix(subject), v2stem=eventPrefix(subject), academies = new Set<string>();
  let failed = false;
  for (let index=0;index<localStorage.length;index++) {
    const key = localStorage.key(index);
    try {
      if (key?.startsWith(stem)) academies.add(identifier(key.slice(stem.length)));
      if (key?.startsWith(v2stem)) {
        const parts=key.slice(v2stem.length).split(':');
        if (parts.length!==2) refuse('register_locator_invalid');
        academies.add(identifier(parts[0])); identifier(parts[1]);
      }
    } catch {failed=true;}
  }
  // Finish independent slots even if one cleanup fails. Keep the account masked.
  for (const academy of academies) {
    try {
      await registerSlotLock(subject,academy,async () => {
        const events=new Set<string>();
        let malformedLegacy=false;
        try {const legacy=parseSlot(localStorage.getItem(slotKey(subject,academy))); if (legacy) events.add(legacy.event);} catch {failed=true;malformedLegacy=true;}
        const academyStem=v2stem+academy+':';
        for(let index=0;index<localStorage.length;index++) {
          const key=localStorage.key(index);
          if(key?.startsWith(academyStem)) {
            try {events.add(identifier(key.slice(academyStem.length)));} catch {failed=true;}
          }
        }
        for(const event of events) {
          try {
            const key=eventKey(subject,academy,event);
            const slot=malformedLegacy ? parseSlot(localStorage.getItem(key)) : readRegisterSlot(subject,academy,event);
            if(slot && slot.event!==event) refuse('register_locator_invalid');
            if (slot && slot.mode !== 'sealed' && (!onlyInterrupted || slot.mode==='cleaning')) {
              if(malformedLegacy) await cleanSlot(subject,academy,slot,'logout',(_subject,_academy,value)=>{
                localStorage.setItem(key,JSON.stringify(value)); window.dispatchEvent(new Event(key));
              });
              else await cleanRegisterSlot(subject,academy,slot,'logout');
            }
          } catch {failed=true;}
        }
      });
    } catch {failed=true;}
  }
  if (failed) refuse('register_account_cleanup_incomplete');
}

export function subscribeRegisterSlot(subject:string,academy:string,event:string,listener:()=>void) {
  const key=eventKey(subject,academy,event), legacyKey=slotKey(subject,academy);
  const storage=(change:StorageEvent)=>{
    if(change.key===key||change.key===null)listener();
    else if(change.key===legacyKey) {
      try {if(parseSlot(change.oldValue)?.event===event||parseSlot(change.newValue)?.event===event)listener();}
      catch {listener();}
    }
  };
  window.addEventListener('storage',storage);
  window.addEventListener(key,listener);
  return ()=>{
    window.removeEventListener('storage',storage);
    window.removeEventListener(key,listener);
  };
}
