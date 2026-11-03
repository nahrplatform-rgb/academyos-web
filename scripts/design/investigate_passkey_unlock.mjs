// Readiness experiment only: disposable browser and virtual authenticator.
// Never connects to a real account, credential provider, app origin or database.
import {chromium} from '@playwright/test';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const checks=[],failures=[],caseFailures=[],requests=[];let browser,context,cdp,authenticatorId;
const record=(name,detail={})=>{checks.push({name,status:'passed',...detail});console.log('PASS '+name)};
const server=createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Content-Security-Policy':"default-src 'none'; script-src 'unsafe-inline'; connect-src 'none'; base-uri 'none'; form-action 'none'"});res.end('<!doctype html><title>Fictional passkey research</title><h1>Virtual authenticator research — no real accounts</h1>')});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://localhost:${server.address().port}`;
async function addAuthenticator(hasPrf){return(await cdp.send('WebAuthn.addVirtualAuthenticator',{options:{protocol:'ctap2',ctap2Version:'ctap2_1',transport:'internal',hasResidentKey:true,hasUserVerification:true,isUserVerified:true,automaticPresenceSimulation:true,hasPrf}})).authenticatorId}
async function provision(page,label='fictional-owner-a'){return page.evaluate(async label=>{
  const challenge=crypto.getRandomValues(new Uint8Array(32)),salt=crypto.getRandomValues(new Uint8Array(32));
  const c=await navigator.credentials.create({publicKey:{challenge,rp:{id:location.hostname,name:'Fictional local key research'},user:{id:new TextEncoder().encode(label),name:label,displayName:'Fictional Owner'},pubKeyCredParams:[{type:'public-key',alg:-7}],authenticatorSelection:{authenticatorAttachment:'platform',residentKey:'required',userVerification:'required'},attestation:'none',extensions:{prf:{eval:{first:salt}}},timeout:5000}});
  // Public metadata only; never serialize PRF output or a private signing key.
  return {id:Array.from(new Uint8Array(c.rawId)),salt:Array.from(salt),enabled:c.getClientExtensionResults().prf?.enabled===true};
},label)}
async function installHelpers(page){await page.evaluate(()=>{
  const bytes=x=>new Uint8Array(x),text=s=>new TextEncoder().encode(s),scope='fictional:owner-a:academy-a:register:v1';
  const req=r=>new Promise((resolve,reject)=>{r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
  async function db(){const r=indexedDB.open('academyos-passkey-research-only',1);r.onupgradeneeded=()=>r.result.createObjectStore('sealed');return req(r)}
  async function kek(meta,contextScope,signal){
    const c=await navigator.credentials.get({signal,publicKey:{rpId:location.hostname,challenge:crypto.getRandomValues(new Uint8Array(32)),allowCredentials:[{type:'public-key',id:bytes(meta.id)}],userVerification:'required',extensions:{prf:{eval:{first:bytes(meta.salt)}}},timeout:1500}});
    const output=c.getClientExtensionResults().prf?.results?.first;if(!output)throw new Error('PRF unavailable');
    const material=await crypto.subtle.importKey('raw',output,'HKDF',false,['deriveKey']);
    return crypto.subtle.deriveKey({name:'HKDF',hash:'SHA-256',salt:bytes(meta.salt),info:text(location.origin+'|'+contextScope)},material,{name:'AES-GCM',length:256},false,['wrapKey','unwrapKey']);
  }
  async function seal(meta){
    const key=await kek(meta,scope),dataKey=await crypto.subtle.generateKey({name:'AES-GCM',length:256},true,['encrypt','decrypt']);
    const wrapIV=crypto.getRandomValues(new Uint8Array(12)),dataIV=crypto.getRandomValues(new Uint8Array(12)),aad=text(scope);
    const wrapped=await crypto.subtle.wrapKey('raw',dataKey,key,{name:'AES-GCM',iv:wrapIV,additionalData:aad});
    const cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv:dataIV,additionalData:aad},dataKey,text(JSON.stringify({name:'Fictional Alex',status:'present',originalOperation:'fictional-original-1'})));
    const envelope={meta,wrapIV:Array.from(wrapIV),dataIV:Array.from(dataIV),wrapped:Array.from(new Uint8Array(wrapped)),cipher:Array.from(new Uint8Array(cipher))};
    const storage=await db(),tx=storage.transaction('sealed','readwrite');tx.objectStore('sealed').put(envelope,'original');await new Promise((res,rej)=>{tx.oncomplete=res;tx.onabort=()=>rej(tx.error)});storage.close();return {sealed:true,plaintextInEnvelope:/Fictional Alex|present|fictional-original-1/.test(JSON.stringify(envelope))};
  }
  async function envelope(){const storage=await db();const result=await req(storage.transaction('sealed').objectStore('sealed').get('original'));storage.close();return result}
  async function open({overrideMeta=null,contextScope=scope,tamper=false,cancel=false}={}){
    const stored=await envelope(),abort=new AbortController();
    if(cancel)setTimeout(()=>abort.abort(),50);
    const key=await kek(overrideMeta??stored.meta,contextScope,abort.signal);
    const aad=text(contextScope),wrapped=bytes(stored.wrapped);if(tamper)wrapped[0]^=1;
    const dataKey=await crypto.subtle.unwrapKey('raw',wrapped,key,{name:'AES-GCM',iv:bytes(stored.wrapIV),additionalData:aad},{name:'AES-GCM',length:256},false,['decrypt']);
    const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes(stored.dataIV),additionalData:aad},dataKey,bytes(stored.cipher));const body=JSON.parse(new TextDecoder().decode(plain));
    // Return only assertions, never PRF output, a data key or private payload.
    return {matches:body.name==='Fictional Alex'&&body.status==='present'&&body.originalOperation==='fictional-original-1',nonExtractable:dataKey.extractable===false};
  }
  window.keyResearch={seal,open,envelope};
})}
try{
  browser=await chromium.launch();context=await browser.newContext();const p=await context.newPage();p.on('request',r=>requests.push(r.url().split('?')[0]));p.on('pageerror',e=>failures.push(e.message));await p.goto(origin);cdp=await context.newCDPSession(p);await cdp.send('WebAuthn.enable',{enableUI:false});authenticatorId=await addAuthenticator(true);
  assert.equal(await p.evaluate(()=>isSecureContext&&Boolean(window.PublicKeyCredential)),true);const meta=await provision(p);assert.equal(meta.enabled,true);record('Disposable Chromium virtual authenticator reports PRF for newly created fictional credential',{browser:browser.version()});
  // Helpers are deliberately installed only on the disposable loopback page.
  await installHelpers(p);assert.deepEqual(await p.evaluate(m=>window.keyResearch.seal(m),meta),{sealed:true,plaintextInEnvelope:false});record('PRF-derived wrapping key seals a random data key; real IDB envelope contains no fictional name/status plaintext');
  await p.reload();await installHelpers(p);const requestsBefore=requests.length;await context.setOffline(true);const opened=await p.evaluate(()=>window.keyResearch.open());assert.deepEqual(opened,{matches:true,nonExtractable:true});assert.equal(requests.length,requestsBefore);record('Page reload then network-disabled virtual-authenticator unlock decrypts original persisted envelope with no request',{notClaimed:'No browser process restart, physical authenticator, offline cold shell or server/account proof'});
  let denied=await p.evaluate(async()=>{try{await window.keyResearch.open({contextScope:'fictional:owner-b:academy-b:register:v1'});return false}catch{return true}});assert.equal(denied,true);record('Different owner/academy derivation and authenticated binding cannot decrypt the original envelope');
  denied=await p.evaluate(async()=>{try{await window.keyResearch.open({tamper:true});return false}catch{return true}});assert.equal(denied,true);record('Tampered wrapped-key ciphertext is refused without clearing the original envelope');
  await context.setOffline(false);const different=await provision(p,'fictional-owner-b');await context.setOffline(true);denied=await p.evaluate(async meta=>{try{await window.keyResearch.open({overrideMeta:meta});return false}catch{return true}},different);assert.equal(denied,true);record('Another virtual passkey cannot unwrap the original data key');
  const preVerificationRecovery=await p.evaluate(async()=>{try{return(await window.keyResearch.open()).matches}catch{return false}});console.log('CONTROL original key after second credential: '+preVerificationRecovery);
  await cdp.send('WebAuthn.setUserVerified',{authenticatorId,isUserVerified:false});denied=await p.evaluate(async()=>{try{await window.keyResearch.open({cancel:true});return false}catch(e){return e.name==='AbortError'||e.name==='NotAllowedError'}});assert.equal(denied,true);
  await cdp.send('WebAuthn.setUserVerified',{authenticatorId,isUserVerified:true});
  // Exercise an explicit reopened page/user action after the cancelled ceremony.
  await context.setOffline(false);await p.reload();await installHelpers(p);await p.locator('h1').click();await context.setOffline(true);
  try{assert.equal((await p.evaluate(()=>window.keyResearch.open())).matches,true);record('Unverified virtual ceremony releases no decrypted result; explicit reopen recovers the original encrypted work')}
  catch(error){const finding={name:'Original-key recovery after failed virtual user verification',status:'failed',expected:'After restoring virtual verification and explicit page reopen, decrypt the original envelope',actual:'NotAllowedError persists;root cause unconfirmed;not a physical-device result',errorName:error.name};checks.push(finding);caseFailures.push(finding);console.log('OPEN '+finding.name)}
  await context.setOffline(false);await cdp.send('WebAuthn.removeVirtualAuthenticator',{authenticatorId});authenticatorId=await addAuthenticator(false);const unsupported=await provision(p);assert.equal(unsupported.enabled,false);record('Ordinary virtual passkey without PRF is explicitly unsupported for this encryption mechanism; no silent fallback');
  assert.deepEqual(failures,[]);assert.equal(requests.every(url=>url.startsWith(origin)),true);
  const output={date:new Date().toISOString(),scope:'Isolated virtual-authenticator mechanism experiment;not physical device,real account,app implementation,security audit or private enablement',ownerDirection:'Investigate device/passkey unlocking first;no separate local-passphrase acceptance inferred',conclusion:caseFailures.length?'Not ready for private enablement;recovery case unresolved':'Selected synthetic mechanism cases passed;physical/security gates remain',browser:browser.version(),scriptSha256:createHash('sha256').update(await readFile(new URL(import.meta.url))).digest('hex'),checks,caseFailures,requests:requests.map(url=>url.replace(origin,'<isolated-loopback-origin>')),noRealCredentialOrAccount:true,noPrivateOrPrfKeyMaterialRecorded:true,limitations:['Virtual authenticator and injected user verification only','No actual macOS Touch ID,iCloud Keychain,Windows Hello,iOS/Android or browser/provider compatibility proof','No browser process restart paired with physical key;reload only','No cold offline boot,known-revocation,account-verification or server transport proof','Not independent crypto/security review;XSS/unlocked-runtime risks remain','No passkey recovery,loss,backup or export policy accepted']};
  const out=resolve(import.meta.dirname,'../../docs/07-handoff/evidence/passkey-unlock-research-2026-11-03.json');await mkdir(resolve(out,'..'),{recursive:true});await writeFile(out,JSON.stringify(output,null,2)+'\n');console.log(`${checks.filter(c=>c.status==='passed').length} passed / ${caseFailures.length} unresolved isolated passkey mechanism checks`);if(caseFailures.length)throw new Error('Passkey research recovery gate remains open;see recorded evidence');
}finally{await context?.close();await browser?.close();await new Promise(r=>server.close(r))}
