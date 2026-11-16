import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {createServer} from 'node:net';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {acquireResource,assertPortFree,assertRuntime,readRuntime} from './runtime.mjs';

test('overlapping launch/build owners cannot both mutate the shared resource',async()=>{
  const root=await mkdtemp(join(tmpdir(),'academyos-resource-'));
  try{
    const attempts=await Promise.allSettled(Array.from({length:6},()=>acquireResource(root,'web-build')));
    const winners=attempts.filter(x=>x.status==='fulfilled');assert.equal(winners.length,1);
    const lease=winners[0].value;
    await assert.rejects(acquireResource(root,'web-build',{inherited:'wrong-token'}),/already owned/);
    const child=await acquireResource(root,'web-build',{inherited:lease.token});
    await child.release();await assert.rejects(acquireResource(root,'web-build'),/already owned/);
    await lease.release();const next=await acquireResource(root,'web-build');await next.release();
  }finally{await rm(root,{recursive:true,force:true});}
});
test('a stopped owner is reported without racing to replace another launcher',async()=>{
  const root=await mkdtemp(join(tmpdir(),'academyos-stale-owner-'));let lease;
  try{
    lease=await acquireResource(root,'server-production');
    const before=await readFile(join(root,'test-results/local-workflow/locks/server-production/owner.json'),'utf8');
    await assert.rejects(acquireResource(root,'server-production',{ownerAlive:()=>false}),/Stopped process/);
    assert.equal(await readFile(join(root,'test-results/local-workflow/locks/server-production/owner.json'),'utf8'),before);
  }finally{await lease?.release();await rm(root,{recursive:true,force:true});}
});
test('an occupied listener is refused and left serving before any build can run',async()=>{
  const server=createServer(socket=>socket.end('existing-server'));
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const port=server.address().port;
  try{await assert.rejects(assertPortFree(port),/already serving/);assert.equal(server.listening,true);}
  finally{await new Promise(resolve=>server.close(resolve));}
  await assertPortFree(port);
});
test('HTML success, a foreign instance and a stale build never count as the checked runtime',()=>{
  const expected={instance:'current',mode:'production',sourceHash:'source',buildId:'build'};
  for(const actual of [{status:'unidentified',http:200},{status:'responding',runtime:{...expected,instance:'old'}},
    {status:'responding',runtime:{...expected,buildId:'old'}},{status:'responding',runtime:{...expected,sourceHash:'old'}}])
    assert.throws(()=>assertRuntime(actual,expected));
  assert.doesNotThrow(()=>assertRuntime({status:'responding',runtime:expected},expected));
});
test('a responsive unidentified server stays distinct from an offline listener',async()=>{
  assert.deepEqual(await readRuntime('http://localhost:3000',async()=>new Response('{}',{status:404})),{status:'unidentified',http:404});
  assert.deepEqual(await readRuntime('http://localhost:3000',async()=>{throw new Error('offline');}),{status:'offline-or-unresponsive'});
});
