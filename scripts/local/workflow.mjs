// Local execution/evidence tooling. No provider mutation or deployment authority.
import {spawn, spawnSync} from 'node:child_process';
import {createHash,randomUUID} from 'node:crypto';
import {createRequire} from 'node:module';
import {existsSync, readdirSync} from 'node:fs';
import {appendFile, mkdir, mkdtemp, readFile, readdir, readlink, rename, symlink, unlink, writeFile} from 'node:fs/promises';
import {dirname, delimiter, isAbsolute, join, resolve} from 'node:path';
import {homedir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {acquireResource,assertPortFree,readRuntime,assertRuntime,stopOwnedRuntime,clearDevOutput,localOrigins} from './runtime.mjs';
import {assertCurrentWebBuild} from '../verification/web-build.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const output=join(root,'test-results/local-workflow');
const digest=value=>createHash('sha256').update(value).digest('hex');
const plans={
  navigation:['scripts/navigation/test_next.mjs'],
  device:['scripts/working-day/test_device_lifecycle.mjs'],
  keyboard:['scripts/experience-projections/test_ui.mjs'],
  public:['scripts/local/smoke.mjs'],
  attendance:['scripts/working-day/test_additive_attendance.mjs'],
  transport:['scripts/workspace-download/test_transport.mjs'],
};
export function selectedSuites(name){
  const names=name==='corrective'?['navigation','device']:name==='all-local'?['navigation','device','keyboard','public']:[name];
  if(names.some(key=>!plans[key]))throw new Error('Choose corrective, navigation, device, keyboard, public, attendance, transport or all-local.');
  return names.map(key=>({name:key,argv:plans[key]}));
}
export function environmentStatus(env){
  const missing=['CLERK_SECRET_KEY','ONBOARDING_PROOF_KEY','UPSTASH_REDIS_REST_TOKEN',
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY','NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY']
    .filter(key=>!env[key]?.trim());
  return {status:missing.length?'incomplete':'configured',missing,
    backend:'Existing synthetic staging services; this is not a local database.',
    verification:'Credential presence only; no authenticated API or database proof.',
    offlineKeysPresent:Boolean(env.LOCAL_REGISTER_WRAP_KEY_V1&&env.LOCAL_OWNER_WORKSPACE_WRAP_KEY_V1)};
}
export function redact(text,env){
  let result=String(text);
  for(const [key,value] of Object.entries(env)){
    if(!key.startsWith('NEXT_PUBLIC_')&&/SECRET|TOKEN|PASSWORD|(?:^|_)KEY(?:_|$)|BYPASS|CREDENTIAL|AUTH|DSN|DATABASE_URL|CONNECTION_STRING/.test(key)&&value?.length>=8)
      result=result.split(value).join('[REDACTED]');
  }
  return result;
}
export function reusable(receipt,signature,artifactsAvailable=true){
  return receipt?.status==='passed'&&receipt.signature===signature&&receipt.sourceStable===true&&artifactsAvailable;
}
export function fixtureEnvironment(env){
  // Minimal OS/runtime allowlist; never forward service credentials or inherited
  // EX02 baseline switches that could change the assertions being executed.
  return Object.fromEntries(Object.entries(env).filter(([key])=>
    /^(?:PATH|HOME|USER|LOGNAME|TMPDIR|TMP|TEMP|SHELL|LANG|LC_[A-Z_]+|TZ|CI|TERM|NO_COLOR|FORCE_COLOR|SystemRoot|COMSPEC|APP_ENV)$/.test(key)));
}
const offlineKeyNames=['LOCAL_REGISTER_WRAP_KEY_V1','LOCAL_OWNER_WORKSPACE_WRAP_KEY_V1'];
const offlineFlags=['LOCAL_REGISTER_PILOT_ENABLED','LOCAL_REGISTER_KEY_ENABLED',
  'LOCAL_REGISTER_TRANSFER_ENABLED','LOCAL_REGISTER_DISPATCH_ENABLED',
  'OWNER_WORKSPACE_PILOT_ENABLED','OWNER_WORKSPACE_TRANSFER_ENABLED','LOCAL_OWNER_WORKSPACE_KEY_ENABLED'];
export function localOfflineEnvironment(env,bridge=spawnSync){
  if(env.ACADEMYOS_LOCAL_OFFLINE!=='true')return {environment:env,status:{state:'not_requested',loaded:false}};
  const refused=()=>new Error('Local offline key recovery refused; check the private archive/identity setup. No key was printed or replaced.');
  if(env.APP_ENV!=='staging'||env.SUPABASE_PROJECT_REF!=='snpphkenmvmhpjstbeul'||
    env.NEXT_PUBLIC_SUPABASE_URL!=='https://snpphkenmvmhpjstbeul.supabase.co'||!env.ONBOARDING_PROOF_KEY)throw refused();
  const privateHome=join(homedir(),'.config');
  const request={identity:env.ACADEMYOS_LOCAL_RECOVERY_IDENTITY??join(privateHome,'academyos-backup/recovery-key.txt'),
    registerDirectory:env.ACADEMYOS_LOCAL_REGISTER_ARCHIVE??join(privateHome,'academyos-register-key/staging-v1'),
    workspaceDirectory:env.ACADEMYOS_LOCAL_WORKSPACE_ARCHIVE??join(privateHome,'academyos-workspace-key/staging-v1')};
  let result,payload;
  try{
    // Descriptor 3 is an in-memory channel. Roots never enter helper stdout,
    // command arguments, a plaintext key file, or a published receipt.
    result=bridge('python3',[join(root,'scripts/local/runtime_keys.py')],{
      cwd:root,env:fixtureEnvironment(env),input:JSON.stringify(request),
      stdio:['pipe','pipe','pipe','pipe'],maxBuffer:16384,timeout:15000});
    if(result.status!==0||result.stdout?.length||!result.output?.[3]||result.output[3].length>4096)throw refused();
    payload=JSON.parse(result.output[3].toString('utf8'));
    if(!payload||Array.isArray(payload)||Object.keys(payload).sort().join(',')!==offlineKeyNames.slice().sort().join(','))throw refused();
    for(const key of offlineKeyNames){
      if(typeof payload[key]!=='string'||!/^[a-f0-9]{64}$/.test(payload[key])||payload[key]===env.ONBOARDING_PROOF_KEY||
        env[key]&&env[key]!==payload[key])throw refused();
    }
    if(payload[offlineKeyNames[0]]===payload[offlineKeyNames[1]])throw refused();
  }catch{throw refused();}
  return {environment:{...env,...payload,...Object.fromEntries(offlineFlags.map(key=>[key,'true']))},
    status:{state:'verified_archives_loaded',loaded:true,
      custody:'Existing purpose-bound encrypted archives recovered into process memory; no new key or plaintext key file.',
      scope:'Local synthetic-staging frontend only; server permissions and existing pilot limits still apply.'}};
}
export async function ensureToolchainLink(path,target){
  try{await symlink(target,path);}catch(error){
    if(error.code!=='EEXIST'||await readlink(path)!==target)throw error;
  }
}
export async function allocateEvidenceDirectory(base,suite){
  await mkdir(base,{recursive:true});
  return mkdtemp(join(base,new Date().toISOString().replace(/[:.]/g,'-')+'-'+suite+'-'));
}
export async function writeJsonAtomically(path,value){
  const temp=path+'.'+randomUUID()+'.tmp';
  try{
    await writeFile(temp,JSON.stringify(value,null,2)+'\n',{mode:0o600,flag:'wx'});
    await rename(temp,path);
  }finally{await unlink(temp).catch(error=>{if(error.code!=='ENOENT')throw error;});}
}
function findNode(){
  if(process.versions.node.split('.')[0]==='24')return process.execPath;
  const base=join(homedir(),'.nvm/versions/node');
  const candidates=[process.env.ACADEMYOS_NODE,...(existsSync(base)?readdirSync(base).filter(n=>/^v24\./.test(n)).sort().reverse().map(n=>join(base,n,'bin/node')):[])];
  for(const file of candidates.filter(Boolean)){
    const result=spawnSync(file,['--version'],{encoding:'utf8'});
    if(result.status===0&&/^v24\./.test(result.stdout.trim()))return file;
  }
  throw new Error('Node 24 is required. Install/select it or set ACADEMYOS_NODE; no tool is downloaded automatically.');
}
async function toolchain(){
  const node=findNode();
  if(node!==process.execPath){
    const child=spawnSync(node,[fileURLToPath(import.meta.url),...process.argv.slice(2)],{
      cwd:root,stdio:'inherit',env:{...process.env,PATH:dirname(node)+delimiter+process.env.PATH}});
    process.exit(child.status??1);
  }
  const candidates=[process.env.ACADEMYOS_NPM,join(homedir(),'.local/bin/npm'),
    ...process.env.PATH.split(delimiter).map(p=>join(p,process.platform==='win32'?'npm.cmd':'npm'))].filter(Boolean);
  let npm;
  for(const file of [...new Set(candidates)]){
    if(!existsSync(file))continue;
    const r=spawnSync(file,['--version'],{encoding:'utf8'});
    if(r.status===0&&r.stdout.trim()==='11.19.1'){npm=file;break;}
  }
  if(!npm)throw new Error('Existing npm 11.19.1 is required; select it with ACADEMYOS_NPM. No installation was performed.');
  const bin=join(output,'toolchain',digest(node+'\n'+npm).slice(0,16),'bin');await mkdir(bin,{recursive:true});
  for(const [name,target] of [['node',node],['npm',npm]]){
    await ensureToolchainLink(join(bin,name),target);
  }
  return {node,npm,env:{...process.env,PATH:bin+delimiter+process.env.PATH},version:{node:process.version,npm:'11.19.1'}};
}
async function sourceFingerprint(){
  const hashes=[];
  async function visit(path){
    for(const item of (await readdir(join(root,path),{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){
      if(item.name.startsWith('.')||item.name==='node_modules'||item.name==='__pycache__')continue;
      const child=path+'/'+item.name;
      if(item.isDirectory())await visit(child);
      else if(item.isFile()&&/\.(?:tsx?|mjs|js|py|sql|css|json|png|svg|woff2?)$/.test(item.name))
        hashes.push([child,digest(await readFile(join(root,child)))]);
    }
  }
  for(const path of ['apps/web/src','apps/web/public','scripts','supabase/migrations','supabase/tests'])await visit(path);
  for(const path of ['package.json','package-lock.json','apps/web/package.json','apps/web/next.config.ts','apps/web/tsconfig.json','scripts/verification/web-build.mjs'])
    hashes.push([path,digest(await readFile(join(root,path)))]);
  if(existsSync(join(root,'node_modules/.package-lock.json')))
    hashes.push(['node_modules/.package-lock.json',digest(await readFile(join(root,'node_modules/.package-lock.json')))]);
  return {sha256:digest(JSON.stringify(hashes)),files:hashes.length};
}
async function artifactNames(path){
  const result=[];
  async function visit(current){
    for(const entry of await readdir(current,{withFileTypes:true})){
      const file=join(current,entry.name);
      if(entry.isDirectory())await visit(file);else result.push(file.slice(path.length+1));
    }
  }
  if(existsSync(path))await visit(path);
  return result;
}
export async function artifactBundle(path){
  return Object.fromEntries(await Promise.all((await artifactNames(path)).map(async file=>
    [file,digest(await readFile(join(path,file)))])));
}
export async function artifactBundleCurrent(path,hashes,receipt='receipt.json'){
  if(!hashes||!Object.keys(hashes).length||!hashes[receipt])return false;
  try{
    for(const [file,hash] of Object.entries(hashes)){
      if(isAbsolute(file)||file.split(/[\\/]/).includes('..')||digest(await readFile(join(path,file)))!==hash)return false;
    }
    return true;
  }catch{return false;}
}
async function execute(command,argv,env,logFile,live=false,onReady){
  await writeFile(logFile,'',{mode:0o600});
  const started=Date.now();let pending='',writes=Promise.resolve(),ready=false,spawnError;
  const child=spawn(command,argv,{cwd:root,env,stdio:['ignore','pipe','pipe'],detached:process.platform!=='win32'});
  const save=text=>{
    const safe=redact(text,env);writes=writes.then(()=>appendFile(logFile,safe));
    if(live&&!ready&&/Ready in/.test(safe)){
      ready=true;console.log(JSON.stringify({server:'listening',log:logFile}));
      if(onReady)onReady().catch(error=>{console.error(JSON.stringify({status:'failed',message:error.message}));forward();});
    }
  };
  const receive=data=>{pending+=data;const end=pending.lastIndexOf('\n');if(end>=0){save(pending.slice(0,end+1));pending=pending.slice(end+1);}};
  child.stdout.on('data',receive);child.stderr.on('data',receive);
  const forward=()=>{
    try{if(process.platform!=='win32')process.kill(-child.pid,'SIGTERM');else child.kill('SIGTERM');}
    catch(error){if(error.code!=='ESRCH')child.kill('SIGTERM');}
  };
  process.once('SIGINT',forward);process.once('SIGTERM',forward);
  const result=await new Promise(resolveResult=>{
    child.once('error',error=>{spawnError=error.message;});
    child.once('close',(code,signal)=>resolveResult({exitCode:code??1,signal,...(spawnError?{error:spawnError}:{})}));
  });
  process.removeListener('SIGINT',forward);process.removeListener('SIGTERM',forward);
  if(pending)save(pending);await writes;
  return {...result,durationMs:Date.now()-started,log:logFile};
}
async function main(){
  const [mode='preflight',...args]=process.argv.slice(2),tc=await toolchain();
  const clean=args.includes('--clean');
  if(clean&&mode!=='dev')throw new Error('--clean is only supported by npm run dev.');
  const req=createRequire(join(root,'apps/web/package.json'));
  const {combinedEnv}=req('@next/env').loadEnvConfig(join(root,'apps/web'),mode!=='production',{info(){},error(){}});
  const env={...combinedEnv,...tc.env};
  let offlineRuntime={state:'not_loaded_for_fixture',loaded:false};
  if(['preflight','dev','production'].includes(mode)&&!args.includes('--public-only')){
    const loaded=localOfflineEnvironment(env);Object.assign(env,loaded.environment);offlineRuntime=loaded.status;
  }
  const readiness=environmentStatus(env);
  if(mode==='status'){
    for(const [kind,origin] of Object.entries(localOrigins)){
      const actual=await readRuntime(origin);let expected,current=false,error;
      try{
        expected=JSON.parse(await readFile(join(output,'runtime-'+kind+'.json'),'utf8'));
        assertRuntime(actual,expected);
        if(kind==='production')current=(await assertCurrentWebBuild(root)).sourceHash===expected.sourceHash;
        else current=true;
      }catch(cause){error=cause.message;}
      console.log(JSON.stringify({mode:kind,origin,status:current?'current':actual.status==='responding'?'stale-or-unowned':actual.status,current,
        ...(error?{message:error}:{}),scope:'Process/build readiness only; verify signed-in account, role and operating API separately.'}));
    }return;
  }
  // Next loads file values itself; explicit public-only mode keeps both Clerk
  // values empty in this process, preserving the existing protected-route fence.
  if(args.includes('--public-only')){env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY='';env.CLERK_SECRET_KEY='';}
  env.PATH=tc.env.PATH;delete env.VERCEL_ENV;
  if(mode==='preflight'){
    console.log(JSON.stringify({runtime:tc.version,environment:readiness,offlineRuntime,
      urls:{development:'http://localhost:3000/en',production:'http://localhost:3100/en'},
      authority:'No deployment or provider settings changed.'}));return;
  }
  if(mode==='dev'||mode==='production'){
    if(readiness.missing.length&&!args.includes('--public-only'))throw new Error('Signed-in local environment incomplete: '+readiness.missing.join(', ')+'. Fill apps/web/.env.local; --public-only opens the public shell with protected routes still closed.');
    const url=localOrigins[mode];env.NEXT_PUBLIC_APP_URL=url;
    if(clean||args.includes('--restart'))await stopOwnedRuntime(root,mode);
    const launchLease=await acquireResource(root,'server-'+mode);
    let buildLease;
    try{
    await assertPortFree(Number(new URL(url).port));
    if(clean)await clearDevOutput(root);
    // This Next/Clerk combination normalizes its internal rewrite to localhost.
    // Use that same canonical name in the browser too: API same-origin guards
    // compare the Origin header with normalized NextURL. Prefer IPv4 loopback
    // consistently across local Node processes. This changes only child Node
    // processes, not system DNS or the product's allowed authentication origins.
    env.NODE_OPTIONS=[env.NODE_OPTIONS,'--dns-result-order=ipv4first'].filter(Boolean).join(' ');
    await mkdir(output,{recursive:true});
    if(mode==='production'){
      buildLease=await acquireResource(root,'web-build');env.ACADEMYOS_WEB_BUILD_LEASE=buildLease.token;
      if(!args.includes('--no-build')){
        const result=await execute(tc.npm,['run','build'],env,join(output,'production-build.log'));
        if(result.exitCode)throw new Error('Local production build failed; see '+result.log);
      }
    }
    const proof=mode==='production'?await assertCurrentWebBuild(root):null;
    const runtime={instance:randomUUID(),mode,pid:process.pid,sourceHash:proof?.sourceHash??null,
      buildId:mode==='production'?(await readFile(join(root,'apps/web/.next/BUILD_ID'),'utf8')).trim():null};
    env.ACADEMYOS_LOCAL_RUNTIME=JSON.stringify(runtime);
    await writeJsonAtomically(join(output,'runtime-'+mode+'.json'),{...runtime,start:launchLease.start});
    console.log(JSON.stringify({mode,url:url+'/en',log:join(output,mode+'.log'),runtime:tc.version,environment:readiness,offlineRuntime,
      ...(clean?{cleanRebuild:true,devOutput:join(root,'apps/web/.next-local')}:{}),
      publicOnly:args.includes('--public-only'),scope:'Local frontend; external services remain synthetic staging when configured.'}));
    const childArgs=['run',mode==='dev'?'dev':'start','--workspace','@academyos/web','--','--hostname','localhost','--port',mode==='dev'?'3000':'3100'];
    const result=await execute(tc.npm,childArgs,env,join(output,mode+'.log'),true,async()=>{
      assertRuntime(await readRuntime(url),runtime);
      console.log(JSON.stringify({server:'verified',mode,url:url+'/en',instance:runtime.instance,buildId:runtime.buildId}));
    });process.exitCode=result.exitCode;return;
    }finally{await buildLease?.release();await launchLease.release();}
  }
  if(mode==='report'){
    const name=args.find(x=>x.startsWith('--suite='))?.split('=')[1]??'corrective';
    for(const suite of selectedSuites(name)){
      const file=join(output,'latest-'+suite.name+'.json');
      if(!existsSync(file)){console.log(JSON.stringify({suite:suite.name,status:'not_run'}));continue;}
      const record=JSON.parse(await readFile(file,'utf8'));
      console.log(JSON.stringify({suite:suite.name,status:record.status,runtime:record.runtime,completed:record.completed,
        currentSource:(await sourceFingerprint()).sha256===record.source.sha256,evidence:record.artifacts,receipt:file}));
    }return;
  }
  if(mode!=='verify')throw new Error('Choose preflight, status, dev, production, verify or report.');
  const verificationLease=await acquireResource(root,'browser-verification');
  try{
  const name=args.find(x=>x.startsWith('--suite='))?.split('=')[1]??'corrective';
  const selected=selectedSuites(name),before=await sourceFingerprint();
  for(const suite of selected){
    if(suite.name==='public'){
      const origin=process.env.LOCAL_PREVIEW_URL??localOrigins.dev;
      const kind=Object.entries(localOrigins).find(([,url])=>url===origin)?.[0];
      if(!kind)throw new Error('Use a canonical local preview origin.');
      const expected=JSON.parse(await readFile(join(output,'runtime-'+kind+'.json'),'utf8'));
      assertRuntime(await readRuntime(origin),expected);
      if(kind==='production'&&(await assertCurrentWebBuild(root)).sourceHash!==expected.sourceHash)throw new Error('Production preview is stale; rebuild and restart it before verification.');
    }
    const testEnv={...fixtureEnvironment(env),APP_ENV:'staging',NEXT_TELEMETRY_DISABLED:'1',UI_REACT_MODE:'production',EX02_READ_OWNER_MEASURE:'1',LOCAL_PREVIEW_URL:process.env.LOCAL_PREVIEW_URL??'http://localhost:3000'};
    const signature=digest(JSON.stringify({source:before,runtime:tc.version,suite:suite.name,platform:process.platform,arch:process.arch,controlledEnvironment:testEnv,
      preview:suite.name==='public'?testEnv.LOCAL_PREVIEW_URL:null}));
    const latest=join(output,'latest-'+suite.name+'.json');let previous;
    if(existsSync(latest)){try{previous=JSON.parse(await readFile(latest,'utf8'));}catch{/* invalid cache is a miss */}}
    // A live server may change with its environment/session without a source edit.
    const available=Boolean(previous&&existsSync(previous.log)&&
      await artifactBundleCurrent(previous.artifacts,previous.artifactHashes,suite.name==='transport'?'transport.json':'receipt.json'));
    if(suite.name!=='public'&&!args.includes('--fresh')&&reusable(previous,signature,available)){
      console.log(JSON.stringify({suite:suite.name,status:'reused',originalCompleted:previous.completed,receipt:latest}));continue;
    }
    const dir=await allocateEvidenceDirectory(output,suite.name);
    testEnv.UI_EVIDENCE_DIR=join(dir,'artifacts');await mkdir(testEnv.UI_EVIDENCE_DIR,{recursive:true});
    testEnv.ACADEMYOS_BROWSER_LEASE=verificationLease.token;
    if(suite.name==='transport')testEnv.WORKSPACE_TRANSFER_EVIDENCE_DIR=testEnv.UI_EVIDENCE_DIR;
    await writeJsonAtomically(latest,{status:'running',signature,source:before,sourceStable:false,
      started:new Date().toISOString(),runtime:tc.version,artifacts:testEnv.UI_EVIDENCE_DIR});
    const result=await execute(tc.node,suite.argv,testEnv,join(dir,'run.log'));
    const after=await sourceFingerprint(),stable=after.sha256===before.sha256;
    const hashes=await artifactBundle(testEnv.UI_EVIDENCE_DIR),complete=Boolean(hashes[suite.name==='transport'?'transport.json':'receipt.json']);
    const record={schema:1,suite:suite.name,status:result.exitCode===0&&stable&&complete?'passed':'failed',signature,
      source:before,sourceStable:stable,runtime:tc.version,command:[tc.node,...suite.argv],...result,
      completed:new Date().toISOString(),artifacts:testEnv.UI_EVIDENCE_DIR,
      files:Object.keys(hashes),artifactHashes:hashes,requiredReceiptPresent:complete,scope:suite.name==='public'?'Actual local public frontend; no signed-in/data/hosted proof.':suite.name==='attendance'?'Disposable signed fixture, real browser and worker, fictional identity and disposable database; no hosted, installed-device or Owner proof.':'Local real-component/router fixtures; fictional identity/external adapters; no hosted/installed/Owner proof.',
      modelTokens:'Not measured by this runner; stored artifacts are inspected selectively.'};
    await writeJsonAtomically(latest,record);
    await writeFile(join(dir,'result.json'),JSON.stringify(record,null,2)+'\n',{mode:0o600});
    console.log(JSON.stringify({suite:suite.name,status:record.status,durationMs:record.durationMs,sourceStable:stable,
      receipt:latest,artifacts:record.artifacts,artifactFiles:record.files.length,log:record.log}));
    if(record.status!=='passed'){process.exitCode=1;break;}
  }
  }finally{await verificationLease.release();}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))
  main().catch(error=>{console.error(JSON.stringify({status:'blocked',message:error.message}));process.exitCode=1;});
