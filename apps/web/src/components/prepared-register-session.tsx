'use client';

import {ClerkProvider,useAuth} from '@clerk/nextjs';
import {useCallback,useEffect,useRef,useState,type ReactNode} from 'react';
import {clearRegisterAccount,readRegisterAccount,requireRegisterAccount} from '@/lib/register-device-account';
import {RegisterSessionContext,type RegisterSessionCheck} from '@/lib/register-session';

type Auth=ReturnType<typeof useAuth>;

function Session({report}:{report:(auth:Auth)=>void}) {
  const auth=useAuth();
  useEffect(()=>{report(auth);},[auth,report]);
  return null;
}

/** Load ordinary sign-in only when the public task needs an online operation.
 * The provider is a sibling: loading it never remounts the offline register.
 * No authenticated HTML, token or key is put in the public worker cache. */
export default function PreparedRegisterSession({subject,generation,children}:{
  subject:string;generation:string;children:ReactNode;
}) {
  const [requested,setRequested]=useState(0);
  const latest=useRef<Auth|null>(null),waiters=useRef(new Set<(auth:Auth)=>void>());
  const active=useRef<Promise<void>|null>(null);
  const alive=useRef(true);
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;latest.current=null;};},[]);
  const report=useCallback((auth:Auth)=>{
    latest.current=auth;
    if(!auth.isLoaded)return;
    for(const ready of waiters.current)ready(auth);
    // A loaded different account is positive identity-change evidence. A
    // missing/expired session alone never means the Owner role was revoked.
    if(auth.userId&&auth.userId!==subject){
      void clearRegisterAccount(subject,undefined,()=>{
        const local=readRegisterAccount();
        return alive.current&&latest.current?.isLoaded===true&&!!latest.current.userId&&
          latest.current.userId!==subject&&local?.subject===subject&&local.generation===generation;
      }).catch(()=>{}); // Cleanup fences first; its existing ending state owns recovery.
    }
  },[subject,generation]);
  const check=useCallback<RegisterSessionCheck>(async(refresh,signal)=>{
    signal.throwIfAborted();
    requireRegisterAccount(subject,generation);
    if(!navigator.onLine)throw new Error('authentication_unavailable');
    const key=process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    if(!key)throw new Error('authentication_unavailable');
    if(!active.current){
      const task=(async()=>{
        // An explicit retry after initial SDK loading failed may recreate only
        // the sibling provider. The roster and its operation lifetime stay put.
        if(!latest.current?.isLoaded)setRequested(value=>value+1);
        const bounded=AbortSignal.any([signal,AbortSignal.timeout(15000)]);
        const auth=latest.current?.isLoaded?latest.current:await new Promise<Auth>((resolve,reject)=>{
          const finish=(auth?:Auth)=>{
            waiters.current.delete(ready);bounded.removeEventListener('abort',aborted);
            if(auth)resolve(auth);else reject(new Error('authentication_unavailable'));
          };
          const ready=(auth:Auth)=>finish(auth),aborted=()=>finish();
          waiters.current.add(ready);bounded.addEventListener('abort',aborted,{once:true});
          if(bounded.aborted)aborted();
        });
        bounded.throwIfAborted();requireRegisterAccount(subject,generation);
        if(auth.userId&&auth.userId!==subject)throw new Error('scope_changed');
        if(!auth.userId)throw new Error('authentication_required');
        // The SDK renews its ordinary same-origin cookie. Discard the returned
        // token; neither this component nor the offline engine persists it.
        let token:string|null,cleanupTokenWait:(()=>void)|undefined;
        try{
          token=await Promise.race([auth.getToken({skipCache:refresh}),new Promise<never>((_,reject)=>{
            const aborted=()=>reject(new Error('authentication_unavailable'));
            bounded.addEventListener('abort',aborted,{once:true});
            // Removed below when the SDK promise settles; no polling/retry timer.
            cleanupTokenWait=()=>bounded.removeEventListener('abort',aborted);
          })]);
        }catch{throw new Error('authentication_unavailable');}
        finally{cleanupTokenWait?.();}
        bounded.throwIfAborted();requireRegisterAccount(subject,generation);
        if(latest.current?.userId&&latest.current.userId!==subject)throw new Error('scope_changed');
        if(!token)throw new Error('authentication_required');
      })();
      active.current=task.finally(()=>{active.current=null;});
    }
    await active.current;
    signal.throwIfAborted();requireRegisterAccount(subject,generation);
  },[subject,generation]);
  return <><RegisterSessionContext value={check}>{children}</RegisterSessionContext>
    {requested>0&&<ClerkProvider key={requested}><Session report={report}/></ClerkProvider>}</>;
}
