// Exercises the actual Next POST handler with synthetic session/RPC/limiter adapters.
// Fake receipts test HTTP shape only; they are not PostgreSQL or security proof.
import {build} from 'esbuild';
import assert from 'node:assert/strict';
import {mkdtemp, writeFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve, join} from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';

const require = createRequire(import.meta.url);
const root = resolve(import.meta.dirname, '../..');
const adapters = {
  state: `export const state={auth:0,subject:'user_synthetic',authError:null,rpcError:null,rpcCalls:[],data:{synthetic:true},budgets:[],limitResult:{success:true}};`,
  server: `import {state} from 'test:state';
    export class JourneyError extends Error {constructor(code,http=503){super(code);this.code=code;this.http=http;}}
    export async function onboardingSession(){state.auth++;if(state.authError)throw new JourneyError(...state.authError);return {subject:state.subject,client:{synthetic:true}};}
    export async function rpc(client,name,args){state.rpcCalls.push({client,name,args});if(state.rpcError){if(state.rpcError[0]==='gateway')throw new GatewayError(state.rpcError[1],state.rpcError[2]);throw new JourneyError(...state.rpcError);}return state.data;}
    import {GatewayError} from '@/lib/onboarding-gateway';`,
  gateway: `export class GatewayError extends Error {constructor(code,http){super(code);this.code=code;this.http=http;}}`,
  limiter: `import {state} from 'test:state';export function stagingRedis(){return {};}
    export function stagingLimiter(redis,prefix,limit){return {limit:async(subject)=>{state.budgets.push({prefix,limit,subject});if(state.limitResult==='unavailable')throw new Error('synthetic outage');return state.limitResult;}};}
    export function rateLimitSubject(subject){return 'hash:'+subject;}
    export function rateLimitAllowed(result){return result.success&&result.reason!=='timeout';}`,
};
const compiled = await build({stdin:{contents:`export {POST} from '${root}/apps/web/src/app/api/workspace-download/route.ts'; export {state} from 'test:state'; export {NextRequest} from 'next/server';`,resolveDir:root},bundle:true,write:false,format:'esm',platform:'node',packages:'external',plugins:[{name:'workspace-test-adapters',setup(b){
  b.onResolve({filter:/^test:state$/},()=>({path:'state',namespace:'test'}));
  for(const [name,path] of [['server','@/lib/onboarding-server'],['gateway','@/lib/onboarding-gateway'],['limiter','@/lib/rate-limit']]) b.onResolve({filter:new RegExp('^'+path+'$')},()=>({path:name,namespace:'test'}));
  b.onResolve({filter:/^next\/server$/},()=>({path:require.resolve('next/server'),external:true}));
  b.onLoad({filter:/.*/,namespace:'test'},args=>({contents:adapters[args.path],loader:'js'}));
}}]});
const temp = await mkdtemp(join(tmpdir(),'academyos-workspace-api-'));
const previous = Object.fromEntries(['APP_ENV','OWNER_WORKSPACE_TRANSFER_ENABLED'].map(key=>[key,process.env[key]]));
try {
  process.env.APP_ENV='staging'; process.env.OWNER_WORKSPACE_TRANSFER_ENABLED='true';
  const file=join(temp,'route.mjs'); await writeFile(file,compiled.outputFiles[0].text);
  const {POST,NextRequest,state}=await import(pathToFileURL(file));
  const origin='https://staging.academy.nahr.dev', url=origin+'/api/workspace-download';
  const academy='00000000-0000-4000-8000-000000000001';
  const device='00000000-0000-4000-8000-000000000002';
  const ns='00000000-0000-4000-8000-000000000003';
  const subject='user_synthetic', month='2026-11-01';
  const seed={payload:{v:1,a:academy,device,ns,epoch:1,scope:'a'.repeat(64),dataset:'people',first:null,last:null,revision:'0',total:null,seen:0,cursor:null,acc:'b'.repeat(64),issued:1794000000,phase:'seed'},signature:'c'.repeat(64)};
  const transfer={...seed,payload:{...seed.payload,phase:'transfer',total:0}};
  const headers={origin,'content-type':'application/json','x-academyos-workspace-device':device,'x-academyos-workspace-namespace':ns,'x-academyos-original-subject':subject};
  const reset=()=>Object.assign(state,{auth:0,subject,authError:null,rpcError:null,rpcCalls:[],data:{synthetic:true},budgets:[],limitResult:{success:true}});
  const send=(body,options={})=>POST(new NextRequest(options.url??url,{method:options.method??'POST',headers:{...headers,...options.headers},...(options.method==='GET'?{}:{body:options.raw??JSON.stringify(body)})}));
  const secure=r=>{assert.equal(r.headers.get('cache-control'),'no-store');assert.equal(r.headers.get('referrer-policy'),'no-referrer');};
  const failed=async(body,expected,options={})=>{reset();const r=await send(body,options);assert.equal(r.status,expected);secure(r);assert.equal(state.auth,0);assert.equal(state.budgets.length,0);assert.equal(state.rpcCalls.length,0);return r;};
  const manifest={action:'manifest',academy,month};

  // Disabled operation must never authenticate, consume a limiter, or call SQL.
  for(const [app,flag] of [['staging','false'],['staging',undefined],['production','true']]) {
    reset();process.env.APP_ENV=app;if(flag===undefined)delete process.env.OWNER_WORKSPACE_TRANSFER_ENABLED;else process.env.OWNER_WORKSPACE_TRANSFER_ENABLED=flag;
    const r=await send(manifest);assert.equal(r.status,app==='staging'?503:403);secure(r);assert.equal(state.auth,0);assert.equal(state.budgets.length,0);assert.equal(state.rpcCalls.length,0);
  }
  process.env.APP_ENV='staging';process.env.OWNER_WORKSPACE_TRANSFER_ENABLED='true';
  await failed(manifest,403,{headers:{origin:'https://attacker.example'}});
  await failed(manifest,403,{url:'https://attacker.example/api/workspace-download',headers:{origin:'https://attacker.example'}});
  await failed(manifest,403,{method:'GET'});
  await failed(manifest,403,{headers:{'content-type':'text/plain'}});
  await failed(null,422,{raw:'{'});
  for(const body of [
    {action:'manifest',academy,unexpected:true}, {action:'manifest',academy,month:'2026-11-02'},
    {action:'page',academy}, {action:'complete',academy,receipt:seed,month},
    {action:'unknown',academy}, {action:'manifest',academy:'not-a-uuid'},
  ]) await failed(body,422);
  for(const key of ['x-academyos-workspace-device','x-academyos-workspace-namespace','x-academyos-original-subject']) {
    await failed(manifest,422,{headers:{[key]:''}});
  }
  await failed(manifest,422,{headers:{'x-academyos-workspace-device':'invalid'}});
  // Actual streamed bytes, not just a declared length, must enforce the limit.
  for(const length of [undefined,'1']) {
    const h=length===undefined?{}:{'content-length':length};
    await failed(null,413,{headers:h,raw:JSON.stringify({...manifest,pad:'界'.repeat(3000)})});
  }
  await failed(manifest,413,{headers:{'content-length':'8193'}});
  reset();state.subject='user_other';let r=await send(manifest);assert.equal(r.status,403);secure(r);assert.equal(state.auth,1);assert.equal(state.budgets.length,0);assert.equal(state.rpcCalls.length,0);
  for(const result of [{success:false},{success:true,reason:'timeout'},'unavailable']) {
    reset();state.limitResult=result;r=await send(manifest);assert.equal(r.status,result==='unavailable'?503:429);secure(r);assert.equal(state.rpcCalls.length,0);assert.deepEqual(state.budgets,[{prefix:'onboarding-entry-read',limit:60,subject:'hash:'+subject}]);
  }
  for(const [error,status] of [[['denied',401],401],[['gateway','limited',429],429]]) {
    reset();if(error[0]==='gateway')state.rpcError=error;else state.authError=error;
    r=await send(manifest);assert.equal(r.status,status);secure(r);
  }
  const cases=[
    [manifest,'manifest',null,month], [{action:'manifest',academy},'manifest',null,null],
    [{action:'page',academy,receipt:seed},'page',seed,null],
    [{action:'resume',academy,receipt:seed},'resume',seed,null],
    [{action:'complete',academy,receipt:transfer},'complete',transfer,null],
  ];
  for(const [body,act,previousReceipt,anchor] of cases) {
    reset();r=await send(body);assert.equal(r.status,200);secure(r);assert.deepEqual(await r.json(),{data:{synthetic:true}});
    assert.equal(state.auth,1);assert.deepEqual(state.budgets,[{prefix:'onboarding-entry-read',limit:60,subject:'hash:'+subject}]);
    assert.deepEqual(state.rpcCalls,[{client:{synthetic:true},name:'x21_workspace_transfer_v1',args:{a:academy,device,ns,expected_subject:subject,act,previous:previousReceipt,month_anchor:anchor}}]);
  }
  reset();state.data={blob:'界'.repeat(11000)};r=await send(manifest);assert.equal(r.status,503);secure(r);assert.ok(Buffer.byteLength(await r.text(),'utf8')<32768);
  console.log(JSON.stringify({workspaceDownloadApi:'passed',scope:'actual POST handler; synthetic adapters and receipt shape only'}));
} finally {
  for(const [key,value] of Object.entries(previous))if(value===undefined)delete process.env[key];else process.env[key]=value;
  await rm(temp,{recursive:true,force:true});
}
