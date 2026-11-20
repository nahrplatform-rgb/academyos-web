import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir,mkdtemp,readFile,realpath,rm,symlink,writeFile} from 'node:fs/promises';
import {execFileSync,fork} from 'node:child_process';
import {once} from 'node:events';
import {createServer} from 'node:net';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {acquireResource,assertPortFree,assertRuntime,clearDevOutput,readRuntime,stopOwnedRuntime} from './runtime.mjs';
import {fileURLToPath} from 'node:url';

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

test('a real HTTP 500 listener can be stopped only with a matching recorded dev owner',async t=>{
  if(!['darwin','linux'].includes(process.platform))return t.skip('requires Unix process inspection');
  try{execFileSync('lsof',['-v'],{stdio:'ignore'});}catch{return t.skip('lsof is unavailable');}
  const root=await realpath(await mkdtemp(join(tmpdir(),'academyos-restart-')));
  let child,closed;
  try{
    const path=join(root,'scripts/local/workflow.mjs');
    await mkdir(join(root,'scripts/local'),{recursive:true});
    await writeFile(path,`
      import {createServer} from 'node:http';
      import {acquireResource} from ${JSON.stringify(fileURLToPath(new URL('./runtime.mjs',import.meta.url)))};
      const lease=await acquireResource(process.cwd(),'server-dev');
      const server=createServer((_,res)=>{res.writeHead(500);res.end();});
      process.once('SIGTERM',()=>server.close(async()=>{await lease.release();process.disconnect();}));
      server.listen(0,'127.0.0.1',()=>process.send({port:server.address().port,start:lease.start}));
    `);
    child=fork(path,['dev'],{cwd:root,execArgv:[],stdio:['ignore','ignore','inherit','ipc']});
    closed=once(child,'exit');
    const {port,start}=await new Promise((resolve,reject)=>{
      child.once('message',resolve);
      child.once('exit',()=>reject(new Error('Fixture exited before listening')));
      child.once('error',reject);
    });
    const origin='http://127.0.0.1:'+port;
    const options={origin,read:async()=>{
      const response=await fetch(origin+'/api/local-runtime');
      assert.equal(response.status,500);
      await response.arrayBuffer();
      return {status:'unidentified',http:500};
    }};
    const record=join(root,'test-results/local-workflow/runtime-dev.json');
    const runtime={mode:'dev',instance:'fixture',pid:child.pid,start};
    await writeFile(record,JSON.stringify({...runtime,start:'wrong'}));
    await assert.rejects(stopOwnedRuntime(root,'dev',options),/process identity changed/);
    await writeFile(record,JSON.stringify(runtime));
    await assert.rejects(stopOwnedRuntime(root,'dev',{origin,read:async()=>({status:'responding',runtime:{...runtime,instance:'foreign'}})}),/not serving/);
    const foreign=createServer();
    await new Promise(resolve=>foreign.listen(0,'127.0.0.1',resolve));
    try{
      await assert.rejects(stopOwnedRuntime(root,'dev',{
        ...options,origin:'http://127.0.0.1:'+foreign.address().port,
      }),/Cannot verify ownership/);
      assert.equal(foreign.listening,true);
    }finally{await new Promise(resolve=>foreign.close(resolve));}
    await stopOwnedRuntime(root,'dev',options);
    const exit=await closed;
    assert.equal(exit[0],0);
    assert.equal(exit[1],null);
    await assertPortFree(port);
    await stopOwnedRuntime(root,'dev',options);
  }finally{
    if(child&&child.exitCode===null&&child.signalCode===null){child.kill('SIGKILL');await closed;}
    await rm(root,{recursive:true,force:true});
  }
});

test('clean rebuild removes only the generated dev tree and refuses a symlink',async()=>{
  const root=await realpath(await mkdtemp(join(tmpdir(),'academyos-clean-')));
  try{
    const web=join(root,'apps/web'),production=join(web,'.next'),dev=join(web,'.next-local');
    await mkdir(production,{recursive:true});await mkdir(dev);
    await writeFile(join(production,'BUILD_ID'),'keep');
    await writeFile(join(web,'.env.local'),'fixture');
    await clearDevOutput(root);
    await assert.rejects(readFile(join(dev,'file')), {code:'ENOENT'});
    assert.equal(await readFile(join(production,'BUILD_ID'),'utf8'),'keep');
    assert.equal(await readFile(join(web,'.env.local'),'utf8'),'fixture');
    await symlink(production,dev);
    await assert.rejects(clearDevOutput(root),/not a real directory/);
    assert.equal(await readFile(join(production,'BUILD_ID'),'utf8'),'keep');
  }finally{await rm(root,{recursive:true,force:true});}
});
