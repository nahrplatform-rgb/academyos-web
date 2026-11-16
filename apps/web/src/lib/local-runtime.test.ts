import test from 'node:test';
import assert from 'node:assert/strict';
import {localRuntime} from './local-runtime';
const dev={instance:'00000000-0000-4000-8000-000000000000',mode:'dev'};
test('local runtime identity is closed outside an explicitly launched localhost app',()=>{
  const env={ACADEMYOS_LOCAL_RUNTIME:JSON.stringify({...dev,private:'must not return'})};
  assert.deepEqual(localRuntime(env,'http://localhost:3000'),{...dev,sourceHash:null,buildId:null});
  for(const origin of ['https://staging.academy.nahr.dev','http://127.0.0.1:3000','http://localhost:3999'])assert.equal(localRuntime(env,origin),null);
  assert.equal(localRuntime({...env,VERCEL:'1'},'http://localhost:3000'),null);
  assert.equal(localRuntime({},'http://localhost:3000'),null);
  assert.equal(localRuntime({ACADEMYOS_LOCAL_RUNTIME:'invalid'},'http://localhost:3000'),null);
});
test('production identity requires its compiled build and returns only public provenance',()=>{
  assert.equal(localRuntime({ACADEMYOS_LOCAL_RUNTIME:JSON.stringify({...dev,mode:'production'})},'http://localhost:3100'),null);
  const expected={...dev,mode:'production',sourceHash:'a'.repeat(64),buildId:'fixture-build'};
  assert.deepEqual(localRuntime({ACADEMYOS_LOCAL_RUNTIME:JSON.stringify(expected)},'http://localhost:3100'),expected);
});
