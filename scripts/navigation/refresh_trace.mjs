// Test-only request and presentation trace. Import before an existing UI suite.
import {chromium} from '@playwright/test';
import {appendFileSync, mkdirSync} from 'node:fs';
import {join} from 'node:path';

const output = process.env.REFRESH_TRACE_DIR;
const family = process.env.REFRESH_TRACE_FAMILY;
if (!output || !/^[a-z-]+$/.test(family ?? '')) throw new Error('Trace output and family required');
mkdirSync(output, {recursive:true});
const filename = join(output, `${family}.jsonl`);
const pages = new WeakSet(), locators = new WeakSet();
const pageIds = new WeakMap(), requestIds = new WeakMap(), fulfilled = new WeakSet();
let nextPage = 0, nextRequest = 0;
const reads = new Set(['list','read','context','links','dates','candidates','profile','agenda',
  'roster','history','sessions','jobs','card','settings','queue','detail','family_list','family_detail',
  'correction_list','correction_context','correction_detail','correction_history',
  'platform','setup','review','owner-list','schedule']);
let sequence = 0;
function emit(value) {
  appendFileSync(filename, JSON.stringify({n:++sequence,at:Date.now(),family,...value})+'\n');
}
async function snapshot(page) {
  if (page.isClosed() || !page.url().startsWith('http://127.0.0.1:')) return null;
  try {
    return await page.evaluate(() => {
      const visible = element => element.getClientRects().length > 0;
      const center = document.querySelector('.workspace-center');
      return {
        route:location.pathname,
        rows:[...document.querySelectorAll('.experience-session,.register-roster li,.workspace-table tbody tr')].filter(visible).length,
        statuses:[...document.querySelectorAll('[role="status"]')].filter(visible).length,
        alerts:[...document.querySelectorAll('[role="alert"]')].filter(visible).length,
        dialogs:document.querySelectorAll('dialog[open]').length,
        focus:document.activeElement?.tagName,
        centerScroll:center?.scrollTop ?? null,
        windowScroll:scrollY,
        inputs:document.querySelectorAll('input,textarea,select').length,
      };
    });
  } catch { return null; }
}
function action(request) {
  try {
    const candidate=request.postDataJSON()?.action;
    return typeof candidate==='string' && /^[a-z_-]{1,64}$/.test(candidate) ? candidate : null;
  } catch { return null; }
}
async function wrapPage(page) {
  if (pages.has(page)) return page;
  pages.add(page);
  pageIds.set(page, ++nextPage);
  const pageId = pageIds.get(page);
  const requestId = request => {
    if (!requestIds.has(request)) requestIds.set(request, ++nextRequest);
    return requestIds.get(request);
  };
  page.on('request', request => {
    const url=new URL(request.url());
    if (url.hostname!=='127.0.0.1') {
      if (/^https?:$/.test(url.protocol)) emit({kind:'external-attempt',page:pageId,origin:url.origin});
      return;
    }
    if (url.pathname.startsWith('/api/')) emit({kind:'api-start',page:pageId,request:requestId(request),path:url.pathname,action:action(request)});
    if (request.isNavigationRequest() && request.frame()===page.mainFrame()) emit({kind:'document',page:pageId,path:url.pathname});
  });
  const route=page.route.bind(page);
  page.route=async(pattern,handler,options)=>route(pattern,async(intercept,request)=>{
    const pathname=new URL(request.url()).pathname;
    const currentAction=action(request);
    const isRead=pathname.startsWith('/api/') && (reads.has(currentAction) || /_(home|calendar)$/.test(currentAction??''));
    const fulfill=intercept.fulfill.bind(intercept);
    intercept.fulfill=async response=>{
      // A fixture can install a second route that falls back to its first handler.
      // Observe/delay a fulfilled request once even when those wrappers nest.
      if (fulfilled.has(request)) return fulfill(response);
      fulfilled.add(request);
      if (isRead) {
        await new Promise(resolve=>setTimeout(resolve,100));
        emit({kind:'held-read',page:pageId,request:requestId(request),path:pathname,action:currentAction,state:await snapshot(page)});
      }
      emit({kind:'api-reply',page:pageId,request:requestId(request),path:pathname,action:currentAction,status:response.status??200});
      return fulfill(response);
    };
    return handler(intercept,request);
  },options);
  const prototype=Object.getPrototypeOf(page.locator('body'));
  if (!locators.has(prototype)) {
    locators.add(prototype);
    for (const method of ['click','fill','check','uncheck','selectOption','press']) {
      const original=prototype[method];
      prototype[method]=async function(...args) {
        const target=this.page();
        // Labels belong to the fictional fixture. Do not record field contents.
        const label=await this.evaluate(element=>element.getAttribute('aria-label')||element.innerText||element.tagName).catch(()=>null);
        emit({kind:'interaction',page:pageIds.get(target),method,label,state:await snapshot(target)});
        const result=await original.apply(this,args);
        emit({kind:'interaction-return',page:pageIds.get(target),method,state:await snapshot(target)});
        return result;
      };
    }
  }
  const evaluate=page.evaluate.bind(page);
  page.evaluate=async(expression,arg)=>{
    const events=String(expression).match(/new Event\(['"](focus|online|visibilitychange)['"]/g);
    if (events) emit({kind:'lifecycle-signal',page:pageId,events,state:await snapshot(page)});
    return evaluate(expression,arg);
  };
  const close=page.close.bind(page);
  page.close=async(...args)=>{emit({kind:'page-end',page:pageId,state:await snapshot(page)});return close(...args);};
  return page;
}
const launch=chromium.launch.bind(chromium);
chromium.launch=async(...args)=>{
  const browser=await launch(...args);
  emit({kind:'browser',version:browser.version()});
  const newPage=browser.newPage.bind(browser), newContext=browser.newContext.bind(browser);
  browser.newPage=async(...values)=>wrapPage(await newPage(...values));
  browser.newContext=async(...values)=>{
    const context=await newContext(...values), create=context.newPage.bind(context);
    context.newPage=async(...input)=>wrapPage(await create(...input));
    return context;
  };
  return browser;
};
