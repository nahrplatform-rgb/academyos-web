import {useSyncExternalStore} from 'react';
import {isCivilDay} from './experience-format';

type OwnerSessionSource = {returnTo:'home'|'calendar';from?:string;attendanceTask?:string};
const taskId=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
type OwnerTodayTaskKind='attendance'|'correction'|'development'|'publication';

export function ownerTodayTaskHint(kind:OwnerTodayTaskKind,id:string) {
  return taskId.test(id)?`#${kind}-return=${id}`:null;
}

export function ownerTodayReturnHint(fragment:string) {
  const match=/^#(attendance|correction|development|publication)-return=(.+)$/.exec(fragment);
  return match&&taskId.test(match[2])?fragment:null;
}

export function ownerTodayReviewSource(id:string) {
  return taskId.test(id)?`#review-from-today=${id}`:'';
}

export function useOwnerTodayReviewSource() {
  const fragment=useSyncExternalStore(subscribe,()=>window.location.hash,()=>'');
  const id=fragment.slice('#review-from-today='.length);
  return fragment.startsWith('#review-from-today=')&&taskId.test(id)?id:null;
}

export function ownerTodayTaskReturn(locale:string,academy:string,kind:OwnerTodayTaskKind,id:string) {
  const hint=ownerTodayTaskHint(kind,id);
  if(!hint)return null;
  return {href:`/${locale}/workspace/${academy}/home${hint}`,label:locale==='ar'?'العودة إلى اليوم':'Back to Today'};
}

export function ownerSessionReturn(locale:string,academy:string,source?:OwnerSessionSource) {
  if(!source)return null;
  const calendar=source.returnTo==='calendar';
  const task=!calendar&&source.attendanceTask?ownerTodayTaskReturn(locale,academy,'attendance',source.attendanceTask):null;
  if(task)return task;
  return {
    href:`/${locale}/workspace/${academy}/${source.returnTo}`,
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
