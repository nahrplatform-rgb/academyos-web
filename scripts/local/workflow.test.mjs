import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,readdir,unlink,readlink,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {selectedSuites,environmentStatus,redact,reusable,fixtureEnvironment,localOfflineEnvironment,ensureToolchainLink,allocateEvidenceDirectory,writeJsonAtomically,artifactBundle,artifactBundleCurrent} from './workflow.mjs';

test('named local checks stay bounded and reject arbitrary commands',()=>{
  assert.deepEqual(selectedSuites('corrective').map(x=>x.name),['navigation','device']);
  assert.deepEqual(selectedSuites('attendance')[0].argv,['scripts/working-day/test_additive_attendance.mjs']);
  assert.deepEqual(selectedSuites('transport')[0].argv,['scripts/workspace-download/test_transport.mjs']);
  assert.deepEqual(selectedSuites('all-local').map(x=>x.name),['navigation','device','keyboard','public']);
  assert.throws(()=>selectedSuites('deploy'),/Choose/);
  assert.throws(()=>selectedSuites('../private'),/Choose/);
});
test('missing server credentials never become signed-in readiness from a public key alone',()=>{
  const status=environmentStatus({NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:'pk_test_fictional'});
  assert.equal(status.status,'incomplete');
  assert.ok(status.missing.includes('CLERK_SECRET_KEY'));
  assert.ok(status.missing.includes('ONBOARDING_PROOF_KEY'));
  assert.equal(status.offlineKeysPresent,false);
  assert.match(status.backend,/not a local database/);
});
test('saved logs redact server credentials while retaining nonsecret failure evidence',()=>{
  const env={CLERK_SECRET_KEY:'fictional-secret',ONBOARDING_PROOF_KEY:'fictional-proof',NEXT_PUBLIC_APP_URL:'http://localhost:3000'};
  assert.equal(redact('failure fictional-secret fictional-proof http://localhost:3000',env),
    'failure [REDACTED] [REDACTED] http://localhost:3000');
  const urls={DATABASE_URL:'postgresql://fictional-user:fictional-password@invalid.example/db',
    SENTRY_DSN:'https://fictional-private@invalid.example/1'};
  assert.equal(redact(Object.values(urls).join(' '),urls),'[REDACTED] [REDACTED]');
});
test('reuse refuses failed, unstable or different-input receipts',()=>{
  assert.equal(reusable({status:'passed',signature:'same',sourceStable:true},'same'),true);
  for(const receipt of [{status:'failed',signature:'same',sourceStable:true},
    {status:'passed',signature:'different',sourceStable:true},
    {status:'passed',signature:'same',sourceStable:false},
    {status:'running',signature:'same',sourceStable:false},undefined])
    assert.equal(reusable(receipt,'same'),false);
  assert.equal(reusable({status:'passed',signature:'same',sourceStable:true},'same',false),false);
});
test('synthetic fixture subprocesses retain runtime settings without inheriting live credentials',()=>{
  assert.deepEqual(fixtureEnvironment({PATH:'/fictional/bin',APP_ENV:'staging',
    CLERK_SECRET_KEY:'private-key',ONBOARDING_PROOF_KEY:'private-proof',
    UPSTASH_REDIS_REST_TOKEN:'private-redis',LOCAL_REGISTER_WRAP_KEY_V1:'private-wrap',
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:'public-key',QSTASH_TOKEN:'private-jobs',
    JOB_PROTECTION_BYPASS_SECRET:'private-bypass',EX02_BASELINE:'1',UNKNOWN_CREDENTIAL:'private-other'}),
  {PATH:'/fictional/bin',APP_ENV:'staging'});
});
test('artifact reuse requires a receipt and detects deletion or tampering',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'academyos-local-artifact-test-'));
  try{
    assert.equal(await artifactBundleCurrent(dir,{}),false);
    await writeFile(join(dir,'receipt.json'),'{"status":"passed"}');
    await writeFile(join(dir,'capture.txt'),'first capture');
    const hashes=await artifactBundle(dir);
    assert.equal(await artifactBundleCurrent(dir,hashes),true);
    await writeFile(join(dir,'capture.txt'),'changed capture');
    assert.equal(await artifactBundleCurrent(dir,hashes),false);
    await writeFile(join(dir,'capture.txt'),'first capture');await unlink(join(dir,'receipt.json'));
    assert.equal(await artifactBundleCurrent(dir,hashes),false);
  }finally{await rm(dir,{recursive:true,force:true});}
});
test('concurrent launchers share an existing tool link without unlink races',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'academyos-local-link-test-'));
  try{
    const path=join(dir,'node');
    await Promise.all(Array.from({length:16},()=>ensureToolchainLink(path,process.execPath)));
    assert.equal(await readlink(path),process.execPath);
    await assert.rejects(ensureToolchainLink(path,'/different/fictional/node'));
    assert.equal(await readlink(path),process.execPath);
  }finally{await rm(dir,{recursive:true,force:true});}
});
const privateFixture={ACADEMYOS_LOCAL_OFFLINE:'true',APP_ENV:'staging',SUPABASE_PROJECT_REF:'snpphkenmvmhpjstbeul',
  NEXT_PUBLIC_SUPABASE_URL:'https://snpphkenmvmhpjstbeul.supabase.co',ONBOARDING_PROOF_KEY:'c'.repeat(64),
  CLERK_SECRET_KEY:'fictional-private-key',PATH:process.env.PATH};
const recoveredFixture={LOCAL_REGISTER_WRAP_KEY_V1:'a'.repeat(64),LOCAL_OWNER_WORKSPACE_WRAP_KEY_V1:'b'.repeat(64)};
test('local offline opt-in uses the private pipe and enables only verified in-memory roots',()=>{
  assert.equal(localOfflineEnvironment({},()=>{throw new Error('must not run');}).status.loaded,false);
  let called=0;
  const result=localOfflineEnvironment(privateFixture,(command,args,options)=>{
    called++;assert.equal(command,'python3');assert.match(args[0],/runtime_keys\.py$/);
    assert.deepEqual(options.stdio,['pipe','pipe','pipe','pipe']);
    assert.equal(options.env.CLERK_SECRET_KEY,undefined);assert.equal(options.env.ONBOARDING_PROOF_KEY,undefined);
    assert.deepEqual(Object.keys(JSON.parse(options.input)).sort(),['identity','registerDirectory','workspaceDirectory']);
    return {status:0,stdout:Buffer.alloc(0),output:[null,Buffer.alloc(0),Buffer.alloc(0),Buffer.from(JSON.stringify(recoveredFixture))]};
  });
  assert.equal(called,1);assert.equal(result.status.loaded,true);
  assert.equal(result.environment.LOCAL_REGISTER_DISPATCH_ENABLED,'true');
  assert.equal(result.environment.OWNER_WORKSPACE_PILOT_ENABLED,'true');
  assert.equal(result.environment.LOCAL_REGISTER_WRAP_KEY_V1,recoveredFixture.LOCAL_REGISTER_WRAP_KEY_V1);
  assert.equal(privateFixture.LOCAL_REGISTER_WRAP_KEY_V1,undefined);
  assert.ok(!JSON.stringify(result.status).includes(recoveredFixture.LOCAL_REGISTER_WRAP_KEY_V1));
});
test('private recovery rejects a foreign backend, unsafe output, reused or replacement root without leaking values',()=>{
  const bridge=patch=>()=>({status:0,stdout:Buffer.alloc(0),output:[null,null,null,Buffer.from(JSON.stringify({...recoveredFixture,...patch}))]});
  const cases=[()=>localOfflineEnvironment({...privateFixture,APP_ENV:'production'},bridge({})),
    ()=>localOfflineEnvironment({...privateFixture,SUPABASE_PROJECT_REF:'foreign'},bridge({})),
    ()=>localOfflineEnvironment(privateFixture,()=>({status:1,stderr:Buffer.from('fictional secret content')})),
    ()=>localOfflineEnvironment(privateFixture,()=>({status:0,stdout:Buffer.from('unexpected private output')})),
    ()=>localOfflineEnvironment(privateFixture,bridge({LOCAL_REGISTER_WRAP_KEY_V1:'c'.repeat(64)})),
    ()=>localOfflineEnvironment(privateFixture,bridge({LOCAL_OWNER_WORKSPACE_WRAP_KEY_V1:'a'.repeat(64)})),
    ()=>localOfflineEnvironment(privateFixture,bridge({LOCAL_REGISTER_WRAP_KEY_V1:['a'.repeat(64)]})),
    ()=>localOfflineEnvironment({...privateFixture,LOCAL_REGISTER_WRAP_KEY_V1:'d'.repeat(64)},bridge({})),
    ()=>localOfflineEnvironment(privateFixture,bridge({EXTRA_KEY:'unexpected'}))];
  for(const fn of cases)assert.throws(fn,error=>error.message==='Local offline key recovery refused; check the private archive/identity setup. No key was printed or replaced.');
});
test('simultaneous runs get separate evidence directories and complete atomic latest reports',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'academyos-evidence-isolation-'));
  try{
    const dirs=await Promise.all(Array.from({length:16},()=>allocateEvidenceDirectory(dir,'public')));
    assert.equal(new Set(dirs).size,16);
    const latest=join(dir,'latest.json');
    await Promise.all(dirs.map((path,index)=>writeJsonAtomically(latest,{path,index,body:'x'.repeat(index*1024)})));
    const final=JSON.parse(await readFile(latest,'utf8'));
    assert.equal(final.path,dirs[final.index]);assert.equal(final.body,'x'.repeat(final.index*1024));
    assert.equal((await readdir(dir)).filter(name=>name.endsWith('.tmp')).length,0);
  }finally{await rm(dir,{recursive:true,force:true});}
});
