// Fictional preview storage only. This is not the AcademyOS private-data adapter.
const DB_NAME = 'academyos-lf-review-v2';
const DB_VERSION = 1;
const request = r => new Promise((resolve,reject)=>{r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
const completion = tx => new Promise((resolve,reject)=>{tx.oncomplete=()=>resolve();tx.onabort=()=>reject(tx.error ?? new Error('Transaction aborted'));tx.onerror=()=>{}});
const metaKey=(ns,dataset)=>`${ns}|${dataset}`;
const rowKey=(ns,dataset,gen,id)=>`${ns}|${dataset}|${gen}|${id}`;
const partition=(ns,dataset,gen)=>IDBKeyRange.only([ns,dataset,gen]);
const rowWithKey=(ns,dataset,gen,row)=>({...row,ns,dataset,gen,key:rowKey(ns,dataset,gen,row.id)});
export class ReviewRepository {
  constructor(db){this.db=db;this.localQueries=0;this.queryTimes=[];db.onversionchange=()=>db.close()}
  static async open(){
    const req=indexedDB.open(DB_NAME,DB_VERSION);
    req.onupgradeneeded=()=>{
      const db=req.result;
      const rows=db.createObjectStore('rows',{keyPath:'key'});
      rows.createIndex('partition',['ns','dataset','gen']);
      rows.createIndex('name',['ns','dataset','gen','search','id']);
      rows.createIndex('nameAr',['ns','dataset','gen','nameAr','id']);
      rows.createIndex('day',['ns','dataset','gen','day','id']);
      const meta=db.createObjectStore('meta',{keyPath:'key'});meta.createIndex('scope','ns');
      db.createObjectStore('control',{keyPath:'key'});
      const ops=db.createObjectStore('operations',{keyPath:'key'});ops.createIndex('scope','ns');
    };
    return new ReviewRepository(await request(req));
  }
  async control(key,value){const write=arguments.length===2;const tx=this.db.transaction('control',write?'readwrite':'readonly');const done=completion(tx);const s=tx.objectStore('control');if(write)s.put({key,value});const result=write?undefined:await request(s.get(key));await done;return result?.value}
  async summaries(ns){this.localQueries++;const tx=this.db.transaction('meta');return request(tx.objectStore('meta').index('scope').getAll(ns))}
  async stagePage(ns,dataset,manifest,offset,rows,{abort=false}={}){
    const tx=this.db.transaction(['rows','meta'],'readwrite');const done=completion(tx);const store=tx.objectStore('rows'),meta=tx.objectStore('meta');
    try{
      let m=await request(meta.get(metaKey(ns,dataset))) ?? {key:metaKey(ns,dataset),ns,dataset,active:null,pending:null};
      if(m.active?.revision===manifest.revision && !m.pending)throw new Error('Already complete');
      if(!m.pending)m.pending={gen:`${manifest.revision}-${crypto.randomUUID()}`,revision:manifest.revision,total:manifest.total,cursor:0};
      const p=m.pending;
      if(p.revision!==manifest.revision || p.total!==manifest.total || p.cursor!==offset || offset+rows.length>p.total || (rows.length===0&&p.total!==0))throw new Error('Snapshot/cursor mismatch');
      if(new Set(rows.map(r=>r.id)).size!==rows.length || rows.some(r=>r.academy!==ns.split(':')[1]))throw new Error('Invalid page scope');
      for(const row of rows){if(await request(store.get(rowKey(ns,dataset,p.gen,row.id))))throw new Error('Repeated row');store.put(rowWithKey(ns,dataset,p.gen,row))}
      p.cursor+=rows.length;
      if(p.cursor===p.total){
        const actual=await request(store.index('partition').count(partition(ns,dataset,p.gen)));
        if(actual!==p.total)throw new Error('Incomplete snapshot');
        if(m.active){const old=store.index('partition').openCursor(partition(ns,dataset,m.active.gen));old.onsuccess=()=>{const c=old.result;if(c){c.delete();c.continue()}}}
        m.active={...p,appliedAt:new Date().toISOString()};m.pending=null;
      }
      meta.put(m);
      if(abort)tx.abort();
      await done;return m;
    }catch(e){try{tx.abort()}catch{}await done.catch(()=>{});throw e}
  }
  async discardStaging(ns,dataset){
    const tx=this.db.transaction(['rows','meta'],'readwrite');const done=completion(tx);const m=await request(tx.objectStore('meta').get(metaKey(ns,dataset)));
    if(m?.pending){const r=tx.objectStore('rows').index('partition').openCursor(partition(ns,dataset,m.pending.gen));r.onsuccess=()=>{const c=r.result;if(c){c.delete();c.continue()}};m.pending=null;tx.objectStore('meta').put(m)}
    await done;
  }
  async read(ns,dataset,{prefix='',after=null,limit=25,day='',locale='en'}={}){
    const start=performance.now();this.localQueries++;
    const tx=this.db.transaction(['rows','meta']);const done=completion(tx);const m=await request(tx.objectStore('meta').get(metaKey(ns,dataset)));
    const generation=m?.active??m?.pending;
    if(!generation){await done;return {items:[],more:false,meta:null}}
    const arabicSearch=prefix?/\p{Script=Arabic}/u.test(prefix):locale==='ar';
    const indexName=dataset==='players'?(arabicSearch?'nameAr':'name'):'day';
    const term=indexName==='day'?day:prefix.toLocaleLowerCase().trim();
    const base=[ns,dataset,generation.gen];
    const lower=after??[...base,term];
    const upper=[...base,term?term+'\uffff':'\uffff','\uffff'];
    const range=IDBKeyRange.bound(lower,upper,Boolean(after),false);
    const result=await new Promise((resolve,reject)=>{
      const items=[];let next=null;const r=tx.objectStore('rows').index(indexName).openCursor(range);
      r.onerror=()=>reject(r.error);r.onsuccess=()=>{const c=r.result;if(!c){resolve({items,more:false,next});return}if(items.length===limit){resolve({items,more:true,next});return}items.push(c.value);next=c.key;c.continue()};
    });
    await done;this.queryTimes.push(performance.now()-start);return {...result,meta:m};
  }
  async countsByDay(ns,dataset){
    const tx=this.db.transaction(['rows','meta']);const done=completion(tx);const m=await request(tx.objectStore('meta').get(metaKey(ns,dataset)));const generation=m?.active??m?.pending;const counts={};
    if(generation)await new Promise((resolve,reject)=>{const r=tx.objectStore('rows').index('day').openKeyCursor(IDBKeyRange.bound([ns,dataset,generation.gen],[ns,dataset,generation.gen,'\uffff','\uffff']));r.onerror=()=>reject(r.error);r.onsuccess=()=>{const c=r.result;if(!c){resolve();return}const day=c.key[3];counts[day]=(counts[day]??0)+1;c.continue()}});
    await done;return counts;
  }
  async getRow(ns,dataset,id){const tx=this.db.transaction(['rows','meta']);const m=await request(tx.objectStore('meta').get(metaKey(ns,dataset)));const gen=m?.active??m?.pending;return gen?request(tx.objectStore('rows').get(rowKey(ns,dataset,gen.gen,id))):undefined}
  async applyDelta(ns,dataset,base,manifest,changes,{abort=false}={}){
    const tx=this.db.transaction(['rows','meta'],'readwrite');const done=completion(tx);
    try{
      const ms=tx.objectStore('meta'),rs=tx.objectStore('rows');const m=await request(ms.get(metaKey(ns,dataset)));
      if(!m?.active || m.active.revision!==base || m.pending)throw new Error('Stale change base');
      for(const c of changes){if(c.kind==='remove')rs.delete(rowKey(ns,dataset,m.active.gen,c.id));else{if(c.row.academy!==ns.split(':')[1])throw new Error('Wrong delta scope');rs.put(rowWithKey(ns,dataset,m.active.gen,c.row))}}
      const count=await request(rs.index('partition').count(partition(ns,dataset,m.active.gen)));
      if(count!==manifest.total)throw new Error('Changed count mismatch');
      m.active={...m.active,total:count,cursor:count,revision:manifest.revision,appliedAt:new Date().toISOString()};ms.put(m);
      if(abort)tx.abort();await done;
    }catch(e){try{tx.abort()}catch{}await done.catch(()=>{});throw e}
  }
  async clearReplicas(ns){
    const tx=this.db.transaction(['rows','meta'],'readwrite');const done=completion(tx);
    const m=tx.objectStore('meta').index('scope').openCursor(IDBKeyRange.only(ns));m.onsuccess=()=>{const c=m.result;if(c){c.delete();c.continue()}};
    const r=tx.objectStore('rows').openCursor();r.onsuccess=()=>{const c=r.result;if(c){if(c.value.ns===ns)c.delete();c.continue()}};
    await done;
  }
  async operation(ns,value){const tx=this.db.transaction('operations',value?'readwrite':'readonly');const done=completion(tx);const s=tx.objectStore('operations');if(value)s.put({...value,key:ns,ns});const result=value??await request(s.get(ns));await done;return result}
  async reset(){const tx=this.db.transaction(['rows','meta','control','operations'],'readwrite');const done=completion(tx);for(const n of ['rows','meta','control','operations'])tx.objectStore(n).clear();await done}
}
