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
const sharp=require('sharp');
const adapters={
 state:`export const state={results:[],budgets:[],provider:0,rpc:0,dispatch:0};`,
 server:`import {state} from 'test:state';export class JourneyError extends Error{constructor(code,http=503){super(code);this.code=code;this.http=http;}}export async function onboardingSession(){return {subject:'user_synthetic',client:{}};}export async function recipientProof(){state.provider++;return {};}export async function rpc(client,name,args){state.rpc++;state.lastRpc={name,args};return {synthetic:true};}`,
 limiter:`import {state} from 'test:state';export function stagingRedis(){return {};}export function stagingLimiter(redis,prefix,limit){return {limit:async()=>{state.budgets.push({prefix,limit});const r=state.results.shift();if(r==='unavailable')throw new Error('synthetic outage');return r??{success:true};}};}export function rateLimitSubject(){return 'synthetic-hash';}export function rateLimitAllowed(r){return r.success&&r.reason!=='timeout';}`,
 delivery:`import {state} from 'test:state';export async function dispatchInvitation(){state.dispatch++;}`,
};
const compiled=await build({stdin:{contents:`export {POST} from '${root}/apps/web/src/app/api/people/route.ts';export {state} from 'test:state';export {NextRequest} from 'next/server';`,resolveDir:root},bundle:true,write:false,format:'esm',platform:'node',packages:'external',plugins:[{name:'test-only-api-adapters',setup(b){
 b.onResolve({filter:/^test:state$/},()=>({path:'state',namespace:'test'}));
 for(const [name,path] of [['server','@/lib/onboarding-server'],['limiter','@/lib/rate-limit'],['delivery','@/lib/onboarding-delivery']])b.onResolve({filter:new RegExp('^'+path+'$')},()=>({path:name,namespace:'test'}));
 b.onResolve({filter:/^next\/server$/},()=>({path:require.resolve('next/server'),external:true}));
 b.onResolve({filter:/^sharp$/},()=>({path:require.resolve('sharp'),external:true}));
 b.onLoad({filter:/.*/,namespace:'test'},a=>({contents:adapters[a.path],loader:'js'}));
}}]});
const temp=await mkdtemp(join(tmpdir(),'academyos-api-budget-'));
const previous={PLAYER_PROFILE_LIFECYCLE_TRIAL:process.env.PLAYER_PROFILE_LIFECYCLE_TRIAL,APP_ENV:process.env.APP_ENV,ONBOARDING_PROOF_KEY:process.env.ONBOARDING_PROOF_KEY,PLAYER_PRIVATE_PROFILE_TRIAL:process.env.PLAYER_PRIVATE_PROFILE_TRIAL,PLAYER_NAME_CORRECTION_TRIAL:process.env.PLAYER_NAME_CORRECTION_TRIAL};
try{
 process.env.APP_ENV='staging';process.env.ONBOARDING_PROOF_KEY='a'.repeat(64);
 const file=join(temp,'route.mjs');await writeFile(file,compiled.outputFiles[0].text);
 const {POST,NextRequest,state}=await import(pathToFileURL(file));
 const send=(body,headers={})=>POST(new NextRequest('https://staging.academy.nahr.dev/api/people',{method:'POST',headers:{origin:'https://staging.academy.nahr.dev','content-type':'application/json',...headers},body:JSON.stringify(body)}));
 function reset(results){state.results=results;state.budgets=[];state.provider=state.rpc=state.dispatch=0;}
 const academy='00000000-0000-4000-8000-000000000001',op='00000000-0000-4000-8000-000000000002';
 const savePrivate={action:'savePrivateProfile',academy,player:op,op,version:0,changes:{legacyId:' 001 ',nationalId:null}};
 const readPrivate={action:'privateProfile',academy,player:op};
 const correctNames={action:'correctNames',academy,player:op,op,version:1,name:' Corrected Fixture ',alternateName:'',revision:0,different:false};
 const archive={action:'setArchived',academy,player:op,op,version:1,archived:true};
 const archivedList={action:'archivedList',academy,query:'Demo'};
 const extendedRead={...readPrivate,action:'extendedPrivateProfile'};
 const extendedSave={...savePrivate,action:'saveExtendedPrivateProfile',changes:{dateOfBirth:'2014-02-01',primaryPhone:null}};
 delete process.env.PLAYER_PROFILE_LIFECYCLE_TRIAL;
 const findMember={action:'findMember',academy,kind:'existing',reference:' 001 '};
 delete process.env.PLAYER_PRIVATE_PROFILE_TRIAL;
 delete process.env.PLAYER_NAME_CORRECTION_TRIAL;
 for(const body of [readPrivate,savePrivate,findMember,correctNames,archive,archivedList,extendedRead,extendedSave]){
  reset([]);assert.equal((await send(body)).status,403);assert.equal(state.rpc,0);
 }
 process.env.PLAYER_PRIVATE_PROFILE_TRIAL='true';
 process.env.PLAYER_NAME_CORRECTION_TRIAL='true';
 process.env.PLAYER_PROFILE_LIFECYCLE_TRIAL='true';
 const cases=[{action:'list',academy},{action:'candidates',academy,name:'Demo'},{action:'profile',academy,player:op},{action:'create',academy,branch:op,op,name:'Demo',contact:'',revision:0,different:false},{action:'reconcile',academy,op},readPrivate,savePrivate,findMember,correctNames,archive,archivedList,extendedRead,extendedSave];
 for(const body of cases)for(const result of [{success:false},{success:true,reason:'timeout'},'unavailable']){
  reset([result]);const r=await send(body);assert.equal(r.status,result==='unavailable'?503:429);assert.equal(state.rpc,0);assert.equal(r.headers.get('cache-control'),'no-store');
  const write=['create','reconcile','savePrivateProfile','correctNames','setArchived','saveExtendedPrivateProfile'].includes(body.action);assert.deepEqual(state.budgets,[{prefix:write?'onboarding-entry-write':'onboarding-entry-read',limit:write?10:60}]);
 }
 reset([]);let r=await send(cases[0]);assert.equal(r.status,200);assert.equal(state.rpc,1);
 for(const alternateName of ['', '  Layla Adel  ']){
  reset([]);r=await send({...cases[3],alternateName});assert.equal(r.status,200);
  const alternate=alternateName.trim();
  assert.equal(state.lastRpc.name,alternate?'i2_register_v2':'i2_register_v1');
  assert.equal(state.lastRpc.args.alternate_name,alternate||undefined);
  assert.deepEqual(state.budgets,[{prefix:'onboarding-entry-write',limit:10}]);
 }
 for(const body of [{...cases[3],alternateName:42},{...cases[3],alternateName:'a'.repeat(161)},{...cases[3],role:'owner'},{...cases[3],contact:'not-fictional@example.org'},{...cases[3],name:'x'.repeat(5000)}]){reset([]);r=await send(body);assert.ok([413,422].includes(r.status));assert.equal(state.rpc,0);}
 reset([]);r=await POST(new NextRequest('https://staging.academy.nahr.dev/api/people',{method:'POST',headers:{origin:'https://attacker.example','content-type':'application/json'},body:JSON.stringify(cases[0])}));assert.equal(r.status,403);assert.equal(state.rpc,0);
 for (const [body,name,args] of [
  [archive,'i2_set_player_archived_v1',{a:academy,player:op,op,expected_version:1,archived:true}],
  [archivedList,'i2_archived_people_v1',{a:academy,after_id:null,query:'Demo'}],
  [extendedRead,'i2_private_profile_v2',{a:academy,player:op,reveal_id:false}],
  [extendedSave,'i2_save_private_profile_v2',{a:academy,player:op,op,expected_version:0,changes:extendedSave.changes}],
  [readPrivate,'i2_private_profile_v1',{a:academy,player:op,reveal_id:false}],
  [{...readPrivate,revealId:true},'i2_private_profile_v1',{a:academy,player:op,reveal_id:true}],
  [savePrivate,'i2_save_private_profile_v1',{a:academy,player:op,op,expected_version:0,changes:{legacyId:'001',nationalId:null}}],
  [findMember,'i2_find_member_v1',{a:academy,id_kind:'existing',reference:'001'}],
 ]) {
  reset([]);r=await send(body);assert.equal(r.status,200);assert.equal(r.headers.get('cache-control'),'no-store');
  assert.deepEqual(state.lastRpc,{name,args});
 }
 for (const body of [{...readPrivate,revealId:'true'},{...savePrivate,changes:{photoUrl:'fixture'}},{...savePrivate,version:-1},{...findMember,kind:'generated'}]){
  reset([]);r=await send(body);assert.equal(r.status,422);assert.equal(state.rpc,0);
 }
 reset([]);r=await send(correctNames);assert.equal(r.status,200);assert.equal(r.headers.get('cache-control'),'no-store');
 assert.deepEqual(state.lastRpc,{name:'i2_correct_player_names_v1',args:{
  a:academy,player:op,op,expected_version:1,display_name:'Corrected Fixture',alternate_name:'',
  reviewed_revision:0,different_person:false,
 }});
 for(const body of [{...correctNames,version:0},{...correctNames,academyMemberNumber:'99'}]){
  reset([]);assert.equal((await send(body)).status,422);assert.equal(state.rpc,0);
 }
 const photo={action:'savePrivatePhoto',academy,player:op,op,version:0,image:null};
 const upload={'x-academyos-photo-upload':'1'};
 const png=await sharp({create:{width:300,height:220,channels:3,background:'#146ca5'}}).png().toBuffer();
 reset([]);r=await send({...photo,image:png.toString('base64')},upload);
 assert.equal(r.status,200);assert.equal(state.lastRpc.name,'i2_save_private_photo_v1');
 assert.equal(r.headers.get('cache-control'),'no-store');
 const normalized=await sharp(Buffer.from(state.lastRpc.args.photo_base64,'base64')).metadata();
 assert.equal(normalized.format,'jpeg');assert.equal(normalized.width,192);assert.equal(normalized.exif,undefined);
 for(const [body,status] of [[{...photo,image:'bm90IGFuIGltYWdl'},422],[{...photo,image:'A'.repeat(701000)},413],[readPrivate,422]]){
  reset([]);r=await send(body,upload);assert.equal(r.status,status);assert.equal(state.rpc,0);
 }
 reset([]);delete process.env.PLAYER_PRIVATE_PROFILE_TRIAL;
 assert.equal((await send(photo,upload)).status,403);assert.equal(state.rpc,0);
 console.log(JSON.stringify({peopleApi:'passed',budgetFailures:cases.length*3,privateRoutingCases:4,nameCorrectionRouting:true,photoNormalizationAndRefusal:true,crossOriginDenied:true,scope:'actual route; synthetic limiter/session adapters'}));
}finally{
 for(const [name,value] of Object.entries(previous))if(value===undefined)delete process.env[name];else process.env[name]=value;
 await rm(temp,{recursive:true,force:true});
}
