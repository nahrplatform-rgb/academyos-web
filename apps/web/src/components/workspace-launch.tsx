'use client';

import {useEffect,type ReactNode} from 'react';
import {readWorkspaceLaunch} from '@/lib/workspace-launch';

/** Online subject comes from current server authentication. Offline hints only
 * select an existing public task shell; its account/slot/data fences still run. */
export default function WorkspaceLaunch({locale,subject=null,enabled=true,offline=false,children}:{
  locale:string;subject?:string|null;enabled?:boolean;offline?:boolean;children?:ReactNode;
}) {
  useEffect(()=>{
    if(!enabled||!offline&&!subject)return;
    const target=readWorkspaceLaunch(offline?undefined:subject!);
    if(target)location.replace(target);
    else if(!offline)location.replace(`/${locale}/workspace`);
  },[enabled,locale,offline,subject]);
  if(!offline)return children;
  const ar=locale==='ar';
  return <main className="public-task" lang={locale} dir={ar?'rtl':'ltr'}>
    <h1>{ar?'مساحة الأكاديمية':'Academy workspace'}</h1>
    <p role="status">{ar?'افتح مساحتك المحضّرة إن كانت متاحة. إذا لم تُفتح، اتصل بالإنترنت وسجّل الدخول لتحضيرها على هذا الجهاز.':
      'Opening your prepared workspace when available. If it does not open, connect and sign in to prepare it on this device.'}</p>
    <a href={`/${locale}/sign-in`}>{ar?'تسجيل الدخول عند الاتصال':'Sign in when connected'}</a>
  </main>;
}
