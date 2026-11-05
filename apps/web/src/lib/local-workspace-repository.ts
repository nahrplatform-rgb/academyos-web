/** Inactive, read-only replica. The caller owns verified device/account authority
 * and must retire this scope on logout, denial or incompatible server context. */
import {checkLocalKey,seal,unseal,type SealedRecord} from './local-register-crypto';
import {fromBytes,jsonBytes,refuse} from './local-register-codec';
import {readWorkspaceReceipt,sameWorkspaceVersion,verifyWorkspaceCompletion,verifyWorkspacePage,workspaceBinding,
  type Collection,type WorkspaceReceipt,type WorkspaceRow,type WorkspaceScope,type WorkspaceTicket} from './local-workspace-codec';

export const LOCAL_WORKSPACE_DATABASE = 'academyos-owner-workspace-v1';
const retentionMs=30*86400000;
const stores=['control','collections','pages'];
type Control = {binding:string; fence:string; key?:CryptoKey; check?:SealedRecord; retiring?:true; serverScope?:string; calendarRevision?:string};
type Transfer = {generation:string; pages:number; startedAt:number; receipt:SealedRecord; seed:SealedRecord};
type Head = Transfer & {scope:string; revision:string; first:string|null; last:string|null;
  checkedAt:number; wallAt:number; observedAt:number; count:number};
type State = {stamp:string; transfer?:Transfer; head?:Head};
type SavedPage = {rows:WorkspaceRow[]; receipt:WorkspaceReceipt};
type Position = {generation:string; page:number; offset:number};

const range=(prefix:IDBValidKey[])=>IDBKeyRange.bound(prefix,[...prefix,[]]);
const request=<T>(r:IDBRequest<T>)=>new Promise<T>((resolve,reject)=>{
  r.onsuccess=()=>resolve(r.result);
  r.onerror=()=>reject(r.error);
});
const checkTime=(value:number)=>{
  if (!Number.isSafeInteger(value)||value<=0) refuse('workspace_invalid_verification');
};

export async function openLocalWorkspace(scopeInput:WorkspaceScope) {
  const scope=structuredClone(scopeInput), binding=workspaceBinding(scope), namespace=scope.namespace;
  if (!globalThis.indexedDB || !globalThis.crypto?.subtle) refuse('workspace_storage_unavailable');
  const opening=indexedDB.open(LOCAL_WORKSPACE_DATABASE,1);
  opening.onupgradeneeded=()=>{
    for(const name of stores) opening.result.createObjectStore(name);
  };
  const db=await new Promise<IDBDatabase>((resolve,reject)=>{
    let blocked=false;
    opening.onblocked=()=>{blocked=true;reject(new Error('workspace_upgrade_blocked'));};
    opening.onsuccess=()=>{if(blocked)opening.result.close();else resolve(opening.result);};
    opening.onerror=()=>reject(opening.error);
  });
  let disposed=false;
  const close=()=>{disposed=true;db.close();};
  db.onversionchange=close;
  function live(){if(disposed) refuse('workspace_closed');}
  async function transact<T>(mode:IDBTransactionMode,work:(t:IDBTransaction)=>Promise<T>) {
    live();
    const tx=db.transaction(stores,mode,mode==='readwrite'?{durability:'strict'}:{});
    if(mode==='readwrite'&&tx.durability!=='strict'){
      tx.abort();
      refuse('workspace_durability_unavailable');
    }
    const done=new Promise<void>((resolve,reject)=>{
      tx.oncomplete=()=>resolve();
      tx.onabort=()=>reject(tx.error??new Error('workspace_transaction_aborted'));
    });
    void done.catch(()=>{});
    try {
      const value=await work(tx);
      await done;
      live();
      return value;
    } catch(error) {
      try {tx.abort();} catch { /* Transaction already ended. */ }
      await done.catch(()=>{});
      throw error;
    }
  }
  const collectionKey=(collection:Collection)=>[namespace,collection];
  const state=(t:IDBTransaction,collection:Collection):Promise<State|undefined>=>
    request(t.objectStore('collections').get(collectionKey(collection)));
  const control=async(t:IDBTransaction):Promise<Control|undefined>=>{
    const value:Control|undefined=await request(t.objectStore('control').get(namespace));
    if(value&&value.binding!==binding) refuse('workspace_scope_mismatch');
    return value;
  };
  let fence:string|undefined;
  try {fence=await transact('readonly',async t=>(await control(t))?.fence);}
  catch(error){close();throw error;}

  async function active(t:IDBTransaction) {
    const c=await control(t);
    if(!c||c.fence!==fence||!c.key||!c.check) refuse('workspace_inactive');
    return {...c,key:checkLocalKey(c.key)};
  }
  async function activate(ticket:WorkspaceTicket) {
    checkTime(ticket.verifiedAt);
    if(!/^[A-Za-z0-9+/]{43}=$/.test(ticket.material)) refuse('workspace_invalid_key');
    const bytes=Uint8Array.from(atob(ticket.material),c=>c.charCodeAt(0));
    if(bytes.byteLength!==32) refuse('workspace_invalid_key');
    let key:CryptoKey;
    try {key=await crypto.subtle.importKey('raw',bytes,{name:'AES-GCM'},false,['encrypt','decrypt']);}
    finally {bytes.fill(0);}
    const current=await transact('readonly',control);
    if(current?.fence!==fence) refuse('workspace_scope_changed');
    if(current?.retiring) refuse('workspace_cleanup_required');
    const existing=current?.check;
    if(existing) await unseal(key,binding,'workspace-key','check',existing);
    const check=existing??await seal(key,binding,'workspace-key','check',jsonBytes('workspace-key-v1'));
    const nextFence=current?.fence??crypto.randomUUID();
    await transact('readwrite',async t=>{
      const before=await control(t);
      if(before?.fence!==fence || before?.retiring || Boolean(before?.check)!==Boolean(existing)) refuse('workspace_scope_changed');
      if(!existing){
        const data=t.objectStore('pages'), collections=t.objectStore('collections');
        if(await request(data.count(range([namespace]))) || await request(collections.count(range([namespace])))) {
          refuse('workspace_orphaned_data');
        }
      } else checkLocalKey(before?.key);
      if(!existing) await request(t.objectStore('control').put({binding,fence:nextFence,key,check},namespace));
    });
    fence=nextFence;
  }
  async function retire() {
    const replacement=crypto.randomUUID();
    await transact('readwrite',async t=>{
      const c=await control(t);
      if(c?.fence!==fence) refuse('workspace_scope_changed');
      await request(t.objectStore('control').put({binding,fence:replacement,retiring:true},namespace));
    });
    try {
      await transact('readwrite',async t=>{
        const c=await control(t);
        if(c?.fence!==replacement || !c.retiring || c.key) refuse('workspace_scope_changed');
        await request(t.objectStore('collections').delete(range([namespace])));
        await request(t.objectStore('pages').delete(range([namespace])));
        await request(t.objectStore('control').put({binding,fence:replacement},namespace));
      });
    } finally {close();}
  }
  const receiptId=(collection:Collection,generation:string,pages:number)=>JSON.stringify([collection,generation,pages]);
  const saveReceipt=(key:CryptoKey,collection:Collection,transfer:Pick<Transfer,'generation'|'pages'>,receipt:WorkspaceReceipt)=>
    seal(key,binding,'workspace-checkpoint',receiptId(collection,transfer.generation,transfer.pages),jsonBytes(receipt,8192));
  async function loadReceipt(key:CryptoKey,collection:Collection,transfer:Transfer,completed=false) {
    const bytes=await unseal(key,binding,'workspace-checkpoint',receiptId(collection,transfer.generation,transfer.pages),transfer.receipt);
    return readWorkspaceReceipt(fromBytes(bytes),scope,collection,completed);
  }
  async function snapshot(collection:Collection) {
    return transact('readonly',async t=>({...await active(t),state:await state(t,collection)}));
  }
  async function compare(t:IDBTransaction,collection:Collection,expected:State|undefined) {
    const owner=await active(t), current=await state(t,collection);
    if(current?.stamp!==expected?.stamp) refuse('workspace_generation_changed');
    return {owner,current};
  }
  const setState=(t:IDBTransaction,collection:Collection,value:Omit<State,'stamp'>)=>
    request(t.objectStore('collections').put({...value,stamp:crypto.randomUUID()},collectionKey(collection)));
  const dropPages=(t:IDBTransaction,collection:Collection,generation:string)=>
    request(t.objectStore('pages').delete(range([...collectionKey(collection),generation])));
  function pageKey(collection:Collection,generation:string,index:number){
    return [...collectionKey(collection),generation,index];
  }
  const pageId=(collection:Collection,generation:string,index:number)=>JSON.stringify(pageKey(collection,generation,index));

  async function begin(collection:Collection,rawSeed:unknown) {
    const seed=readWorkspaceReceipt(rawSeed,scope,collection);
    if(seed.payload.phase!=='seed') refuse('workspace_seed_required');
    const {key,serverScope,state:before}=await snapshot(collection);
    if(serverScope && serverScope!==seed.payload.scope) refuse('workspace_incompatible_manifest');
    if(before?.head&&(before.head.scope!==seed.payload.scope || BigInt(before.head.revision)>BigInt(seed.payload.revision))) {
      refuse('workspace_incompatible_manifest');
    }
    const generation=crypto.randomUUID(), basis={generation,pages:0,startedAt:Date.now()};
    const receipt=await saveReceipt(key,collection,basis,seed);
    await transact('readwrite',async t=>{
      const {owner,current}=await compare(t,collection,before);
      if(owner.serverScope && owner.serverScope!==seed.payload.scope) refuse('workspace_incompatible_manifest');
      if(current?.transfer) await dropPages(t,collection,current.transfer.generation);
      await setState(t,collection,{head:current?.head,transfer:{...basis,receipt,seed:receipt}});
    });
    return generation;
  }
  async function checkpoint(collection:Collection) {
    const {key,state:before}=await snapshot(collection);
    if(!before?.transfer) return null;
    const receipt=await loadReceipt(key,collection,before.transfer);
    await transact('readonly',t=>compare(t,collection,before));
    return {generation:before.transfer.generation,receipt};
  }
  async function renew(collection:Collection,generation:string,rawReceipt:unknown) {
    const {key,state:before}=await snapshot(collection), transfer=before?.transfer;
    if(!transfer||transfer.generation!==generation) refuse('workspace_generation_changed');
    const prior=await loadReceipt(key,collection,transfer);
    const next=readWorkspaceReceipt(rawReceipt,scope,collection);
    const {issued,...prefix}=next.payload;
    if(issued<prior.payload.issued || Object.entries(prefix).some(([field,value])=>
      JSON.stringify(value)!==JSON.stringify(prior.payload[field as keyof typeof prior.payload]))) {
      refuse('workspace_resume_mismatch');
    }
    const receipt=await saveReceipt(key,collection,transfer,next);
    await transact('readwrite',async t=>{
      const {current}=await compare(t,collection,before);
      await setState(t,collection,{head:current?.head,transfer:{...transfer,receipt}});
    });
  }

  async function append(collection:Collection,generation:string,rawReceipt:unknown,rawRows:unknown) {
    const {key,state:before}=await snapshot(collection);
    const transfer=before?.transfer;
    if(!transfer||transfer.generation!==generation) refuse('workspace_generation_changed');
    const prior=await loadReceipt(key,collection,transfer);
    const receipt=readWorkspaceReceipt(rawReceipt,scope,collection);
    const rows=await verifyWorkspacePage(prior,receipt,structuredClone(rawRows));
    const next={generation,pages:transfer.pages+1,startedAt:transfer.startedAt};
    const encrypted=await seal(key,binding,'workspace-page',pageId(collection,generation,transfer.pages),jsonBytes({rows,receipt}));
    const savedReceipt=await saveReceipt(key,collection,next,receipt);
    await transact('readwrite',async t=>{
      const {current}=await compare(t,collection,before);
      await request(t.objectStore('pages').add(encrypted,pageKey(collection,generation,transfer.pages)));
      await setState(t,collection,{head:current?.head,transfer:{...next,receipt:savedReceipt,seed:transfer.seed}});
    });
  }

  async function page(key:CryptoKey,collection:Collection,generation:string,index:number) {
    const stored:SealedRecord=await transact('readonly',async t=>{
      await active(t);
      return request(t.objectStore('pages').get(pageKey(collection,generation,index)));
    });
    return fromBytes(await unseal(key,binding,'workspace-page',pageId(collection,generation,index),stored)) as SavedPage;
  }
  async function complete(collection:Collection,generation:string,rawFinal:unknown,checkedAt:number) {
    checkTime(checkedAt);
    const wallAt=Date.now();
    const final=readWorkspaceReceipt(rawFinal,scope,collection,true);
    if(Math.abs(checkedAt-final.payload.issued*1000)>15000) refuse('workspace_verification_mismatch');
    const {key,state:before}=await snapshot(collection), transfer=before?.transfer;
    if(!transfer||transfer.generation!==generation) refuse('workspace_generation_changed');
    verifyWorkspaceCompletion(await loadReceipt(key,collection,transfer),final);
    let previous=await loadReceipt(key,collection,{...transfer,pages:0,receipt:transfer.seed});
    let count=0;
    // Verify actual encrypted records in order. A missing page cannot be hidden
    // by an intact checkpoint. No collection-wide decoded array is retained.
    for(let i=0;i<transfer.pages;i++){
      const saved=await page(key,collection,generation,i);
      const receipt=readWorkspaceReceipt(saved.receipt,scope,collection);
      await verifyWorkspacePage(previous,receipt,saved.rows);
      count+=saved.rows.length;
      previous=receipt;
    }
    if(count!==final.payload.total) refuse('workspace_incomplete_data');
    verifyWorkspaceCompletion(previous,final);
    const {scope:serverScope,revision,first,last}=final.payload;
    const receipt=await saveReceipt(key,collection,transfer,final);
    const head:Head={generation,pages:transfer.pages,startedAt:transfer.startedAt,receipt,seed:transfer.seed,scope:serverScope,revision,first,last,
      checkedAt,wallAt,observedAt:wallAt,count};
    await transact('readwrite',async t=>{
      const {owner}=await compare(t,collection,before);
      if(owner.serverScope && owner.serverScope!==serverScope) refuse('workspace_incompatible_manifest');
      if(first!==null && owner.calendarRevision && BigInt(owner.calendarRevision)>BigInt(revision)) {
        refuse('workspace_obsolete_window');
      }
      await request(t.objectStore('control').put({...owner,serverScope,
        calendarRevision:first===null?owner.calendarRevision:revision},namespace));
      if(first!==null && last!==null) {
        const store=t.objectStore('collections');
        const names=await request(store.getAllKeys(range([namespace])));
        for(const name of names){
          const other=(name as [string,Collection])[1];
          if(other===collection)continue;
          const existing=await state(t,other), old=existing?.head;
          if(!old||old.first===null||old.last===null||old.first>last||old.last<first)continue;
          if(old.scope!==serverScope || BigInt(old.revision)>BigInt(revision)) refuse('workspace_obsolete_window');
          if(old.revision!==revision){
            await dropPages(t,other,old.generation);
            // Retire an overlapping old generation atomically. A late transfer
            // cannot publish across the new head's revision check.
            await setState(t,other,{transfer:existing?.transfer});
          }
        }
      }
      if(before?.head) await dropPages(t,collection,before.head.generation);
      await setState(t,collection,{head});
    });
  }

  async function refresh(collection:Collection,rawSeed:unknown,checkedAt:number) {
    checkTime(checkedAt);
    const seed=readWorkspaceReceipt(rawSeed,scope,collection);
    const {key,state:before}=await snapshot(collection), head=before?.head;
    if(head && Date.now()-head.wallAt>=retentionMs) {
      await sweepExpired();
      return false;
    }
    if(seed.payload.phase!=='seed'||!head||checkedAt<=head.checkedAt||
        Math.abs(checkedAt-seed.payload.issued*1000)>15000||
        !sameWorkspaceVersion(await loadReceipt(key,collection,head,true),seed)) return false;
    const now=Date.now();
    await transact('readwrite',async t=>{
      await compare(t,collection,before);
      await setState(t,collection,{transfer:before?.transfer,head:{...head,checkedAt,wallAt:now,observedAt:now}});
    });
    return true;
  }

  async function read(collection:Collection,search='',position?:Position,limit=25) {
    if(typeof search!=='string'||search.length>160||!Number.isInteger(limit)||limit<1||limit>50) {
      refuse('workspace_invalid_query');
    }
    const selected=await transact('readwrite',async t=>{
      const {key}=await active(t), before=await state(t,collection), head=before?.head;
      if(!head) return null;
      const now=Date.now();
      if(now<head.observedAt) refuse('workspace_clock_verification_required');
      if(now-head.wallAt>=retentionMs){
        await dropPages(t,collection,head.generation);
        if(before?.transfer) await dropPages(t,collection,before.transfer.generation);
        await request(t.objectStore('collections').delete(collectionKey(collection)));
        return null;
      }
      // Observe wall-clock rollback on subsequent opens while keeping transfer
      // CAS independent from a routine local read.
      await request(t.objectStore('collections').put({...before,head:{...head,observedAt:now}},collectionKey(collection)));
      return {key,before,head};
    });
    if(!selected)return null;
    const {key,head}=selected;
    await loadReceipt(key,collection,head,true);
    if(position&&(position.generation!==head.generation||!Number.isInteger(position.page)||
        position.page<0||position.page>=head.pages||!Number.isInteger(position.offset)||position.offset<0||position.offset>=50)){
      refuse('workspace_invalid_position');
    }
    const normalized=(value:string)=>value.normalize('NFKC').toLowerCase();
    const filter=normalized(search.trim()), rows:WorkspaceRow[]=[];
    let index=position?.page??0, offset=position?.offset??0, scanned=0;
    while(index<head.pages&&rows.length<limit&&scanned<12){
      const saved=await page(key,collection,head.generation,index);
      if(offset>saved.rows.length) refuse('workspace_invalid_position');
      scanned++;
      while(offset<saved.rows.length&&rows.length<limit){
        const row=saved.rows[offset++];
        const text='display_name'in row?row.display_name+' '+row.branch_name:row.title+' '+row.sport+' '+row.sport_ar;
        if(!filter||normalized(text).includes(filter)) rows.push(row);
      }
      if(offset===saved.rows.length){index++;offset=0;}
    }
    await transact('readonly',async t=>{
      await active(t);
      const now=await state(t,collection);
      if(now?.head?.generation!==head.generation||now.head.wallAt!==head.wallAt||
          Date.now()<now.head.observedAt||Date.now()-head.wallAt>=retentionMs) refuse('workspace_generation_changed');
    });
    return {rows,count:head.count,checkedAt:head.checkedAt,revision:head.revision,scanned,
      next:index<head.pages?{generation:head.generation,page:index,offset}:null};
  }

  async function sweepExpired() {
    await transact('readwrite',async t=>{
      await active(t);
      const store=t.objectStore('collections');
      const keys=await request(store.getAllKeys(range([namespace])));
      const now=Date.now();
      for(const key of keys){
        const collection=(key as [string,Collection])[1];
        const saved=await state(t,collection);
        if(!saved)continue;
        const headExpired=saved.head && now-saved.head.wallAt>=retentionMs;
        const transferExpired=saved.transfer && (headExpired || now-saved.transfer.startedAt>=retentionMs);
        if(headExpired) await dropPages(t,collection,saved.head!.generation);
        if(transferExpired) await dropPages(t,collection,saved.transfer!.generation);
        if(headExpired||transferExpired){
          const head=headExpired?undefined:saved.head, transfer=transferExpired?undefined:saved.transfer;
          if(head||transfer)await setState(t,collection,{head,transfer});
          else await request(store.delete(key));
        }
      }
    });
  }
  const ready=await transact('readonly',control);
  if(ready?.key && ready.fence===fence){
    try {await sweepExpired();}
    catch(error){close();throw error;}
  }

  function acceptsScope(serverScope: string) {
    return transact('readonly', async t => {
      const owner = await active(t);
      return owner.serverScope === undefined || owner.serverScope === serverScope;
    });
  }
  function hasKey() {
    return transact('readonly', async t => {
      const current = await control(t);
      if (current?.fence !== fence || current?.retiring) refuse('workspace_scope_changed');
      if (!current?.key) return false;
      checkLocalKey(current.key);
      return true;
    });
  }

  return {activate,begin,checkpoint,renew,append,complete,refresh,read,retire,close,acceptsScope,hasKey};
}
