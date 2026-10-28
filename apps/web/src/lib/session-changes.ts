import type{DatePlan}from'./planning';
export type SessionState={original:string;date:string;start:string;end:string;canceled:boolean;schedule_version:number;plan_version:number;head:string|null};
export type SessionChangeRead={plan:DatePlan&{scheduled_day:string;canceled:boolean;schedule_version:number};head:string|null;history:{id:string;kind:'move'|'cancel';reason:string;before_state:SessionState;after_state:SessionState;created_at:string}[];more:boolean};
export type SessionChangeIntent={kind:'move'|'cancel';date:string;start:string;end:string;reason:string};
export class SessionChangeInputError extends Error{}
const pattern=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
function id(v:unknown){if(typeof v!=='string'||!pattern.test(v))throw new SessionChangeInputError();return v.toLowerCase();}
function date(v:unknown){if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v)||v.startsWith('0000')||!Number.isFinite(Date.parse(v+'T00:00:00Z'))||new Date(v+'T00:00:00Z').toISOString().slice(0,10)!==v)throw new SessionChangeInputError();return v;}
function time(v:unknown){if(typeof v!=='string'||!/^([01]\d|2[0-3]):[0-5]\d$/.test(v))throw new SessionChangeInputError();return v;}
function revision(v:unknown,min:number){if(!Number.isSafeInteger(v)||(v as number)<min)throw new SessionChangeInputError();return v;}
export function sessionChangeRequest(v:unknown){if(!v||typeof v!=='object'||Array.isArray(v))throw new SessionChangeInputError();const b=v as Record<string,unknown>,a=id(b.academy);let keys:string[],rpc:string,args:Record<string,unknown>,mutating=false;
 if(b.action==='reconcile'){keys=['action','academy','op'];rpc='t9_operation_v1';args={a,op:id(b.op)};mutating=true;}
 else{args={a,p:id(b.program),day:date(b.day)};
 if(b.action==='read'){keys=['action','academy','program','day','after'];rpc='t9_read_v1';args.after_id=b.after==null?null:id(b.after);}
 else if(b.action==='review'||b.action==='save'){keys=['action','academy','program','day','schedule_version','version','head','kind','date','start','end','reason',...(b.action==='save'?['op']:[])];if(!['move','cancel'].includes(String(b.kind))||typeof b.reason!=='string'||!b.reason.trim()||b.reason.length>240)throw new SessionChangeInputError();let nd=null,ns=null,ne=null;if(b.kind==='move'){nd=date(b.date);ns=time(b.start);ne=time(b.end);if(ne<=ns)throw new SessionChangeInputError();}else if(b.date!==null||b.start!==null||b.end!==null)throw new SessionChangeInputError();Object.assign(args,{sv:revision(b.schedule_version,1),pv:revision(b.version,0),head:b.head===null?null:id(b.head),kind:b.kind,new_day:nd,new_start:ns,new_end:ne,reason:b.reason.trim()});rpc=b.action==='save'?'t9_save_v1':'t9_review_v1';if(b.action==='save'){args.op=id(b.op);mutating=true;}}
 else throw new SessionChangeInputError();}
 if(Object.keys(b).some(k=>!keys.includes(k)))throw new SessionChangeInputError();return{rpc,args,mutating};}
