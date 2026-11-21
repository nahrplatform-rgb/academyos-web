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
const compiled=await build({stdin:{contents:`export {POST} from '${root}/apps/web/src/app/api/onboarding/route.ts';export {state} from 'test:state';export {NextRequest} from 'next/server';`,resolveDir:root},bundle:true,write:false,format:'esm',platform:'node',packages:'external',plugins:[{name:'test-only-api-adapters',setup(b){
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
 const send=body=>POST(new NextRequest('https://staging.academy.nahr.dev/api/onboarding',{method:'POST',headers:{origin:'https://staging.academy.nahr.dev','content-type':'application/json'},body:JSON.stringify(body)}));
 function reset(results){state.results=results;state.budgets=[];state.provider=state.rpc=state.dispatch=0;}
 for(const action of ['review','accept','setup','save','create'])for(const result of [{success:false},{success:true,reason:'timeout'}]){
  reset([result]);const r=await send({action});assert.equal(r.status,429);assert.deepEqual(await r.json(),{error:'limited'});assert.equal(r.headers.get('cache-control'),'no-store');assert.equal(state.provider+state.rpc+state.dispatch,0);
  assert.deepEqual(state.budgets,[{prefix:['accept','save','create'].includes(action)?'onboarding-entry-write':'onboarding-entry-read',limit:['accept','save','create'].includes(action)?10:60}]);
 }
 reset(['unavailable']);let r=await send({action:'review'});assert.equal(r.status,503);assert.deepEqual(await r.json(),{error:'unavailable'});assert.equal(state.provider+state.rpc+state.dispatch,0);
 for(const results of [[{success:false}],[{success:true},{success:false}],[{success:true,reason:'timeout'}]]){
  reset(results);r=await send({action:'exchange',invitation:'00000000-0000-4000-8000-000000000001',token:'b'.repeat(64)});assert.equal(r.status,429);assert.equal(r.headers.has('set-cookie'),false);assert.equal(state.provider+state.rpc+state.dispatch,0);
  assert.equal(state.budgets[0].prefix,'exchange-network');if(results.length===2)assert.equal(state.budgets[1].prefix,'exchange-global');
 }
 // Positive control: adapters are wired; an allowed setup actually reaches RPC.
 reset([{success:true}]);r=await send({action:'setup',academy:'00000000-0000-4000-8000-000000000001'});assert.equal(r.status,200);assert.equal(state.rpc,1);
 console.log(JSON.stringify({apiBudget:'passed',cases:15,providerCallsOnDeniedEntry:0,cookieOnDeniedExchange:false,scope:'actual route; synthetic limiter/session/provider adapters'}));
}finally{
 for(const [name,value] of Object.entries(previous))if(value===undefined)delete process.env[name];else process.env[name]=value;
 await rm(temp,{recursive:true,force:true});
}
