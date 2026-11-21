import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {readFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {resolve} from 'node:path';
import {createInterface} from 'node:readline';
import {build} from 'esbuild';
import {chromium, expect} from '@playwright/test';

const root = resolve(import.meta.dirname, '../..');
const web = resolve(root, 'apps/web/src');
const bundle = await build({
  stdin: {
    contents: `
      import React from 'react';
      import {createRoot} from 'react-dom/client';
      import Changes from '${web}/components/session-change-workspace';
      import Planning from '${web}/components/date-planning-workspace';
      import Experience from '${web}/components/experience-workspace';
      import ProgramPlanning from '${web}/components/program-planning-workspace';
      import Publication from '${web}/components/publication-workspace';
      const [,locale,,academy,,program,day,change] = location.pathname.split('/');
      const query = new URLSearchParams(location.search);
      const props = {locale, academy, program, day};
      createRoot(document.getElementById('root')).render(day === 'plan' ? <ProgramPlanning {...props}/> :
        day === 'publish' ? <Publication {...props} mode="owner"/> : change ? <Changes {...props}/> :
        day ? <Planning {...props} from={query.get('from')} returnTo={query.get('return')}/> :
        <Experience {...props} role={query.get('role') ?? 'owner'} calendar anchor={query.get('anchor')}/>);
    `,
    resolveDir: root,
    loader: 'tsx',
  },
  bundle: true, write: false, jsx: 'automatic', format: 'iife',
  define: {'process.env.NODE_ENV': '"production"'},
  plugins: [{
    name: 'fictional-identity-and-navigation',
    setup(builder) {
      builder.onResolve({filter: /^@clerk\/nextjs$|^next\/(navigation|link)$/}, ({path}) => ({path, namespace: 'fixture'}));
      builder.onLoad({filter: /.*/, namespace: 'fixture'}, ({path}) => ({
        loader: 'tsx', resolveDir: root,
        contents: path === '@clerk/nextjs'
          ? "export const useUser=()=>({isLoaded:true,user:{id:'user_owner'}});export const UserButton=()=>null;"
          : path === 'next/navigation'
            ? 'export const useRouter=()=>({push:href=>location.assign(href)});'
            : 'export default function Link({children,prefetch,...props}){return <a {...props}>{children}</a>}',
      }));
    },
  }],
});
const handlers = await build({
  stdin: {
    contents: `export {sessionChangeRequest} from '${web}/lib/session-changes';
      export {planningRequest} from '${web}/lib/planning';
      export {experienceRequest} from '${web}/lib/experience-projections';
      export {programPlanningRequest} from '${web}/lib/program-planning';
      export {publicationRequest} from '${web}/lib/publication';
      export {guardianRequest} from '${web}/lib/guardians';`,
    resolveDir: root,
  },
  bundle: true, write: false, platform: 'node', format: 'esm',
});
const {sessionChangeRequest, planningRequest, experienceRequest, programPlanningRequest, publicationRequest, guardianRequest} = await import(
  'data:text/javascript;base64,' + Buffer.from(handlers.outputFiles[0].text).toString('base64')
);
const css = await readFile(resolve(web, 'app/globals.css'), 'utf8');
const server = createServer((req, res) => {
  const arabic = req.url.startsWith('/ar/');
  res.setHeader('content-type', req.url === '/bundle.js' ? 'text/javascript' : 'text/html');
  res.end(req.url === '/bundle.js' ? bundle.outputFiles[0].text :
    `<!doctype html><html lang="${arabic ? 'ar' : 'en'}" dir="${arabic ? 'rtl' : 'ltr'}"><meta name="viewport" content="width=device-width"><style>${css}</style><div id="root"></div><script src="/bundle.js"></script>`);
});
await new Promise(resolveListen => server.listen(0, '127.0.0.1', resolveListen));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
try {
  for (const locale of ['en', 'ar']) {
    const child = spawn('python3', ['scripts/workspace-download/test_schedule.py', '--browser-fixture'],
      {cwd: root, stdio: ['pipe', 'pipe', 'inherit']});
    const closed = once(child, 'close');
    const lines = createInterface({input: child.stdout})[Symbol.asyncIterator]();
    const next = async () => {
      const response = await lines.next();
      assert.equal(response.done, false, 'Disposable Schedule database exited');
      return JSON.parse(response.value);
    };
    const page = await browser.newPage({viewport: {width: 1440, height: 950}});
    const errors = [];
    const requests = [];
    page.on('pageerror', error => errors.push(error.message));
    try {
      const {academy, program, day, proposal} = await next();
      let queue = Promise.resolve();
      let drop = true;
      await page.route('**/api/**', route => {
        const reply = queue.then(async () => {
          const path = new URL(route.request().url()).pathname;
          const handler = {
            '/api/session-changes': sessionChangeRequest,
            '/api/planning': planningRequest,
            '/api/experience': experienceRequest,
            '/api/program-planning': programPlanningRequest,
            '/api/publication': publicationRequest,
            '/api/guardians': guardianRequest,
          }[path];
          assert.ok(handler, `Unexpected request ${path}`);
          const body = route.request().postDataJSON();
          requests.push(body);
          child.stdin.write(JSON.stringify(handler(body)) + '\n');
          const data = await next();
          if (path.endsWith('session-changes') && body.action === 'save' && drop) {
            assert.equal(data.changed, true);
            drop = false;
            await route.abort();
            return;
          }
          await route.fulfill({json: {data}});
        });
        queue = reply.catch(error => {
          errors.push(String(error));
          return route.abort().catch(() => {});
        });
        return queue;
      });
      const label = (english, arabic) => locale === 'ar' ? arabic : english;
      const button = (english, arabic) => page.getByRole('button', {name: label(english, arabic), exact: true});
      const link = (english, arabic) => page.getByRole('link', {name: label(english, arabic), exact: true});
      const base = `/${locale}/workspace/${academy}`;
      const moved = '2100-02-02';
      const occurrence = page.locator(`[data-occurrence="${program}:${day}"]`);
      await page.goto(`${origin}${base}/programs/${program}/plan`);
      await page.getByRole('button', {name: new RegExp(proposal.slice(0, 8))}).click();
      await page.getByRole('checkbox', {name: label(/I reviewed the summary/, /راجعت الملخص/)}).check();
      await button('Save 39 dates together', 'حفظ 39 تاريخاً معاً').click();
      await expect(page.getByText(label(/All reviewed date changes saved together/, /حُفظت كل تغييرات التواريخ المراجعة/))).toBeVisible();
      const publication = `${origin}${base}/programs/${program}/publish`;
      async function confirmVisibility(english, arabic) {
        await button('Check visibility changes', 'فحص تغييرات الظهور').click();
        await page.getByRole('checkbox', {name: label(/I reviewed the changes/, /راجعت التغييرات/)}).check();
        await button(english, arabic).click();
        await expect(page.getByText(label(/All reviewed visibility changes committed together/, /حُفظت كل تغييرات الظهور المراجعة/))).toBeVisible();
      }
      await page.goto(publication);
      await button('Publish planned dates', 'نشر التواريخ المخططة').click();
      await confirmVisibility('Publish 40 dates together', 'نشر 40 تاريخاً معاً');
      async function verifyRoleCalendars(visible) {
        for (const role of ['trainer', 'guardian']) {
          await page.goto(`${origin}${base}/calendar?role=${role}&anchor=${day}`);
          await expect(page.getByText('Football sessions', {exact: true}).first()).toBeVisible();
          if (visible) await expect(occurrence).toBeVisible();
          else await expect(occurrence).toHaveCount(0);
          await expect(page.getByText('Swimming sessions', {exact: true})).toHaveCount(0);
        }
      }
      await verifyRoleCalendars(true);
      await page.goto(publication);
      await button('Withdraw published dates', 'سحب التواريخ المنشورة').click();
      await page.getByLabel(label('Last date', 'آخر تاريخ'), {exact: true}).fill(day);
      await confirmVisibility('Withdraw 1 dates together', 'سحب 1 تاريخاً معاً');
      await verifyRoleCalendars(false);
      await page.goto(`${origin}${base}/calendar?anchor=${day}`);
      await expect(page.getByText('Swimming sessions', {exact: true}).first()).toBeVisible();
      await occurrence.click();
      await link('Open this date', 'فتح هذا التاريخ').click();
      await link('Move, cancel and history', 'النقل والإلغاء والسجل').click();
      await button('Move this date', 'نقل هذا التاريخ').click();
      await page.getByLabel(label('New date', 'التاريخ الجديد'), {exact: true}).fill(moved);
      await page.getByLabel(label('Reason', 'السبب'), {exact: true}).fill('Synthetic change reason');
      await button('Review change', 'مراجعة التغيير').click();
      await page.getByRole('checkbox').check();
      await button('Confirm move', 'تأكيد النقل').click();
      await expect(button('Check original operation', 'التحقق من العملية الأصلية')).toBeVisible();
      await page.reload();
      await button('Check original operation', 'التحقق من العملية الأصلية').click();
      await expect(page.getByText('Synthetic change reason', {exact: true})).toBeVisible();
      assert.equal(requests.filter(request => request.action === 'save').length, 1);
      assert.equal(requests.find(request => request.action === 'reconcile').op,
        requests.find(request => request.action === 'save').op);
      await link('Plan and roster', 'الخطة واللاعبون').click();
      await expect(page.getByText('Football sessions', {exact: true}).first()).toBeVisible();
      await expect(page.getByText(moved, {exact: false}).first()).toBeVisible();
      await link('Move, cancel and history', 'النقل والإلغاء والسجل').click();
      await button('Cancel this date', 'إلغاء هذا التاريخ').click();
      await page.getByLabel(label('Reason', 'السبب'), {exact: true}).fill('Synthetic cancellation');
      await button('Review change', 'مراجعة التغيير').click();
      await page.getByRole('checkbox').check();
      await button('Confirm cancellation', 'تأكيد الإلغاء').click();
      await expect(page.getByText('Synthetic cancellation', {exact: true})).toBeVisible();
      await expect(page.getByText('Synthetic change reason', {exact: true})).toBeVisible();
      await page.goto(`${origin}${base}/calendar`);
      await page.getByLabel(label('Go to date', 'انتقل إلى تاريخ'), {exact: true}).fill(moved);
      await expect(occurrence).toHaveAttribute('data-state', 'cancelled');
      assert.deepEqual(errors, []);
      console.log(`PASS ${locale} program planning, publication, role visibility, withdrawal, move recovery and cancellation`);
    } finally {
      await page.close();
      child.stdin.end();
      assert.deepEqual(await closed, [0, null]);
    }
  }
} finally {
  await browser.close();
  await new Promise(resolveClose => server.close(resolveClose));
}
