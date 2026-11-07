'use client';

import {useEffect,useState,useSyncExternalStore} from 'react';
import PreparedRegisterPanel from './prepared-register-panel';
import {readRegisterAccount,subscribeRegisterAccount,REGISTER_ACCOUNT_KEY} from '@/lib/register-device-account';

function subscribe(listener:()=>void) {
  window.addEventListener('online',listener);
  window.addEventListener('offline',listener);
  window.addEventListener('hashchange',listener);
  const stop=subscribeRegisterAccount(listener);
  return ()=>{
    stop();
    window.removeEventListener('online',listener);
    window.removeEventListener('offline',listener);
    window.removeEventListener('hashchange',listener);
  };
}
function deviceSnapshot() {
  try {
    const locale=location.hash==='#ar'?'ar':'en';
    return JSON.stringify([locale,navigator.onLine,localStorage.getItem(REGISTER_ACCOUNT_KEY)]);
  } catch {return '["en",true,null]';}
}
const empty=()=>'["en",true,null]';
type OpenRegister={subject:string;generation:string;academy:string;event:string};

/** The public document never contains a principal, register ID or data. The
 * latest still-active personal-device scope comes only from local storage. */
export default function PreparedRegisterStartup() {
  const state=useSyncExternalStore(subscribe,deviceSnapshot,empty);
  const [locale,online,available]=JSON.parse(state) as ['en'|'ar',boolean,string|null];
  const [opened,setOpened]=useState<OpenRegister|null>(null);
  const ar=locale==='ar';
  let local:ReturnType<typeof readRegisterAccount>=null;
  if (available!==null) {
    try {local=readRegisterAccount();}
    catch {local=null;}
  }
  useEffect(()=>{
    if (online||opened||local?.mode!=='active'||!local.selection) return;
    const scope={subject:local.subject,generation:local.generation,...local.selection};
    let current=true;
    queueMicrotask(()=>{if(current)setOpened(scope);});
    return ()=>{current=false;};
  },[online,opened,local]);
  // Keep an open offline task on reconnect. The active generation must still match.
  const selected=opened&&local?.mode==='active'&&local.subject===opened.subject&&local.generation===opened.generation?opened:null;
  return <div className="public-task" lang={locale} dir={ar?'rtl':'ltr'}>
    <h1>{ar?'سجل الحضور المحضّر':'Prepared attendance register'}</h1>
    {online&&selected&&<p role="status">{ar?
      'عاد الاتصال. احفظ اختياراتك على هذا الجهاز، ثم افتح مساحة العمل للتحقّق من الصلاحية والمزامنة.':
      'Connection restored. Save your choices on this device, then open the workspace to verify access and sync.'}</p>}
    {selected?
      <PreparedRegisterPanel key={`${selected.generation}:${selected.event}`} locale={locale}
        scope={selected} offline offlineGeneration={selected.generation}/>:
      <p role="status">{ar?'افتح مساحة العمل بعد الاتصال للتحقّق من الصلاحية أو تحضير سجل.':
        'Open your workspace when connected to verify access or prepare a register.'}</p>}
    <p><a href={`/${locale}/workspace`}>{ar?'العودة إلى مساحة العمل':'Return to workspace'}</a></p>
  </div>;
}
