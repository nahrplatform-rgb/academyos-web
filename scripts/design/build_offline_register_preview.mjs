import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
const root=resolve(import.meta.dirname,'../..'),dir=resolve(root,'design/offline-register-preview');
const inputs=['src/index.html','src/style.css','src/repository.mjs','src/fixtures.mjs','src/app.mjs'];
const sources=await Promise.all(inputs.map(p=>readFile(resolve(dir,p),'utf8')));
const script=sources.slice(2).map(s=>s.replace(/^import .*;\n/gm,'').replace(/^export /gm,'')).join('\n');
const html=sources[0].replace('/* PREVIEW_STYLE */',sources[1]).replace('/* PREVIEW_SCRIPT */',script);
const hash=s=>createHash('sha256').update(s).digest('hex');
const manifest=JSON.stringify({scope:'Fictional offline-register changed-state preview; no private app implementation or hosted/security proof',sources:Object.fromEntries(inputs.map((p,i)=>[p,hash(sources[i])])),htmlSha256:hash(html)},null,2)+'\n';
if(process.argv.includes('--check')){
 for(const [file,expected] of [['index.html',html],['manifest.json',manifest]])if(await readFile(resolve(dir,file),'utf8')!==expected)throw new Error(`Stale ${file}`);
 const receipt=JSON.parse(await readFile(resolve(dir,'evidence/checks.json'),'utf8'));
 if(receipt.htmlSha256!==hash(html)||receipt.harnessSha256!==hash(await readFile(resolve(root,'scripts/design/test_offline_register_preview.mjs'),'utf8')))throw new Error('Stale offline-register review test receipt');
 console.log('PASS offline-register preview freshness');
}else{await writeFile(resolve(dir,'index.html'),html);await writeFile(resolve(dir,'manifest.json'),manifest);console.log('Built fictional offline-register preview')}
