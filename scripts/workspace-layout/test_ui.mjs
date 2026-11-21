// Actual shared shell/panes with long fictional content. Structural UI evidence only.
import {build} from 'esbuild';import {chromium,expect} from '@playwright/test';import assert from 'node:assert/strict';import {readFile,mkdir,writeFile} from 'node:fs/promises';import {createServer} from 'node:http';import {resolve} from 'node:path';import {tmpdir} from 'node:os';
const root=resolve(import.meta.dirname,'../..'),mode=process.env.UI_REACT_MODE==='development'?'development':'production';
const source=`import React,{useState} from 'react';import{createRoot}from'react-dom/client';import Shell from '${root}/apps/web/src/components/workspace-shell.tsx';import Panes from '${root}/apps/web/src/components/workspace-panes.tsx';function App(){const params=new URLSearchParams(location.search),ar=params.has('ar'),role=params.get('role')||undefined;const[selected,setSelected]=useState(null),[draft,setDraft]=useState('');const t=(a,b)=>ar?b:a;return <Shell role={role} onNavigate={e=>{if(params.has('guard'))e.preventDefault();}} locale={ar?'ar':'en'} context="Fictional Academy" title={t('Workspace layout','تخطيط مساحة العمل')} homeHref="#home" languageHref="#language" account={<button className="workspace-icon-button" aria-label="Fictional account"><span aria-hidden="true">A</span></button>} navigation={role?[{href:'/'+(ar?'ar':'en')+'/workspace/00000000-0000-4000-8000-000000000001/'+(params.get('section')||'programs'),label:'Existing task',current:true}]:Array.from({length:30},(_,i)=>({href:'#nav-'+i,label:t('Navigation '+i,'التنقل '+i)}))}><Panes arabic={ar} selected={selected!==null} selectionKey={String(selected)} title={t('Selected record','السجل المختار')} onBack={()=>setSelected(null)} inspector={<>{Array.from({length:60},(_,i)=><p key={i}>Fictional detail {i}</p>)}</>}><h1>{t('Long working list','قائمة العمل الطويلة')}</h1><label>{t('Draft note','ملاحظة مسودة')}<input value={draft} onChange={event=>setDraft(event.target.value)}/></label>{Array.from({length:100},(_,i)=><p key={i}><button onClick={()=>setSelected(i)}>Record {i}</button></p>)}</Panes></Shell>}createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>);`;
const compiled=await build({stdin:{contents:source,resolveDir:root,loader:'tsx'},bundle:true,write:false,jsx:'automatic',plugins:[{name:'test-link',setup(b){b.onResolve({filter:/^next\/link$/},()=>({path:'link',namespace:'test'}));b.onLoad({filter:/.*/,namespace:'test'},()=>({contents:`import React from 'react';export default function Link({children,...props}){return <a {...props}>{children}</a>}`,loader:'tsx',resolveDir:root}));}}],define:{'process.env.NODE_ENV':JSON.stringify(mode)}});
const css=await readFile(root+'/apps/web/src/app/globals.css','utf8');
const server=createServer((req,res)=>{res.setHeader('Content-Type',req.url==='/bundle.js'?'text/javascript':'text/html');res.end(req.url==='/bundle.js'?compiled.outputFiles[0].text:`<!doctype html><html lang="${req.url.includes('ar')?'ar':'en'}"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style><div id="root"></div><script src="/bundle.js"></script>`);});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch(),page=await browser.newPage({viewport:{width:1440,height:800}}),errors=[];page.on('pageerror',e=>errors.push(e.message));const out=resolve(process.env.UI_EVIDENCE_DIR??resolve(tmpdir(),'academyos-layout-ui'));await mkdir(out,{recursive:true});
async function open(ar=false){await page.goto(`http://127.0.0.1:${server.address().port}/?${ar?'ar':''}`);await page.getByRole('heading',{level:1}).waitFor();}
async function reset(){await page.locator('.layout-menu summary').click();await page.getByRole('button',{name:/Reset layout|إعادة ضبط التخطيط/,exact:true}).click();await page.locator('.layout-menu summary').click();}
try{
 for(const ar of [false,true]){
 await page.setViewportSize({width:1440,height:600});await open(ar);await reset();
 assert.equal(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight),true,'Desktop document must not grow with its columns');
 await page.locator('.workspace-center').evaluate(e=>e.scrollTop=600);await page.locator('.workspace-inspector').evaluate(e=>e.scrollTop=350);
 assert.equal(await page.locator('.workspace-center').evaluate(e=>e.scrollTop),600);assert.equal(await page.locator('.workspace-inspector').evaluate(e=>e.scrollTop),350);assert.equal(await page.locator('.workspace-nav-body').evaluate(e=>e.scrollTop),0);assert.equal(await page.evaluate(()=>scrollY),0);
 await page.locator('.workspace-nav-body').evaluate(e=>e.scrollTop=250);assert.equal(await page.locator('.workspace-center').evaluate(e=>e.scrollTop),600);
 const divider=page.getByRole('separator',{name:ar?'تغيير عرض التفاصيل':'Resize details',exact:true});await divider.focus();await divider.press('End');await expect(divider).toHaveAttribute('aria-valuenow','420');await divider.press('Home');await expect(divider).toHaveAttribute('aria-valuenow','260');await divider.press(ar?'ArrowRight':'ArrowLeft');await expect(divider).toHaveAttribute('aria-valuenow','276');
 const box=await divider.boundingBox();await page.mouse.move(box.x+box.width/2,box.y+50);await page.mouse.down();await page.mouse.move(box.x+(ar?100:-100),box.y+50);await page.mouse.up();assert.ok(Number(await divider.getAttribute('aria-valuenow'))>350);
 const draft=page.getByRole('textbox',{name:ar?'ملاحظة مسودة':'Draft note',exact:true});
 await draft.fill('Retained draft');
 await page.locator('.workspace-center').evaluate(e=>e.scrollTop=600);
 const toggle=page.getByRole('button',{name:ar?'إخفاء التفاصيل':'Hide details',exact:true}),toggleBox=await toggle.boundingBox();assert.ok(toggleBox.width>=44&&toggleBox.height>=44);await expect(page.locator('.workspace-inspector .inspector-heading').getByRole('button',{name:ar?'إخفاء التفاصيل':'Hide details',exact:true})).toBeVisible();await page.mouse.click(toggleBox.x+toggleBox.width/2,toggleBox.y+toggleBox.height/2);await expect(page.locator('.workspace-inspector')).toBeHidden();assert.equal(await page.locator('.workspace-center').evaluate(e=>e.scrollTop),600);const show=page.getByRole('button',{name:ar?'إظهار التفاصيل':'Show details',exact:true}),showBox=await show.boundingBox();assert.ok(showBox.width>=44&&showBox.height>=44);await expect(show).toBeFocused();await page.mouse.click(showBox.x+showBox.width/2,showBox.y+showBox.height/2);await expect(page.locator('.inspector-heading h2')).toBeFocused();
 await expect(draft).toHaveValue('Retained draft');
 assert.equal(await page.locator('.workspace-center').evaluate(e=>e.scrollTop),600);
 await expect(page.locator('.workspace-center').getByRole('button',{name:/^(Hide details|Show details|إخفاء التفاصيل|إظهار التفاصيل)$/})).toHaveCount(0);
 await page.locator('.layout-menu summary').click();await page.getByRole('button',{name:ar?'تصغير التنقل':'Compact navigation',exact:true}).click();await expect(page.locator('.app-scene')).toHaveAttribute('data-navigation','compact');await page.locator('.layout-menu summary').click();
 await page.reload();await expect(page.locator('.app-scene')).toHaveAttribute('data-navigation','compact');const prefs=JSON.parse(await page.evaluate(()=>localStorage.getItem('academyos:layout:v1')));assert.deepEqual(Object.keys(prefs).sort(),['compact','detailsHidden','inspectorWidth','navigationHidden','navigationWidth']);
 await reset();await expect(page.locator('.app-scene')).toHaveAttribute('data-navigation','expanded');await expect(divider).toHaveAttribute('aria-valuenow','276');
 const navigation=page.getByRole('separator',{name:ar?'تغيير عرض التنقل':'Resize navigation',exact:true});
 await expect(navigation).toHaveAttribute('aria-valuenow','220');
 await navigation.press(ar?'ArrowLeft':'ArrowRight');
 await expect(navigation).toHaveAttribute('aria-valuenow','236');
 const navigationBox=await navigation.boundingBox();
 await page.mouse.move(navigationBox.x+navigationBox.width/2,navigationBox.y+60);
 await page.mouse.down();await page.mouse.move(navigationBox.x+(ar?-60:60),navigationBox.y+60);await page.mouse.up();
 assert.ok(Number(await navigation.getAttribute('aria-valuenow'))>280);
 await navigation.press('End');await expect(navigation).toHaveAttribute('aria-valuenow','336');
 await page.getByRole('button',{name:ar?'إخفاء التنقل':'Hide navigation',exact:true}).click();
 await expect(page.locator('.workspace-nav-body')).toBeHidden();
 await expect(page.locator('.workspace-sidebar .workspace-utilities')).toBeVisible();
 assert.ok((await page.locator('.workspace-sidebar').boundingBox()).width<=64);
 await expect(navigation).toBeHidden();
 await page.getByRole('button',{name:ar?'إظهار التنقل':'Show navigation',exact:true}).click();
 await expect(navigation).toHaveAttribute('aria-valuenow','336');
 await navigation.press('Enter');await expect(navigation).toHaveAttribute('aria-valuenow','220');
 const appearance=page.getByRole('button',{name:ar?'الوضع الداكن':'Dark mode',exact:true});
 await expect(appearance).toBeVisible();
 assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).colorScheme),'light');
 await appearance.click();
 assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).colorScheme),'dark');
 await page.getByRole('button',{name:ar?'الوضع الفاتح':'Light mode',exact:true}).click();
 await page.screenshot({path:resolve(out,`desktop-${ar?'ar':'en'}.png`)});
 const retained=await page.getByRole('button',{name:'Record 4',exact:true}).elementHandle();await retained.focus();await page.setViewportSize({width:1024,height:700});await expect(page.getByRole('button',{name:ar?'التفاصيل والسياق':'Details & context',exact:true})).toBeVisible();assert.equal(await retained.evaluate(e=>e.isConnected),true,'Breakpoint must retain the working-list DOM');await expect(page.getByRole('button',{name:'Record 4',exact:true})).toBeFocused();await page.setViewportSize({width:1440,height:600});await expect(divider).toBeVisible();assert.equal(await retained.evaluate(e=>e.isConnected),true);await expect(page.getByRole('button',{name:'Record 4',exact:true})).toBeFocused();
 for(const width of [1280,1024,768,720,390,360,320]){await page.setViewportSize({width,height:700});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`${width} overflow`);if(width<1280)await expect(divider).toBeHidden();if(width<768){assert.ok(await page.evaluate(()=>document.documentElement.scrollHeight>innerHeight),'Phone retains natural page scroll');await page.getByRole('button',{name:'Record 4',exact:true}).click();await expect(page.locator('dialog[open]')).toBeVisible();await page.locator('dialog[open]').press('Escape');await expect(page.locator('dialog[open]')).toHaveCount(0);}}
 }
 for(const role of ['owner','trainer','guardian']) for(const ar of [false,true]) {
  await page.setViewportSize({width:1440,height:800});
  await page.goto(`http://127.0.0.1:${server.address().port}/?role=${role}&guard=1${ar?'&ar':''}`);
  const sidebar=page.locator('.workspace-sidebar');
  await expect(sidebar.locator('.workspace-identity')).toContainText('Fictional Academy');
  await expect(page.locator('.window-toolbar')).toBeHidden();
  await expect(sidebar.getByRole('link',{name:ar?'تبديل مساحة العمل':'Switch workspace',exact:true})).toBeVisible();
  const menu=sidebar.locator('.workspace-navigation');
  assert.equal(await menu.getByRole('link',{name:ar?'تبديل مساحة العمل':'Switch workspace',exact:true}).count(),0,'Switching is outside daily task navigation');
  const targets=await menu.locator('a').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('href')));
  assert.ok(targets.every(h=>!h.includes('/platform')),'Academy navigation never adds Platform administration');
  if(role!=='owner')assert.ok(targets.every(h=>h.includes('/'+role+'/')||role==='trainer'&&h.endsWith('/development')),'Recipient menu stays role-specific');
  const before=page.url();await sidebar.getByRole('link',{name:ar?'تبديل مساحة العمل':'Switch workspace',exact:true}).click();assert.equal(page.url(),before,'Switch respects the domain navigation guard');
  await page.getByRole('link',{name:ar?'رئيسية مساحة العمل':'Workspace home',exact:true}).click();assert.equal(page.url(),before,'Workspace brand respects the domain navigation guard');
  await page.setViewportSize({width:390,height:800});
  const openMenu=page.getByRole('button',{name:ar?'القائمة':'Menu',exact:true});
  const drawer=page.locator('.workspace-drawer');
  await openMenu.press('Enter');
  await expect(drawer).toBeVisible();
  await expect(drawer.locator('.workspace-identity')).toContainText('Fictional Academy');
  await page.keyboard.press('Escape');
  await expect(drawer).not.toBeVisible();
  await expect(openMenu).toBeFocused();
  const footer=page.locator('.workspace-dock');
  await expect(footer.getByRole('link',{name:ar?'English':'العربية',exact:true})).toBeVisible();
  await expect(footer.getByRole('button',{name:'Fictional account',exact:true})).toBeVisible();
  await expect(footer.locator('.workspace-connection')).toContainText(ar?'متصل':'Online');
  await expect(page.getByRole('link',{name:ar?'English':'العربية',exact:true})).toHaveCount(1);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'Phone navigation must reflow');
  if(role==='owner'){await page.goto(`http://127.0.0.1:${server.address().port}/?role=owner&section=players/00000000-0000-4000-8000-000000000002/guardians${ar?'&ar':''}`);await expect(page.locator('.workspace-sidebar .workspace-navigation a[aria-current=page]')).toHaveAttribute('href',`/${ar?'ar':'en'}/workspace/00000000-0000-4000-8000-000000000001/players`);assert.deepEqual(await page.locator('.workspace-sidebar .workspace-navigation a').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('href'))),targets,'Owner menus stay consistent across task families');}
 }
 assert.deepEqual(errors,[]);await writeFile(resolve(out,'receipt.json'),JSON.stringify({mode,scope:'actual shell/panes; fictional long list/details; no data API or domain permission proof',checks:'independent 3-column scrolling, short desktop, keyboard/pointer RTL sizing, clamps, compact/reset/persistence, exact presentation-only storage, desktop sidebars and navigation footer, collapsed detail access with retained input and scroll, one accessible phone footer and separate navigation drawer,320360390720768102412801440 reflow, phone dialog Escape and focus return',errors},null,2));console.log('PASS adaptive workspace '+mode);
}finally{await browser.close();await new Promise(r=>server.close(r));}
