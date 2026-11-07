// Actual API route with test-only provider/limiter adapters. Tests ordering and
// failure responses; never substitutes for real identity/RLS/hosted evidence.
import { build } from 'esbuild';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const require=createRequire(import.meta.url), root=resolve(import.meta.dirname,'../..');
const adapters={
 state:`export const state={results:[],budgets:[],provider:0,rpc:0,dispatch:0};`,
 server:`import {state} from 'test:state';export class JourneyError extends Error{constructor(code,http=503){super(code);this.code=code;this.http=http;}}export async function onboardingSession(){return {subject:'user_synthetic',client:{}};}export async function recipientProof(){state.provider++;return {};}export async function rpc(){state.rpc++;return {synthetic:true};}`,
 limiter:`import {state} from 'test:state';export function stagingRedis(){return {};}export function stagingLimiter(redis,prefix,limit){return {limit:async()=>{state.budgets.push({prefix,limit});const r=state.results.shift();if(r==='unavailable')throw new Error('synthetic outage');return r??{success:true};}};}export function rateLimitSubject(){return 'synthetic-hash';}export function rateLimitAllowed(r){return r.success&&r.reason!=='timeout';}`,
 delivery:`import {state} from 'test:state';export async function dispatchInvitation(){state.dispatch++;}`,
};
const compiled=await build({stdin:{contents:`export {POST} from '${root}/apps/web/src/app/api/programs/route.ts';export {state} from 'test:state';export {NextRequest} from 'next/server';`,resolveDir:root},bundle:true,write:false,format:'esm',platform:'node',packages:'external',plugins:[{name:'test-only-api-adapters',setup(b){
 b.onResolve({filter:/^test:state$/},()=>({path:'state',namespace:'test'}));
 for(const [name,path] of [['server','@/lib/onboarding-server'],['limiter','@/lib/rate-limit'],['delivery','@/lib/onboarding-delivery']])b.onResolve({filter:new RegExp('^'+path+'$')},()=>({path:name,namespace:'test'}));
 b.onResolve({filter:/^next\/server$/},()=>({path:require.resolve('next/server'),external:true}));
 b.onLoad({filter:/.*/,namespace:'test'},a=>({contents:adapters[a.path],loader:'js'}));
}}]});
const temp=await mkdtemp(join(tmpdir(),'academyos-api-budget-'));
const previous={APP_ENV:process.env.APP_ENV,ONBOARDING_PROOF_KEY:process.env.ONBOARDING_PROOF_KEY};
try{
 process.env.APP_ENV='staging';process.env.ONBOARDING_PROOF_KEY='a'.repeat(64);
 const file=join(temp,'route.mjs');await writeFile(file,compiled.outputFiles[0].text);
 const {POST,NextRequest,state}=await import(pathToFileURL(file));
 const send=body=>POST(new NextRequest('https://staging.academy.nahr.dev/api/programs',{method:'POST',headers:{origin:'https://staging.academy.nahr.dev','content-type':'application/json'},body:JSON.stringify(body)}));
 function reset(results){state.results=results;state.budgets=[];state.provider=state.rpc=state.dispatch=0;}
 const academy='00000000-0000-4000-8000-000000000001',op='00000000-0000-4000-8000-000000000002';
 const definition={name:'Demo',from:'2026-11-01',to:'2027-01-31',rules:[{day:0,start:'17:00',end:'18:00'}]};
 const cases=[{action:'list',academy},{action:'preview',academy,definition,context:3,window:0},{action:'read',academy,program:op,window:0},{action:'create',academy,definition,context:3,op,receipt:{through:3,digest:'a'.repeat(64),signature:'b'.repeat(64)}},{action:'step',academy,program:op,version:1,step:'prepare'},{action:'reconcile',academy,op},{action:'dates',academy,from:'2026-11-01'}];
 for(const body of cases)for(const result of [{success:false},{success:true,reason:'timeout'},'unavailable']){
  reset([result]);const r=await send(body);assert.equal(r.status,result==='unavailable'?503:429);assert.equal(state.rpc,0);assert.equal(r.headers.get('cache-control'),'no-store');
  const write=['create','step','reconcile'].includes(body.action);assert.deepEqual(state.budgets,[{prefix:write?'onboarding-entry-write':'onboarding-entry-read',limit:write?10:60}]);
 }
 reset([]);let r=await send(cases[0]);assert.equal(r.status,200);assert.equal(state.rpc,1);
 for(const body of [{...cases[3],role:'owner'},{...cases[3],definition:{...definition,rules:[{day:0,start:'23:00',end:'01:00'}]}},{...cases[3],definition:{...definition,name:'x'.repeat(9000)}}]){reset([]);r=await send(body);assert.ok([413,422].includes(r.status));assert.equal(state.rpc,0);}
 reset([]);r=await POST(new NextRequest('https://staging.academy.nahr.dev/api/programs',{method:'POST',headers:{origin:'https://attacker.example','content-type':'application/json'},body:JSON.stringify(cases[0])}));assert.equal(r.status,403);assert.equal(state.rpc,0);
 console.log(JSON.stringify({programsApi:'passed',budgetFailures:21,invalidBodies:3,crossOriginDenied:true,scope:'actual route; synthetic limiter/session adapters'}));
}finally{
 for(const [name,value] of Object.entries(previous))if(value===undefined)delete process.env[name];else process.env[name]=value;
 await rm(temp,{recursive:true,force:true});
}
