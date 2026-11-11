// In-browser fictional source. No app, Supabase, Clerk or other service is called.
export const FIXTURE_VERSION='LF-review-2026-11-02.1';
export const SCOPE_A='review-user:academy-A:owner';
export const SCOPE_B='review-user:academy-B:owner';
const names=[['Alex Demo','أليكس تجريبي'],['Taylor Demo','تايلور تجريبي'],['Jordan Demo','جوردان تجريبي'],['Sam Demo','سام تجريبي'],['Riley Demo','رايلي تجريبي'],['نور تجريبي طويل لاختبار التفاف الاسم','نور تجريبي طويل لاختبار التفاف الاسم'],['Casey Demo','كيسي تجريبي'],['Morgan Demo','مورغان تجريبي']];
export function baseRows(ns,dataset){
  const academy=ns.split(':')[1];
  if(academy==='academy-B')return [];
  if(dataset==='players')return Array.from({length:128},(_,i)=>({id:`player-${String(i+1).padStart(3,'0')}`,academy,name:`${names[i%8][0]} ${String(i+1).padStart(3,'0')}`,nameAr:`${names[i%8][1]} ${String(i+1).padStart(3,'0')}`,search:`${names[i%8][0].toLocaleLowerCase()} ${String(i+1).padStart(3,'0')}`,branch:'Demo Main Branch',branchAr:'الفرع التجريبي الرئيسي',revision:1,day:''}));
  const count=dataset==='2026-11'?64:['2026-10','2026-12'].includes(dataset)?24:0;
  return Array.from({length:count},(_,i)=>{
    const day=`${dataset}-${String(i% (dataset==='2026-11'?30:28)+1).padStart(2,'0')}`;
    const program=i<30?'Football Demo':i<60?'Swimming Demo':'Fitness Demo';const title=i<30?'Football practice':i<60?'Swimming practice':'Fitness practice';
    const hour=i<30?'14':i<60?'16':'18';
    return {id:`${dataset}-session-${String(i+1).padStart(3,'0')}`,academy,day,date:day,title,titleAr:i<30?'تدريب كرة القدم':i<60?'تدريب السباحة':'تدريب اللياقة',program,branch:'Demo Main Branch',branchAr:'الفرع التجريبي الرئيسي',sport:i<30?'Football':i<60?'Swimming':'Fitness',sportAr:i<30?'كرة القدم':i<60?'السباحة':'اللياقة',starts_at:`${day}T${hour}:00:00Z`,ends_at:`${day}T${Number(hour)+1}:00:00Z`,timezone:'Africa/Cairo',state:i%5===0?'draft':'published',capacity:18,roster_count:12,revision:1,search:''};
  });
}
export function changeSet(ns,dataset){
  const rows=baseRows(ns,dataset);
  if(ns!==SCOPE_A)return [];
  if(dataset==='players')return [{kind:'upsert',row:{...rows[0],name:'Alex Demo Updated 001',nameAr:'أليكس تجريبي محدّث 001',search:'alex demo updated 001',revision:2}},{kind:'remove',id:'player-002'}];
  if(dataset==='2026-11')return [{kind:'upsert',row:{...rows[0],day:'2026-11-03',date:'2026-11-03',starts_at:'2026-11-03T14:00:00Z',ends_at:'2026-11-03T15:00:00Z',state:'moved',revision:2}},{kind:'remove',id:rows[1].id}];
  return [];
}
export function sourceRows(ns,dataset,revision=1){let rows=baseRows(ns,dataset);if(revision>=2)for(const c of changeSet(ns,dataset)){rows=rows.filter(r=>r.id!==(c.kind==='remove'?c.id:c.row.id));if(c.kind==='upsert')rows.push(c.row)}return rows.sort((a,b)=>a.id.localeCompare(b.id))}
export function manifest(ns,dataset,revision=1){return {revision:`r${revision}`,total:sourceRows(ns,dataset,revision).length,pageSize:dataset==='players'?25:50,epoch:'owner-summary-v1',dataset,ns}}
