// Test tooling: bind .next consumers to the source and compiled assets they use.
// This is a local freshness check, not a signed release/security attestation.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,readdir,writeFile,rm} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

const projectRoot=resolve(import.meta.dirname,'../..');
const digest=value=>createHash('sha256').update(value).digest('hex');
export const buildReceipt='apps/web/.next/academyos-build-source.json';
async function files(root,path){
  const entries=await readdir(join(root,path),{withFileTypes:true});
  return (await Promise.all(entries.filter(x=>!x.name.startsWith('.')).map(x=>x.isDirectory()
    ?files(root,`${path}/${x.name}`):`${path}/${x.name}`))).flat();
}
async function hashes(root,paths){
  return Object.fromEntries(await Promise.all(paths.sort().map(async path=>[path,digest(await readFile(join(root,path)))])));
}
export async function webSourceSnapshot(root){
  return hashes(root,[...(await files(root,'apps/web/src')),...(await files(root,'apps/web/public')),
    'package.json','package-lock.json','apps/web/package.json','apps/web/next.config.ts','apps/web/tsconfig.json',
    'scripts/verification/web-build.mjs']);
}
export async function webArtifactSnapshot(root){
  return hashes(root,[...(await files(root,'apps/web/.next/static')),
    'apps/web/.next/BUILD_ID','apps/web/.next/server/app/prepared-workspace.html']);
}
export async function assertCurrentWebBuild(root){
  let receipt;
  try{receipt=JSON.parse(await readFile(join(root,buildReceipt),'utf8'));}
  catch{throw new Error('Missing/invalid web build receipt. Run npm run build before tests that consume .next.');}
  assert.equal(receipt.version,1,'Unsupported web build receipt');
  assert.deepEqual(await webSourceSnapshot(root),receipt.inputs,
    'Web source changed since .next was built. Run npm run build before this test.');
  assert.deepEqual(await webArtifactSnapshot(root),receipt.artifacts,
    'Compiled web assets differ from the checked build. Run npm run build before this test.');
  return {node:receipt.node,sourceHash:digest(JSON.stringify(receipt.inputs)),
    artifactHash:digest(JSON.stringify(receipt.artifacts))};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  if(process.argv.includes('--check')){
    console.log('PASS compiled web build matches current source and assets',await assertCurrentWebBuild(projectRoot));
  }else if(process.argv.includes('--build')){
    const inputs=await webSourceSnapshot(projectRoot);
    await rm(join(projectRoot,buildReceipt),{force:true});
    const result=spawnSync('npm',['run','build','--workspace','@academyos/web'],{cwd:projectRoot,stdio:'inherit'});
    if(result.error)throw result.error;
    if(result.status!==0)process.exit(result.status??1);
    assert.deepEqual(await webSourceSnapshot(projectRoot),inputs,'Web inputs changed during the build; rebuild before recording evidence.');
    await writeFile(join(projectRoot,buildReceipt),JSON.stringify({version:1,node:process.version,
      inputs,artifacts:await webArtifactSnapshot(projectRoot)},null,2)+'\n');
    console.log('Recorded compiled web source/asset receipt');
  }else throw new Error('Use --build or --check');
}
