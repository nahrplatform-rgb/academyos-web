// These adapters apply only to the disposable Next app and its fictional data.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {dirname,join,relative} from 'node:path';
import {build} from 'esbuild';

export const rollbackPlayer='Fictional offline workspace player';

export async function configureRollbackBuild(root,dir){
  const config=join(dir,'fixture-config.ts');
  await writeFile(config,await readFile(join(root,'apps/web/src/lib/config.ts')));
  const layout=join(dir,'app/[locale]/layout.jsx');
  const route=join(dir,'app/[locale]/workspace/[academy]/attendance/[event]/page.tsx');
  const layoutSource=await readFile(layout,'utf8');
  const routeSource=await readFile(route,'utf8');
  const gate='const offlineRegisterPilotEnabled=(_env: unknown)=>true;';
  assert.ok(layoutSource.includes('enabled={true}')&&routeSource.includes(gate));
  const imports=`import {offlineRegisterPilotEnabled,ownerWorkspaceEnabled} from '../../fixture-config';
export const dynamic='force-dynamic';\n`;
  await writeFile(layout,imports+layoutSource.replace('enabled={true}',
    'enabled={offlineRegisterPilotEnabled(process.env)} workspaceEnabled={ownerWorkspaceEnabled(process.env)}'));
  const routeImport='./'+relative(dirname(route),config.slice(0,-3));
  await writeFile(route,routeSource.replace(gate,`import {offlineRegisterPilotEnabled} from '${routeImport}';`));
}

export function rollbackBuildEnvironment(env,registerEnabled){
  const register=String(registerEnabled);
  return {...env,APP_ENV:'staging',OWNER_WORKSPACE_PILOT_ENABLED:'true',
    OWNER_WORKSPACE_TRANSFER_ENABLED:'true',LOCAL_OWNER_WORKSPACE_KEY_ENABLED:'true',
    LOCAL_OWNER_WORKSPACE_WRAP_KEY_V1:'b'.repeat(64),
    LOCAL_REGISTER_PILOT_ENABLED:register,LOCAL_REGISTER_KEY_ENABLED:register,
    LOCAL_REGISTER_TRANSFER_ENABLED:register,LOCAL_REGISTER_DISPATCH_ENABLED:register,
    LOCAL_REGISTER_WRAP_KEY_V1:'c'.repeat(64)};
}

/** Seed only a completed People download. Opening it uses the real app, worker
 * and encrypted repository. Attendance preparation and original capture use UI. */
export async function seedRollbackWorkspace(root,page,scope){
  const adapter=await build({stdin:{contents:`
    import {openLocalWorkspace} from './apps/web/src/lib/local-workspace-repository.ts';
    import {digest} from './apps/web/src/lib/local-register-codec.ts';
    import {readRegisterAccount} from './apps/web/src/lib/register-device-account.ts';
    import {saveWorkspaceSlot} from './apps/web/src/lib/workspace-device-slots.ts';
    window.seedFixturePeople=async({academy,day,name})=>{
      const account=readRegisterAccount();
      if(account?.subject!=='user_owner'||account.mode!=='active')throw Error('Prepare the fictional Owner register first');
      const context={subject:account.subject,academy};
      const device=crypto.randomUUID(),namespace=crypto.randomUUID();
      const repo=await openLocalWorkspace({...context,device,namespace,
        environment:'staging',epoch:1,capability:'owner-workspace-v1'});
      try{
        const checkedAt=Date.now(), issued=Math.floor(checkedAt/1000);
        const row={id:crypto.randomUUID(),display_name:name,branch_id:crypto.randomUUID(),branch_name:'Fictional offline branch'};
        const seed={v:1,a:academy,device,ns:namespace,epoch:1,scope:'a'.repeat(64),dataset:'people',
          first:null,last:null,revision:'1',total:null,seen:0,cursor:null,acc:'b'.repeat(64),issued,phase:'seed'};
        const receipt=payload=>({payload,signature:'c'.repeat(64)});
        const frame=text=>'s'+new TextEncoder().encode(text).byteLength+':'+text;
        const acc=await digest('x21-row-v1'+[seed.acc,'people',row.id,row.display_name,row.branch_id,row.branch_name].map(frame).join(''));
        const transfer={...seed,total:1,seen:1,cursor:{id:row.id},acc,phase:'transfer'};
        const material=btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
        await repo.activate({material,verifiedAt:checkedAt});
        const generation=await repo.begin('people',receipt(seed));
        await repo.append('people',generation,receipt(transfer),[row]);
        await repo.complete('people',generation,receipt({...transfer,phase:'complete'}),checkedAt);
        await repo.rememberContext(seed.scope,checkedAt,{academy_id:academy,academy_name:'Fictional rollback academy',
          branch_id:row.branch_id,branch_name:row.branch_name,timezone:'UTC',today:day});
        saveWorkspaceSlot(context,{device,namespace,generation:crypto.randomUUID(),mode:'active'});
      }finally{repo.close();}
    };
  `,resolveDir:root},bundle:true,write:false});
  await page.addScriptTag({content:adapter.outputFiles[0].text});
  await page.evaluate(async data=>{
    try{await window.seedFixturePeople(data);}
    finally{delete window.seedFixturePeople;}
  },{academy:scope.academy,day:scope.day,name:rollbackPlayer});
}

export function rollbackStorage(page,scope){
  return page.evaluate(async({academy,event})=>{
    const read=key=>JSON.parse(localStorage.getItem(key));
    const account=read('academyos.register-account.v1');
    const workspace=read(`academyos.workspace-slot.v1:user_owner:${academy}`);
    const register=read(`academyos.register-slot.v2:user_owner:${academy}:${event}`)??read(
      `academyos.register-slot.v1:user_owner:${academy}`);
    const result=request=>new Promise((resolve,reject)=>{
      request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
    });
    const db=await result(indexedDB.open('academyos-owner-register-v1'));
    try{
      const tx=db.transaction(['control','rows']);
      const [control,rosterRows]=await Promise.all([
        result(tx.objectStore('control').get(register.namespace)),
        result(tx.objectStore('rows').index('namespace').count(register.namespace)),
      ]);
      return {account,workspace,register,rosterRows,repositoryMode:control?.mode};
    }finally{db.close();}
  },scope);
}
