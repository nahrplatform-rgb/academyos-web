'use client';

import {createContext,useContext,type ReactNode} from 'react';
import {Button} from './ui/controls';

type RegisterAccount = {
  subject:string|null; allowed:boolean; controlled:boolean; signingOut:boolean;
  cleanupFailed:boolean; manage:()=>void; signOut:(locale:string)=>void;
};
export const RegisterAccountContext = createContext<RegisterAccount|null>(null);
export function useRegisterAccount() {return useContext(RegisterAccountContext);}

export function RegisterAccountControl({locale, children}:{locale:string;children:ReactNode}) {
  const account=useRegisterAccount(), ar=locale==='ar';
  if (!account?.controlled || !account.subject) return <div className="workspace-provider-account">{children}</div>;
  const label=ar?'الحساب':'Account';
  return <details className="layout-menu">
    <summary className="workspace-icon-button" aria-label={label} title={label}><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="3.5"/><path d="M5 20v-1.5a7 7 0 0 1 14 0V20"/></svg></summary>
    <div>
      <Button type="button" onClick={account.manage}>{ar?'إدارة الحساب':'Manage account'}</Button>
      <Button type="button" disabled={account.signingOut} onClick={()=>account.signOut(locale)}>
        {ar?'تسجيل الخروج':'Sign out'}
      </Button>
    </div>
  </details>;
}
