// Execute actual worker with provider/queue/database test adapters. No real mail.
import {build} from 'esbuild';import {mkdtemp,writeFile,rm}from'node:fs/promises';import{tmpdir}from'node:os';import{resolve,join}from'node:path';import{pathToFileURL}from'node:url';import assert from'node:assert/strict';import{createRequire}from'node:module';
const require=createRequire(import.meta.url);
const root=resolve(import.meta.dirname,'../..'),temp=await mkdtemp(join(tmpdir(),'academyos-trainer-worker-'));
const adapters={
 state:`export const state={calls:[],jobs:[],claim:{send:true,lease:'00000000-0000-4000-8000-000000000002',recipient:'trainer@example.invalid'}}`,
 server:`import {state}from'test:state';export function onboardingDatabase(){return{}}export async function rpc(client,name,args){state.calls.push({name,args});return args.lease?{send:false}:state.claim;}`,
 jobs:`import{state}from'test:state';export function stagingJobPublisher(){return{publishJSON:async args=>{state.jobs.push(args)}}}`,
 email:`export function stagingEmailConfig(){return {key:'synthetic',from:'Synthetic <test@example.invalid>',to:['trainer@example.invalid'],reply_to:'test@example.invalid'}}`
};
const bundle=await build({stdin:{contents:`export*from'${root}/apps/web/src/lib/trainer-delivery.ts';export{state}from'test:state'`,resolveDir:root},bundle:true,write:false,platform:'node',format:'esm',packages:'external',plugins:[{name:'worker-adapters',setup(b){
 b.onResolve({filter:/^@upstash\/qstash$/},()=>({path:require.resolve('@upstash/qstash'),external:true}));
 b.onResolve({filter:/^server-only$/},()=>({path:'empty',namespace:'fixture'}));b.onResolve({filter:/^test:state$/},()=>({path:'state',namespace:'fixture'}));
 for(const[name,path]of[['server','./onboarding-server'],['jobs','./jobs'],['email','./email']])b.onResolve({filter:new RegExp('^'+path.replaceAll('.','\\.')+'$')},()=>({path:name,namespace:'fixture'}));
 b.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:adapters[a.path]??'',loader:'js'}));}}]});
const originalFetch=globalThis.fetch,prior={APP_ENV:process.env.APP_ENV,ONBOARDING_PROOF_KEY:process.env.ONBOARDING_PROOF_KEY,TRAINER_STAGING_RECIPIENTS:process.env.TRAINER_STAGING_RECIPIENTS};
try{
 process.env.APP_ENV='staging';process.env.ONBOARDING_PROOF_KEY='a'.repeat(64);process.env.TRAINER_STAGING_RECIPIENTS='trainer@example.invalid';
 const file=join(temp,'worker.mjs');await writeFile(file,bundle.outputFiles[0].text);const {deliverTrainer,dispatchTrainer,verifyTrainerDelivery,state}=await import(pathToFileURL(file));
 const id='00000000-0000-4000-8000-000000000001';let sends=[];
 globalThis.fetch=async(url,args)=>{sends.push({url,args});return Response.json({id:'synthetic-provider-id'});};
 await dispatchTrainer(id);assert.deepEqual(state.jobs[0].body,{invitation:id});assert.equal(state.jobs[0].url,'https://staging.academy.nahr.dev/api/jobs/trainers');
 await deliverTrainer(id);assert.equal(sends.length,1);assert.equal(state.calls.at(-1).args.outcome,'accepted');assert.equal(state.calls.at(-1).args.provider,'synthetic-provider-id');
 assert.equal(sends[0].args.headers['Idempotency-Key'],`academyos-trainer/${id}/1`);assert.match(sends[0].args.body,/trainer-invitation#/);assert.match(state.calls[0].args.proof.target,/^trainer:/);
 process.env.TRAINER_STAGING_RECIPIENTS='';state.calls=[];sends=[];await deliverTrainer(id);assert.equal(sends.length,0);assert.equal(state.calls.at(-1).args.outcome,'blocked');
 process.env.TRAINER_STAGING_RECIPIENTS='trainer@example.invalid';state.calls=[];globalThis.fetch=async()=>{throw new Error('Synthetic response loss')};await deliverTrainer(id);assert.equal(state.calls.at(-1).args.outcome,'unknown');
 state.claim={send:false,retry:true};await assert.rejects(deliverTrainer(id));
 assert.equal(await verifyTrainerDelivery('{}','forged'),false);
 console.log(JSON.stringify({trainerDelivery:'passed',cases:['opaque signed queue job','stable provider idempotency','domain-separated worker proof','blocked unauthorized recipient','provider accepted distinct from inbox','unknown provider result','lease retry','forged callback denial'],scope:'actual worker; synthetic provider/queue/database adapters, no mail'}));
}finally{globalThis.fetch=originalFetch;for(const[k,v]of Object.entries(prior))if(v===undefined)delete process.env[k];else process.env[k]=v;await rm(temp,{recursive:true,force:true});}
