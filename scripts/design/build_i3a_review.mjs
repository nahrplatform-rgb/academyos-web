import { build } from 'esbuild';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
const root=resolve(import.meta.dirname,'../..');
const target=resolve(root,'design/i3a-program-dates-review');
await build({entryPoints:[resolve(target,'review.tsx')],bundle:true,minify:true,jsx:'automatic',format:'iife',outfile:resolve(target,'review.js'),define:{'process.env.NODE_ENV':'"production"'},plugins:[{name:'local-review-link',setup(b){b.onResolve({filter:/^next\/link$/},()=>({path:'link',namespace:'review'}));b.onLoad({filter:/.*/,namespace:'review'},()=>({contents:`import React from 'react';export default function Link({children,...props}){return <a {...props}>{children}</a>}`,loader:'tsx',resolveDir:root}));}}]});
const css=await readFile(resolve(root,'apps/web/src/app/globals.css'),'utf8');
await writeFile(resolve(target,'app.css'),css+'\n.review-controls{padding:16px 24px;background:#e8f0ff;border-bottom:2px solid #075bea}.review-controls label{display:block;margin-block:10px 4px}.review-controls select{max-width:460px;margin-bottom:10px}.review-controls p{margin:8px 0 0}.review-check{display:flex!important;align-items:center;gap:10px;min-height:44px}.review-check input{width:22px;min-width:22px;min-height:22px;height:22px}\n');
await writeFile(resolve(target,'index.html'),'<!doctype html><html lang="en" dir="ltr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AcademyOS I3a — draft program dates design review</title><link rel="stylesheet" href="app.css"><div id="root"></div><script src="review.js"></script></html>\n');
const files=['design/i3a-program-dates-review/model.ts','apps/web/src/components/workspace-panes.tsx','design/i3a-program-dates-review/review.tsx','apps/web/src/components/workspace-shell.tsx','apps/web/src/components/ui/controls.tsx','apps/web/src/app/globals.css'];
await writeFile(resolve(target,'source-manifest.json'),JSON.stringify({scope:'Design preview only; no API, database, login or email',sources:Object.fromEntries(await Promise.all(files.map(async file=>[file,createHash('sha256').update(await readFile(resolve(root,file))).digest('hex')])) )},null,2)+'\n');
console.log('Built local I3a review from shared app controls; no product/provider changes.');

await writeFile(resolve(target,'app.css'),(await readFile(resolve(target,'app.css'),'utf8'))+'\n.review-controls{max-width:1900px;margin:auto;font:13px/1.6 system-ui}.review-controls select{max-width:580px}.form-columns{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.weekdays{display:flex;gap:8px 16px;flex-wrap:wrap}.weekday-field{margin-top:20px!important}.weekdays label{margin:6px 0!important}.dates-table td{vertical-align:top}.dates-table details{font-size:11px;margin-top:6px}.dates-table bdi{overflow-wrap:anywhere}.workspace-inspector section .journey-actions{margin-top:20px}.workspace-panes .journey-error{max-width:100%}@media(max-width:720px){.form-columns{grid-template-columns:1fr;gap:0}.review-controls{padding:12px 16px}.weekdays{gap:4px 12px}.dates-table details{font-size:12px}}\n');

await writeFile(resolve(target,'app.css'),(await readFile(resolve(target,'app.css'),'utf8'))+'\n.detail-dates-phone{display:none}@media(max-width:1100px){.detail-dates-phone{display:block}}\n');

await writeFile(resolve(target,'app.css'),(await readFile(resolve(target,'app.css'),'utf8'))+'\n@media(max-width:720px){.dates-table caption{display:block;width:100%;text-align:start;font-size:14px;line-height:1.6;padding-block:12px}}\n');
