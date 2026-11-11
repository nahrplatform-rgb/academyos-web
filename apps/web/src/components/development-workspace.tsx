'use client';
import {useCallback,useEffect,useRef,useState}from'react';
import{useUser,UserButton,SignInButton}from'@clerk/nextjs';
import Link from 'next/link';
import WorkspaceShell,{PublicWorkspace}from'./workspace-shell';
import WorkspacePanes from'./workspace-panes';
import{Button,Select}from'./ui/controls';
import{listenForVisibleResume}from'@/lib/visible-resume';
import {ownerTodayTaskReturn,useOwnerTodayReviewSource} from '@/lib/owner-session-navigation';
import type{FeedbackFields,FeedbackDetail,FeedbackSummary,FeedbackHistory,FeedbackPublication}from'@/lib/development';
const emptyFeedback=():FeedbackFields=>({strengths:'',focus:'',next:'',private:''});
type Notice=''|'retained'|'cancelled'|'confirmed_loading'|'confirmed';
type Props={locale:string;academy:string;family?:boolean;initialEvent?:string;initialPlayer?:string;initialLink?:string;initialAssessment?:string};
type Query=Record<string,unknown>&{action:string};
type Listing={items:FeedbackSummary[];more:boolean};
type FeedbackTarget={event:string;player:string};
type Pending=FeedbackTarget&{operation:string};
type OperationResult={cancelled?:boolean;operation?:string;event?:string;player?:string};
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
class Failure extends Error{constructor(public code:string){super(code);}}
const isAccessFailure=(code:string)=>code==='denied'||code==='sign_in_required';

function readOriginal(key:string):Pending|null {
 const raw=sessionStorage.getItem(key);
 if(raw===null)return null;
 let value;
 try{value=JSON.parse(raw);}catch{throw new Failure('recovery_unavailable');}
 if(!value||Object.keys(value).length!==3||![value.event,value.player,value.operation].every(id=>typeof id==='string'&&uuid.test(id)))
  throw new Failure('recovery_unavailable');
 return {event:value.event,player:value.player,operation:value.operation};
}

function confirmedOriginal(result:OperationResult,original:Pending){
 return result?.operation===original.operation&&result.event===original.event&&result.player===original.player;
}
export default function DevelopmentWorkspace(props:Props){const user=useUser();const[authTimeout,setAuthTimeout]=useState(false);useEffect(()=>{if(user.isLoaded)return;const timer=setTimeout(()=>setAuthTimeout(true),15000);return()=>clearTimeout(timer);},[user.isLoaded]);if(!user.isLoaded)return <PublicWorkspace locale={props.locale} title={props.locale==='ar'?'التطور':'Development'}><p role="status">{authTimeout?(props.locale==='ar'?'تعذر تحميل تسجيل الدخول. أعد تحميل الصفحة.':'Could not load sign-in. Reload this page.'):(props.locale==='ar'?'جارٍ تحميل تسجيل الدخول…':'Loading sign-in…')}</p>{authTimeout&&<Button onClick={()=>window.location.reload()}>{props.locale==='ar'?'إعادة المحاولة':'Retry'}</Button>}</PublicWorkspace>;if(!user.user)return <PublicWorkspace locale={props.locale} title={props.locale==='ar'?'تسجيل الدخول':'Sign in'}><SignInButton forceRedirectUrl={`/${props.locale}/workspace/${props.academy}/${props.family?'guardian/':''}development`}><Button>{props.locale==='ar'?'تسجيل الدخول':'Sign in'}</Button></SignInButton></PublicWorkspace>;return <Journey key={`${user.user.id}:${props.academy}:${props.family}:${props.initialEvent??''}:${props.initialPlayer??''}:${props.initialLink??''}:${props.initialAssessment??''}`} {...props} subject={user.user.id}/>;}
function Journey({locale:initial,academy,family=false,initialEvent,initialPlayer,initialLink,initialAssessment,subject}:Props&{subject:string}){
 const reviewSource=useOwnerTodayReviewSource();
 const exactTask=!family&&Boolean(initialEvent&&initialPlayer);
 const recoveryKey=`development:v1:${subject}:${academy}`;
 const resultTarget=useRef<FeedbackTarget|null>(null);
 const[locale,setLocale]=useState(initial),[role,setRole]=useState(''),[query,setQuery]=useState<Query|null>(null),[listing,setListing]=useState<Listing|null>(null),[stack,setStack]=useState<Query[]>([]),[detail,setDetail]=useState<FeedbackDetail|null>(null),[publication,setPublication]=useState<FeedbackPublication|null>(null);
 const[fields,setFields]=useState<FeedbackFields>(emptyFeedback),[language,setLanguage]=useState<'en'|'ar'>(initial==='ar'?'ar':'en'),[reason,setReason]=useState(''),[mode,setMode]=useState('view'),[busy,setBusy]=useState(true),[error,setError]=useState(''),[notice,setNotice]=useState<Notice>(''),[denied,setDenied]=useState(false),[pending,setPending]=useState<Pending|null>(null),[unknown,setUnknown]=useState(false),[confirmed,setConfirmed]=useState(false),[history,setHistory]=useState<FeedbackHistory[]>([]),[historyMore,setHistoryMore]=useState(false),[historyOpen,setHistoryOpen]=useState(false),[historyError,setHistoryError]=useState(''),[historyBusy,setHistoryBusy]=useState(false);
 const[from,setFrom]=useState(()=>{const d=new Date();d.setUTCDate(d.getUTCDate()-13);return d.toISOString().slice(0,10);}),[filter,setFilter]=useState('all'),[receipt,setReceipt]=useState('');
 const alive=useRef(true),generation=useRef(0),controller=useRef<AbortController|null>(null),opRunning=useRef(false),dirtyRef=useRef(false),detailRef=useRef<FeedbackDetail|null>(null),queryRef=useRef<Query|null>(null),refreshRef=useRef<()=>void>(()=>{}),opener=useRef<HTMLButtonElement|null>(null),openerId=useRef('');
 const ar=locale==='ar',t=(en:string,a:string)=>ar?a:en,locked=!!pending||busy||confirmed,dirty=!!detail&&['edit','submit'].includes(mode)&&JSON.stringify(fields)!==JSON.stringify(detail.fields??emptyFeedback())||!!reason&&['return','withdraw'].includes(mode);
 useEffect(()=>{dirtyRef.current=dirty;detailRef.current=detail;queryRef.current=query;},[dirty,detail,query]);
 const message=(code:string)=>({denied:t('Access is unavailable. Return to your workspaces or sign in with the intended account.','الصلاحية غير متاحة. عد إلى مساحاتك أو سجل الدخول بالحساب المقصود.'),stale:t('A newer version exists. Reload it; retain and compare your text before reapplying.','يوجد إصدار أحدث. أعد تحميله وقارن نصك المحتفظ به قبل إعادة تطبيقه.'),conflict:t('This operation no longer matches the current state. Reload before trying again.','لم تعد العملية تطابق الحالة الحالية. أعد التحميل قبل المحاولة.'),state_changed:t('This revision is no longer editable or reviewable. Reload the current state.','لم يعد هذا الإصدار قابلاً للتحرير أو المراجعة. أعد تحميل الحالة الحالية.'),author_ineligible:t('The author’s original assignment is no longer current. Return this submission for a new reviewable version.','لم يعد تعيين المؤلف الأصلي سارياً. أعد الإرسال للحصول على إصدار جديد للمراجعة.'),not_ended:t('Feedback can be written after the session ends.','يمكن كتابة الملاحظات بعد انتهاء التدريب.'),limited:t('Too many requests. Wait briefly, then retry.','طلبات كثيرة. انتظر قليلاً ثم حاول مجدداً.'),invalid:t('Check the required text, field lengths and selected values.','تحقق من النصوص المطلوبة وأطوال الحقول والقيم المحددة.'),sign_in_required:t('Sign in again to check this feedback or recover the original save.','سجّل الدخول مجدداً للتحقق من الملاحظات أو استعادة الحفظ الأصلي.'),storage_unavailable:t('This browser could not keep a recovery reference. Nothing was submitted.','تعذر حفظ مرجع الاستعادة في هذا المتصفح. لم يُرسل شيء.'),recovery_unavailable:t('The saved recovery reference is unavailable. Keep this tab open and retry before saving.','مرجع الاستعادة المحفوظ غير متاح. أبقِ علامة التبويب مفتوحة وأعد المحاولة قبل الحفظ.')}[code]??t('Could not load or confirm the operation. Retry the current read.','تعذر تحميل العملية أو تأكيدها. أعد محاولة القراءة الحالية.'));
 const raw=useCallback(async<T,>(body:Record<string,unknown>,signal?:AbortSignal):Promise<T>=>{
  const response=await fetch('/api/development',{method:'POST',headers:{'Content-Type':'application/json'},
   body:JSON.stringify({...body,academy}),cache:'no-store',signal:signal??AbortSignal.timeout(15000)});
  if(response.status===401)throw new Failure('sign_in_required');
  if(response.status===403)throw new Failure('denied');
  let result;
  try{result=await response.json();}catch{throw new Failure('unavailable');}
  if(!response.ok||result?.error||result?.data?.error)throw new Failure(result?.error??result?.data?.error??'unavailable');
  return result?.data as T;
 },[academy]);
 function clearSelection(){setDetail(null);setPublication(null);setMode('view');setFields(emptyFeedback());setReason('');setHistory([]);setHistoryOpen(false);setHistoryError('');setHistoryBusy(false);}
 function deny(code='denied'){generation.current++;controller.current?.abort();setDenied(true);setDetail(null);setPublication(null);setListing(null);setFields(emptyFeedback());setReason('');setHistory([]);setReceipt('');setMode('view');setConfirmed(false);setBusy(false);setError(code);}
 function guard(){return !locked&&(!dirty||window.confirm(t('Leave without saving these edits?','المغادرة دون حفظ هذه التعديلات؟')));}
 async function load(q:Query,newStack:Query[]=[]){const gen=++generation.current;controller.current?.abort();const c=new AbortController();controller.current=c;clearSelection();setListing(null);setQuery(q);setStack(newStack);setBusy(true);setError('');setNotice('');try{const data=await raw<Listing>(q,AbortSignal.any([c.signal,AbortSignal.timeout(15000)]));if(!alive.current||gen!==generation.current)return;setListing(data);setDenied(false);return true;}catch(e){if(!alive.current||gen!==generation.current)return;const code=e instanceof Failure?e.code:'unavailable';if(isAccessFailure(code))deny(code);else setError(code);}finally{if(alive.current&&gen===generation.current)setBusy(false);}}
 function showDetail(next:FeedbackDetail){
  setDetail(next);setRole(next.owner?'owner':'trainer');setDenied(false);
  setFields(next.fields??emptyFeedback());setLanguage(next.language??(ar?'ar':'en'));
 }
 async function initialLoad(){
  const gen=++generation.current;
  setBusy(true);setError('');
  try{
   if(family){
    setRole('guardian');
    if(initialLink&&initialAssessment){
     const loaded=await load({action:'family_list',link:initialLink});
     if(loaded){
      const currentGeneration=generation.current;
      try{
       const value=await raw<FeedbackPublication>({action:'family_detail',link:initialLink,assessment:initialAssessment});
       if(alive.current&&currentGeneration===generation.current)setPublication(value);
      }catch(e){
       if(!alive.current||currentGeneration!==generation.current)return;
       if(e instanceof Failure&&isAccessFailure(e.code))deny(e.code);else setError('unavailable');
      }
     }
    }else await load({action:'links'});
    return;
   }
   if(initialEvent&&initialPlayer){
    const next=await raw<FeedbackDetail>({action:'detail',event:initialEvent,player:initialPlayer});
    if(alive.current&&gen===generation.current)showDetail(next);
    return;
   }
   const ctx=await raw<{role:string}>({action:'context'});
   if(!alive.current||gen!==generation.current)return;
   setRole(ctx.role);
   await load(ctx.role==='owner'?{action:'queue',scope:'all'}:{action:'sessions',from});
  }catch(e){
   if(!alive.current||gen!==generation.current)return;
   const code=e instanceof Failure?e.code:'unavailable';
   if(isAccessFailure(code))deny(code);else setError(code);
  }finally{
   if(alive.current&&gen===generation.current)setBusy(false);
  }
 }
 useEffect(()=>{
  alive.current=true;
  let mounted=true;
  queueMicrotask(()=>{
   if(!mounted)return;
   if(!family){
    try{
     const original=readOriginal(recoveryKey);
     if(original){setPending(original);setUnknown(true);setBusy(false);return;}
    }catch{/* Reads remain available. A save checks recovery storage before submission. */}
   }
   void initialLoad();
  });
  return()=>{mounted=false;alive.current=false;controller.current?.abort();};
 // Identity, academy and explicit route changes remount this journey.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[]);
 async function open(item:FeedbackSummary,event?:React.MouseEvent<HTMLButtonElement>){if(!guard())return;opener.current=event?.currentTarget??null;openerId.current=item.id;
  if(query?.action==='sessions'){await load({action:'roster',event:item.id});return;}
  if(query?.action==='links'){await load({action:'family_list',link:item.id});return;}
  const gen=++generation.current;controller.current?.abort();const c=new AbortController();controller.current=c;clearSelection();setBusy(true);setError('');setNotice('');
  try{if(family){const p=await raw<FeedbackPublication>({action:'family_detail',link:query?.link,assessment:item.id},AbortSignal.any([c.signal,AbortSignal.timeout(15000)]));if(!alive.current||gen!==generation.current)return;setPublication(p);}
   else{const d=await raw<FeedbackDetail>({action:'detail',event:item.event_id??query?.event,player:item.player_id??item.id},AbortSignal.any([c.signal,AbortSignal.timeout(15000)]));if(!alive.current||gen!==generation.current)return;setDetail(d);setFields(d.fields??emptyFeedback());setLanguage(d.language??(ar?'ar':'en'));}}
  catch(e){if(alive.current&&gen===generation.current){const code=e instanceof Failure?e.code:'unavailable';if(isAccessFailure(code))deny(code);else setError(code);}}finally{if(alive.current&&gen===generation.current)setBusy(false);}}
 async function refresh(keepText=false){
  if(pending||opRunning.current)return;
  const target=resultTarget.current??detailRef.current;
  if(!query&&!target){
   if(!family){
    try{
     const original=readOriginal(recoveryKey);
     if(original){setPending(original);setUnknown(true);setBusy(false);return;}
    }catch{/* A read does not replace a saved recovery reference. */}
   }
   await initialLoad();return;
  }
  const gen=++generation.current;
  setBusy(true);setError('');setNotice('');
  try{
   if(target){
    const fresh=await raw<FeedbackDetail>({action:'detail',event:target.event,player:target.player});
    if(!alive.current||gen!==generation.current)return;
    if(keepText){setDetail(fresh);setNotice('retained');}
    else{showDetail(fresh);setMode('view');setReason('');}
   }
   if(publication&&family&&query){
    const next=await raw<FeedbackPublication>({action:'family_detail',link:query.link,assessment:publication.id});
    if(!alive.current||gen!==generation.current)return;
    setPublication(next);
   }
   if(query){
    const next=await raw<Listing>(query);
    if(!alive.current||gen!==generation.current)return;
    setListing(next);setDenied(false);
   }
   if(confirmed)setNotice('confirmed');
   setConfirmed(false);resultTarget.current=null;
  }catch(e){
   if(!alive.current||gen!==generation.current)return;
   const code=e instanceof Failure?e.code:'unavailable';
   if(isAccessFailure(code))deny(code);
   else{setError(code);setListing(null);}
  }finally{
   if(alive.current&&gen===generation.current)setBusy(false);
  }
 }
 useEffect(()=>{refreshRef.current=()=>{if(opRunning.current||pending||busy)return;void refresh(dirtyRef.current);};});
 useEffect(()=>listenForVisibleResume(()=>refreshRef.current()),[]);
 useEffect(()=>{
  const onLeave=(e:BeforeUnloadEvent)=>{if(dirty||pending){e.preventDefault();e.returnValue='';}};
  window.addEventListener('beforeunload',onLeave);
  return()=>window.removeEventListener('beforeunload',onLeave);
 },[dirty,pending]);
 function clearOriginal(original:Pending){
  try{
   if(readOriginal(recoveryKey)?.operation===original.operation)sessionStorage.removeItem(recoveryKey);
  }catch{/* Keep any unresolved stored reference available on reopen. */}
  setPending(null);setUnknown(false);
 }
 async function acknowledged(result:OperationResult,original:Pending){
  clearOriginal(original);
  if(result.cancelled&&detailRef.current?.event===original.event&&detailRef.current.player===original.player){
   setNotice('cancelled');return;
  }
  if(!result.cancelled){
   setReceipt(original.operation);setConfirmed(true);setNotice('confirmed_loading');
  }
  const gen=generation.current;
  resultTarget.current={event:original.event,player:original.player};
  setBusy(true);
  try{
   const next=await raw<FeedbackDetail>({action:'detail',event:original.event,player:original.player});
   const list=queryRef.current?await raw<Listing>(queryRef.current):null;
   if(!alive.current||gen!==generation.current)return;
   showDetail(next);setReason('');setMode('view');setHistoryOpen(false);setHistory([]);
   if(list)setListing(list);
   setNotice(result.cancelled?'cancelled':'confirmed');setConfirmed(false);resultTarget.current=null;
  }catch(e){
   if(!alive.current||gen!==generation.current)return;
   const code=e instanceof Failure?e.code:'unavailable';
   if(isAccessFailure(code))deny(code);
   else{setNotice('');setListing(null);setError(code);}
  }finally{
   if(alive.current&&gen===generation.current)setBusy(false);
  }
 }
 async function command(act:string){
  if(!detail||locked||opRunning.current)return;
  setError('');setNotice('');
  const original={event:detail.event,player:detail.player,operation:crypto.randomUUID()};
  try{
   const existing=readOriginal(recoveryKey);
   if(existing){setPending(existing);setUnknown(true);return;}
   const stored=JSON.stringify(original);
   sessionStorage.setItem(recoveryKey,stored);
   if(sessionStorage.getItem(recoveryKey)!==stored)throw new Failure('storage_unavailable');
  }catch(e){setError(e instanceof Failure?e.code:'storage_unavailable');return;}
  setPending(original);setUnknown(false);opRunning.current=true;
  try{
   const result=await raw<OperationResult>({action:'command',...original,command:act,version:detail.version,
    fields:act==='save'||act==='submit'?{...fields}:{},language,reason:act==='return'||act==='withdraw'?reason.trim():''});
   if(!confirmedOriginal(result,original))throw new Failure('unavailable');
   if(alive.current)await acknowledged(result,original);
  }catch(e){
   if(!alive.current)return;
   const code=e instanceof Failure?e.code:'unavailable';
   if(code==='denied'){clearOriginal(original);deny(code);}
   else if(['stale','conflict','state_changed','invalid','limited','author_ineligible','not_ended'].includes(code)){
    clearOriginal(original);setError(code);
   }else{
    if(code==='sign_in_required')deny(code);
    setUnknown(true);setNotice('');
   }
  }finally{opRunning.current=false;}
 }
 async function reconcile(){
  if(!pending||opRunning.current)return;
  const original=pending;
  opRunning.current=true;setBusy(true);setError('');
  try{
   const result=await raw<OperationResult>({action:'operation',...original});
   if(result?.cancelled!==true&&!confirmedOriginal(result,original))throw new Failure('unavailable');
   if(alive.current)await acknowledged(result,original);
  }catch(e){
   if(!alive.current)return;
   const code=e instanceof Failure?e.code:'unavailable';
   if(isAccessFailure(code))deny(code);else setError(code);
   setUnknown(true);
  }finally{
   opRunning.current=false;
   if(alive.current)setBusy(false);
  }
 }
 async function loadHistory(before?:number){if(!detail||historyBusy||pending)return;setHistoryBusy(true);setHistoryError('');const gen=generation.current;try{const h=await raw<{items:FeedbackHistory[];more:boolean}>({action:'history',event:detail.event,player:detail.player,before});if(!alive.current||gen!==generation.current)return;setHistory(before?[...history,...h.items]:h.items);setHistoryMore(h.more);setHistoryOpen(true);}catch(e){if(alive.current&&gen===generation.current){if(e instanceof Failure&&isAccessFailure(e.code))deny(e.code);else setHistoryError('unavailable');}}finally{if(alive.current&&gen===generation.current)setHistoryBusy(false);}}
 function next(){if(!listing?.more||!query||!guard())return;const last=listing.items.at(-1)!;void load({...query,after:last.id,...(query.action==='sessions'?{after_at:last.starts_at}:{})},[...stack,query]);}
 const status=(s:string|null|undefined)=>({draft:t('Draft','مسودة'),submitted:t('Awaiting Owner review','بانتظار مراجعة المالك'),returned:t('Changes requested','مطلوب تعديل'),published:t('Published','منشور'),withdrawn:t('Withdrawn','مسحوب')}[s??'']??t('Not started','لم يبدأ'));
 const publicFields=(f:Partial<FeedbackFields>)=><div className="development-public">{(['strengths','focus','next']as const).map((key,i)=><section key={key}><h3>{[t('Strengths','نقاط القوة'),t('Improvement focus','محور التحسين'),t('Next steps','الخطوات القادمة')][i]}</h3><p dir="auto">{f[key]||t('Not entered','لم تُكتب بعد')}</p></section>)}</div>;
 const historyTitle=(kind:string)=>({save:t('Draft saved','حُفظت المسودة'),submit:t('Submitted','أُرسلت للمراجعة'),return:t('Returned for changes','أُعيدت للتعديل'),publish:t('Published','نُشرت'),amend:t('Amendment started','بدأ التعديل'),withdraw:t('Withdrawn','سُحبت')}[kind]??kind);
 const inspector=publication?<><h3>{publication.context.name}</h3><p>{publication.context.title} · {publication.context.branch} · {publication.context.sport}</p><p>{new Date(publication.context.starts_at).toLocaleString(ar?'ar':'en',{timeZone:publication.context.timezone})} · {publication.context.timezone}</p><p>{t('Published','نُشر')} {new Date(publication.created_at).toLocaleString(ar?'ar':'en')} · {t('Revision','الإصدار')} {publication.revision}</p>{publicFields(publication.fields)}</>:detail?<>
 <h3>{detail.name}</h3><p>{detail.title} · {detail.branch} · {detail.sport}</p><p>{new Date(detail.starts_at).toLocaleString(ar?'ar':'en',{timeZone:detail.timezone})} · {detail.timezone}</p><p className="development-status">{status(detail.state)} · {t('Revision','الإصدار')} {detail.revision}</p>
 {detail.internal_reason&&<section className="development-private"><strong>{t('Internal review reason','سبب المراجعة الداخلي')}</strong><p dir="auto">{detail.internal_reason}</p></section>}
 {detail.publication&&<p>{t(`Family currently sees published revision ${detail.publication.revision}.`,`ترى الأسرة حالياً الإصدار المنشور ${detail.publication.revision}.`)}</p>}
 {mode==='edit'?<><label>{t('Content language','لغة الملاحظات')}<Select disabled={locked} value={language} onChange={e=>setLanguage(e.target.value as 'en'|'ar')}><option value="en">English</option><option value="ar">العربية</option></Select></label>{(['strengths','focus','next','private']as const).map((key,i)=><label key={key}>{[t('Strengths','نقاط القوة'),t('Improvement focus','محور التحسين'),t('Next steps','الخطوات القادمة'),t('Private staff note — never shared with families','ملاحظة خاصة للطاقم — لا تُعرض للأسرة')][i]}<textarea dir="auto" rows={3} disabled={locked} value={fields[key]} onChange={e=>setFields({...fields,[key]:e.target.value})}/><small>{t('Maximum 2,000 characters per field.','الحد الأقصى ٢٠٠٠ حرف لكل حقل.')}</small></label>)}<div className="journey-actions"><Button disabled={locked} onClick={()=>void command('save')}>{t('Save draft','حفظ المسودة')}</Button><Button disabled={locked} onClick={()=>{if(!fields.strengths.trim()||!fields.focus.trim()||!fields.next.trim()){setError('invalid');return;}setMode('submit');}}>{t('Review submission','مراجعة الإرسال')}</Button></div></>:mode==='submit'?<><h3>{t('Review exact submission','مراجعة الإرسال بالتحديد')}</h3>{publicFields(fields)}<section className="development-private"><strong>{t('Private staff note','ملاحظة الطاقم الخاصة')}</strong><p dir="auto">{fields.private||t('None','لا توجد')}</p></section><p>{t('Submitting freezes this version for Owner review. It does not publish it.','يثبت الإرسال هذا الإصدار لمراجعة المالك ولا ينشره.')}</p><Button disabled={locked} onClick={()=>void command('submit')}>{t('Submit for Owner review','إرسال لمراجعة المالك')}</Button><Button disabled={locked} onClick={()=>setMode('edit')}>{t('Back to editing','العودة للتحرير')}</Button></>:<>
 {publicFields(detail.fields??{})}{detail.fields?.private&&<section className="development-private"><strong>{t('Private staff note','ملاحظة الطاقم الخاصة')}</strong><p dir="auto">{detail.fields.private}</p></section>}
 {!detail.owner&&detail.ended&&(!detail.id||['draft','returned'].includes(detail.state??''))&&<Button disabled={locked} onClick={()=>setMode('edit')}>{detail.id?t('Continue draft','متابعة المسودة'):t('Write feedback','كتابة الملاحظات')}</Button>}
 {!detail.owner&&['published','withdrawn'].includes(detail.state??'')&&<Button disabled={locked} onClick={()=>void command('amend')}>{t('Propose an amendment','اقتراح تعديل')}</Button>}
 {detail.owner&&detail.state==='submitted'&&mode==='view'&&<div className="journey-actions"><Button className={exactTask?'primary':undefined} disabled={locked||detail.self||!detail.author_current} onClick={()=>setMode('publish')}>{t('Review publication','مراجعة النشر')}</Button><Button disabled={locked||detail.self} onClick={()=>setMode('return')}>{t('Request changes','طلب تعديلات')}</Button></div>}
 {detail.owner&&detail.state==='submitted'&&!detail.author_current&&<p role="status">{message('author_ineligible')}</p>}{detail.owner&&detail.self&&detail.state==='submitted'&&<p role="status">{t('A different-account Owner must review this submission.','يجب أن يراجع هذا الإرسال مالك من حساب مختلف.')}</p>}
 {detail.owner&&detail.publication&&mode==='view'&&<Button disabled={locked} onClick={()=>setMode('withdraw')}>{t('Withdraw publication','سحب المنشور')}</Button>}
 {mode==='publish'&&<section className="development-confirm"><h3>{t('Publish this exact version?','نشر هذا الإصدار بالتحديد؟')}</h3><p>{t('Only the three public fields above become available to currently approved and enabled linked Guardians. Private notes stay internal.','تتاح الحقول العامة الثلاثة أعلاه فقط لأولياء الأمور المرتبطين المعتمدين والمفعّلين حالياً. تبقى الملاحظات الخاصة داخلية.')}</p><Button className={exactTask?'primary':undefined} disabled={locked} onClick={()=>void command('publish')}>{t('Confirm publication','تأكيد النشر')}</Button><Button disabled={locked} onClick={()=>setMode('view')}>{t('Back to review','العودة للمراجعة')}</Button></section>}
 {['return','withdraw'].includes(mode)&&<section className="development-confirm"><h3>{mode==='return'?t('Return for changes','إعادة للتعديل'):t('Withdraw current publication','سحب المنشور الحالي')}</h3><label>{t('Internal reason','سبب داخلي')}<textarea rows={3} dir="auto" disabled={locked} value={reason} onChange={e=>setReason(e.target.value)}/></label><p>{mode==='return'?t('The Trainer can revise. Any existing publication stays visible.','يمكن للمدرب التعديل. يبقى أي منشور سابق مرئياً.'):t('Future family reads will hide this publication. History remains.','لن تعرض القراءات التالية للأسرة هذا المنشور. يبقى السجل.')}</p><Button className={exactTask&&mode==='return'?'primary':undefined} disabled={locked||!reason.trim()} onClick={()=>void command(mode)}>{mode==='return'?t('Confirm return','تأكيد الإعادة'):t('Confirm withdrawal','تأكيد السحب')}</Button><Button disabled={locked} onClick={()=>{setReason('');setMode('view');}}>{t('Back','رجوع')}</Button></section>}
 </>}
 {detail.id&&<><Button disabled={locked||historyBusy} onClick={()=>historyOpen?setHistoryOpen(false):void loadHistory()}>{historyOpen?t('Hide internal history','إخفاء السجل الداخلي'):t('Internal revision history','سجل الإصدارات الداخلي')}</Button>{historyBusy&&<p role="status">{t('Loading history…','جارٍ تحميل السجل…')}</p>}{historyError&&<p role="alert">{t('Could not load history. Try again.','تعذر تحميل السجل. حاول مجدداً.')}</p>}{historyOpen&&<ol>{history.map(h=><li key={h.version}><strong>{historyTitle(h.kind)} · {t('Revision','الإصدار')} {h.revision}</strong><p>{new Date(h.created_at).toLocaleString(ar?'ar':'en')}</p>{h.reason&&<p dir="auto">{h.reason}</p>}{(h.submitted_fields||h.published_fields)&&<details><summary>{t('Retained exact text','النص المحفوظ بالتحديد')}</summary>{publicFields(h.submitted_fields??h.published_fields??{})}{h.submitted_fields?.private&&<section className="development-private"><strong>{t('Private staff note','ملاحظة الطاقم الخاصة')}</strong><p dir="auto">{h.submitted_fields.private}</p></section>}</details>}</li>)}</ol>}{historyOpen&&historyMore&&<Button disabled={locked||historyBusy} onClick={()=>void loadHistory(history.at(-1)?.version)}>{t('Earlier history','السجل الأقدم')}</Button>}</>}
 </>:<p>{t('Choose a player or assessment to continue.','اختر لاعباً أو تقييماً للمتابعة.')}</p>;
 const todayReturn=detail?.owner&&detail.id&&detail.id===reviewSource
  &&detail.event===initialEvent&&detail.player===initialPlayer
  ?ownerTodayTaskReturn(locale,academy,'development',detail.id):null;
 const browseHref=`/${locale}/workspace/${academy}/development`;
 return <div className="development-layout"><WorkspaceShell role={family?'guardian':role==='owner'?'owner':role==='trainer'?'trainer':'workspace'} module="development" locale={locale} context={family?t('Guardian workspace','مساحة ولي الأمر'):role==='owner'?t('Academy Owner workspace','مساحة مالك الأكاديمية'):t('Trainer workspace','مساحة المدرب')} title={t('Development feedback','ملاحظات التطور')} homeHref={`/${locale}/workspace`} languageHref={`/${ar?'en':'ar'}/workspace/${academy}/${family?'guardian/':''}development`} onNavigate={e=>{if(e.currentTarget.href.includes('/development')&&e.currentTarget.getAttribute('hreflang')){e.preventDefault();setLocale(ar?'en':'ar');return;}if(!guard())e.preventDefault();}} navigation={[{href:`/${locale}/workspace`,label:t('Your workspaces','مساحاتك')},{href:`/${locale}/workspace/${academy}/${family?'guardian/training':role==='owner'?'programs':'trainer/schedule'}`,label:t('Training & attendance','التدريبات والحضور')},{href:`/${locale}/workspace/${academy}/${family?'guardian/':''}development`,label:t('Development','التطور'),current:true}]} account={<UserButton/>}>
 <header className="task-header">
  <h1>{exactTask?t('Development feedback','ملاحظات التطور'):t('Player development','تطور اللاعبين')}</h1>
  <div className="journey-actions">
   {todayReturn&&<Link className="ui-button" href={todayReturn.href} prefetch={false} aria-disabled={locked} onClick={e=>{if(!guard())e.preventDefault();}}>{todayReturn.label}</Link>}
   {exactTask&&<Link className="ui-button" href={browseHref} prefetch={false} aria-disabled={locked} onClick={e=>{if(!guard())e.preventDefault();}}>{t('Browse development','تصفح التطور')}</Link>}
   <Button disabled={locked} onClick={()=>void refresh(dirty)}>{t('Refresh view','تحديث العرض')}</Button>
  </div>
 </header>
 <section className="development-workspace">{!exactTask&&<p>{family?t('Published feedback for your approved linked player.','الملاحظات المنشورة للاعب المرتبط بك والمعتمد.'):t('Write after a session, review the exact version, then share published feedback with the approved family.','اكتب بعد التدريب وراجع الإصدار بالتحديد ثم شارك المنشور مع الأسرة المعتمدة.')}</p>}
 {pending&&<section role="status" className="development-confirm"><strong>{unknown?t('Outcome unknown. Do not submit again.','النتيجة غير معروفة. لا ترسل مجدداً.'):t('Saving…','جارٍ الحفظ…')}</strong>{unknown&&<Button disabled={busy} onClick={()=>void reconcile()}>{t('Check original operation','التحقق من العملية الأصلية')}</Button>}</section>}
 {denied?<p role="alert">{message(error||'denied')}</p>:<>
 {error&&!(confirmed&&error==='unavailable')&&<div role="alert">{message(error)}{!pending&&<Button disabled={busy} onClick={()=>void refresh(dirty)}>{t('Reload current view; retain my text','إعادة تحميل العرض والاحتفاظ بنصي')}</Button>}</div>}{notice&&<p role="status">{({retained:t('Current version loaded. Your text is retained; compare it before saving.','حُمّل الإصدار الحالي. احتُفظ بنصك؛ قارنه قبل الحفظ.'),cancelled:t('The original operation did not commit and is fenced. Review your retained input before trying again.','لم تُحفظ العملية الأصلية وأُغلقت. راجع مدخلاتك المحتفظ بها قبل المحاولة.'),confirmed_loading:t('Operation confirmed. Reloading the current saved result.','تأكدت العملية. جارٍ تحميل النتيجة المحفوظة الحالية.'),confirmed:t('Operation confirmed. The current saved result is shown.','تأكدت العملية. تُعرض النتيجة المحفوظة الحالية.')}[notice])}</p>}{receipt&&<p className="development-receipt">{t('Confirmed operation','العملية المؤكدة')}: {receipt}</p>}
 {confirmed&&!pending&&<section role="status"><p>{t('Save confirmed; the current read failed. Reload before continuing.','تأكد الحفظ وفشلت القراءة الحالية. أعد التحميل قبل المتابعة.')}</p><Button disabled={busy} onClick={()=>void refresh()}>{t('Retry current view','إعادة تحميل العرض الحالي')}</Button></section>}
 {busy&&<p role="status">{t('Loading current authorized view…','جارٍ تحميل العرض المسموح الحالي…')}</p>}
 {!confirmed&&!unknown&&(exactTask
 ?<WorkspacePanes task arabic={ar} title={t('Feedback details','تفاصيل الملاحظات')} selected={!!detail} selectionKey={detail?.id??detail?.player}
   inspector={error==='unavailable'?<p>{t('Read unavailable. Reload the current view; your unsaved text is retained.','القراءة غير متاحة. أعد تحميل العرض الحالي؛ نصك غير المحفوظ باقٍ.')}</p>:detail?inspector:null}>{null}</WorkspacePanes>
 :<WorkspacePanes arabic={ar} title={t('Feedback details','تفاصيل الملاحظات')} selected={!!detail||!!publication} selectionKey={detail?.player??publication?.id} blocked={locked} onBack={()=>{if(!guard())return;clearSelection();requestAnimationFrame(()=>{const target=opener.current?.isConnected?opener.current:document.querySelector<HTMLButtonElement>(`button[data-feedback-id="${openerId.current}"]`);target?.focus();});}} inspector={error==='unavailable'?<p>{t('Read unavailable. Reload the current view; your unsaved text is retained.','القراءة غير متاحة. أعد تحميل العرض الحالي؛ نصك غير المحفوظ باقٍ.')}</p>:inspector}>
 {role==='owner'&&<div className="journey-actions"><Button disabled={locked} onClick={()=>{if(guard())void load({action:'queue',scope:filter});}}>{t('Assessments','التقييمات')}</Button><Button disabled={locked} onClick={()=>{if(guard())void load({action:'sessions',from});}}>{t('Session players','لاعبو التدريب')}</Button></div>}
 {query?.action==='sessions'&&<><label>{t('First day — 14-day view','أول يوم — عرض ١٤ يوماً')}<input type="date" disabled={locked} value={from} onChange={e=>setFrom(e.target.value)}/></label><Button disabled={locked||!from} onClick={()=>{if(guard())void load({action:'sessions',from});}}>{t('Show ended sessions','عرض التدريبات المنتهية')}</Button></>}
 {query?.action==='queue'&&<label>{t('Review filter','تصفية المراجعة')}<Select disabled={locked} value={filter} onChange={e=>{if(!guard())return;setFilter(e.target.value);void load({action:'queue',scope:e.target.value});}}><option value="all">{t('All retained assessments','كل التقييمات المحفوظة')}</option><option value="submitted">{t('Awaiting my review','بانتظار مراجعتي')}</option></Select></label>}
 {query?.action==='roster'&&<Button disabled={locked} onClick={()=>{if(guard())void load({action:'sessions',from});}}>{t('Back to sessions','العودة للتدريبات')}</Button>}{query?.action==='family_list'&&<Button disabled={locked} onClick={()=>{if(guard())void load({action:'links'});}}>{t('Choose linked player','اختيار اللاعب المرتبط')}</Button>}
 {!busy&&listing&&<><h2>{query?.action==='links'?t('Linked players','اللاعبون المرتبطون'):query?.action==='sessions'?t('Ended published sessions','التدريبات المنشورة المنتهية'):query?.action==='roster'?t('Session players','لاعبو التدريب'):query?.action==='family_list'?t('Published feedback','ملاحظات منشورة'):t('Assessments','التقييمات')}</h2>{listing.items.length===0?<section className="journey-card"><h3>{t('Nothing to show in this selection','لا توجد نتائج ضمن هذا الاختيار')}</h3><p>{family?t('Only currently approved development links and published feedback appear. Contact the academy if you expected access.','تظهر فقط ارتباطات التطور المعتمدة حالياً والملاحظات المنشورة. تواصل مع الأكاديمية إذا توقعت صلاحية.'):t('Choose another period or filter. Drafts are created by assigned Trainers after a published session ends.','اختر فترة أو تصفية أخرى. ينشئ المدرب المعيّن المسودة بعد انتهاء التدريب المنشور.')}</p></section>:<ul className="development-list">{listing.items.map(item=><li key={item.id}><Button data-feedback-id={item.id} disabled={locked||item.available===false} aria-pressed={detail?.player===item.id||detail?.id===item.id||publication?.id===item.id} onClick={e=>void open(item,e)}><strong>{item.name??item.title}</strong>{item.branch&&<span>{item.branch} · {item.sport}</span>}{item.starts_at&&<span>{new Date(item.starts_at).toLocaleString(ar?'ar':'en',item.timezone?{timeZone:item.timezone}:{})}</span>}{!family&&item.state!==undefined&&<span>{status(item.state)}</span>}{item.available===false&&<span>{t('Authored by a different Trainer','كتبه مدرب مختلف')}</span>}</Button></li>)}</ul>}<div className="journey-actions"><Button disabled={locked||stack.length===0} onClick={()=>{if(!guard())return;void load(stack.at(-1)!,stack.slice(0,-1));}}>{t('Previous page','الصفحة السابقة')}</Button><Button disabled={locked||!listing.more} onClick={next}>{t('Next page','الصفحة التالية')}</Button></div></>}
 </WorkspacePanes>)}
 </>}
 </section></WorkspaceShell></div>;
}
