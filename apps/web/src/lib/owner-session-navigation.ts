import {useSyncExternalStore} from 'react';
import {isCivilDay} from './experience-format';

type OwnerSessionSource = {returnTo:'home'|'calendar';from?:string;attendanceTask?:string};
const taskId=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

export function ownerAttendanceReturnTask(fragment:string) {
  const value=fragment.slice('#attendance-return='.length);
  return fragment.startsWith('#attendance-return=')&&taskId.test(value)?value:null;
}

export function ownerSessionReturn(locale:string,academy:string,source?:OwnerSessionSource) {
  if(!source)return null;
  const calendar=source.returnTo==='calendar';
  const task=!calendar&&source.attendanceTask&&taskId.test(source.attendanceTask)?source.attendanceTask:null;
  return {
    href:`/${locale}/workspace/${academy}/${source.returnTo}${task?`#attendance-return=${task}`:''}`,
    label:locale==='ar'?(calendar?'العودة إلى التقويم':'العودة إلى اليوم'):(calendar?'Back to calendar':'Back to Today'),
  };
}

export function ownerSessionSourceSuffix(prefix:'?'|'#',source?:OwnerSessionSource) {
  if(!source)return '';
  const {from,returnTo,attendanceTask}=source;
  const task=prefix==='#'&&returnTo==='home'&&attendanceTask&&taskId.test(attendanceTask)?attendanceTask:null;
  return `${prefix}${isCivilDay(from)?`from=${from}&`:''}return=${returnTo}${task?`&attendance=${task}`:''}`;
}

function subscribe(listener:()=>void) {
  window.addEventListener('hashchange',listener);
  window.addEventListener('popstate',listener);
  return ()=>{
    window.removeEventListener('hashchange',listener);
    window.removeEventListener('popstate',listener);
  };
}

/** Fragments preserve the offline route. Optional task IDs guide checked focus, never authority. */
export function useOwnerSessionSource():OwnerSessionSource|undefined {
  const fragment=useSyncExternalStore(subscribe,()=>window.location.hash,()=>'');
  const query=new URLSearchParams(fragment.slice(1));
  const returnTo=query.get('return');
  if(returnTo!=='home'&&returnTo!=='calendar')return undefined;
  const source={returnTo,from:query.get('from')??undefined,attendanceTask:query.get('attendance')??undefined} satisfies OwnerSessionSource;
  return ownerSessionSourceSuffix('#',source)===fragment?source:undefined;
}
