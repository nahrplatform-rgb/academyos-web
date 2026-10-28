/** I4a exact command contract. Current actor and all authority are server-derived. */
export class AttendanceInputError extends Error{}
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
function id(v:unknown){if(typeof v!=='string'||!uuid.test(v))throw new AttendanceInputError();return v.toLowerCase();}
export function attendanceRequest(v:unknown){
 if(!v||typeof v!=='object'||Array.isArray(v))throw new AttendanceInputError();const b=v as Record<string,unknown>,a=id(b.academy),ev=id(b.event);let rpc:string,keys:string[],args:Record<string,unknown>,mutating=false;
 if(b.action==='roster'){keys=['action','academy','event','after'];rpc='a10_roster_v1';args={a,ev,after_id:b.after==null?null:id(b.after)};}
 else if(b.action==='history'){keys=['action','academy','event','player','before'];rpc='a10_history_v1';if(b.before!=null&&(!Number.isSafeInteger(b.before)||(b.before as number)<1))throw new AttendanceInputError();args={a,ev,player:id(b.player),before_version:b.before??null};}
 else if(b.action==='mark'){keys=['action','academy','event','player','status','version','reason','captured_at','op'];rpc='a10_mark_v1';mutating=true;if(!['present','absent'].includes(String(b.status))||!Number.isSafeInteger(b.version)||(b.version as number)<0||!(b.reason===null||typeof b.reason==='string'&&b.reason.trim().length>0&&b.reason.length<=500)||typeof b.captured_at!=='string'||b.captured_at.length>35||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,6})?Z$/.test(b.captured_at)||!Number.isFinite(Date.parse(b.captured_at))||new Date(b.captured_at).toISOString().slice(0,19)!==b.captured_at.slice(0,19))throw new AttendanceInputError();args={a,ev,player:id(b.player),new_status:b.status,expected_version:b.version,reason:b.reason,captured_at:b.captured_at,op:id(b.op)};}
 else if(b.action==='reconcile'){keys=['action','academy','event','op'];rpc='a10_operation_v1';mutating=true;args={a,ev,op:id(b.op)};}
 else throw new AttendanceInputError();if(Object.keys(b).some(k=>!keys.includes(k)))throw new AttendanceInputError();return{rpc,args,mutating};
}
export type AttendancePlayer={id:string;name:string;status:'present'|'absent'|null;version:number};
export type AttendanceRoster={event:string;program:string;day:string;scheduled_day:string;starts_at:string;ends_at:string;projection:{name:string;branch:string;timezone:string;sport:string;sport_ar:string};owner:boolean;server_now:string;closes_at:string;open:boolean;count:number;saved:number;players:AttendancePlayer[];more:boolean;protected:boolean};
export type AttendanceHistory={items:{version:number;actor_role:'owner'|'trainer';before_status:string|null;status:string;reason:string|null;captured_at:string;received_at:string}[];more:boolean};
