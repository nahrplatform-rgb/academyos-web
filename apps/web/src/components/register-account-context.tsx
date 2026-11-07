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
  if (!account?.controlled || !account.subject) return children;
  return <details className="layout-menu">
    <summary>{ar?'الحساب':'Account'}</summary>
    <div>
      <Button type="button" onClick={account.manage}>{ar?'إدارة الحساب':'Manage account'}</Button>
      <Button type="button" disabled={account.signingOut} onClick={()=>account.signOut(locale)}>
        {ar?'تسجيل الخروج':'Sign out'}
      </Button>
    </div>
  </details>;
}
