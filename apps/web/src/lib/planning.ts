// Browser-safe bounded planning contract; identity/authority are always server derived.
export type PersonChoice={id:string;name:string;enrolled?:boolean;eligible?:boolean};
export type DatePlan={published?:boolean;scheduled_day?:string;canceled?:boolean;schedule_version?:number;context:{academy_name:string;branch_name:string;branch_id:string};program:string;name:string;day:string;start:string;end:string;timezone:string;version:number;capacity:number|null;trainer:PersonChoice|null;count:number;players:PersonChoice[];more:boolean};
export type PlanningDelta={version:number;capacity:number;trainer:string|null;add:string[];remove:string[]};
export class PlanningInputError extends Error{}
const pattern=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
function object(v:unknown):Record<string,unknown>{if(!v||typeof v!=='object'||Array.isArray(v))throw new PlanningInputError();return v as Record<string,unknown>;}
function id(v:unknown){if(typeof v!=='string'||!pattern.test(v))throw new PlanningInputError();return v.toLowerCase();}
function date(v:unknown){if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v)||v.startsWith('0000')||!Number.isFinite(Date.parse(v+'T00:00:00Z'))||new Date(v+'T00:00:00Z').toISOString().slice(0,10)!==v)throw new PlanningInputError();return v;}
function integer(v:unknown,min=0){if(!Number.isSafeInteger(v)||(v as number)<min||(v as number)>2147483647)throw new PlanningInputError();return v as number;}
function ids(v:unknown){if(!Array.isArray(v)||v.length>25)throw new PlanningInputError();const r=v.map(id);if(new Set(r).size!==r.length)throw new PlanningInputError();return r.sort();}
export function planningRequest(v:unknown){
 const b=object(v),a=id(b.academy);let keys:string[],rpc:string,args:Record<string,unknown>,mutating=false;
 if(b.action==='dates'){keys=['action','academy','from','after_day','after_program'];if((b.after_day==null)!==(b.after_program==null))throw new PlanningInputError();rpc='p5_dates_v1';args={a,day_start:date(b.from),after_day:b.after_day==null?null:date(b.after_day),after_program:b.after_program==null?null:id(b.after_program)};}
 else if(b.action==='reconcile'){keys=['action','academy','op'];rpc='q6_operation_v1';mutating=true;args={a,op:id(b.op)};}
 else{
 const p=id(b.program),day=date(b.day);args={a,p,day};
 switch(b.action){
 case 'read':keys=['action','academy','program','day','after'];rpc='q6_read_v1';args.after_id=b.after==null?null:id(b.after);break;
 case 'candidates':keys=['action','academy','program','day','kind','query','after'];rpc='q6_candidates_v1';if(!['trainer','player'].includes(String(b.kind))||typeof b.query!=='string'||b.query.length>80)throw new PlanningInputError();Object.assign(args,{kind:b.kind,query:b.query,after_id:b.after==null?null:id(b.after)});break;
 case 'review':case 'save':{
 keys=['action','academy','program','day','schedule_version','version','capacity','trainer','add','remove',...(b.action==='save'?['op']:[])];const add=ids(b.add),remove=ids(b.remove);if(add.length+remove.length>25||add.some(x=>remove.includes(x)))throw new PlanningInputError();Object.assign(args,{sv:integer(b.schedule_version,1),expected_version:integer(b.version),capacity:integer(b.capacity,1),trainer:b.trainer===null?null:id(b.trainer),add_ids:add,remove_ids:remove});rpc=b.action==='save'?'q6_save_v2':'q6_review_v2';if(b.action==='save'){args.op=id(b.op);mutating=true;}break;}
 default:throw new PlanningInputError();
 }
 }
 if(Object.keys(b).some(k=>!keys.includes(k)))throw new PlanningInputError();return{rpc,args,mutating};
}
