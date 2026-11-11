import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
const allowed=new Set(['/','/index.html','/design/device-unlock-probe/index.html']);
createServer(async(req,res)=>{
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return}
 const path=new URL(req.url,'http://localhost:3239').pathname;
 if(path==='/favicon.ico'){res.writeHead(204);res.end();return}
 if(!allowed.has(path)){res.writeHead(404);res.end('Diagnostic only');return}
 try{const html=await readFile(new URL('../../design/device-unlock-probe/index.html',import.meta.url));res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"});res.end(req.method==='HEAD'?'':html)}catch{res.writeHead(503);res.end('Diagnostic unavailable')}
}).listen(3239,'127.0.0.1',()=>console.log('Fictional device probe: http://localhost:3239/design/device-unlock-probe/index.html'));
