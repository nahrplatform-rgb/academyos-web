import {readRegisterAccount} from './register-device-account';
import {readRegisterSlot} from './register-device-slots';
import {readWorkspaceSlot} from './workspace-device-slots';
import {isCivilDay} from './experience-format';

export const WORKSPACE_LAUNCH_KEY='academyos.workspace-launch.v1';
const route=/^\/(en|ar)\/workspace\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})\/(players|calendar|attendance\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}))(\?anchor=(\d{4}-\d{2}-\d{2}))?$/;

function target(path:unknown) {
  if(typeof path!=='string'||path.length>256)return null;
  const match=route.exec(path);
  if(!match||match[5]&&(match[3]!=='calendar'||!isCivilDay(match[6])))return null;
  return {locale:match[1],academy:match[2],page:match[3],event:match[4]};
}
function activeSlot(subject:string,path:string) {
  const scope=target(path);
  if(!scope)return null;
  const slot=scope.event?readRegisterSlot(subject,scope.academy,scope.event):
    readWorkspaceSlot({subject,academy:scope.academy});
  return slot?.mode==='active'?{namespace:slot.namespace,generation:slot.generation}:null;
}

/** A nonprivate route hint, never a membership, coverage or key grant. The
 * destination still opens its ordinary protected reader/original recovery. */
export function rememberWorkspaceLaunch(subject:string,calendar?:{locale:string;anchor:string}) {
  try {
    const current=location.pathname+location.search;
    const scope=target(current);
    if(!scope)return;
    let path=current;
    if(scope.page==='calendar'){
      // Only Calendar knows which displayed period has a prepared read.
      if(!calendar||!['en','ar'].includes(calendar.locale)||!isCivilDay(calendar.anchor))return;
      path=`/${calendar.locale}/workspace/${scope.academy}/calendar?anchor=${calendar.anchor}`;
    }
    const account=readRegisterAccount();
    if(!account||account.mode!=='active'||account.subject!==subject)return;
    const slot=activeSlot(subject,path);
    if(!slot)return;
    localStorage.setItem(WORKSPACE_LAUNCH_KEY,JSON.stringify({subject,
      generation:account.generation,path,slot}));
  } catch { /* Optional navigation memory cannot prevent an operating save. */ }
}

export function readWorkspaceLaunch(subject?:string):string|null {
  try {
    const account=readRegisterAccount();
    if(!account||account.mode!=='active'||subject!==undefined&&account.subject!==subject)return null;
    const raw=localStorage.getItem(WORKSPACE_LAUNCH_KEY);
    if(!raw||raw.length>1024)return null;
    const saved=JSON.parse(raw);
    if(!saved||Object.keys(saved).sort().join(',')!=='generation,path,slot,subject'||
      saved.subject!==account.subject||saved.generation!==account.generation||!target(saved.path))return null;
    const slot=activeSlot(account.subject,saved.path);
    if(!slot||!saved.slot||Object.keys(saved.slot).sort().join(',')!=='generation,namespace'||
      slot.namespace!==saved.slot.namespace||slot.generation!==saved.slot.generation)return null;
    return saved.path;
  } catch {return null;}
}
