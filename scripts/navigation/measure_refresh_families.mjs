// Run unchanged component suites with test-only request observation and delay.
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {mkdir, readFile, readdir, unlink, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';

const root=resolve(import.meta.dirname,'../..');
const output=resolve(process.env.REFRESH_TRACE_DIR ?? join(tmpdir(),'academyos-ex13a-refresh-families'));
const allowed=['onboarding','people','guardians','trainers','programs','planning','program-planning',
  'publication','session-changes','attendance','corrections','qr-attendance','guardian-training',
  'development','experience-projections'];
const families=process.argv.slice(2);
if (!families.length || new Set(families).size!==families.length || families.some(value=>!allowed.includes(value))) throw new Error('Select distinct known component families');
await mkdir(output,{recursive:true});
const harnessHashes=Object.fromEntries(await Promise.all(['measure_refresh_families.mjs','refresh_trace.mjs'].map(async name=>[
  `scripts/navigation/${name}`,createHash('sha256').update(await readFile(join(root,'scripts/navigation',name))).digest('hex')
])));
const results=[];
for (const family of families) {
  const sourcePath=`scripts/${family}/test_ui.mjs`;
  const source=await readFile(join(root,sourcePath),'utf8');
  const local=join(root,`scripts/${family}/.refresh-baseline.mjs`);
  const sourceHash=createHash('sha256').update(source).digest('hex');
  const familyOutput=join(output,family);
  await mkdir(familyOutput,{recursive:true});
  await writeFile(join(output,`${family}.jsonl`),'');
  // Some historical fixtures have literal output paths. Redirect those only.
  await writeFile(local,"import '../navigation/refresh_trace.mjs';\n"+
    source.replaceAll('docs/07-handoff/evidence',familyOutput),{flag:'wx'});
  let log='';
  let code;
  try {
    code=await new Promise((done,reject)=>{
      const child=spawn(process.execPath,[local],{cwd:root,env:{...process.env,
        REFRESH_TRACE_DIR:output,REFRESH_TRACE_FAMILY:family,UI_EVIDENCE_DIR:familyOutput}});
      child.stdout.on('data',value=>log+=value);
      child.stderr.on('data',value=>log+=value);
      child.once('error',reject);
      child.once('close',done);
    });
  } finally {
    await unlink(local);
    await writeFile(join(output,`${family}.log`),log);
  }
  const events=(await readFile(join(output,`${family}.jsonl`),'utf8')).trim().split('\n').filter(Boolean).map(JSON.parse);
  const counts={};
  for (const event of events.filter(item=>item.kind==='api-start')) {
    const key=`${event.path}:${event.action}`;
    counts[key]=(counts[key]??0)+1;
  }
  const lifecycle=[];
  for (let index=0;index<events.length;index++) {
    if (events[index].kind!=='lifecycle-signal') continue;
    const following=[];
    let end=index+1;
    while (end<events.length) {
      const event=events[end++];
      if (event.page!==events[index].page) continue;
      if (['interaction','lifecycle-signal','document','page-end'].includes(event.kind)) break;
      following.push(event);
    }
    lifecycle.push({page:events[index].page,events:events[index].events,before:events[index].state,
      starts:following.filter(item=>item.kind==='api-start').map(({path,action})=>({path,action})),
      held:following.filter(item=>item.kind==='held-read').map(({action,state})=>({action,state}))});
  }
  const result={family,recordedAt:new Date().toISOString(),source:sourcePath,sha256:sourceHash,harnessHashes,passed:code===0,code,
    browser:events.find(item=>item.kind==='browser')?.version,
    observedDocumentEntries:events.filter(item=>item.kind==='document').length,
    requestCountsAcrossEntireSuite:counts,lifecycleSamples:lifecycle,
    heldReadSamples:events.filter(item=>item.kind==='held-read').length,
    localInteractions:events.filter(item=>item.kind==='interaction').length,
    externalAttempts:events.filter(item=>item.kind==='external-attempt')};
  results.push(result);
  await writeFile(join(output,`${family}-summary.json`),JSON.stringify(result,null,2)+'\n');
  console.log(`${family}: ${result.passed?'passed':'FAILED'}; ${result.heldReadSamples} held read observations`);
}
const summaries=(await readdir(output)).filter(value=>value.endsWith('-summary.json'));
const all=await Promise.all(summaries.map(async file=>JSON.parse(await readFile(join(output,file),'utf8'))));
await writeFile(join(output,'summary.json'),JSON.stringify({recordedAt:new Date().toISOString(),
  profile:{node:process.version,os:process.platform,arch:process.arch,readDelayMs:100},
  scope:'Actual product component fixtures with fictional identity/API. Fixture assertions retained. Counts span entire suites and are not per-user/session estimates. Next routing and hosted behavior require separate evidence.',
  results:all},null,2)+'\n');
if (results.some(item=>!item.passed)) process.exitCode=1;
