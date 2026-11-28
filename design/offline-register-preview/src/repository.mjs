// Isolated fictional review DB. Never import this unencrypted adapter into the app.
const REVIEW_DB = 'academyos-offline-register-review-v1';
const currentRequest = r => new Promise((resolve,reject)=>{r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
const finished = tx => new Promise((resolve,reject)=>{tx.oncomplete=()=>resolve();tx.onabort=()=>reject(tx.error??new Error('Local transaction aborted'));tx.onerror=()=>{}});
const packetBytes = packet => JSON.stringify(packet);
const COPY = value => structuredClone(value);
export class RegisterReviewRepository {
  constructor(db){this.db=db;db.onversionchange=()=>db.close()}
  static async open(){const r=indexedDB.open(REVIEW_DB,1);r.onupgradeneeded=()=>{for(const name of ['replicas','work','projection','fixture','serverReceipts','control'])r.result.createObjectStore(name,{keyPath:'key'})};return new RegisterReviewRepository(await currentRequest(r))}
  async read(store,key){const tx=this.db.transaction(store);return (await currentRequest(tx.objectStore(store).get(key)))?.value}
  async write(store,key,value){const tx=this.db.transaction(store,'readwrite');const done=finished(tx);tx.objectStore(store).put({key,value:COPY(value)});await done}
  async settings(value){if(value)await this.write('control','settings',value);return this.read('control','settings')}
  async prepare(ns){
    const tx=this.db.transaction(['fixture','replicas'],'readwrite'),done=finished(tx),fs=tx.objectStore('fixture');
    let fixture=(await currentRequest(fs.get(ns)))?.value;
    if(!fixture){fixture=makeFixture(ns);fs.put({key:ns,value:fixture})}
    if(!fixture.access){tx.abort();await done.catch(()=>{});throw new Error('Access unavailable')}
    tx.objectStore('replicas').put({key:ns,value:{rows:COPY(fixture.rows),session:COPY(fixture.session),complete:true,checkedAt:fixture.now}});await done;
  }
  async capture(ns,draft,{abort=false,clientTime=new Date().toISOString()}={}){
    const tx=this.db.transaction(['replicas','work','projection'],'readwrite'),done=finished(tx);
    try{
      const replica=(await currentRequest(tx.objectStore('replicas').get(ns)))?.value;
      const prior=(await currentRequest(tx.objectStore('work').get(ns)))?.value;
      if(!replica?.complete||replica.rows.length!==18||!replica.session.published)throw new Error('Complete published register required');
      if(prior&&prior.state!=='confirmed')throw new Error('Recover the original save first');
      const selected=Object.entries(draft);
      if(selected.length===0||selected.length>18)throw new Error('Choose at least one new mark');
      const marks=selected.map(([id,status])=>{const row=replica.rows.find(r=>r.id===id);if(!row||row.status!=='unmarked'||!['present','absent'].includes(status))throw new Error('Saved marks require corrections');return {id,name:row.name,nameAr:row.nameAr,status,baseStatus:row.status,baseVersion:row.version}}).sort((a,b)=>a.id.localeCompare(b.id));
      const packet={id:crypto.randomUUID(),namespace:ns,sessionId:replica.session.id,rosterVersion:replica.session.rosterVersion,clientTime,marks};
      const work={packet,bytes:packetBytes(packet),state:'pending',reason:null,receipt:null,quarantined:false,session:COPY(replica.session)};
      tx.objectStore('work').put({key:ns,value:work});
      tx.objectStore('projection').put({key:ns,value:{operationId:packet.id,marks:COPY(marks)}});
      if(abort)tx.abort();await done;return COPY(work);
    }catch(e){try{tx.abort()}catch{}await done.catch(()=>{});throw e}
  }
  async transition(ns,id,state,extra={}){
    const tx=this.db.transaction('work','readwrite'),done=finished(tx),store=tx.objectStore('work');
    const work=(await currentRequest(store.get(ns)))?.value;
    if(!work||work.packet.id!==id){tx.abort();await done.catch(()=>{});throw new Error('Original save changed')}
    // Packet and exact bytes are immutable; only delivery/review metadata may change.
    store.put({key:ns,value:{...work,state,...extra,packet:work.packet,bytes:work.bytes}});await done;
  }
  async fixtureScenario(ns,scenario){
    const tx=this.db.transaction('fixture','readwrite'),done=finished(tx),store=tx.objectStore('fixture');
    const f=(await currentRequest(store.get(ns)))?.value??makeFixture(ns);
    f.scenario=scenario;
    if(scenario==='conflict'){const row=f.rows.find(r=>r.id==='player-01');row.status='absent';row.version=2}
    if(scenario==='expired')f.now='2026-11-05T18:00:00Z';
    if(scenario==='revoked')f.access=false;
    if(scenario==='roster')f.session.rosterVersion++;
    if(scenario==='withdrawn')f.session.published=false;
    store.put({key:ns,value:f});await done;
  }
  async submit(ns,id,{lookupOnly=false}={}){
    // Fictional server is a separate IDB store, not a network/backend implementation.
    const tx=this.db.transaction(['fixture','serverReceipts','work'],'readwrite'),done=finished(tx);
    try{
      const f=(await currentRequest(tx.objectStore('fixture').get(ns)))?.value;
      const w=(await currentRequest(tx.objectStore('work').get(ns)))?.value;
      if(!w||w.packet.id!==id||w.packet.namespace!==ns||w.bytes!==packetBytes(w.packet))throw new Error('Original packet mismatch');
      const receipts=tx.objectStore('serverReceipts'),key=ns+'|'+id;
      const old=(await currentRequest(receipts.get(key)))?.value;
      if(!f?.access){await done;return {type:'denied'}}
      if(old){if(old.bytes!==w.bytes)throw new Error('Idempotency payload mismatch');await done;return {type:'receipt',receipt:old,replayed:true}}
      if(lookupOnly){await done;return {type:'not_found'}}
      if(f.scenario==='offline-transfer'){await done;return {type:'unknown'}}
      const expired=Date.parse(f.now)>Date.parse(f.session.deadline)||Date.parse(f.now)<Date.parse(f.session.startsAt);
      const conflict=!f.session.published||w.packet.sessionId!==f.session.id||w.packet.rosterVersion!==f.session.rosterVersion||w.packet.marks.some(m=>{const row=f.rows.find(r=>r.id===m.id);return !row||row.version!==m.baseVersion||row.status!=='unmarked'});
      if(expired||conflict){await done;return {type:'review',reason:expired?'deadline':'versions',current:COPY(f.rows),session:COPY(f.session)}}
      for(const m of w.packet.marks){const row=f.rows.find(r=>r.id===m.id);row.status=m.status;row.version++}
      f.appliedBatches++;tx.objectStore('fixture').put({key:ns,value:f});
      const receipt={id,bytes:w.bytes,namespace:ns,marks:w.packet.marks.map(m=>({id:m.id,status:m.status,version:f.rows.find(r=>r.id===m.id).version})),recordedAt:f.now,reference:'review-receipt-'+id.slice(0,8)};
      receipts.put({key,value:receipt});await done;
      if(f.scenario==='lost-reply')return {type:'unknown'};
      if(f.scenario==='bad-receipt')return {type:'receipt',receipt:{...receipt,id:'wrong-operation'}};
      return {type:'receipt',receipt};
    }catch(e){try{tx.abort()}catch{}await done.catch(()=>{});throw e}
  }
  async confirm(ns,id,receipt,{abort=false}={}){
    const tx=this.db.transaction(['work','projection','replicas'],'readwrite'),done=finished(tx);
    try{
      const store=tx.objectStore('work'),w=(await currentRequest(store.get(ns)))?.value;
      if(!w||w.quarantined||w.packet.id!==id||receipt.id!==id||receipt.namespace!==ns||receipt.bytes!==w.bytes||receipt.marks.length!==w.packet.marks.length||receipt.marks.some((m,i)=>m.id!==w.packet.marks[i].id||m.status!==w.packet.marks[i].status||m.version!==w.packet.marks[i].baseVersion+1))throw new Error('Receipt does not match the original save');
      const replica=(await currentRequest(tx.objectStore('replicas').get(ns)))?.value;
      if(replica){for(const mark of receipt.marks){const row=replica.rows.find(r=>r.id===mark.id);if(row){row.status=mark.status;row.version=mark.version}}tx.objectStore('replicas').put({key:ns,value:replica})}
      store.put({key:ns,value:{...w,state:'confirmed',receipt:COPY(receipt),reason:null}});tx.objectStore('projection').delete(ns);
      if(abort)tx.abort();await done;
    }catch(e){try{tx.abort()}catch{}await done.catch(()=>{});throw e}
  }
  async cleanup(ns){
    const tx=this.db.transaction(['replicas','projection','work'],'readwrite'),done=finished(tx);
    tx.objectStore('replicas').delete(ns);tx.objectStore('projection').delete(ns);
    const store=tx.objectStore('work'),w=(await currentRequest(store.get(ns)))?.value;
    if(w&&w.state!=='confirmed')store.put({key:ns,value:{...w,quarantined:true}});else store.delete(ns);
    await done;
  }
  async recover(ns){
    const w=await this.read('work',ns);
    if(w?.quarantined)await this.transition(ns,w.packet.id,w.state,{quarantined:false});
  }
  async reset(){const stores=Array.from(this.db.objectStoreNames),tx=this.db.transaction(stores,'readwrite'),done=finished(tx);for(const s of stores)tx.objectStore(s).clear();await done}
}
