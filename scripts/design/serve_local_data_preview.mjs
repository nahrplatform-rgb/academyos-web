import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const html=resolve(import.meta.dirname,'../../design/local-data-preview/index.html');
const allowed=new Set(['/','/index.html','/design/local-data-preview/index.html']);
createServer(async(req,res)=>{
 if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);res.end();return}
 const path=new URL(req.url,'http://127.0.0.1:3235').pathname;
 if(path==='/favicon.ico'){res.writeHead(204);res.end();return}
 if(!allowed.has(path)){res.writeHead(404);res.end('Preview only');return}
 try{const body=await readFile(html);res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; form-action 'none'; base-uri 'none'; frame-ancestors 'none'"});res.end(req.method==='HEAD'?'':body)}catch{res.writeHead(503);res.end('Build the preview first')}
}).listen(3235,'127.0.0.1',()=>console.log('Fictional local-data review: http://127.0.0.1:3235/design/local-data-preview/index.html'));
