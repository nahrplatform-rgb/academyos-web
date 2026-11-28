'use client';

import {useCallback,useEffect,useRef,useState,useSyncExternalStore,type ReactNode} from 'react';
import {useClerk,useUser} from '@clerk/nextjs';
import {Button} from './ui/controls';
import {RegisterAccountContext} from './register-account-context';
import {clearDisabledPreparedCapabilities,clearRegisterAccount,readRegisterAccount,REGISTER_ACCOUNT_KEY,REGISTER_DRAFT_EXIT_EVENT,subscribeRegisterAccount} from '@/lib/register-device-account';

function snapshot() {
  try {return localStorage.getItem(REGISTER_ACCOUNT_KEY) ?? '';}
  catch {return null;}
}
const serverSnapshot=()=>'' as string|null;

/** Only a loaded Clerk account enters the protected lifecycle. A failed cleanup
 * leaves the account marker fenced and the provider session available to retry. */
export default function RegisterAccountBoundary({enabled,workspaceEnabled=false,locale,children}:{enabled:boolean;workspaceEnabled?:boolean;locale:string;children:ReactNode}) {
  const {isLoaded,user}=useUser(), {signOut,openUserProfile}=useClerk();
  const subject=isLoaded?user?.id??null:null;
  const source=useSyncExternalStore(subscribeRegisterAccount,snapshot,serverSnapshot);
  let local:ReturnType<typeof readRegisterAccount>=null, invalid=false;
  if (source) {
    try {local=readRegisterAccount();}
    catch {invalid=true;}
  }
  const [signingOut,setSigningOut]=useState(false), [cleanupFailed,setCleanupFailed]=useState(false);
  const guard=useRef(false), current=useRef(subject), capabilities=useRef({register:enabled,workspace:workspaceEnabled});
  const anyEnabled=enabled||workspaceEnabled;
  const localSubject=local?.subject, mode=local?.mode;
  const cleanupDisabled=useCallback(()=>{
    const expected=capabilities.current;
    const stillCurrent=()=>!guard.current&&current.current===localSubject&&capabilities.current===expected;
    if(!localSubject)return;
    void clearDisabledPreparedCapabilities(localSubject,expected,stillCurrent).then(cleared=>{
      if(cleared&&stillCurrent())setCleanupFailed(false);
    },()=>{if(stillCurrent())setCleanupFailed(true);});
  },[localSubject]);
  useEffect(()=>{
    current.current=subject;
    capabilities.current={register:enabled,workspace:workspaceEnabled};
    if (!isLoaded || !localSubject || guard.current) return;
    if (localSubject===subject && anyEnabled) {
      cleanupDisabled();
      return;
    }
    const departed=()=>!capabilities.current.register&&!capabilities.current.workspace || current.current!==localSubject;
    void clearRegisterAccount(localSubject,undefined,departed).catch(()=>setCleanupFailed(true));
    // Storage mode changes inside cleanup must not launch another cleanup.
  },[anyEnabled,enabled,workspaceEnabled,isLoaded,localSubject,subject,cleanupDisabled]);

  async function leave(locale:string) {
    if (!subject||guard.current||!window.dispatchEvent(new Event(REGISTER_DRAFT_EXIT_EVENT,{cancelable:true}))) return;
    guard.current=true;
    setSigningOut(true);
    setCleanupFailed(false);
    try {
      if (localSubject || navigator.locks) {
        // Recheck inside the shared lock, including a first prepare racing sign-out.
        if (localSubject && localSubject!==subject) throw new Error('scope_changed');
        await clearRegisterAccount(subject,async () => {
          if (current.current!==subject) throw new Error('scope_changed');
          await signOut();
        });
      } else await signOut();
      window.location.assign(locale==='ar'?'/ar':'/en');
    } catch {
      setCleanupFailed(true);
    } finally {guard.current=false;setSigningOut(false);}
  }
  const ar=locale==='ar', departed=Boolean(localSubject && localSubject!==subject && isLoaded);
  if (signingOut||mode==='ending'||departed||cleanupFailed) return <main className="public-task" lang={locale} dir={ar?'rtl':'ltr'}>
    <h1>{ar?'مسح التنزيلات':'Clearing downloads'}</h1>
    {cleanupFailed||mode==='ending'&&!signingOut?
      <><p role="alert">{ar?'لم يكتمل مسح التنزيلات. يبقى العمل المعلّق محمياً.':
        'Downloads could not be cleared. Pending work remains protected.'}</p>
        <Button type="button" onClick={()=>{
          if(departed&&localSubject)void clearRegisterAccount(localSubject).then(()=>setCleanupFailed(false),()=>setCleanupFailed(true));
          else if(anyEnabled&&mode==='active')cleanupDisabled();
          else void leave(locale);
        }}>{ar?'أعد المحاولة':'Retry cleanup'}</Button></>:
      <p role="status">{ar?'جارٍ إخفاء البيانات المحضّرة لهذا الحساب.':'Prepared data is hidden while this account is cleared.'}</p>}
  </main>;
  return <RegisterAccountContext value={{subject, signingOut, cleanupFailed,
    controlled:(anyEnabled&&source!==null)||Boolean(localSubject),
    allowed:anyEnabled&&isLoaded&&!!subject&&source!==null&&!invalid&&!signingOut&&
      (!local || local.subject===subject&&mode==='active'),
    manage:()=>openUserProfile(),signOut:locale=>void leave(locale)}}>{children}</RegisterAccountContext>;
}
