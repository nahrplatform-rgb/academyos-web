import {fixtureEnvironment} from '../local/workflow.mjs';
import{readFile,writeFile,unlink,mkdir}from'node:fs/promises';import{spawn}from'node:child_process';import{gunzipSync}from'node:zlib';import{createHash}from'node:crypto';import{resolve}from'node:path';
const root=resolve(import.meta.dirname,'../..'),out=resolve(root,'design/app-experience-review/captures');await mkdir(out,{recursive:true});
const journeys=['onboarding','people','guardians','trainers','programs','planning','program-planning','session-changes','publication','attendance','guardian-training','corrections','qr-attendance','development','experience-projections','workspace-layout','billing','trainer-compensation','platform-commerce','class-media'];
async function uiFiles(dir){const {readdir}=await import('node:fs/promises');return(await Promise.all((await readdir(resolve(root,dir),{withFileTypes:true})).map(x=>x.isDirectory()?uiFiles(dir+'/'+x.name):dir+'/'+x.name))).flat()}
const uiInputs=[...(await uiFiles('apps/web/src/components')),...(await uiFiles('apps/web/src/app')).filter(x=>/(?:page|layout)\.tsx$|globals\.css$/.test(x)),'apps/web/src/lib/visible-resume.ts','apps/web/src/lib/experience-format.ts','apps/web/src/lib/workspace-read-owner.ts','apps/web/src/lib/owner-session-navigation.ts'].sort();const captureInputs=Object.fromEntries(await Promise.all(uiInputs.map(async p=>[p,createHash('sha256').update(await readFile(resolve(root,p))).digest('hex')])));
try{const cached=JSON.parse(gunzipSync(await readFile(resolve(root,'design/app-experience-review/capture-pack.json.gz'))));for(const j of journeys){try{await readFile(resolve(out,j+'.jsonl'))}catch{await writeFile(resolve(out,j+'.jsonl'),cached.filter(r=>r.journey===j||r.type==='style').map(r=>JSON.stringify(r)).join('\n')+'\n')}}}catch(e){if(e.code!=='ENOENT')throw e;}
const connectedTests={'class-media':'scripts/class-media/test_connected.mjs',billing:'scripts/working-day/test_family_billing_day.mjs','trainer-compensation':'scripts/working-day/test_trainer_compensation.mjs','platform-commerce':'scripts/working-day/test_platform_commerce.mjs'};
const testSource=journey=>connectedTests[journey]??`scripts/${journey}/test_ui.mjs`;
const testDependencies={
  'class-media': [
    'apps/web/src/app/api/class-media/route.ts',
    'apps/web/src/lib/class-media-gateway.ts',
    'apps/web/src/lib/class-media-session.ts',
    'apps/web/src/lib/class-media-hosted-ops.ts',
    'apps/web/src/lib/class-media-hosted-store.ts',
    'apps/web/src/lib/class-media-image.ts',
    'apps/web/src/lib/class-media-limits.ts',
    'apps/web/src/lib/class-media-store.ts',
    'apps/web/src/lib/class-media-variant.ts',
    'apps/web/src/lib/onboarding-gateway.ts',
    'apps/web/src/lib/onboarding-server.ts',
    'scripts/class-media/fixtures.mjs',
    'scripts/class-media/local-db.py',
    'scripts/class-media/local-fixture.mjs',
    'supabase/migrations/20261124235018_ex25_synthetic_class_media.sql',
    'supabase/migrations/20261125094228_ex25_hosted_variant_protocol.sql',
    'supabase/migrations/20261125094402_ex25_staging_storage_policy.sql',
    'supabase/migrations/20261125145344_ex25_align_staging_storage_proof.sql',
    'supabase/migrations/20261125151806_ex25_staff_gallery.sql',
  ],
  'platform-commerce': [
    'apps/web/src/app/api/platform-commerce/route.ts',
    'apps/web/src/lib/platform-commerce.ts',
    'apps/web/src/lib/onboarding-gateway.ts',
    'scripts/working-day/owner_fixture.mjs',
    'scripts/working-day/owner_db.py',
    'supabase/migrations/20261122075500_ex23_platform_commerce.sql',
    'supabase/migrations/20261126120047_ex30_versioned_monthly_offer.sql',
  ],
  'trainer-compensation':['apps/web/src/app/api/trainer-compensation/route.ts','apps/web/src/lib/trainer-compensation.ts','apps/web/src/lib/onboarding-gateway.ts','scripts/working-day/owner_fixture.mjs','scripts/working-day/owner_db.py','supabase/migrations/20261122063506_ex22_trainer_compensation.sql'],billing:["apps/web/src/app/api/billing/route.ts","apps/web/src/lib/billing.ts","apps/web/src/lib/onboarding-gateway.ts","scripts/working-day/owner_fixture.mjs","scripts/working-day/owner_db.py","supabase/migrations/20261121195423_ex21_family_billing.sql"],onboarding:['scripts/onboarding/save_followup.mjs'],attendance:['scripts/attendance/save_followup.mjs'],'qr-attendance':['scripts/qr-attendance/save_followup.mjs'],trainers:['scripts/appointments/save_followup.mjs'],guardians:['scripts/appointments/save_followup.mjs'],programs:['scripts/programs/save_followup.mjs'],'session-changes':['scripts/session-changes/save_followup.mjs'],corrections:['scripts/review-decisions/save_followup.mjs','scripts/review-decisions/trainer_submission.mjs'],development:['scripts/review-decisions/save_followup.mjs','scripts/review-decisions/trainer_submission.mjs','scripts/review-decisions/publication_lifecycle.mjs'],publication:['scripts/publication/save_followup.mjs'],'program-planning':['scripts/program-planning/save_followup.mjs'],planning:['scripts/planning/save_followup.mjs'],people:['scripts/people/profile_continuity.mjs','scripts/people/changed_query.mjs']};
testDependencies['trainer-compensation'].push('apps/web/src/lib/trainer-payslip.tsx','apps/web/src/components/trainer-arrival-panel.tsx','supabase/migrations/20261123175251_ex22_trainer_pay_periods.sql');
const selected=process.argv.slice(2).length?process.argv.slice(2):journeys;
const parallel = selected.filter(name => !Object.hasOwn(connectedTests, name));
const batches = Array.from({ length: Math.ceil(parallel.length / 2) }, (_, index) => parallel.slice(index * 2, index * 2 + 2));
// Connected journeys share the disposable database and capture entry path.
batches.push(...selected.filter(name => Object.hasOwn(connectedTests, name)).map(name => [name]));
const results=[];for(const batch of batches)await Promise.all(batch.map(async name=>{if(!journeys.includes(name))throw Error('Unknown journey');const test=testSource(name),path=resolve(root,test.replace(/[^/]+$/,'.experience-capture.mjs')),log=resolve(out,name+'.log');let source=await readFile(resolve(root,test),'utf8');source=`import '../experience-review/capture.mjs';\n`+source.replaceAll('docs/07-handoff/evidence','/private/tmp/academyos-review-evidence');await writeFile(resolve(out,name+'.jsonl'),'');await writeFile(path,source);try{let output='';const status=await new Promise(r=>{const child=spawn(process.execPath,[path],{cwd:root,env:{...fixtureEnvironment(process.env),ACADEMY_REVIEW_CAPTURE:out,ACADEMY_REVIEW_JOURNEY:name,UI_EVIDENCE_DIR:'/private/tmp/academyos-review-evidence/'+name}});child.stdout.on('data',x=>output+=x);child.stderr.on('data',x=>output+=x);child.on('close',r)});await writeFile(log,output);const receipt={type:'run',journey:name,status:status===0?'passed':'failed',exit:status,inputs:captureInputs,dependencies:Object.fromEntries(await Promise.all((testDependencies[name]??[]).map(async p=>[p,createHash('sha256').update(await readFile(resolve(root,p))).digest('hex')]))),test: createHash('sha256').update(await readFile(resolve(root,test))).digest('hex')};results.push(receipt);const{appendFile}=await import('node:fs/promises');await appendFile(resolve(out,name+'.jsonl'),JSON.stringify(receipt)+'\n');console.log(name+': '+(status===0?'passed':'FAILED — see capture log'));}finally{await unlink(path)}}));await writeFile(resolve(out,'collection-result.json'),JSON.stringify(results,null,2)+'\n');if(results.some(x=>x.status!=='passed'))process.exitCode=1;
