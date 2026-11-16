// Local process ownership only. Never infer login, role or database readiness.
import {createServer} from 'node:net';
import {randomUUID} from 'node:crypto';
import {mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';

export const localOrigins={dev:'http://localhost:3000',production:'http://localhost:3100'};
export function alive(pid){
  if(!Number.isSafeInteger(pid)||pid<=0)return false;
  try{process.kill(pid,0);return true;}catch(error){return error.code==='EPERM';}
}
export async function acquireResource(root,name,{inherited,ownerAlive=alive}={}){
  const path=join(root,'test-results/local-workflow/locks',name);
  await mkdir(join(root,'test-results/local-workflow/locks'),{recursive:true});
  for(let attempt=0;attempt<2;attempt++){
    try{await mkdir(path,{mode:0o700});}
    catch(error){
      if(error.code!=='EEXIST')throw error;
      let owner;try{owner=JSON.parse(await readFile(join(path,'owner.json'),'utf8'));}catch{}
      if(owner&&ownerAlive(owner.pid)&&inherited&&owner.token===inherited)return {token:inherited,release:async()=>{}};
      if(owner&&Number.isSafeInteger(owner.pid)&&!ownerAlive(owner.pid))
        throw new Error(`Stopped process ${owner.pid} left local resource ${name}. Inspect and remove only ${path}; no active owner is replaced automatically.`);
      throw new Error(`Local resource ${name} is already owned${owner?' by process '+owner.pid:''}. Finish that run before starting another.`);
    }
    const token=randomUUID();
    try{await writeFile(join(path,'owner.json'),JSON.stringify({pid:process.pid,token}),{mode:0o600,flag:'wx'});}
    catch(error){await rm(path,{recursive:true,force:true});throw error;}
    return {token,release:async()=>{
      let owner;try{owner=JSON.parse(await readFile(join(path,'owner.json'),'utf8'));}catch{return;}
      if(owner.pid===process.pid&&owner.token===token)await rm(path,{recursive:true,force:true});
    }};
  }
  throw new Error(`Local resource ${name} changed owner; retry after its current run finishes.`);
}
export async function assertPortFree(port){
  await new Promise((resolve,reject)=>{
    const server=createServer();
    server.once('error',()=>reject(new Error(`localhost:${port} is already serving. Check npm run local:status; use --restart only for this launcher's known server. No build or log was overwritten.`)));
    server.listen(port,'127.0.0.1',()=>server.close(error=>error?reject(error):resolve()));
  });
}
export async function readRuntime(origin,send=fetch){
  if(!Object.values(localOrigins).includes(origin))throw new Error('Use localhost:3000 or localhost:3100.');
  try{
    const response=await send(origin+'/api/local-runtime',{redirect:'error',cache:'no-store',signal:AbortSignal.timeout(10000)});
    if(!response.ok)return {status:'unidentified',http:response.status};
    return {status:'responding',runtime:await response.json()};
  }catch{return {status:'offline-or-unresponsive'};}
}
export function assertRuntime(actual,expected){
  if(actual.status!=='responding'||actual.runtime?.instance!==expected.instance||actual.runtime?.mode!==expected.mode)
    throw new Error('The local port is not serving the recorded process. Restart the known launcher; do not accept an anonymous HTML page as runtime proof.');
  if(expected.mode==='production'&&(actual.runtime.sourceHash!==expected.sourceHash||actual.runtime.buildId!==expected.buildId))
    throw new Error('The running production process differs from the checked build. Restart local production.');
}
export async function stopOwnedRuntime(root,mode){
  const origin=localOrigins[mode];let expected;
  try{expected=JSON.parse(await readFile(join(root,'test-results/local-workflow/runtime-'+mode+'.json'),'utf8'));}
  catch{throw new Error('No recorded local server owner. Refusing to stop an unrelated listener.');}
  assertRuntime(await readRuntime(origin),expected);
  if(!alive(expected.pid))throw new Error('Recorded launcher is no longer running; inspect the listener instead of guessing a process.');
  process.kill(expected.pid,'SIGTERM');
  const end=Date.now()+10000;
  while(Date.now()<end){
    try{
      await assertPortFree(Number(new URL(origin).port));
      // The listener can close before the owning launcher has released its
      // build/server leases. Do not let a normal --restart race that cleanup.
      for(const name of ['server-'+mode,...(mode==='production'?['web-build']:[])]){
        let owner;try{owner=JSON.parse(await readFile(join(root,'test-results/local-workflow/locks',name,'owner.json'),'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}
        if(owner?.pid===expected.pid)throw new Error('Recorded launcher is still releasing its resources.');
      }
      return;
    }
    catch{await new Promise(resolve=>setTimeout(resolve,100));}
  }
  throw new Error('The recorded server did not stop in time; no replacement was started.');
}
