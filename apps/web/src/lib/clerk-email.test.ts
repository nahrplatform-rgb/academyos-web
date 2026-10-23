import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { handleClerkEmail } from "./clerk-email";
const key = Buffer.alloc(32, 7), secret = `whsec_${key.toString('base64')}`;
const env = { APP_ENV: 'staging', EMAIL_PROVIDER: 'resend', RESEND_API_KEY: 're_synthetic', EMAIL_FROM: 'AcademyOS Staging <notifications@notify.academy.nahr.dev>', EMAIL_REPLY_TO: 'support@nahr.dev', EMAIL_ALLOWED_RECIPIENTS: 'first@example.test', AUTH_EMAIL_ALLOWED_RECIPIENTS: 'first@example.test,second@example.test', CLERK_EMAIL_WEBHOOK_SECRET: secret };
function event() { return { object: 'event', type: 'email.created', instance_id: 'ins_3L0UyDYr4FD8mVDmMG6JXePE0KR', timestamp: Date.now(), data: { id: 'ema_synthetic', object: 'email', slug: 'verification_code', delivered_by_clerk: false, to_email_address: 'second@example.test', subject: 'untrusted subject', body: 'untrusted body', data: { otp_code: '123456' } } }; }
function signed(value: unknown, timestamp = Math.floor(Date.now()/1000), mutate = false) {
 const body = JSON.stringify(value), id = 'msg_synthetic';
 const sig = createHmac('sha256', key).update(`${id}.${timestamp}.${body}`).digest('base64');
 return new Request('https://staging.academy.nahr.dev/api/webhooks/clerk-email', { method:'POST', headers:{'Content-Type':'application/json','svix-id':id,'svix-timestamp':String(timestamp),'svix-signature':`v1,${sig}`}, body: mutate ? body+' ' : body });
}
const allowed = async () => true;
test('valid signed verification event reaches only the approved provider with fixed sender and safe template', async () => {
 let calls = 0;
 const transport: typeof fetch = async (url, init) => {
  calls++; assert.equal(url,'https://api.resend.com/emails');
  const b=JSON.parse(init!.body as string); assert.equal(b.to,'second@example.test'); assert.equal(b.from,env.EMAIL_FROM);
  assert.ok(b.text.includes('123456')); assert.ok(b.text.includes('رمز التحقق')); assert.ok(!JSON.stringify(b).includes('untrusted'));
  assert.equal(init!.cache,'no-store'); return Response.json({id:'synthetic-provider-receipt'});
 };
 const r=await handleClerkEmail(signed(event()),{env,allowed,transport});
 assert.equal(r.status,200); assert.deepEqual(await r.json(),{outcome:'provider_accepted'}); assert.equal(calls,1);
 assert.equal(r.headers.get('cache-control'),'no-store'); assert.equal(r.headers.get('referrer-policy'),'no-referrer');
});
test('missing, tampered, wrong-key and expired signatures never send', async () => {
 const reqs=[new Request('https://staging.academy.nahr.dev/api/webhooks/clerk-email',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'}),signed(event(),undefined,true),signed(event(),Math.floor(Date.now()/1000)-600)];
 const wrong=signed(event());wrong.headers.set('svix-signature','v1,'+Buffer.alloc(32).toString('base64'));reqs.push(wrong);
 for(const req of reqs) assert.equal((await handleClerkEmail(req,{env,allowed,transport:async()=>{throw new Error('Must not send');}})).status,401);
});
test('signed foreign instance/recipient, invalid code and disabled config fail without sending', async () => {
 for(const [change,status] of [
  [(e:ReturnType<typeof event>)=>{e.instance_id='ins_other';},401],
  [(e:ReturnType<typeof event>)=>{e.data.to_email_address='foreign@example.test';},403],
  [(e:ReturnType<typeof event>)=>{e.data.data.otp_code='<script>';},422],
  [(e:ReturnType<typeof event>)=>{e.data.id='';},422],
  [(e:ReturnType<typeof event>)=>{e.timestamp=Date.now()+60000;},422],
 ] as const){ const e=event();change(e);let calls=0;assert.equal((await handleClerkEmail(signed(e),{env,allowed,transport:async()=>{calls++;return Response.json({id:'bad'});}})).status,status);assert.equal(calls,0); }
 for(const changes of [{APP_ENV:'production'},{AUTH_EMAIL_ALLOWED_RECIPIENTS:''},{AUTH_EMAIL_ALLOWED_RECIPIENTS:'a@example.test,b@example.test,c@example.test'},{CLERK_EMAIL_WEBHOOK_SECRET:''}]) assert.equal((await handleClerkEmail(signed(event()),{env:{...env,...changes},allowed})).status,503);
});
test('unrelated/native templates and stale original events are acknowledged without sends',async()=>{
 const cases=[{...event(),type:'user.created'}, {...event(),timestamp:Date.now()-540000}, {...event(),data:{...event().data,slug:'reset_password_code'}}, {...event(),data:{...event().data,delivered_by_clerk:true}}];
 for(const e of cases){let calls=0;const r=await handleClerkEmail(signed(e),{env,allowed,transport:async()=>{calls++;return Response.json({id:'bad'});}});assert.equal(r.status,200);assert.equal(calls,0);assert.ok(['ignored','expired'].includes((await r.json()).outcome));}
});
test('provider unknown/failure and limiter timeout retain retryable truthful failure; no payload leaks',async()=>{
 for(const transport of [async()=>{throw new Error('private-code-and-token');},async()=>new Response('private-provider-error',{status:429}),async()=>Response.json({}),async()=>new Response('bad json',{status:200})] as Array<typeof fetch>){const r=await handleClerkEmail(signed(event()),{env,allowed,transport});assert.equal(r.status,503);assert.deepEqual(await r.json(),{outcome:'unavailable'});}
 let calls=0;const r=await handleClerkEmail(signed(event()),{env,allowed:async()=>false,transport:async()=>{calls++;return Response.json({id:'bad'});}});assert.equal(r.status,503);assert.equal(calls,0);
});
test('retry after unknown outcome and concurrent duplicates preserve exact provider key and message',async()=>{
 const e=event(),seen:Array<{key:string|null,body:unknown}>=[];
 const transport:typeof fetch=async(_u,init)=>{seen.push({key:new Headers(init!.headers).get('Idempotency-Key'),body:init!.body});if(seen.length===1)throw new Error('Lost response');return Response.json({id:'same-provider-id'});};
 assert.equal((await handleClerkEmail(signed(e),{env,allowed,transport})).status,503);
 const rs=await Promise.all(Array.from({length:5},()=>handleClerkEmail(signed(e),{env,allowed,transport})));assert.ok(rs.every(r=>r.status===200));
 assert.equal(new Set(seen.map(x=>x.key)).size,1);assert.equal(new Set(seen.map(x=>x.body)).size,1);assert.match(seen[0].key!,/^academyos-clerk\/[a-f0-9]{64}$/);
 const next=event();next.data.id='ema_other';await handleClerkEmail(signed(next),{env,allowed,transport});assert.notEqual(seen.at(-1)!.key,seen[0].key);
});
test('bounded reads reject oversized bodies even without content-length, and reject unsupported media',async()=>{
 const req=signed({...event(),padding:'x'.repeat(65536)});assert.equal(req.headers.get('content-length'),null);assert.equal((await handleClerkEmail(req,{env,allowed})).status,413);
 const bad=signed(event());bad.headers.set('content-type','text/plain');assert.equal((await handleClerkEmail(bad,{env,allowed})).status,415);
});
