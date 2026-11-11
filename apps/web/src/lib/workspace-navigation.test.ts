import test from 'node:test';
import assert from 'node:assert/strict';
import { workspaceNavigation } from '../components/workspace-navigation';
import {ownerTodayReturnHint,ownerSessionReturn,ownerSessionSourceSuffix} from './owner-session-navigation';
const academy='00000000-0000-4000-8000-000000000001',path=`/en/workspace/${academy}/calendar`;
test('canonical Owner menu preserves only a valid same-academy Calendar civil hint',()=>{
 const menu=(href:string)=>workspaceNavigation('en',academy,'owner',[{href,label:'Calendar',current:true}]);
 assert.equal(menu(path+'?anchor=2026-11-01&unknown=discard').find(x=>x.href.startsWith(path))?.href,path+'?anchor=2026-11-01');
 assert.equal(menu(path+'?anchor=2026-11-01').find(x=>x.current)?.href,path+'?anchor=2026-11-01');
 for(const href of [path+'?anchor=2026-02-30',path+'?anchor=2026-11-01&anchor=2026-11-02',path+'?return=https://foreign.invalid',path.replace(academy,'00000000-0000-4000-8000-000000000002')+'?anchor=2026-11-01','https://foreign.invalid'+path+'?anchor=2026-11-01']){
  assert.equal(menu(href).find(x=>x.href.startsWith(path))?.href,path);
 }
 for(const role of ['trainer','guardian'] as const){
  const links=workspaceNavigation('en',academy,role,[{href:path+'?anchor=2026-11-01',label:'Calendar'}]);
  assert.ok(links.every(x=>!x.href.includes('anchor=')&&!x.href.startsWith('https:')));
 }
});

test('attendance queue return is a bounded one-use focus hint and retains the ordinary dated path',()=>{
 const event='00000000-0000-4000-8000-000000000002';
 const source={returnTo:'home' as const,attendanceTask:event};
 assert.equal(ownerSessionSourceSuffix('#',source),`#return=home&attendance=${event}`);
 assert.equal(ownerSessionReturn('ar',academy,source)?.href,`/ar/workspace/${academy}/home#attendance-return=${event}`);
 assert.equal(ownerSessionSourceSuffix('?',source),'?return=home');
 assert.equal(ownerSessionReturn('en',academy,{returnTo:'calendar',attendanceTask:event})?.href,path);
 assert.equal(ownerTodayReturnHint(`#attendance-return=${event}`),`#attendance-return=${event}`);
 for(const fragment of ['',`#attendance-return=${event}&extra=1`,'#attendance-return=/platform','#attendance-return=invalid'])
  assert.equal(ownerTodayReturnHint(fragment),null);
 assert.equal(ownerSessionSourceSuffix('#',{returnTo:'home',attendanceTask:'/platform'}),'#return=home');
});
