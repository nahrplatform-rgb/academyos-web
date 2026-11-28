import assert from 'node:assert/strict';
import {beforeEach, test} from 'node:test';
import {cleanRegisterAccountSlots, readRegisterSlot, subscribeRegisterSlot, writeRegisterSlot, type RegisterSlot} from './register-device-slots';

const subject='user_owner', academy='11111111-1111-4111-8111-111111111111';
const a='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', b='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const device='dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const v1=`academyos.register-slot.v1:${subject}:${academy}`;
const v2=(event:string)=>`academyos.register-slot.v2:${subject}:${academy}:${event}`;
const slot=(event:string):RegisterSlot=>({device,event,namespace:null,generation:1,mode:'reserved'});
class MemoryStorage {
  data=new Map<string,string>();
  get length(){return this.data.size;}
  key(i:number){return [...this.data.keys()][i]??null;}
  getItem(k:string){return this.data.get(k)??null;}
  setItem(k:string,v:string){this.data.set(k,v);}
}
let storage:MemoryStorage, events:EventTarget;
beforeEach(()=>{
  storage=new MemoryStorage(); events=new EventTarget();
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:storage});
  Object.defineProperty(globalThis,'window',{configurable:true,value:events});
  Object.defineProperty(globalThis,'navigator',{configurable:true,value:{locks:{request:async (_name:string,work:()=>unknown)=>work()}}});
});

test('event lookup and notifications preserve legacy bytes while creating independent entries',()=>{
  const legacy=JSON.stringify(slot(a),null,2); storage.setItem(v1,legacy);
  let aCalls=0,bCalls=0;
  const stopA=subscribeRegisterSlot(subject,academy,a,()=>aCalls++);
  const stopB=subscribeRegisterSlot(subject,academy,b,()=>bCalls++);
  writeRegisterSlot(subject,academy,slot(b));
  assert.equal(storage.getItem(v1),legacy);
  assert.deepEqual(readRegisterSlot(subject,academy,a),slot(a));
  assert.deepEqual(readRegisterSlot(subject,academy,b),slot(b));
  assert.deepEqual([aCalls,bCalls],[0,1]);
  writeRegisterSlot(subject,academy,{...slot(a),generation:2});
  assert.equal(JSON.parse(storage.getItem(v1)!).generation,2);
  assert.deepEqual([aCalls,bCalls],[1,1]);
  stopA(); stopB();
});

test('mismatched, malformed and ambiguous entries fail closed',()=>{
  storage.setItem(v2(a),JSON.stringify(slot(b)));
  assert.throws(()=>readRegisterSlot(subject,academy,a));
  assert.throws(()=>writeRegisterSlot(subject,academy,slot(a)));
  storage.setItem(v2(a),'{'); assert.throws(()=>readRegisterSlot(subject,academy,a));
  storage.setItem(v2(a),JSON.stringify(slot(a))); storage.setItem(v1,JSON.stringify(slot(a)));
  assert.throws(()=>readRegisterSlot(subject,academy,a),/register_locator_ambiguous/);
  assert.throws(()=>writeRegisterSlot(subject,academy,slot(a)),/register_locator_ambiguous/);
});

test('cleanup seals independent reserved entries even when another is invalid',async()=>{
  storage.setItem(v1,JSON.stringify(slot(a))); storage.setItem(v2(b),JSON.stringify(slot(b)));
  const other='cccccccc-cccc-4ccc-8ccc-cccccccccccc'; storage.setItem(v2(other),'{');
  await assert.rejects(cleanRegisterAccountSlots(subject),/register_account_cleanup_incomplete/);
  assert.equal(JSON.parse(storage.getItem(v1)!).mode,'sealed');
  assert.equal(JSON.parse(storage.getItem(v2(b))!).mode,'sealed');
  assert.equal(storage.getItem(v2(other)),'{');
});
