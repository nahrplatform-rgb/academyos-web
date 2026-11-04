// Presentation audit of actual captured component DOM. No identity/API/database proof.
import {chromium} from '@playwright/test';
import {readFile,writeFile,readdir,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const root=resolve(import.meta.dirname,'../..'),captures=resolve(root,'design/app-experience-review/captures'),out=resolve(root,process.env.UI_EVIDENCE_DIR??'design/operations-review/evidence');
await mkdir(out,{recursive:true});const css=await readFile(resolve(root,'apps/web/src/app/globals.css'),'utf8');
const browser=await chromium.launch(),page=await browser.newPage(),results=[];
function luminance(hex){const digits=hex.replace('#','');const rgb=(digits.length===3?[...digits].map(c=>c+c).join(''):digits).match(/../g).map(x=>parseInt(x,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2]}
function contrast(a,b){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
const contrastChecks=[];
try {
for(const file of (await readdir(captures)).filter(p=>p.endsWith('.jsonl'))){
 const frames=(await readFile(resolve(captures,file),'utf8')).trim().split('\n').filter(Boolean).map(x=>JSON.parse(x)).filter(x=>x.type==='frame');
 for(const lang of ['en','ar'])for(const width of [360,1440]){
  const candidates=frames.filter(x=>(x.html.includes('lang="ar"')?'ar':(x.lang||'en'))===lang&&x.viewport.width===width);
  if(!candidates.length)continue;
  const frame=candidates.sort((a,b)=>b.text.length-a.text.length)[0];
  await page.setViewportSize({width,height:1000});
  await page.setContent('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+css+'</style></head><body>'+frame.html+'</body></html>');
  for(const mode of ['light','dark']){
   await page.evaluate(mode=>{
    if(mode==='light')delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme=mode;
   },mode);
   const state=await page.evaluate(()=>({canvas:getComputedStyle(document.documentElement).getPropertyValue('--canvas').trim(),surface:getComputedStyle(document.documentElement).getPropertyValue('--surface').trim(),scheme:getComputedStyle(document.documentElement).colorScheme,overflow:document.documentElement.scrollWidth>innerWidth,heading:document.querySelector('h1')?.textContent}));
   assert.equal(state.canvas,mode==='light'?'#fff':'#1a1e27',file);
   assert.equal(state.surface,mode==='light'?'#fff':'#242a35',file);
   assert.equal(state.scheme,mode,file);
   assert.equal(state.overflow,false,`${file} ${lang} ${width} ${mode}`);
   results.push({journey:frame.journey,frame:frame.id,lang,width,...state});
   if(!contrastChecks.some(check=>check.mode===mode)){
    const pairs=[['ink','canvas'],['muted','surface'],['success','success-surface'],['red','red-bg'],['neutral','neutral-bg'],['warning','warning-surface'],['primary-ink','primary']];
    const palette=await page.evaluate(pairs=>Object.fromEntries(pairs.flat().map(k=>[k,getComputedStyle(document.documentElement).getPropertyValue('--'+k).trim()])),pairs);
    for(const [fg,bg] of pairs){
     const ratio=contrast(palette[fg],palette[bg]);
     assert.ok(ratio>=4.5,`${mode} ${fg}/${bg} ${ratio}`);
     contrastChecks.push({mode,fg,bg,ratio});
    }
   }
   if(mode==='light'&&['onboarding','programs','guardian-training','development','people','attendance'].includes(frame.journey))await page.screenshot({path:resolve(out,`${frame.journey}-${lang}-${width}.png`),fullPage:true});
  }
 }
}
await writeFile(resolve(out,'captured-theme.json'),JSON.stringify({scope:'Actual local captured DOM/CSS only; chosen representative frames, not every state or hosted permission proof',contrastChecks,results},null,2)+'\n');
console.log(`PASS ${results.length} real-component EN/AR phone/desktop theme checks`);
}finally{await browser.close()}
