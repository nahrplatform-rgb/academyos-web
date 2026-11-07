import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {webSourceSnapshot,webArtifactSnapshot,assertCurrentWebBuild,buildReceipt} from './web-build.mjs';

// Fictional files exercise rejection; real Next output is checked by its consumer.
async function fixture(run){
  const root=await mkdtemp(join(tmpdir(),'academyos-build-freshness-'));
  const put=async(path,value)=>{await mkdir(dirname(join(root,path)),{recursive:true});await writeFile(join(root,path),value);};
  try{
    for(const path of ['package.json','package-lock.json','apps/web/package.json','apps/web/next.config.ts',
      'apps/web/tsconfig.json','scripts/verification/web-build.mjs','apps/web/src/example.tsx',
      'apps/web/public/example.js','apps/web/.next/static/chunk.js','apps/web/.next/BUILD_ID',
      'apps/web/.next/server/app/prepared-workspace.html'])await put(path,'fictional '+path);
    await put(buildReceipt,JSON.stringify({version:1,node:process.version,
      inputs:await webSourceSnapshot(root),artifacts:await webArtifactSnapshot(root)}));
    await run(root,put);
  }finally{await rm(root,{recursive:true,force:true});}
}
test('matching source and compiled assets permit the fixture consumer',()=>fixture(async root=>{
  const proof=await assertCurrentWebBuild(root);assert.match(proof.sourceHash,/^[a-f0-9]{64}$/);
  assert.match(proof.artifactHash,/^[a-f0-9]{64}$/);
}));
test('changed or newly added source rejects an older compiled shell',()=>fixture(async(root,put)=>{
  await put('apps/web/src/example.tsx','new source');
  await assert.rejects(assertCurrentWebBuild(root),/Web source changed/);
  await put('apps/web/src/example.tsx','fictional apps/web/src/example.tsx');
  await put('apps/web/src/new.tsx','another source');
  await assert.rejects(assertCurrentWebBuild(root),/Web source changed/);
}));
test('changed public HTML or compiled chunks reject mixed build artifacts',()=>fixture(async(root,put)=>{
  await put('apps/web/.next/server/app/prepared-workspace.html','old shell from a different build');
  await assert.rejects(assertCurrentWebBuild(root),/Compiled web assets differ/);
  await put('apps/web/.next/server/app/prepared-workspace.html','fictional apps/web/.next/server/app/prepared-workspace.html');
  await put('apps/web/.next/static/chunk.js','stale compiled component');
  await assert.rejects(assertCurrentWebBuild(root),/Compiled web assets differ/);
}));
test('missing build evidence refuses to imply source freshness',()=>fixture(async root=>{
  await rm(join(root,buildReceipt));await assert.rejects(assertCurrentWebBuild(root),/Run npm run build/);
}));
