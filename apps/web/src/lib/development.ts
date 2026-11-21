import { uuidPattern } from './onboarding';
export class DevelopmentInputError extends Error {}
const id=(v:unknown)=>{if(typeof v!=='string'||!uuidPattern.test(v))throw new DevelopmentInputError();return v.toLowerCase();};
const integer=(v:unknown,min=0)=>{if(typeof v!=='number'||!Number.isSafeInteger(v)||v<min)throw new DevelopmentInputError();return v;};
export type FeedbackFields={strengths:string;focus:string;next:string;private:string};
export const emptyFeedback=():FeedbackFields=>({strengths:'',focus:'',next:'',private:''});
export function feedbackFields(v:unknown,complete=false):FeedbackFields{if(!v||typeof v!=='object'||Array.isArray(v))throw new DevelopmentInputError();const f=v as Record<string,unknown>;if(Object.keys(f).sort().join()!=='focus,next,private,strengths')throw new DevelopmentInputError();for(const key of ['strengths','focus','next','private'])if(typeof f[key]!=='string'||Array.from(f[key] as string).length>2000||complete&&key!=='private'&&!(f[key]as string).trim())throw new DevelopmentInputError();if(new TextEncoder().encode(JSON.stringify(f)).length>24576)throw new DevelopmentInputError();return f as FeedbackFields;}
export function developmentRequest(value:unknown){
 if(!value||typeof value!=='object'||Array.isArray(value))throw new DevelopmentInputError();
 const b=value as Record<string,unknown>,a=id(b.academy);let keys:string[],rpc:string,args:Record<string,unknown>;let mutating=false;
 switch(b.action){
 case 'context':keys=['action','academy'];rpc='e14_context_v1';args={a};break;
 case 'sessions':{
 keys=['action','academy','from','after_at','after'];rpc='e14_sessions_v1';
 if(typeof b.from!=='string'||!/^\d{4}-\d\d-\d\d$/.test(b.from)||!Number.isFinite(Date.parse(b.from))||new Date(b.from).toISOString().slice(0,10)!==b.from||b.from<'0001-01-01'||b.from>'9999-12-18'||(b.after_at==null)!==(b.after==null))throw new DevelopmentInputError();
 if(b.after_at!=null&&(typeof b.after_at!=='string'||b.after_at.length>35||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,6})?(?:Z|[+-]\d\d:\d\d)$/.test(b.after_at)||!Number.isFinite(Date.parse(b.after_at))))throw new DevelopmentInputError();
 args={a,first_date:b.from,after_at:b.after_at??null,after_id:b.after==null?null:id(b.after)};break;}
 case 'roster':keys=['action','academy','event','after'];rpc='e14_roster_v1';args={a,ev:id(b.event),after_id:b.after==null?null:id(b.after)};break;
 case 'queue':keys=['action','academy','scope','after'];rpc='e14_queue_v1';if(!['all','submitted'].includes(b.scope as string))throw new DevelopmentInputError();args={a,scope:b.scope,after_id:b.after==null?null:id(b.after)};break;
 case 'detail':keys=['action','academy','event','player'];rpc='e14_detail_v1';args={a,ev:id(b.event),player:id(b.player)};break;
 case 'history':keys=['action','academy','event','player','before'];rpc='e14_history_v1';args={a,ev:id(b.event),player:id(b.player),before_version:b.before==null?null:integer(b.before,1)};break;
 case 'operation':keys=['action','academy','event','player','operation'];rpc='e14_operation_v1';args={a,ev:id(b.event),player:id(b.player),op:id(b.operation)};mutating=true;break;
 case 'command':{
 keys=['action','academy','event','player','command','version','fields','language','reason','operation'];rpc='e14_command_v1';mutating=true;
 if(!['save','submit','amend','publish','return','withdraw'].includes(b.command as string)||!['en','ar'].includes(b.language as string)||typeof b.reason!=='string'||Array.from(b.reason).length>1000)throw new DevelopmentInputError();
 const writing=b.command==='save'||b.command==='submit';const f=writing?feedbackFields(b.fields,b.command==='submit'):b.fields;
 if(!writing&&(!f||Array.isArray(f)||typeof f!=='object'||Object.keys(f).length!==0)||['return','withdraw'].includes(b.command as string)&&!b.reason.trim()||!['return','withdraw'].includes(b.command as string)&&b.reason!=='')throw new DevelopmentInputError();
 args={a,ev:id(b.event),player:id(b.player),act:b.command,expected:integer(b.version),f,lang:b.language,reason:b.reason,op:id(b.operation)};break;}
 case 'links':keys=['action','academy','after'];rpc='e14_links_v1';args={a,after_id:b.after==null?null:id(b.after)};break;
 case 'family_list':keys=['action','academy','link','after'];rpc='e14_family_list_v1';args={a,link:id(b.link),after_id:b.after==null?null:id(b.after)};break;
 case 'family_detail':keys=['action','academy','link','assessment'];rpc='e14_family_detail_v1';args={a,link:id(b.link),assessment:id(b.assessment)};break;
 default:throw new DevelopmentInputError();
 }
 if(Object.keys(b).some(k=>!keys.includes(k)))throw new DevelopmentInputError();return{rpc,args,mutating};
}
export type FeedbackSummary={id:string;event_id?:string;player_id?:string;name?:string;state?:string;version?:number;title?:string;starts_at?:string;ends_at?:string;branch?:string;sport?:string;timezone?:string;available?:boolean};
export type FeedbackDetail={event:string;player:string;name:string;owner:boolean;self:boolean;id:string|null;state:string|null;version:number;revision:number;fields:FeedbackFields|null;language:'en'|'ar'|null;publication:{id:string;revision:number;created_at:string}|null;author_current:boolean;internal_reason?:string|null;title:string;branch:string;sport:string;timezone:string;starts_at:string;ends_at:string;ended:boolean};
export type FeedbackHistory={version:number;revision:number;kind:string;reason:string|null;created_at:string;submitted_fields:FeedbackFields|null;published_fields:Omit<FeedbackFields,'private'>|null};
export type FeedbackPublication={id:string;revision:number;fields:Omit<FeedbackFields,'private'>;language:'en'|'ar';created_at:string;context:{name:string;title:string;branch:string;sport:string;timezone:string;starts_at:string;ends_at:string;schema:string}};
