'use client';

import {useEffect,useSyncExternalStore} from 'react';
import {readRegisterAccount,subscribeRegisterAccount} from '@/lib/register-device-account';
import {isCivilDay} from '@/lib/experience-format';
import PreparedRegisterPanel from './prepared-register-panel';
import {readRegisterSlot} from '@/lib/register-device-slots';
import {readWorkspaceSlot} from '@/lib/workspace-device-slots';
import {PeopleJourney} from './people-workspace';
import {ExperienceJourney} from './experience-workspace';

const pathPattern=/^\/(en|ar)\/workspace\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})\/(players|calendar|attendance\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}))$/;
const opening=()=>'';
const reentryKey='academyos.workspace-reentry.v1';
function snapshot() {
  try {
    const match=pathPattern.exec(location.pathname);
    if(!match)return null;
    const [,locale,academy,destination,event]=match,view=event?'attendance':destination;
    if(event){const original=sessionStorage.getItem(`attendance:${readRegisterAccount()?.subject}:${academy}:${event}`);if(original&&/^[a-f0-9-]{36}$/i.test(original))return JSON.stringify({locale,original:true});}
    const account=readRegisterAccount();
    if(account?.mode!=='active')return JSON.stringify({locale});
    const context={subject:account.subject,academy};
    const slot=event?readRegisterSlot(account.subject,academy):readWorkspaceSlot(context);
    if(slot?.mode!=='active'||event&&'event' in slot&&slot.event!==event)return JSON.stringify({locale});
    const anchor=new URLSearchParams(location.search).get('anchor');
    return JSON.stringify({locale,academy,view,subject:account.subject,generation:account.generation,
      event,anchor:isCivilDay(anchor)?anchor:undefined});
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
  const scope=source?JSON.parse(source) as {locale:string;academy?:string;view?:string;subject?:string;generation?:string;event?:string;anchor?:string;original?:boolean}:null;
  const locale=scope?.locale??'en',ar=locale==='ar';
  useEffect(()=>{
    const match=pathPattern.exec(location.pathname);
    if(!match||match[4])return; // Attendance sync uses current signed API checks without reloading an open draft.
    const destination=location.pathname+location.search;
    let disposed=false,leaving=false,pending:AbortController|null=null;
    const cancel=()=>{pending?.abort();pending=null;};
    const disconnected=()=>{cancel();try{sessionStorage.removeItem(reentryKey);}catch{}};
    const departing=()=>{leaving=true;cancel();};
    const reconnect=()=>{
      if(!navigator.onLine){disconnected();return;}
      if(disposed||leaving||pending)return;
      // A connection can return before hydration attaches its listener. Try
      // on mount too. The browser's online flag alone does not prove that the
      // origin is reachable, and must not reload a usable offline document.
      try {
        if(sessionStorage.getItem(reentryKey)===destination)return;
      } catch {return;}
      const controller=new AbortController();pending=controller;
      const timer=setTimeout(()=>controller.abort(),3000);
      void fetch('/prepared-workspace',{method:'HEAD',credentials:'omit',cache:'no-store',
        redirect:'error',signal:controller.signal}).then(response=>{
        if(!response.ok||response.headers.get('x-academyos-public-shell')!=='workspace-v1'||
          controller.signal.aborted||disposed||leaving||!navigator.onLine||
          location.pathname+location.search!==destination)return;
        try{sessionStorage.setItem(reentryKey,destination);}catch{return;}
        location.reload();
      }).catch(()=>{}).finally(()=>{
        clearTimeout(timer);if(pending===controller)pending=null;
      });
    };
    window.addEventListener('online',reconnect);
    window.addEventListener('offline',disconnected);
    window.addEventListener('beforeunload',departing);
    reconnect();
    return()=>{
      disposed=true;cancel();
      window.removeEventListener('online',reconnect);
      window.removeEventListener('offline',disconnected);
      window.removeEventListener('beforeunload',departing);
    };
  },[]);
  if(source==='')return <main className="public-task" lang={locale} dir={ar?'rtl':'ltr'}>
    <p role="status">{ar?'جارٍ فتح مساحة العمل…':'Opening your workspace…'}</p>
  </main>;
  if(!scope?.subject||!scope.academy)return <main className="public-task" lang={locale} dir={ar?'rtl':'ltr'}>
    <h1>{ar?'مساحة الأكاديمية':'Academy workspace'}</h1>
    <p role="status">{scope?.original?(ar?'يوجد حفظ أصلي يحتاج التحقق عبر الإنترنت قبل تسجيل حضور آخر.':'An original save needs an online check before another attendance save.'):(ar?'لا توجد بيانات محضّرة لهذه المساحة على الجهاز. افتحها عند الاتصال.':
      'This workspace has no prepared data on this device. Open it when connected.')}</p>
    {scope?.original&&<a href={location.pathname+location.search}>{ar?'تحقق من الحفظ الأصلي عبر الإنترنت':'Check original save online'}</a>}
  </main>;
  const common={locale,academy:scope.academy,subject:scope.subject,prepared:true,publicOffline:true};
  const key=`${scope.generation}:${scope.academy}:${scope.view}`;
  if(scope.view==='attendance'&&scope.event)return <PreparedRegisterPanel key={`${key}:${scope.event}`}
    locale={locale} scope={{subject:scope.subject,academy:scope.academy,event:scope.event}} normal offline offlineGeneration={scope.generation}/>;
  return scope.view==='players'?<PeopleJourney key={key} {...common}/>:
    <ExperienceJourney key={key} {...common} role="owner" calendar anchor={scope.anchor}/>;
}
