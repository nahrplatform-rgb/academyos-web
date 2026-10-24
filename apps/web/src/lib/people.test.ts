import test from 'node:test';
import assert from 'node:assert/strict';
import {peopleRequest,PeopleInputError} from './people';
import {gatewayRequest,DATABASE_ORIGIN} from './onboarding-gateway';
const academy='00000000-0000-4000-8000-000000000001',branch='00000000-0000-4000-8000-000000000002',op='00000000-0000-4000-8000-000000000003';
const valid={action:'create',academy,branch,op,name:' Alex Demo ',contact:'CONTACT@example.invalid',revision:0,different:false};
test('people requests use only named gateways; recovery consumes write budget',()=>{
 for(const [action,fields,rpc,mutating] of [['list',{},'i2_people_v1',false],['candidates',{name:'Demo'},'i2_candidates_v1',false],['profile',{player:op},'i2_profile_v1',false],['create',valid,'i2_register_v1',true],['reconcile',{op},'i2_operation_v1',true]] as const){
  const r=peopleRequest({academy,action,...fields});assert.equal(r.rpc,rpc);assert.equal(r.mutating,mutating);
  assert.equal(gatewayRequest(`${DATABASE_ORIGIN}/rest/v1/rpc/${rpc}`,{method:'POST',body:JSON.stringify(r.args)}).mutating,mutating);
 }
 const r=peopleRequest(valid);assert.equal(r.args.display_name,'Alex Demo');assert.equal(r.args.contact,'contact@example.invalid');
});
test('people rejects unexpected privilege fields, malformed intents and non-fictional contacts',()=>{
 for(const input of [null,[],{...valid,academy:'foreign'},{...valid,name:' '},{...valid,name:'x'.repeat(161)},{...valid,contact:'user@example.org'},{...valid,contact:'a,b@example.invalid'},{...valid,revision:NaN},{...valid,revision:-1},{...valid,different:'true'},{...valid,role:'owner'},{...valid,fields:{consent:true}},{action:'list',academy,query:'a'},{action:'unknown',academy}])assert.throws(()=>peopleRequest(input),PeopleInputError);
});
