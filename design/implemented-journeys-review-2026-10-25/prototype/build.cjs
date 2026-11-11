const fs=require('node:fs');const path=require('node:path');const esbuild=require('esbuild');
const dir=__dirname,root=path.resolve(dir,'../../..');
fs.copyFileSync(path.join(root,'apps/web/src/app/globals.css'),path.join(dir,'baseline.css'));
esbuild.buildSync({entryPoints:[path.join(dir,'review.tsx')],bundle:true,outfile:path.join(dir,'review.js'),jsx:'automatic',platform:'browser',define:{'process.env.NODE_ENV':'"production"'},alias:{'next/link':path.join(dir,'link.tsx')},logLevel:'info'});
