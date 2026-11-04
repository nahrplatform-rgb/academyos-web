// Offline review instrumentation only. Imported by temporary copies of existing UI checks.
import {chromium} from '@playwright/test';
import {appendFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
const out=process.env.ACADEMY_REVIEW_CAPTURE;
if(!out)throw Error('Capture output required');mkdirSync(out,{recursive:true});
const journey=process.env.ACADEMY_REVIEW_JOURNEY;let sequence=0,serial=Promise.resolve();const hooked=new WeakSet(),pages=new WeakSet();
function emit(x){appendFileSync(`${out}/${journey}.jsonl`,JSON.stringify(x)+'\n')}
async function snapshot(page,label){try{if(page.isClosed()||!page.url().startsWith('http://127.0.0.1:'))return null;
 const data=await page.evaluate(()=>{let n=0;for(const el of document.querySelectorAll('button,a,input,select,textarea,summary,[role="button"],[role="checkbox"]'))el.setAttribute('data-review-node',String(n++));
 const clone=document.body.cloneNode(true),original=[...document.body.querySelectorAll('input,textarea,select')],copies=[...clone.querySelectorAll('input,textarea,select')];
 original.forEach((e,i)=>{const c=copies[i];if(e.tagName==='TEXTAREA')c.textContent=e.value;else if(e.tagName==='SELECT'){[...c.options].forEach((o,j)=>o.toggleAttribute('selected',e.selectedIndex===j))}else{c.setAttribute('value',e.type==='password'?'[not captured]':e.value);c.toggleAttribute('checked',e.checked)}});
 for(const e of clone.querySelectorAll('script,iframe,video,audio'))e.remove();
 for(const e of clone.querySelectorAll('a')){e.setAttribute('data-review-href',e.getAttribute('href')??'');e.removeAttribute('href')}
 for(const e of clone.querySelectorAll('*'))for(const a of [...e.attributes])if(a.name.startsWith('on'))e.removeAttribute(a.name);
 const controls=[...document.querySelectorAll('[data-review-node]')].map(e=>{const r=e.getBoundingClientRect();return {node:e.getAttribute('data-review-node'),tag:e.tagName,label:e.getAttribute('aria-label')||e.innerText||e.getAttribute('placeholder')||e.getAttribute('name')||e.getAttribute('type')||e.tagName,disabled:!!e.disabled,visible:!!r.width&&!!r.height}});
 let css='';for(const sheet of document.styleSheets)try{css += [...sheet.cssRules].map(r=>r.cssText).join('\n')}catch{}
 return {html:clone.innerHTML,css,text:document.body.innerText,controls,lang:document.documentElement.lang,dir:document.documentElement.dir,theme:document.documentElement.dataset.theme,scroll:{x:scrollX,y:scrollY},focus:document.activeElement?.getAttribute('data-review-node')};
 });const id=journey+'-'+sequence++,viewport=page.viewportSize();const cssId=createHash('sha256').update(data.css).digest('hex');emit({type:'style',id:cssId,css:data.css});delete data.css;emit({type:'frame',id,journey,label,viewport,cssId,...data});return id;
 }catch(e){emit({type:'gap',journey,label,error:String(e)});return null}}
async function wrapPage(page){if(pages.has(page))return page;pages.add(page);
 page.on('dialog',d=>emit({type:'dialog',journey,kind:d.type(),message:d.message(),scope:'Native dialog; not recreated inside product frame'}));
 const proto=Object.getPrototypeOf(page.locator('body'));
 if(!hooked.has(proto)){hooked.add(proto);for(const method of ['click','fill','check','uncheck','selectOption','press','setInputFiles']){const old=proto[method];if(!old)continue;proto[method]=async function(...args){const p=this.page();let node=null,label='';try{await this.evaluate(e=>e.setAttribute('data-review-target','yes'));label=await this.evaluate(e=>e.innerText||e.getAttribute('aria-label')||e.getAttribute('placeholder')||e.tagName)}catch{}
 const before=await snapshot(p,`${method}: ${label}`);try{node=await this.getAttribute('data-review-node')}catch{}
 const result=await old.apply(this,args);await p.waitForTimeout(70);const after=await snapshot(p,`After ${method}: ${label}`);emit({type:'edge',journey,before,after,node,method,label,value:method==='fill'?String(args[0]):undefined});return result;}}}
 for(const method of ['goto','reload','setViewportSize']){const old=page[method].bind(page);page[method]=async(...args)=>{const r=await old(...args);await page.waitForTimeout(100);await snapshot(page,method==='setViewportSize'?`Viewport ${args[0].width}×${args[0].height}`:method);return r}}
 const close=page.close.bind(page);page.close=async(...a)=>{await snapshot(page,'Last state');return close(...a)};return page;}
const launch=chromium.launch.bind(chromium);chromium.launch=async(...args)=>{const b=await launch(...args),newPage=b.newPage.bind(b),newContext=b.newContext.bind(b);b.newPage=async(...a)=>wrapPage(await newPage(...a));b.newContext=async(...a)=>{const c=await newContext(...a),np=c.newPage.bind(c);c.newPage=async(...x)=>wrapPage(await np(...x));return c};return b};
