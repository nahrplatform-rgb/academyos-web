// Local process ownership only. Never infer login, role or database readiness.
import {createServer} from 'node:net';
import {randomUUID} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {lstat,mkdir,readFile,realpath,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';

export const localOrigins={dev:'http://localhost:3000',production:'http://localhost:3100'};
export function alive(pid){
  if(!Number.isSafeInteger(pid)||pid<=0)return false;
  try{process.kill(pid,0);return true;}catch(error){return error.code==='EPERM';}
}
export function processStart(pid){
  return execFileSync('ps',['-p',String(pid),'-o','lstart='],{encoding:'utf8',env:{...process.env,LC_ALL:'C'}}).trim();
}

function ownsDevListener(pid,port){
  const listeners=execFileSync('lsof',['-nP','-t',`-iTCP:${port}`,'-sTCP:LISTEN'],{encoding:'utf8'}).trim().split(/\s+/).map(Number);
  return listeners.length>0&&listeners.every(listener=>{
    for(let child=listener;child>1;){
      if(child===pid)return true;
      const parent=Number(execFileSync('ps',['-p',String(child),'-o','ppid='],{encoding:'utf8'}).trim());
      if(parent===child)return false;
      child=parent;
    }
    return false;
  });
}

function verifyUnresponsiveDev(root,expected,port){
  try{
    const command=execFileSync('ps',['-ww','-p',String(expected.pid),'-o','command='],{encoding:'utf8'}).trim();
    const cwd=execFileSync('lsof',['-a','-p',String(expected.pid),'-d','cwd','-Fn'],{encoding:'utf8'}).split('\n');
    const script=join(root,'scripts/local/workflow.mjs');
    const args=command.slice(command.indexOf(' ')+1);
    const launcher=[script,'scripts/local/workflow.mjs'].some(path=>
      args===path+' dev'||args.startsWith(path+' dev '));
    if(expected.start&&expected.start===processStart(expected.pid)&&launcher&&cwd.includes('n'+root)&&ownsDevListener(expected.pid,port))return;
  }catch{
    // OS process inspection can fail when a process exits or tools are unavailable.
  }
  throw new Error('Cannot verify ownership of the unresponsive dev listener. No process was stopped.');
}

export async function clearDevOutput(root){
  const web=join(root,'apps/web');
  const output=join(web,'.next-local');
  if(await realpath(web)!==web)throw new Error('Dev output parent is not the expected workspace directory.');
  const entry=await lstat(output).catch(error=>{if(error.code!=='ENOENT')throw error;});
  if(!entry)return;
  if(!entry.isDirectory()||entry.isSymbolicLink())throw new Error('Dev output is not a real directory. Inspect apps/web/.next-local.');
  await rm(output,{recursive:true});
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
    let start;
    try{
      start=name==='server-dev'?processStart(process.pid):undefined;
      await writeFile(join(path,'owner.json'),JSON.stringify({pid:process.pid,token,start}),{mode:0o600,flag:'wx'});
    }
    catch(error){await rm(path,{recursive:true,force:true});throw error;}
    return {token,start,release:async()=>{
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
export async function stopOwnedRuntime(root,mode,{origin=localOrigins[mode],read=()=>readRuntime(origin)}={}){
  const port=Number(new URL(origin).port);let expected;
  let lease;
  try{lease=JSON.parse(await readFile(join(root,'test-results/local-workflow/locks','server-'+mode,'owner.json'),'utf8'));}
  catch(error){
    if(error.code!=='ENOENT')throw error;
    await assertPortFree(port);
    return;
  }
  try{expected=JSON.parse(await readFile(join(root,'test-results/local-workflow/runtime-'+mode+'.json'),'utf8'));}
  catch{throw new Error('No recorded local server owner. Refusing to stop an unrelated listener.');}
  if(expected.mode!==mode||lease.pid!==expected.pid||!alive(expected.pid))
    throw new Error('The recorded launcher and active lease do not match. No process was stopped.');
  const actual=await read();
  if(mode==='dev'&&actual.status!=='responding'){
    if(lease.start!==expected.start)throw new Error('The dev process identity changed. No process was stopped.');
    verifyUnresponsiveDev(root,expected,port);
  }else{
    assertRuntime(actual,expected);
    if(expected.start&&processStart(expected.pid)!==expected.start)throw new Error('The recorded launcher PID was reused.');
  }
  process.kill(expected.pid,'SIGTERM');
  const end=Date.now()+10000;
  while(Date.now()<end){
    try{
      await assertPortFree(port);
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
