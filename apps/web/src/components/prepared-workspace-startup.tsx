'use client';

import {useEffect,useSyncExternalStore} from 'react';
import {readRegisterAccount,subscribeRegisterAccount} from '@/lib/register-device-account';
import {isCivilDay} from '@/lib/experience-format';
import {readWorkspaceSlot} from '@/lib/workspace-device-slots';
import {PeopleJourney} from './people-workspace';
import {ExperienceJourney} from './experience-workspace';

const pathPattern=/^\/(en|ar)\/workspace\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})\/(players|calendar)$/;
const opening=()=>'';
const reentryKey='academyos.workspace-reentry.v1';
function snapshot() {
  try {
    const match=pathPattern.exec(location.pathname);
    if(!match)return null;
    const [,locale,academy,view]=match;
    const account=readRegisterAccount();
    if(account?.mode!=='active')return JSON.stringify({locale});
    const context={subject:account.subject,academy};
    const slot=readWorkspaceSlot(context);
    if(slot?.mode!=='active')return JSON.stringify({locale});
    const anchor=new URLSearchParams(location.search).get('anchor');
    return JSON.stringify({locale,academy,view,subject:account.subject,generation:account.generation,
      anchor:isCivilDay(anchor)?anchor:undefined});
  } catch {return null;}
}
function subscribe(listener:()=>void) {
  const stop=subscribeRegisterAccount(listener);
  window.addEventListener('storage',listener);
  return ()=>{stop();window.removeEventListener('storage',listener);};
}

/** Public code and CSS only. The normal path plus the active device locator
 * selects encrypted data. A network return re-enters the protected same URL. */
export default function PreparedWorkspaceStartup() {
  const source=useSyncExternalStore(subscribe,snapshot,opening);
  const scope=source?JSON.parse(source) as {locale:string;academy?:string;view?:string;subject?:string;generation?:string;anchor?:string}:null;
  const locale=scope?.locale??'en',ar=locale==='ar';
  useEffect(()=>{
    if(!pathPattern.test(location.pathname))return;
    const destination=location.pathname+location.search;
    const disconnected=()=>{try{sessionStorage.removeItem(reentryKey);}catch{}};
    const reconnect=()=>{
      if(!navigator.onLine){disconnected();return;}
      // A connection can return before hydration attaches its listener. Try
      // once on mount too, without looping when the network remains unreachable.
      try {
        if(sessionStorage.getItem(reentryKey)===destination)return;
        sessionStorage.setItem(reentryKey,destination);
      } catch {return;}
      location.reload();
    };
    window.addEventListener('online',reconnect);
    window.addEventListener('offline',disconnected);
    reconnect();
    return()=>{
      window.removeEventListener('online',reconnect);
      window.removeEventListener('offline',disconnected);
    };
  },[]);
  if(source==='')return <main className="public-task" lang={locale} dir={ar?'rtl':'ltr'}>
    <p role="status">{ar?'جارٍ فتح مساحة العمل…':'Opening your workspace…'}</p>
  </main>;
  if(!scope?.subject||!scope.academy)return <main className="public-task" lang={locale} dir={ar?'rtl':'ltr'}>
    <h1>{ar?'مساحة الأكاديمية':'Academy workspace'}</h1>
    <p role="status">{ar?'لا توجد بيانات محضّرة لهذه المساحة على الجهاز. افتحها عند الاتصال.':
      'This workspace has no prepared data on this device. Open it when connected.'}</p>
  </main>;
  const common={locale,academy:scope.academy,subject:scope.subject,prepared:true,publicOffline:true};
  const key=`${scope.generation}:${scope.academy}:${scope.view}`;
  return scope.view==='players'?<PeopleJourney key={key} {...common}/>:
    <ExperienceJourney key={key} {...common} role="owner" calendar anchor={scope.anchor}/>;
}
