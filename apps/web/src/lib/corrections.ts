/** I4c exact command/receipt contract; authority always resolves at the database. */
export class CorrectionInputError extends Error {}
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const id=(v:unknown)=>{if(typeof v!=='string'||!uuid.test(v))throw new CorrectionInputError();return v.toLowerCase();};
export function correctionRequest(value:unknown){
 if(!value||typeof value!=='object'||Array.isArray(value))throw new CorrectionInputError();const b=value as Record<string,unknown>,a=id(b.academy);let keys:string[],rpc:string,args:Record<string,unknown>;let mutating=false;
 const ev=b.action==='correction_list'&&b.event==null?null:id(b.event);
 const cursor=()=>{if((b.after_at==null)!==(b.after_id==null)||b.after_at!=null&&(typeof b.after_at!=='string'||b.after_at.length>35||!Number.isFinite(Date.parse(b.after_at))))throw new CorrectionInputError();return{after_at:b.after_at??null,after_id:b.after_id==null?null:id(b.after_id)};};
 const reason=()=>{if(typeof b.reason!=='string'||!b.reason.trim()||b.reason.length>500)throw new CorrectionInputError();return b.reason;};
 if(b.action==='correction_list'){keys=['scope','after_at','after_id'];if(!['all','pending'].includes(String(b.scope)))throw new CorrectionInputError();rpc='c12_list_v1';args={a,ev,scope:b.scope,...cursor()};}
 else if(b.action==='correction_context'){keys=['player'];rpc='c12_context_v1';args={a,ev,player:id(b.player)};}
 else if(b.action==='correction_detail'){keys=['request'];rpc='c12_detail_v1';args={a,ev,rid:id(b.request)};}
 else if(b.action==='correction_history'){keys=['request','after_at','after_id'];rpc='c12_history_v1';args={a,ev,rid:id(b.request),...cursor()};}
 else if(b.action==='correction_submit'){keys=['player','version','reason','op'];if(!Number.isSafeInteger(b.version)||(b.version as number)<1)throw new CorrectionInputError();rpc='c12_submit_v1';mutating=true;args={a,ev,player:id(b.player),expected_version:b.version,reason:reason(),op:id(b.op)};}
 else if(b.action==='correction_decide'){keys=['request','choice','reason','op'];if(!['approved','rejected'].includes(String(b.choice)))throw new CorrectionInputError();rpc='c12_decide_v1';mutating=true;args={a,ev,rid:id(b.request),choice:b.choice,reason:reason(),op:id(b.op)};}
 else if(b.action==='correction_reconcile'){keys=['op'];rpc='c12_operation_v1';mutating=true;args={a,ev,op:id(b.op)};}
 else throw new CorrectionInputError();if(Object.keys(b).some(k=>!['action','academy','event',...keys].includes(k)))throw new CorrectionInputError();return{rpc,args,mutating};
}
export type CorrectionContext={event:string;player:string;name:string;current:'present'|'absent'|null;version:number;owner:boolean;projection:{name:string;branch:string;timezone:string};starts_at:string;ends_at:string;closes_at:string;open:boolean;existing?:string|null};
export type CorrectionDetail=CorrectionContext&{id:string;self:boolean;state:string;before:string;proposed:'present'|'absent';base:number;reason:string;decision_reason:string|null;created_at:string;decided_at:string|null};
export type CorrectionRow={id:string;event:string;player:string;name:string;before_status:string;proposed:string;base_version:number;created_at:string;state:string};
export type CorrectionList={owner:boolean;items:CorrectionRow[];more:boolean};
export type CorrectionHistory={items:{id:string;kind:string;reason:string;created_at:string}[];more:boolean};
export type CorrectionReceipt={request:string;event:string;player:string;state:string};
export function isCorrectionReceipt(v:unknown,event:string):v is CorrectionReceipt {if(!v||typeof v!=='object'||Array.isArray(v))return false;const r=v as Record<string,unknown>;return r.event===event&&typeof r.request==='string'&&uuid.test(r.request)&&typeof r.player==='string'&&uuid.test(r.player)&&['pending','approved','rejected','stale','expired','ineligible'].includes(String(r.state));}
