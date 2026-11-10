'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { listenForVisibleResume } from '@/lib/visible-resume';
import { useUser, UserButton } from '@clerk/nextjs';
import { WorkspaceReadFailure as ReadFailure } from '@/lib/workspace-read-owner';
import { useWorkspaceReadOwner } from './workspace-runtime';
import WorkspaceShell, { PublicWorkspace, type NavigationItem } from './workspace-shell';
import WorkspacePanes from './workspace-panes';
import { Button, Select } from './ui/controls';
import { ownerNavigation } from './owner-navigation';
import { addCivilDays, monthGridStart, shiftMonth, sessionTime, isCivilDay, formatCount, formatQuantity } from '@/lib/experience-format';
import {ownerAttendanceReturnTask,ownerSessionSourceSuffix} from '@/lib/owner-session-navigation';
import {useOwnerWorkspaceDevice,WorkspaceDeviceTools} from './owner-workspace-device';
import type { CalendarCursor, CurrentCalendarProjection, CalendarProjection, CalendarSession, ExperienceContext } from '@/lib/experience-projections';
type Role='owner'|'trainer'|'guardian';
type Props={locale:string;academy:string;role:Role;calendar?:boolean;anchor?:string;prepared?:boolean;publicOffline?:boolean};
type HomeTask={id:string;title?:string;kind:'program'|'publication'|'correction'|'feedback'|'attendance';program?:string;event?:string;player?:string};
type Panel={tasks?:HomeTask[];state:'ready'|'unavailable';count?:number;items?:CalendarSession[];more?:boolean;item?:{id:string;title?:string;starts_at?:string;ends_at?:string;timezone?:string;date?:string;status?:string;created_at?:string}|null};
type Home={context:ExperienceContext&{setup_required?:boolean;player_name?:string};as_of?:string;setup_required?:boolean;panels?:Record<string,Panel>};
type Link={id:string;display_name:string;branch_name:string};
export default function ExperienceWorkspace(props:Props){
 const session=useUser(),ar=props.locale==='ar';const[authExpired,setAuthExpired]=useState(false);useEffect(()=>{if(session.isLoaded)return;const timer=setTimeout(()=>setAuthExpired(true),15000);return()=>clearTimeout(timer);},[session.isLoaded]);
 if(!session.isLoaded)return <PublicWorkspace locale={props.locale} title="AcademyOS"><p role="status">{authExpired?(ar?'تعذر تحميل تسجيل الدخول. أعد المحاولة.':'Sign-in unavailable. Retry.'):(ar?'جارٍ تحميل تسجيل الدخول…':'Loading sign-in…')}</p>{authExpired&&<Button onClick={()=>window.location.reload()}>{ar?'إعادة المحاولة':'Retry'}</Button>}</PublicWorkspace>;
 if(!session.user)return <PublicWorkspace locale={props.locale} title="AcademyOS"><Link prefetch={false} href={`/${props.locale}/sign-in`}>{ar?'تسجيل الدخول':'Sign in'}</Link></PublicWorkspace>;
 return <ExperienceJourney {...props} subject={session.user.id} key={`${session.user.id}:${props.academy}:${props.role}:${props.calendar}`}/>;
}
export function ExperienceJourney({locale:initialLocale,academy,role,calendar=false,anchor,subject,prepared=false,publicOffline=false}:Props&{subject:string}){
 const device=useOwnerWorkspaceDevice({subject,academy,priority:'calendar',prepared:prepared&&role==='owner'&&calendar,publicOffline,anchor});
 const {approved,active:deviceActive,offline,calendar:readCalendar,context:readContext,needMonth,remove}=device;
 const accessRevoked=device.phase==='denied';
 const [fromDevice,setFromDevice]=useState(false),[missingCoverage,setMissingCoverage]=useState(false),[checking,setChecking]=useState(false);
 const lastChecked=useRef(false),resumeCheck=useRef(false);
 const readOwner=useWorkspaceReadOwner(subject,academy);
 const[locale,setLocale]=useState(initialLocale),[home,setHome]=useState<Home|null>(null),[data,setData]=useState<CalendarProjection|null>(null),[links,setLinks]=useState<Link[]>([]),[link,setLink]=useState(''),[moreLinks,setMoreLinks]=useState(false),[linkAfter,setLinkAfter]=useState<string|null>(null),[from,setFrom]=useState(()=>isCivilDay(anchor)?anchor:''),[view,setView]=useState<'week'|'month'>('week'),[selected,setSelected]=useState<CalendarSession|null>(null),[pages,setPages]=useState<(CalendarCursor|null)[]>([]),[cursor,setCursor]=useState<CalendarCursor|null>(null),[busy,setBusy]=useState(true),[error,setError]=useState(''),[filter,setFilter]=useState(''),[revision,setRevision]=useState(0);
 // The resolved cold-entry anchor is display/navigation state, not another read trigger.
 const currentAnchor=useRef('');
 const localWinner=useRef(0);
 const[resolvedAnchor,setResolvedAnchor]=useState('');
 const displayedFrom=from||resolvedAnchor;
 const[restored,setRestored]=useState(false),[selectedKey,setSelectedKey]=useState<{program:string;day:string}|null>(null);const cacheKey=`academyos:experience:${subject}:${academy}:${role}:${calendar?'calendar':'home'}`;
 const ar=locale==='ar',t=(en:string,a:string)=>ar?a:en,base=`/${locale}/workspace/${academy}`,roleBase=role==='owner'?base:`${base}/${role}`,generation=useRef(0),rowOpener=useRef<HTMLButtonElement|null>(null),selectionRef=useRef<{program:string;day:string}|null>(null),reading=useRef(false),controllers=useRef(new Set<AbortController>());
 const scene=useRef<HTMLDivElement|null>(null),taskHeader=useRef<HTMLElement|null>(null),headerContent=useRef<HTMLDivElement|null>(null),resultsRegion=useRef<HTMLDivElement|null>(null),headerContext=useRef<HTMLParagraphElement|null>(null),periodSummary=useRef<HTMLParagraphElement|null>(null),operationsSummary=useRef<HTMLElement|null>(null),taskGrid=useRef<HTMLElement|null>(null),[checkingHeight,setCheckingHeight]=useState(0),[checkingRegions,setCheckingRegions]=useState({context:0,summary:0,operationsSummary:0,tasks:0,header:0,headerWidth:0,toolbar:0});
 const scrollPosition=useRef({center:0,document:0}),pendingPosition=useRef<{center:number;document:number}|null>(null),departurePosition=useRef<{center:number;document:number}|null>(null);
 const queueReturn=useRef<string|null>(null);
 const reserveGeometry=useCallback(()=>{setCheckingHeight(resultsRegion.current?.getBoundingClientRect().height??0);setCheckingRegions({headerWidth:headerContent.current?.getBoundingClientRect().width??0,header:taskHeader.current?.getBoundingClientRect().height??0,toolbar:scene.current?.querySelector('.window-toolbar')?.getBoundingClientRect().height??0,context:headerContext.current?.getBoundingClientRect().height??0,summary:periodSummary.current?.getBoundingClientRect().height??0,operationsSummary:operationsSummary.current?.getBoundingClientRect().height??0,tasks:taskGrid.current?.getBoundingClientRect().height??0});},[]);
 const rememberSelection=useCallback((value:{program:string;day:string}|null)=>{selectionRef.current=value;setSelectedKey(value);},[]);
 const request=useCallback(async<T,>(path:string,body:Record<string,unknown>,signal:AbortSignal):Promise<T>=>{
  return readOwner.read<T>(role,path,body,signal);
 },[readOwner,role]);
 useEffect(()=>{document.documentElement.lang=locale;document.documentElement.dir=ar?'rtl':'ltr';},[locale,ar]);
 useEffect(()=>{let live=true;queueMicrotask(()=>{if(!live)return;try{const saved=JSON.parse(sessionStorage.getItem(cacheKey)??'null');if(saved&&(!prepared||!isCivilDay(anchor)||saved.entryAnchor===anchor)){if(role==='owner'&&!calendar&&ownerAttendanceReturnTask(window.location.hash)===saved.attendanceTask)queueReturn.current=saved.attendanceTask;if(saved.position&&['center','document'].every(key=>Number.isFinite(saved.position[key])&&saved.position[key]>=0&&saved.position[key]<=1000000)){scrollPosition.current={center:saved.position.center,document:saved.position.document};pendingPosition.current={...scrollPosition.current};}if(isCivilDay(saved.from))setFrom(saved.from);if(saved.view==='week'||saved.view==='month')setView(saved.view);if(typeof saved.filter==='string'&&saved.filter.length<=80)setFilter(saved.filter);if(typeof saved.selection?.program==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(saved.selection.program)&&typeof saved.selection.day==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(saved.selection.day))rememberSelection({program:saved.selection.program,day:saved.selection.day});}}catch{}if(role==='owner'&&!calendar&&ownerAttendanceReturnTask(window.location.hash))window.history.replaceState(window.history.state,'',window.location.pathname+window.location.search);setRestored(true);});return()=>{live=false;};},[cacheKey,rememberSelection,anchor,prepared,role,calendar]);
 useEffect(()=>{if(!restored)return;try{sessionStorage.setItem(cacheKey,JSON.stringify({entryAnchor:anchor,from:displayedFrom,view,filter,selection:selectionRef.current,attendanceTask:queueReturn.current,position:scrollPosition.current}));}catch{}},[cacheKey,restored,anchor,displayedFrom,view,filter,selectedKey]);
 // Navigation coordinates only: never persist the projection or restore before authority.
 useEffect(()=>{if(!restored)return;const node=scene.current;
  const remember=()=>{try{const saved=JSON.parse(sessionStorage.getItem(cacheKey)??'null');if(saved)sessionStorage.setItem(cacheKey,JSON.stringify({...saved,attendanceTask:queueReturn.current,position:departurePosition.current??scrollPosition.current}));}catch{}};
  const track=(event:Event)=>{if(pendingPosition.current)return;const target=event.target;if(target instanceof HTMLElement&&target.classList.contains('workspace-center'))scrollPosition.current.center=target.scrollTop;else if(event.target===document)scrollPosition.current.document=window.scrollY;};
  node?.addEventListener('scroll',track,true);window.addEventListener('scroll',track,{passive:true});window.addEventListener('pagehide',remember);
  return()=>{remember();node?.removeEventListener('scroll',track,true);window.removeEventListener('scroll',track);window.removeEventListener('pagehide',remember);};
 },[cacheKey,restored]);
 useEffect(()=>{if(busy||!restored||!pendingPosition.current)return;if(error){pendingPosition.current=null;scrollPosition.current={center:0,document:0};return;}const position=pendingPosition.current;
  const frame=requestAnimationFrame(()=>{if(pendingPosition.current!==position)return;const center=scene.current?.querySelector<HTMLElement>('.workspace-center');if(center)center.scrollTop=position.center;window.scrollTo({top:position.document,behavior:'instant'});pendingPosition.current=null;scrollPosition.current={center:center?.scrollTop??0,document:window.scrollY};});return()=>cancelAnimationFrame(frame);
 },[busy,error,restored]);
 useEffect(()=>{
  if(busy||!restored||role!=='owner'||calendar||error||!home||home.setup_required||!queueReturn.current)return;
  const id=queueReturn.current;
  const frame=requestAnimationFrame(()=>{
   if(queueReturn.current!==id)return;
   const item=scene.current?.querySelector<HTMLAnchorElement>(`[data-owner-attendance-task="${id}"]`);
   const destination=item??scene.current?.querySelector<HTMLElement>('#owner-today-attention');
   destination?.focus({preventScroll:Boolean(item)});
   queueReturn.current=null;
   try{
    const saved=JSON.parse(sessionStorage.getItem(cacheKey)??'null');
    if(saved)sessionStorage.setItem(cacheKey,JSON.stringify({...saved,attendanceTask:null}));
   }catch{}
  });
  return()=>cancelAnimationFrame(frame);
 },[busy,restored,role,calendar,error,home,cacheKey]);
 useEffect(()=>{
  const cancelReturn=()=>{
   if(!queueReturn.current)return;
   queueReturn.current=null;pendingPosition.current=null;
   try{
    const saved=JSON.parse(sessionStorage.getItem(cacheKey)??'null');
    if(saved)sessionStorage.setItem(cacheKey,JSON.stringify({...saved,attendanceTask:null}));
   }catch{}
  };
  const events=['pointerdown','keydown','wheel','touchstart'] as const;
  for(const event of events)window.addEventListener(event,cancelReturn,{capture:true,passive:true});
  return()=>{for(const event of events)window.removeEventListener(event,cancelReturn,true);};
 },[cacheKey]);
 useEffect(()=>{const pending=controllers.current;return()=>{for(const c of pending)c.abort();pending.clear();};},[]);
 useEffect(()=>{
  function refresh(){
   if(approved||offline||reading.current||accessRevoked)return;
   const keep=role==='owner'&&lastChecked.current;
   resumeCheck.current=keep;reading.current=true;generation.current++;reserveGeometry();setChecking(keep);setBusy(true);
   if(!keep){setHome(null);setData(null);setSelected(null);}
   setRevision(x=>x+1);
  }
  return listenForVisibleResume(refresh);
 },[approved,offline,role,accessRevoked,rememberSelection,reserveGeometry]);
 useEffect(()=>{
  if(!restored||role!=='guardian')return;
  reading.current=true;const c=new AbortController(),pending=controllers.current;pending.add(c);let live=true;queueMicrotask(()=>{if(live){setBusy(true);setError('');}});
  request<{items:Link[];more:boolean}>('/api/guardians',{action:'links',after:linkAfter},c.signal).then(r=>{if(!live)return;setLinks(r.items);setMoreLinks(r.more);setLink(current=>r.items.some(x=>x.id===current)?current:r.items[0]?.id??'');if(!r.items.length){reading.current=false;rememberSelection(null);setSelected(null);setBusy(false);}}).catch(e=>{if(!live)return;setLinks([]);setLink('');setHome(null);setData(null);setSelected(null);rememberSelection(null);reading.current=false;setError(e instanceof ReadFailure?e.code:'unavailable');setBusy(false);});
  return()=>{live=false;c.abort();pending.delete(c);};
 },[restored,role,linkAfter,request,revision,rememberSelection]);
 const applyCalendar=useCallback((result:CalendarProjection,local:boolean,preserveMissing=false)=>{
   lastChecked.current=true;setData(result);setHome({context:result.context,as_of:result.as_of});
   setFromDevice(local);setMissingCoverage(false);setError('');
   const chosen=result.items.find(i=>i.program===selectionRef.current?.program&&i.day===selectionRef.current?.day)??null;
   if(chosen)rememberSelection({program:chosen.program,day:chosen.day});
   else if(!preserveMissing)rememberSelection(null);
   setSelected(chosen);
 },[rememberSelection]);
 useEffect(()=>{
  if(!restored||role==='guardian'&&!link)return;
  reading.current=true;
  const c=new AbortController(),pending=controllers.current;
  pending.add(c);
  const ticket=++generation.current;let live=true;
  const current=()=>live&&ticket===generation.current;
  function loading(){
    if(!current())return;
    const keep=resumeCheck.current&&role==='owner'&&lastChecked.current;
    resumeCheck.current=false;reserveGeometry();setChecking(keep);setBusy(true);setError('');
    if(!keep){lastChecked.current=false;setHome(null);setData(null);setSelected(null);setFromDevice(false);setMissingCoverage(false);}
  }
  void(async()=>{
   try{
    let periodAnchor=from||currentAnchor.current;
    if(calendar&&role==='owner'&&(deviceActive||offline)){
     const context=await readContext().catch(()=>null);
     if(!current())return;
     periodAnchor=periodAnchor||context?.today||'';
     if(periodAnchor){
      if(!from&&!currentAnchor.current){currentAnchor.current=periodAnchor;setResolvedAnchor(periodAnchor);}
      const first=view==='month'?monthGridStart(periodAnchor):periodAnchor;
      const result=await readCalendar(periodAnchor,first,addCivilDays(first,view==='week'?6:41),cursor).catch(()=>null);
      if(!current())return;
      if(result){applyCalendar(result,true,true);return;}
      if(approved&&!offline)needMonth(periodAnchor);
     }
     if(offline){
      setData(null);setSelected(null);setFromDevice(false);
      setHome(context?{context}:null);setMissingCoverage(true);setError('');
      return;
     }
    }
    if(accessRevoked)return;
    loading();
    if(calendar&&periodAnchor){
     const first=view==='month'?monthGridStart(periodAnchor):periodAnchor;
     const result=await request<CalendarProjection>('/api/experience',{action:`${role}_calendar`,...(role==='guardian'?{link}:{}),from:first,to:addCivilDays(first,view==='week'?6:41),cursor},c.signal);
     if(current()&&localWinner.current!==ticket)applyCalendar(result,false);
     return;
    }
    if(calendar&&role==='owner'){
     const result=await request<CurrentCalendarProjection>('/api/experience',{action:'owner_current_calendar',view},c.signal);
     if(!current())return;
     if(result.setup_required){setHome(result);rememberSelection(null);return;}
     if(!isCivilDay(result.anchor))throw new ReadFailure('unavailable');
     currentAnchor.current=result.anchor;setResolvedAnchor(result.anchor);
     if(localWinner.current!==ticket)applyCalendar(result,false);
     return;
    }
    const h=await request<Home>('/api/experience',{action:`${role}_home`,...(role==='guardian'?{link}:{})},c.signal);
    if(!current())return;
    lastChecked.current=!h.setup_required;setHome(h);
    const chosen=h.panels?.today?.items?.find(i=>i.program===selectionRef.current?.program&&i.day===selectionRef.current?.day)??null;
    rememberSelection(chosen?{program:chosen.program,day:chosen.day}:null);setSelected(chosen);
    if(calendar&&!h.setup_required&&!from)setFrom(h.context.today);
   }catch(e){
    if(!current())return;
    const code=e instanceof ReadFailure?e.code:'unavailable';
    lastChecked.current=false;setError(code);setHome(null);setData(null);setSelected(null);setFromDevice(false);
    if(code==='denied'||code==='setup_required'){
      if(approved)void remove();
      rememberSelection(null);setLinks([]);setLink('');
    }
   }
   finally{if(current()){reading.current=false;setBusy(false);setChecking(false);}}
  })();
  return()=>{live=false;c.abort();pending.delete(c);};
 },[restored,role,calendar,link,from,view,cursor,revision,request,rememberSelection,reserveGeometry,
    deviceActive,offline,approved,readCalendar,readContext,needMonth,remove,applyCalendar,accessRevoked]);
 useEffect(()=>{
  if(!restored||!calendar||role!=='owner'||!deviceActive)return;
  const ticket=generation.current;let live=true;
  void(async()=>{
    const period=from||currentAnchor.current||(await readContext().catch(()=>null))?.today;
    if(!period)return;
    const first=view==='month'?monthGridStart(period):period;
    const result=await readCalendar(period,first,addCivilDays(first,view==='week'?6:41),cursor).catch(()=>null);
    if(!live||ticket!==generation.current)return;
    if(!result){
      if(fromDevice&&!reading.current){
        setData(null);setSelected(null);setHome(null);setFromDevice(false);setMissingCoverage(true);
        if(!offline)needMonth(period);
      }
      return;
    }
    localWinner.current=ticket;
    if(!from&&!currentAnchor.current){currentAnchor.current=period;setResolvedAnchor(period);}
    applyCalendar(result,true,true);
  })();
  return()=>{live=false;};
 },[restored,calendar,role,deviceActive,device.coverage,from,view,cursor,readContext,readCalendar,applyCalendar,fromDevice,offline,needMonth]);
 function resetPeriod(day:string){rememberSelection(null);setFrom(day);setCursor(null);setPages([]);setSelected(null);}
 const calendarHref=`${roleBase}/calendar${role==='owner'&&!calendar&&home?.context.today?`?anchor=${home.context.today}`:''}`;
 const nav:NavigationItem[]=role==='owner'?ownerNavigation(locale,academy,calendar?'calendar':'home').map(item=>item.href===`${base}/calendar`?{...item,href:calendarHref}:item):[
  {href:`${roleBase}/home`,label:t('Home','الرئيسية'),current:!calendar,module:role==='guardian'?'family':'operations'},
  {href:`${roleBase}/calendar`,label:t('Calendar','التقويم'),current:calendar,module:'training'},
  {href:role==='trainer'?`${base}/trainer/schedule`:`${base}/guardian/training`,label:role==='trainer'?t('My sessions','تدريباتي'):t('Training & attendance','التدريبات والحضور'),module:'attendance'},
  {href:role==='trainer'?`${base}/development`:`${base}/guardian/development`,label:t('Development','التطور'),module:'development'},
 ];
 function destination(item:CalendarSession){return role==='owner'?`${base}/programs/${item.program}/${item.day}?from=${item.date}&return=${calendar?'calendar':'home'}`:role==='trainer'?`${base}/attendance/${item.id}`:`${base}/guardian/training?link=${link}&event=${item.id}&from=${item.date}`;}
 const ownerToday = role === 'owner' && !calendar;
 const ownerCalendar = role === 'owner' && calendar;
 const protectedViewGone=accessRevoked||(fromDevice&&!deviceActive);
 const ownerOperations = role === 'owner';
 function sessionStatus(item: CalendarSession) {
  return {draft:t('Draft','مسودة'),published:t('Published','منشور'),moved:t('Moved','منقول'),cancelled:t('Cancelled','ملغى')}[item.state];
 }
 function row(item: CalendarSession) {
  const time = sessionTime(locale, item.timezone, item.starts_at, item.ends_at);
  const stateLabel = sessionStatus(item);
  return <li key={`${item.program}:${item.day}`}>
   <Button className={ownerToday ? "experience-session operations-session" : ownerCalendar ? "experience-session operations-calendar-event" : "experience-session"} data-occurrence={`${item.program}:${item.day}`} data-state={item.state} aria-pressed={selected?.program===item.program&&selected?.day===item.day} onClick={e=>{
    rowOpener.current=e.currentTarget;
    rememberSelection({program:item.program,day:item.day});
    setSelected(item);
   }}>
    <span className="session-clock">{!ownerOperations&&<b>{time.date}</b>}<bdi>{time.time}</bdi></span>
    <span className="session-name"><strong>{item.title}</strong><span>{!ownerToday&&<>{item.branch} · </>}{ar?item.sport_ar:item.sport}</span></span>
    {ownerToday&&<span className="operations-roster"><span className="visually-hidden">{t('Roster','قائمة اللاعبين')}: </span><bdi>{item.roster_count??'—'}</bdi></span>}
    <span className={`session-state state-${item.state}`}>{stateLabel}{item.published&&item.state!=='cancelled'&&Date.parse(item.starts_at)>Date.parse(home?.as_of??'')&&<span> · {t('Scheduled','مجدول')}</span>}</span>
   </Button>
  </li>;
 }

 const labels:Record<string,string>={unfinished_programs:t('Finish draft programs','إكمال مسودات البرامج'),private_publication_reviews:t('Publication preparations','تجهيزات النشر'),corrections:t('Correction requests','طلبات التصحيح'),feedback_reviews:t('Feedback awaiting review','ملاحظات بانتظار المراجعة'),invitations:t('Pending invitations','دعوات معلقة'),incomplete_attendance:t('Registers needing marks','سجلات تحتاج حضوراً'),feedback_drafts:t('My feedback drafts','مسودات ملاحظاتي')};
 const taskHref:Record<string,string>={unfinished_programs:`${base}/programs`,private_publication_reviews:`${base}/programs`,corrections:`${base}/attendance/corrections`,feedback_reviews:`${base}/development`,invitations:`${base}/staff`,incomplete_attendance:role==='owner'?`${base}/calendar`:`${base}/trainer/schedule`,feedback_drafts:`${base}/development`};
 const ownerTaskAction: Record<string,string> = {
  unfinished_programs:t('Open programs','فتح البرامج'),
  private_publication_reviews:t('Open programs','فتح البرامج'),
  corrections:t('Open corrections','فتح التصحيحات'),
  feedback_reviews:t('Open development','فتح التطور'),
  invitations:t('Open staff','فتح الموظفين'),
  incomplete_attendance:t('Open calendar','فتح التقويم'),
 };
 function taskLabel(task:HomeTask){if(task.kind==='publication')return task.title==='withdraw'?t('Review withdrawal','مراجعة سحب النشر'):t('Review publication','مراجعة النشر');if(task.title)return task.title;return ({program:t('Resume this program','متابعة هذا البرنامج'),correction:t('Review requested correction','مراجعة التصحيح المطلوب'),feedback:role==='trainer'?t('Continue feedback','متابعة الملاحظات'):t('Review submitted feedback','مراجعة الملاحظات المقدمة'),attendance:t('Open this register','فتح سجل الحضور')})[task.kind];}
 function exactTask(task:HomeTask){if(task.kind==='program')return `${base}/programs/${task.id}`;if(task.kind==='publication')return `${base}/programs/${task.program}/publish?job=${task.id}`;if(task.kind==='attendance')return `${base}/attendance/${task.id}${ownerToday?ownerSessionSourceSuffix('#',{returnTo:'home',attendanceTask:task.id}):''}`;if(task.kind==='correction')return `${base}/attendance/corrections?event=${task.event}&player=${task.player}`;return `${base}/development?event=${task.event}&player=${task.player}`;}
 const today=home?.panels?.today;
 const registerAttention=home?.panels?.incomplete_attendance;
 const displayCount=(panel:Panel|undefined)=>panel?.state==='ready'&&typeof panel.count==='number'
  ? formatCount(locale,panel.count)
  : t('Unavailable','غير متاح');
 const sessions=calendar?data?.items:today?.items;
 const visible=sessions?.filter(i=>!filter||i.title.toLocaleLowerCase().includes(filter.toLocaleLowerCase())||i.branch.toLocaleLowerCase().includes(filter.toLocaleLowerCase()));
 const rangeStart = data?.from || (isCivilDay(displayedFrom) ? (view==='month'?monthGridStart(displayedFrom):displayedFrom) : '');
 const rangeEnd = data?.to || (rangeStart?addCivilDays(rangeStart,view==='week'?6:41):'');
 const periodLabel = rangeStart&&rangeEnd ? new Intl.DateTimeFormat(ar?'ar-EG':'en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).formatRange(new Date(rangeStart+'T12:00:00Z'),new Date(rangeEnd+'T12:00:00Z')) : '';
 const title=calendar?t('Training calendar','تقويم التدريب'):role==='trainer'?t('Your day, ready','يومك جاهز'):role==='guardian'?t('Your player, connected','كل ما يخص لاعبك'):t('Academy operations','عمليات الأكاديمية');
 const selectedTime = selected && sessionTime(locale,selected.timezone,selected.starts_at,selected.ends_at);
 const ownerInspector = selected && selectedTime && <div className="operations-inspection">
  <h3>{selected.title}</h3>
  <p>{selectedTime.date}</p>
  <span className={`session-state state-${selected.state}`}>{sessionStatus(selected)}</span>
  <dl>
   <div><dt>{t('Time','الوقت')}</dt><dd><bdi>{selectedTime.time}</bdi><br/><small>{selected.timezone}</small></dd></div>
   <div><dt>{t('Branch','الفرع')}</dt><dd>{selected.branch}</dd></div>
   <div><dt>{t('Sport','الرياضة')}</dt><dd>{ar?selected.sport_ar:selected.sport}</dd></div>
   <div><dt>{t('Roster','قائمة اللاعبين')}</dt><dd><bdi>{selected.roster_count??'—'} / {selected.capacity??'—'}</bdi></dd></div>
  </dl>
  {selected.state==='cancelled'
   ? <p>{t('Cancelled. Retained history stays available to the Owner.','ملغى. يبقى السجل المحفوظ متاحاً للمالك.')}</p>
   : offline?<p>{t('Connect to open planning for this date.','اتصل بالإنترنت لفتح التخطيط لهذا التاريخ.')}</p>:<Link prefetch={false} className="button" href={destination(selected)} aria-disabled={busy} onClick={e=>{if(busy)e.preventDefault();}}>{t('Open this date','فتح هذا التاريخ')}</Link>}
 </div>;
 return <div ref={scene} className={ownerCalendar ? "owner-operations operations-calendar" : ownerToday ? "owner-operations" : undefined} onClickCapture={event=>{const anchor=event.target instanceof Element?event.target.closest('a[href]'):null;if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||!(anchor instanceof HTMLAnchorElement)||anchor.target==='_blank'||anchor.getAttribute('href')?.startsWith('#'))return;const task=anchor.getAttribute('data-owner-attendance-task');if(ownerToday&&task){queueReturn.current=task;rememberSelection(null);}const center=scene.current?.querySelector<HTMLElement>('.workspace-center');departurePosition.current={center:center?.scrollTop??0,document:window.scrollY};}}><WorkspaceShell prefetch={prepared?false:undefined} scopeLabel={ownerToday?home?.context.branch_name:undefined} toolbarMinHeight={busy?checkingRegions.toolbar:0} locale={locale} role={role} module={role==='guardian'?'family':calendar?'training':'operations'} context={(!protectedViewGone&&home?.context.academy_name)||t('Academy workspace','مساحة الأكاديمية')} title={title} homeHref={`/${locale}/workspace`} languageHref="#language" onNavigate={e=>{if(e.currentTarget.getAttribute('href')==='#language'){e.preventDefault();setLocale(ar?'en':'ar');}
 else if(publicOffline){e.preventDefault();const path=new URL(e.currentTarget.href);if(path.pathname.endsWith('/players')||path.pathname.endsWith('/calendar'))window.location.assign(path.href);}}}
 account={publicOffline?null:<UserButton/>} tools={<WorkspaceDeviceTools device={device} locale={locale} verified={Boolean(home&&!home.setup_required)&&!error&&!accessRevoked}/>} navigation={nav}>
 <WorkspacePanes arabic={ar} title={t('Session details','تفاصيل التدريب')} selected={!!selectedKey&&!error&&!protectedViewGone} blocked={busy} selectionKey={selectedKey?`${selectedKey.program}:${selectedKey.day}`:''} onBack={()=>{const key=selectionRef.current?`${selectionRef.current.program}:${selectionRef.current.day}`:'';rememberSelection(null);setSelected(null);requestAnimationFrame(()=>{const opener=rowOpener.current?.isConnected?rowOpener.current:document.querySelector<HTMLButtonElement>(`[data-occurrence="${CSS.escape(key)}"]`);opener?.focus({preventScroll:true});});}} inspector={selected&&!protectedViewGone?(ownerOperations?ownerInspector:<><h3>{selected.title}</h3><p>{sessionTime(locale,selected.timezone,selected.starts_at,selected.ends_at).date}</p><p>{sessionTime(locale,selected.timezone,selected.starts_at,selected.ends_at).time} · <bdi>{selected.timezone}</bdi></p><p>{selected.branch} · {ar?selected.sport_ar:selected.sport}</p>{role!=='guardian'&&<p>{t('Roster','قائمة اللاعبين')}: {selected.roster_count} / {selected.capacity??'—'}</p>}{selected.state==='cancelled'?<p>{t('Cancelled. Retained history stays available to the Owner.','ملغى. يبقى السجل المحفوظ متاحاً للمالك.')}</p>:<Link prefetch={false} className="button" href={destination(selected)} aria-disabled={busy} onClick={e=>{if(busy)e.preventDefault();}}>{role==='trainer'?t('Open register','فتح سجل الحضور'):t('Open player training','فتح تدريبات اللاعب')}</Link>}</>):busy&&selectedKey?<p role="status">{t('Checking current access…','جارٍ التحقق من الصلاحية الحالية…')}</p>:<div className="inspector-empty"><h3>{t('A useful next step','خطوتك التالية')}</h3><p>{t('Choose a session to see its context and open the right task.','اختر تدريباً لعرض سياقه وفتح المهمة المناسبة.')}</p></div>}>
 <header ref={taskHeader} style={{minHeight:busy&&checkingRegions.header?checkingRegions.header:undefined}} className="task-header"><div ref={headerContent} style={{minWidth:busy&&checkingRegions.headerWidth?`min(100%, ${checkingRegions.headerWidth}px)`:undefined}}>{!ownerOperations&&<p className="eyebrow">{role==='trainer'?t('Trainer','مدرب'):t('Guardian','ولي الأمر')}</p>}<h1>{title}</h1>{(home?.context.today||busy)&&<p ref={headerContext} style={{minHeight:busy&&checkingRegions.context?checkingRegions.context:undefined}}>{home?.context.today?<><bdi>{ownerCalendar?t('Session times follow each branch timezone.','تتبع أوقات التدريبات المنطقة الزمنية لكل فرع.'):ownerToday?new Intl.DateTimeFormat(ar?'ar-EG':'en-GB',{dateStyle:'full',timeZone:'UTC'}).format(new Date(home.context.today+'T12:00:00Z')):home.context.today}</bdi>{!ownerOperations&&<> · <bdi>{home.context.timezone}</bdi></>}</>:<span aria-hidden="true">&#160;</span>}</p>}</div><div className={ownerOperations?"operations-header-actions":undefined}>
 {ownerToday&&(home&&!home.setup_required
  ? <Link prefetch={false} className="operations-calendar-link" href={calendarHref}>{t('Open calendar','فتح التقويم')}</Link>
  : busy&&checkingRegions.operationsSummary>0&&<span aria-hidden="true" className="operations-calendar-link operations-placeholder">{t('Open calendar','فتح التقويم')}</span>)}
 <Button className="experience-reload" aria-label={ownerCalendar?t('Refresh','تحديث'):t('Reload current view','إعادة تحميل العرض الحالي')} disabled={busy||offline||accessRevoked} onClick={()=>approved?device.refresh():setRevision(x=>x+1)}>{ownerCalendar?t('Refresh','تحديث'):t('Reload current view','إعادة تحميل العرض الحالي')}</Button>
 </div></header>
 {role==='guardian'&&<section className="experience-player-picker"><label>{t('Player','اللاعب')}<Select disabled={busy} value={link} onChange={e=>{rememberSelection(null);setHome(null);setData(null);setSelected(null);setLink(e.target.value);setCursor(null);setPages([]);}}>{links.map(x=><option key={x.id} value={x.id}>{x.display_name} · {x.branch_name}</option>)}</Select></label>{moreLinks&&<Button disabled={busy} onClick={()=>setLinkAfter(links.at(-1)?.id??null)}>{t('More linked players','لاعبون مرتبطون آخرون')}</Button>}{linkAfter&&<Button disabled={busy} onClick={()=>setLinkAfter(null)}>{t('First players','أول اللاعبين')}</Button>}</section>}
 {busy&&!checkingHeight&&<p role="status">{checking?t('Checking for changes…','جارٍ التحقق من التغييرات…'):calendar?t('Loading this calendar…','جارٍ تحميل هذا التقويم…'):t('Loading your current tasks…','جارٍ تحميل مهامك الحالية…')}</p>}
 {(error||accessRevoked)&&<p role="alert">{accessRevoked||error==='denied'?t('Access is no longer available. Choose your current workspace.','لم تعد الصلاحية متاحة. اختر مساحة عملك الحالية.'):t('This view is unavailable. Refresh to try again.','هذا العرض غير متاح. حدّثه للمحاولة مجددًا.')}</p>}{error&&calendar&&!accessRevoked&&<Button disabled={busy} onClick={()=>{setCursor(null);setPages([]);currentAnchor.current='';setResolvedAnchor('');setFrom('');setRevision(x=>x+1);}}>{t('Return to the current period','العودة للفترة الحالية')}</Button>}
 {!busy&&!error&&home?.setup_required&&<section className="journey-card"><h2>{t('Finish academy setup','أكمل إعداد الأكاديمية')}</h2><p>{t('Your saved setup is ready to resume.','يمكنك استئناف الإعداد المحفوظ.')}</p><Link prefetch={false} className="button" href={base}>{t('Continue setup','متابعة الإعداد')}</Link></section>}
 {!busy&&!error&&role==='guardian'&&!links.length&&<section className="journey-card"><h2>{t('No active player links','لا ارتباطات نشطة بلاعبين')}</h2><p>{t('Ask the academy to review your invitation or current access.','اطلب من الأكاديمية مراجعة دعوتك أو صلاحيتك الحالية.')}</p></section>}
 {(home||calendar||restored)&&!home?.setup_required&&!error&&!protectedViewGone&&<div ref={resultsRegion} style={{display:'flow-root',minHeight:busy&&checkingHeight?checkingHeight:undefined}}>
 {busy&&checkingHeight>0&&<div style={{height:0,position:'sticky',top:Math.max(80,checkingRegions.toolbar+8),zIndex:1}}><p role="status" style={{margin:0,background:'var(--surface)'}}>{checking?t('Checking for changes…','جارٍ التحقق من التغييرات…'):calendar?t('Loading this calendar…','جارٍ تحميل هذا التقويم…'):t('Loading your current tasks…','جارٍ تحميل مهامك الحالية…')}</p></div>}
 {calendar&&(ownerCalendar?<section className="calendar-toolbar operations-calendar-toolbar" aria-busy={busy} aria-label={t('Calendar controls','أدوات التقويم')}>
  <div className="journey-actions" role="group" aria-label={t('Calendar view','عرض التقويم')}><Button disabled={busy} aria-pressed={view==='week'} onClick={()=>{setView('week');setCursor(null);setPages([]);}}>{t('Week','أسبوع')}</Button><Button disabled={busy} aria-pressed={view==='month'} onClick={()=>{setView('month');setCursor(null);setPages([]);}}>{t('Month','شهر')}</Button></div>
  <div className="journey-actions operations-period-actions" role="group" aria-label={t('Change period','تغيير الفترة')}>
   <Button aria-label={t('Previous period','الفترة السابقة')} disabled={!displayedFrom||busy} onClick={()=>resetPeriod(view==='week'?addCivilDays(displayedFrom,-7):shiftMonth(displayedFrom,-1))}><span aria-hidden="true" className="directional">‹</span><span className="operations-period-word">{t('Previous','السابق')}</span></Button>
   <Button disabled={busy||!home} onClick={()=>{if(home)resetPeriod(home.context.today);}}>{t('Today','اليوم')}</Button>
   <Button aria-label={t('Next period','الفترة التالية')} disabled={!displayedFrom||busy} onClick={()=>resetPeriod(view==='week'?addCivilDays(displayedFrom,7):shiftMonth(displayedFrom,1))}><span className="operations-period-word">{t('Next','التالي')}</span><span aria-hidden="true" className="directional">›</span></Button>
  </div>
  <label>{t('Go to date','انتقل إلى تاريخ')}<input type="date" value={displayedFrom} disabled={busy} onChange={e=>{if(e.target.value)resetPeriod(e.target.value);}}/></label>
 </section>:<section className="calendar-toolbar" aria-busy={busy}><div className="journey-actions"><Button disabled={busy} aria-pressed={view==='week'} onClick={()=>{setView('week');setCursor(null);setPages([]);}}>{t('Week','أسبوع')}</Button><Button disabled={busy} aria-pressed={view==='month'} onClick={()=>{setView('month');setCursor(null);setPages([]);}}>{t('Month','شهر')}</Button><Button disabled={!displayedFrom||busy} onClick={()=>resetPeriod(view==='week'?addCivilDays(displayedFrom,-7):shiftMonth(displayedFrom,-1))}>{t('Previous period','الفترة السابقة')}</Button><Button disabled={busy||!home} onClick={()=>{if(home)resetPeriod(home.context.today);}}>{t('Today','اليوم')}</Button><Button disabled={!displayedFrom||busy} onClick={()=>resetPeriod(view==='week'?addCivilDays(displayedFrom,7):shiftMonth(displayedFrom,1))}>{t('Next period','الفترة التالية')}</Button></div><label>{t('Go to date','انتقل إلى تاريخ')}<input type="date" value={displayedFrom} disabled={busy} onChange={e=>{if(e.target.value)resetPeriod(e.target.value);}}/></label></section>)}
 {ownerToday&&home&&<nav ref={operationsSummary} className="operations-summary" aria-label={t('Operations summary','ملخص العمليات')}>
  <a className="operations-metric" data-tone="training" href="#owner-today-schedule">
   <strong>{displayCount(today)}</strong><span>{t('Sessions today','جلسات اليوم')}</span>
   {home.context.branch_name&&<small>{home.context.branch_name}</small>}
  </a>
  <a className="operations-metric" data-tone="attendance" href="#owner-today-attention">
   <strong>{displayCount(registerAttention)}</strong><span>{t('Registers needing marks','سجلات تحتاج حضوراً')}</span>
   <small>{t('Across the academy','على مستوى الأكاديمية')}</small>
  </a>
 </nav>}
 {ownerToday&&busy&&!home&&checkingRegions.operationsSummary>0&&
  <nav ref={operationsSummary} aria-hidden="true" className="operations-summary" style={{minHeight:checkingRegions.operationsSummary}}/>}
 <section className="experience-sessions"><header><div><h2 id={ownerToday?'owner-today-schedule':undefined} tabIndex={ownerToday?-1:undefined}>{calendar?(ownerCalendar&&periodLabel?periodLabel:t('Sessions in this period','تدريبات هذه الفترة')):t('Today’s sessions','تدريبات اليوم')}</h2>{!calendar&&!ownerToday&&today?.state==='ready'&&typeof today.count==='number'&&<p className="experience-scope-count"><bdi>{new Intl.NumberFormat(locale).format(today.count)}</bdi> {t('in your current scope','ضمن نطاقك الحالي')}</p>}</div>{!calendar&&(ownerToday?<small><bdi>{home?.context.timezone}</bdi></small>:<Link prefetch={false} href={calendarHref}>{t('Open calendar','فتح التقويم')}</Link>)}</header>
 {calendar&&(data||busy)&&<p ref={periodSummary} style={{minHeight:busy&&checkingRegions.summary?checkingRegions.summary:undefined}}>{data?<>{!ownerCalendar&&<><bdi>{data.from} — {data.to}</bdi> · </>}{formatQuantity(locale,data.total,'session')} {t('in this period','في هذه الفترة')} · {formatCount(locale,data.items.length)} {t('on this page','في هذه الصفحة')}{data.more&&` · ${t('More pages available','توجد صفحات أخرى')}`}</>:<span aria-hidden="true">&#160;</span>}</p>}
 {restored&&<label>{t('Search this loaded page','البحث في هذه الصفحة المحملة')}<input type="search" value={filter} onChange={e=>setFilter(e.target.value)}/></label>}
 {missingCoverage&&<p role="status">{offline?t('This period is not on this device yet. Connect to prepare it.','هذه الفترة غير متاحة على هذا الجهاز بعد. اتصل بالإنترنت لتحضيرها.'):device.phase==='preparing'?t('Preparing this period on your device…','جارٍ تحضير هذه الفترة على جهازك…'):t('This period is not ready on this device. Check for changes to try again.','هذه الفترة غير جاهزة على هذا الجهاز. تحقّق من التغييرات للمحاولة مجددًا.')}</p>}
 {!missingCoverage&&!busy&&visible?.length===0&&<div className={ownerCalendar?'operations-calendar-empty':undefined}><p>{filter?t('No match on this page. Clear the search or check another page.','لا تطابق في هذه الصفحة. امسح البحث أو افحص صفحة أخرى.'):calendar&&data&&data.total>0?t('No sessions on this page. Return to the previous page.','لا تدريبات في هذه الصفحة. عُد إلى الصفحة السابقة.'):t('No sessions in this selection.','لا تدريبات ضمن هذا الاختيار.')}</p>{ownerCalendar&&filter&&<Button onClick={()=>setFilter('')}>{t('Clear search','مسح البحث')}</Button>}</div>}
 {!calendar&&home?.panels?.today?.state==='unavailable'&&<p>{(ownerToday?t('Today’s schedule is unavailable. Reload this view to try again.','جدول اليوم غير متاح. أعد تحميل العرض للمحاولة.'):t('Training view unavailable for this link. Ask the academy to review access.','عرض التدريب غير متاح لهذا الارتباط. اطلب من الأكاديمية مراجعة الصلاحية.'))}</p>}
 {ownerToday&&!!visible?.length&&<div className="operations-schedule-head" aria-hidden="true">
  <span>{t('Time','الوقت')}</span><span>{t('Session','الجلسة')}</span><span>{t('Roster','القائمة')}</span><span>{t('Schedule','الجدول')}</span>
 </div>}
 {ownerCalendar&&data&&!!visible?.length?<div className="operations-calendar-content">
  <div className={view==='week'?'operations-week-board':'calendar-grid operations-month-board'} aria-label={view==='week'?t('Weekly calendar','التقويم الأسبوعي'):t('Monthly calendar','التقويم الشهري')}>
   {Array.from({length:view==='week'?7:42},(_,i)=>addCivilDays(data.from,i)).map(day=>{
    const items=visible.filter(item=>item.date===day);
    const dayDate=new Date(day+'T12:00:00Z');
    return <section className={`operations-calendar-day${view==='month'?' calendar-day':''}${items.length?'':' is-empty'}${day===home?.context.today?' is-today':''}`} key={day} aria-labelledby={`calendar-day-${day}`}>
     <header><h3 id={`calendar-day-${day}`}><span>{new Intl.DateTimeFormat(ar?'ar-EG':'en-GB',{weekday:'short',timeZone:'UTC'}).format(dayDate)}</span><bdi>{new Intl.DateTimeFormat(ar?'ar-EG':'en-GB',{day:'numeric',month:'short',timeZone:'UTC'}).format(dayDate)}</bdi></h3>{day===home?.context.today&&<span className="operations-day-today">{t('Today','اليوم')}</span>}</header>
     <ul>{items.map(row)}</ul>
     {!items.length&&<p className="operations-day-empty">{filter?t('No matches on this page','لا تطابق في هذه الصفحة'):data.more||!!cursor?t('No sessions on this page','لا تدريبات في هذه الصفحة'):t('No sessions','لا تدريبات')}</p>}
    </section>;
   })}
  </div>
 </div>:!ownerCalendar&&calendar&&view==='month'&&data?<div className="calendar-grid" aria-label={t('Monthly calendar','التقويم الشهري')}>{Array.from({length:42},(_,i)=>addCivilDays(data.from,i)).map(day=><section className="calendar-day" key={day}><h3><bdi>{new Intl.DateTimeFormat(ar?'ar-EG':'en-GB',{weekday:'short',day:'numeric',month:'short',timeZone:'UTC'}).format(new Date(day+'T12:00:00Z'))}</bdi></h3><ul>{visible?.filter(s=>s.date===day).map(row)}</ul></section>)}</div>:<ul className="experience-session-list">{visible?.map(row)}</ul>}
 {calendar&&data&&<div className="journey-actions"><Button disabled={busy||!pages.length} onClick={()=>{setCursor(pages.at(-1)??null);setPages(x=>x.slice(0,-1));}}>{t('Previous page','الصفحة السابقة')}</Button><Button disabled={busy||!data.more||!data.next} onClick={()=>{setPages(x=>[...x,cursor]);setCursor(data.next);}}>{t('More sessions','تدريبات أخرى')}</Button></div>}
 {!calendar&&today?.more&&<p><Link prefetch={false} href={calendarHref}>{ownerToday?t('Continue in calendar','المتابعة في التقويم'):t('See all today’s sessions','عرض كل تدريبات اليوم')}</Link></p>}
 </section>
 {!calendar&&<section ref={taskGrid} style={{minHeight:busy&&checkingRegions.tasks?checkingRegions.tasks:undefined}} className="experience-task-grid" aria-labelledby={ownerToday?"owner-today-attention":"workspace-task-heading"}>
  <h2 id={ownerToday?"owner-today-attention":"workspace-task-heading"} tabIndex={ownerToday?-1:undefined}>{ownerToday?t('Needs your attention','يحتاج انتباهك'):t('Tasks and reviews','المهام والمراجعات')}</h2>
  {Object.entries(home?.panels??{}).filter(([key])=>labels[key]).sort(([aKey,a],[bKey,b])=>Number(a.state==='ready'&&a.count===0)-Number(b.state==='ready'&&b.count===0)||(ownerToday?Number(bKey==='incomplete_attendance')-Number(aKey==='incomplete_attendance'):0)).map(([key,panel])=>{
   const taskCount = panel.tasks?.length ?? 0;
   const showGroupAction = taskCount === 0 || (key !== 'incomplete_attendance' && typeof panel.count === 'number' && panel.count > taskCount);
   const tone = key.includes('feedback')?'development':key.includes('attendance')||key==='corrections'?'attendance':key==='invitations'?'people':'training';
   return <section key={key} className={`experience-task-card${panel.state==='ready'&&panel.count===0?' is-empty':''} module-${tone}`}>
    {ownerToday
      ? <div className="operations-task-title"><h3>{labels[key]}</h3><strong>{displayCount(panel)}</strong></div>
      : <><h3>{labels[key]}</h3><strong>{displayCount(panel)}</strong></>}
    {ownerToday&&showGroupAction&&<Link prefetch={false} className="operations-task-destination" href={taskHref[key]}>{ownerTaskAction[key]} <span aria-hidden="true" className="task-arrow">→</span></Link>}
    {!!taskCount&&<ul>{panel.tasks?.map(task=><li key={task.id}>
     <Link prefetch={false} href={exactTask(task)} data-owner-attendance-task={ownerToday&&task.kind==='attendance'?task.id:undefined}>{ownerToday&&task.kind==='attendance'
      ? <><strong>{taskLabel(task)}</strong><span>{t('Open register','فتح سجل الحضور')}</span></>
      : taskLabel(task)}</Link>
    </li>)}</ul>}
    {!ownerToday&&<Link prefetch={false} href={taskHref[key]}>{t('Open workspace','فتح مساحة العمل')} →</Link>}
   </section>;
  })}
 </section>}
 {!calendar&&role!=='owner'&&<section className="experience-task-grid">{(role==='guardian'?['next_session','recent_attendance','latest_feedback']:['next_session']).map(key=>{const p=home?.panels?.[key],item=p?.item;return <section key={key} className={`experience-task-card module-${key==='latest_feedback'?'development':'family'}`}><h2>{key==='next_session'?t('Next session','التدريب القادم'):key==='recent_attendance'?t('Latest session attendance','حضور آخر تدريب'):t('Latest published feedback','آخر ملاحظات منشورة')}</h2>{p?.state==='unavailable'?<p>{t('Unavailable for this link','غير متاح لهذا الارتباط')}</p>:item?<><h3>{item.title}</h3>{item.starts_at&&item.ends_at&&item.timezone&&<><p>{sessionTime(locale,item.timezone,item.starts_at,item.ends_at).date} · {sessionTime(locale,item.timezone,item.starts_at,item.ends_at).time}</p><p>{new Date(item.starts_at)>new Date()?t('Scheduled','مجدول'):item.status==='present'?t('Present','حاضر'):item.status==='absent'?t('Absent','غائب'):t('Unmarked','غير مسجل')}</p></>}<Link prefetch={false} href={key==='latest_feedback'?`${base}/guardian/development?link=${link}&assessment=${item.id}`:role==='trainer'?`${base}/attendance/${item.id}`:`${base}/guardian/training?link=${link}&event=${item.id}&from=${item.date??home?.context.today}`}>{t('Open details','فتح التفاصيل')}</Link></>:<p>{key==='next_session'?t('No upcoming published session.','لا تدريب منشور قادم.'):key==='recent_attendance'?t('No completed published session yet.','لا تدريب منشور منتهٍ بعد.'):t('Nothing published yet.','لم يُنشر شيء بعد.')}</p>}</section>;})}</section>}
 {home?.as_of&&<p className="experience-freshness">{t('Checked at','تم التحقق في')} <bdi>{new Intl.DateTimeFormat(ar?'ar-EG':'en-GB',{timeStyle:'short',timeZone:home.context.timezone}).format(new Date(home.as_of))}</bdi> · {fromDevice?t('From your prepared device.','من البيانات المحضّرة على جهازك.'):t('Current access is checked on every request.','تُراجع الصلاحية الحالية مع كل طلب.')}</p>}
 </div>}
 </WorkspacePanes></WorkspaceShell></div>;
}
