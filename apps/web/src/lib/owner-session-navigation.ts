import {useSyncExternalStore} from 'react';
import {isCivilDay} from './experience-format';

type OwnerSessionSource = {returnTo:'home'|'calendar';from?:string};

export function ownerSessionReturn(locale:string,academy:string,source?:OwnerSessionSource) {
  if(!source)return null;
  const calendar=source.returnTo==='calendar';
  return {
    href:`/${locale}/workspace/${academy}/${source.returnTo}`,
    label:locale==='ar'?(calendar?'العودة إلى التقويم':'العودة إلى اليوم'):(calendar?'Back to calendar':'Back to Today'),
  };
}

export function ownerSessionSourceSuffix(prefix:'?'|'#',source?:OwnerSessionSource) {
  if(!source)return '';
  const {from,returnTo}=source;
  return `${prefix}${isCivilDay(from)?`from=${from}&`:''}return=${returnTo}`;
}

function subscribe(listener:()=>void) {
  window.addEventListener('hashchange',listener);
  window.addEventListener('popstate',listener);
  return ()=>{
    window.removeEventListener('hashchange',listener);
    window.removeEventListener('popstate',listener);
  };
}

/** A fragment preserves the offline route and carries no authority or record identifiers. */
export function useOwnerSessionSource():OwnerSessionSource|undefined {
  const fragment=useSyncExternalStore(subscribe,()=>window.location.hash,()=>'');
  const query=new URLSearchParams(fragment.slice(1));
  const returnTo=query.get('return');
  if(returnTo!=='home'&&returnTo!=='calendar')return undefined;
  const source={returnTo,from:query.get('from')??undefined} satisfies OwnerSessionSource;
  return ownerSessionSourceSuffix('#',source)===fragment?source:undefined;
}
