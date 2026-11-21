import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('../../apps/web/public/prepared-workspace-worker.js',import.meta.url),'utf8');
test('the editing-origin worker retires without intercepting assets or touching protected stores',async()=>{
  const events={},calls=[];
  const self={location:{origin:'http://localhost:3000'},registration:{unregister:async()=>{calls.push('unregister');return true;}},
    clients:{claim:async()=>calls.push('claim')},skipWaiting:async()=>{},addEventListener:(name,handler)=>events[name]=handler};
  vm.runInNewContext(source,{self,URL});
  let pending;events.activate({waitUntil:p=>pending=p});await pending;
  events.fetch({respondWith:()=>{throw new Error('must not intercept HMR');}});
  events.message({ports:[{postMessage:value=>calls.push(value)}]});
  assert.deepEqual(calls,['unregister','unavailable']);
});
