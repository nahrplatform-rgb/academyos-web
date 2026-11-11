import {TODAY,players,sessions,history,initialMarks,addDays,rosterFor} from './data.js';

const $ = s=>document.querySelector(s);
const host=$('#app'), dialog=$('#dialog');
const params=new URLSearchParams(location.search);
const state={locale:params.get('lang')==='ar'?'ar':'en',variant:params.get('v')==='1'?0:1,theme:'light',view:'home',branch:'cairo',selected:'s1',player:'p1',search:'',rosterSearch:'',playerGroup:'all',searches:{},calendarMode:'week',anchor:TODAY,chartWeeks:6,chartMode:'chart',marks:structuredClone(initialMarks),draft:{},save:'idle',outcome:'confirmed',scenario:'ready',mobileNav:false,returnView:'home',scheduleFilter:'all',registerFilter:'all',toast:'',rosterFilter:'all'};
let pendingNavigation=null, frozenDraft=null, toastTimer, dialogReturnSelector=null;
const viewScroll = new Map();
const paneSizes = {
  navigation: { min:220, max:336, initial:220, controls:'owner-sidebar' },
  details: { min:260, max:420, initial:276, controls:'owner-inspector' },
};
const preferredWidths = { navigation:paneSizes.navigation.initial, details:paneSizes.details.initial };
let navigationOpen = true;
let registerOpenedFromAttention = false;

const t=(en,ar)=>state.locale==='ar'?ar:en;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number=v=>new Intl.NumberFormat(state.locale==='ar'?'ar-EG':'en-GB').format(v);
const date=(d,opts={day:'numeric',month:'short'})=>new Intl.DateTimeFormat(state.locale==='ar'?'ar-EG':'en-GB',{...opts,timeZone:'UTC'}).format(new Date(d+'T12:00:00Z'));
const branchName=b=>b==='cairo'?t('Cairo branch','فرع القاهرة'):t('Alexandria branch','فرع الإسكندرية');
const currentSession=()=>sessions.find(s=>s.id===state.selected)||sessions[0];
const currentPlayer=()=>players.find(p=>p.id===state.player)||players[0];
// The fixed demonstration clock is not a production eligibility/deadline rule.
const canRecord=s=>s.status==='published'&&(s.date<TODAY||(s.date===TODAY&&s.end<='17:10'));
function programTone(session) {
  if (session.en === 'Development group') return 'violet';
  if (session.en === 'Skills practice') return 'gold';
  return 'sky';
}

const name=o=>state.locale==='ar'?o.ar:o.en;
const upcomingToday = session => session.date === TODAY && session.status === 'published' && session.start > '17:10';
const branchRegisters = () => sessions.filter(session => session.branch === state.branch && canRecord(session));
const registersNeedingMarks = () => branchRegisters().filter(session => regState(session) !== 'recorded');
const dirty=()=>Object.keys(state.draft).length>0;
const locked=()=>state.save==='unknown'||state.save==='pending';
const paths={home:'m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z',calendar:'M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2',users:'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',check:'m5 12 4 4L19 6',chevron:'m9 5 7 7-7 7',arrow:'M5 12h14m-6-6 6 6-6 6',back:'M19 12H5m6-6-6 6 6 6',clock:'M12 8v4l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',close:'m6 6 12 12M6 18 18 6',sun:'M12 2v2m0 16v2M2 12h2m16 0h2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0',moon:'M21 12.8A9 9 0 0 1 11.2 3 9 9 0 1 0 21 12.8',search:'m21 21-4.4-4.4M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0',menu:'M4 6h16M4 12h16M4 18h16',activity:'M3 12h4l3-8 4 16 3-8h4',alert:'M10.3 3.9 1.8 18.5A1.7 1.7 0 0 0 3.3 21h17.4a1.7 1.7 0 0 0 1.5-2.5L13.7 3.9a2 2 0 0 0-3.4 0M12 9v4m0 4h.01',register:'M9 3h6v4H9zM9 5H6a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3M8 13l2 2 5-5',chart:'M4 19V9m8 10V4m8 15v-7',refresh:'M20 7v5h-5M4 17v-5h5M6.1 6.1A8 8 0 0 1 20 12M4 12a8 8 0 0 0 13.9 5.9',info:'M12 11v6m0-10h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',pin:'M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0M15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0'};
function icon(key,cls=''){return `<svg class="icon ${cls}" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[key]||paths.activity}"/></svg>`;}
function button(label,action,cls='',extra=''){return `<button class="btn ${cls}" data-action="${action}" ${extra}>${label}</button>`;}
function badge(status){const words={published:t('Published','منشورة'),draft:t('Private draft','مسودة خاصة'),moved:t('Moved','تم نقلها'),cancelled:t('Cancelled','ملغاة'),recorded:t('Recorded','مسجل'),unrecorded:t('Not recorded','غير مسجل'),partial:t('Partly recorded','مسجل جزئيًا'),present:t('Present','حاضر'),absent:t('Absent','غائب'),unmarked:t('Unmarked','دون تحديد')};return `<span class="badge ${status}"><span class="status-dot"></span>${words[status]||esc(status)}</span>`;}
const regState=s=>{const n=Object.keys(state.marks[s.id]||{}).length;return n>=rosterFor(s).length?'recorded':n?'partial':'unrecorded';};
function notify(msg){state.toast=msg;$('#announcer').textContent=msg;render();clearTimeout(toastTimer);toastTimer=setTimeout(()=>{state.toast='';render();},4000);}
function modal(title,body,footer,kind=''){const opener=document.activeElement;dialogReturnSelector=kind==='detail-dialog'?(state.view==='players'?`[data-player="${state.player}"]`:`[data-session="${state.selected}"]`):opener?.dataset.action?`[data-action="${opener.dataset.action}"]`:null;dialog.innerHTML=`<div class="dialog-head"><h2 id="dialog-title">${title}</h2>${button(icon('close'),'close-dialog','icon-btn',`aria-label="${t('Close dialog','إغلاق النافذة')}"`)}</div><div class="dialog-body ${kind}">${body}</div>${footer?`<div class="dialog-actions">${footer}</div>`:''}`;if(!dialog.open)dialog.showModal();}
function guard(fn){
  if(locked()){notify(t('Check the original operation before leaving this register.','تحقق من العملية الأصلية قبل مغادرة السجل.'));return;}
  if(dirty()){pendingNavigation=fn;modal(t('Keep your attendance changes?','هل تريد الاحتفاظ بتغييرات الحضور؟'),`<p>${t('These choices have not been saved, even in this sample. Stay to review them, or discard the choices.','لم تُحفظ هذه الاختيارات حتى في هذا النموذج. يمكنك البقاء لمراجعتها أو تجاهلها.')}</p>`,button(t('Keep editing','متابعة التعديل'),'close-dialog','primary')+button(t('Discard sample changes','تجاهل تغييرات النموذج'),'discard','danger'));return;}
  fn();
}
function rememberView() {
  viewScroll.set(routeHash(), $('#main')?.scrollTop || 0);
  state.searches[state.view] = state.search;
}

function go(view, selected, prepare, restoreSelection = false) {
  guard(() => {
    rememberView();
    if (state.view !== 'register') state.returnView = state.view;
    state.view = view;
    state.scenario = 'ready';
    state.search = state.searches[view] || '';
    state.mobileNav = false;
    if (selected) {
      state.selected = selected;
      state.save = 'idle';
      state.rosterSearch = '';
      state.rosterFilter = 'all';
    }
    prepare?.();
    location.hash = routeHash();
    render(true);
    if (restoreSelection) {
      const queueButton = registerOpenedFromAttention && state.view === 'home'
        ? document.querySelector(`.attention-queue [data-id="${state.selected}"]`) : null;
      const row = queueButton || $('#main').querySelector(`[data-session="${state.selected}"], [data-id="${state.selected}"]`);
      registerOpenedFromAttention = false;
      row?.focus({preventScroll:true});
    }
  });
}
function selectSession(id){guard(()=>{state.selected=id;render();if(matchMedia('(max-width: 1199px)').matches)openDetails();else $('#detail-heading')?.focus();});}
function openDetails(){modal(state.view==='players'?t('Player profile','ملف اللاعب'):t('Session details','تفاصيل الجلسة'),inspectorBody(),button(t('Back to workspace','العودة لمساحة العمل'),'close-dialog'),'detail-dialog');}
function nav() {
  const groups = [
    [t('Workspace','مساحة العمل'), [
      ['home','home',t('Today','اليوم'),'sky'],
      ['calendar','calendar',t('Calendar','التقويم'),'violet'],
    ]],
    [t('Academy','الأكاديمية'), [
      ['players','users',t('Players','اللاعبون'),'gold'],
      ['registers','register',t('Attendance','الحضور'),'teal'],
    ]],
  ];
  return `<aside id="owner-sidebar" class="sidebar ${state.mobileNav?'is-open':''}" aria-label="${t('Workspace navigation','التنقل في مساحة العمل')}">
    <div class="academy-mark"><span class="academy-emblem">R</span><div>
      <strong>${t('Riverside Academy','أكاديمية ريفرسايد')}</strong><span>${t('Academy Owner','مالك الأكاديمية')}</span>
    </div></div>
    <nav class="nav-groups" aria-label="${t('Owner pages','صفحات المالك')}">
      ${groups.map(([group, links])=>`<div class="nav-group">
        <span class="nav-caption">${group}</span>
        ${links.map(([view, glyph, label, tone])=>{
          const active = state.view === view || (view === 'registers' && state.view === 'register');
          const count = view === 'registers' && state.scenario !== 'denied'
            ? `<span class="nav-count" aria-label="${t('Registers needing marks','سجلات بحاجة لتحديد الحضور')}">${number(registersNeedingMarks().length)}</span>` : '';
          return `<a href="#${view}" data-nav="${view}" class="nav-item ${tone} ${active?'active':''}" ${active?'aria-current="page"':''}>
            ${icon(glyph)}<span>${label}</span>${count}
          </a>`;
        }).join('')}
      </div>`).join('')}
    </nav>
    <button class="owner-account" data-action="about"><span class="avatar small">DO</span><span>
      <strong>${t('Demo owner','مالك تجريبي')}</strong><small>${t('Sample workspace','مساحة عمل تجريبية')}</small>
    </span>${icon('chevron','directional')}</button>
  </aside>`;
}
function navigationToggle() {
  if (!state.variant) return '';
  const label = navigationOpen ? t('Close navigation','إغلاق التنقل') : t('Open navigation','فتح التنقل');
  return button(icon('menu')+t('Navigation','التنقل'),'toggle-navigation','desktop-nav-toggle secondary',
    `id="desktop-nav-toggle" aria-label="${label}" aria-controls="owner-sidebar" aria-expanded="${navigationOpen}" title="${label}"`);
}
function header(){return `<div class="sample-strip"><span><span class="sample-dot"></span>${t('OWNER DESIGN STUDIO','استوديو تصميم المالك')}<span class="strip-divider">/</span>${t('Fictional data · Simulated actions','بيانات خيالية · إجراءات محاكاة')}</span><button data-action="about">${t('About this sample','عن هذا النموذج')}${icon('info')}</button></div><header class="topbar"><div class="brand"><button id="mobile-nav-toggle" class="btn icon-btn mobile-menu" data-action="menu" aria-controls="owner-sidebar"
    aria-label="${state.mobileNav ? t('Close navigation','إغلاق قائمة التنقل') : t('Open navigation','فتح قائمة التنقل')}" aria-expanded="${state.mobileNav}">${icon('menu')}</button><span class="brand-symbol">A</span><span>Academy<span class="brand-os">OS</span></span></div>${navigationToggle()}<div class="scope"><label class="sr-only" for="branch">${t('Branch','الفرع')}</label>${icon('pin')}<select id="branch" ${locked()?'disabled':''}><option value="cairo" ${state.branch==='cairo'?'selected':''}>${t('Cairo branch','فرع القاهرة')}</option><option value="alex" ${state.branch==='alex'?'selected':''}>${t('Alexandria branch','فرع الإسكندرية')}</option></select></div><div class="header-tools"><button id="language-toggle" class="language btn ghost" data-action="language" lang="${state.locale==='en'?'ar':'en'}">${t('العربية','English')}</button><button id="theme-toggle" class="btn icon-btn" data-action="theme" aria-label="${state.theme==='light'?t('Switch to dark mode','التبديل إلى المظهر الداكن'):t('Switch to light mode','التبديل إلى المظهر الفاتح')}">${icon(state.theme==='dark'?'sun':'moon')}</button><span class="header-rule"></span><button class="btn ghost state-trigger" data-action="states">${icon('activity')}${t('Preview states','حالات المعاينة')}</button></div></header>`;}
function heading(title,sub,actions=''){return `<div class="page-heading"><div><h1 id="page-title" tabindex="-1">${title}</h1><p>${sub}</p></div><div class="heading-actions">${actions}</div></div>`;}
function sectionTitle(title,extra=''){return `<div class="section-title"><h2>${title}</h2>${extra}</div>`;}
function chart(){
  const rows=history.filter(r=>r.branch===state.branch).slice(-state.chartWeeks);const present=rows.reduce((a,r)=>a+r.present,0),absent=rows.reduce((a,r)=>a+r.absent,0),unmarked=rows.reduce((a,r)=>a+r.unmarked,0),rate=Math.round(present/(present+absent)*100);
  const points=rows.map((r,i)=>[50+i*(520/(rows.length-1)),150-(r.present/(r.present+r.absent))*120]);
  const line=points.map((p,i)=>`${i?'L':'M'}${p[0]},${p[1]}`).join(' ');
  return `<section class="trend-section" aria-labelledby="trend-heading"><div class="trend-header"><div><h2 id="trend-heading">${t('Attendance, in perspective','نظرة على الحضور')}</h2><p>${t('Sample data','بيانات تجريبية') + ' · ' + branchName(state.branch) + ' · ' + date(rows[0].week) + ' – ' + date(addDays(rows.at(-1).week,6))}</p></div><label class="period-select"><span class="sr-only">${t('Chart period','فترة الرسم')}</span><select id="chart-period"><option value="6" ${state.chartWeeks===6?'selected':''}>${t('Last 6 weeks','آخر ٦ أسابيع')}</option><option value="4" ${state.chartWeeks===4?'selected':''}>${t('Last 4 weeks','آخر ٤ أسابيع')}</option></select></label></div><div class="trend-layout"><div class="trend-summary"><div class="large-number">${number(rate)}<span>%</span></div><p>${t('of recorded marks were present','من الحالات المسجلة كانت حضورًا')}</p><span class="trend-key"><i></i>${t('Present','حاضر')}</span></div><div class="chart-area">${state.chartMode==='table'?`<table class="chart-table"><caption class="sr-only">${t('Fictional attendance history','سجل حضور خيالي')}</caption><thead><tr><th>${t('Week','الأسبوع')}</th><th>${t('Present','حاضر')}</th><th>${t('Absent','غائب')}</th><th>${t('Unmarked','دون تحديد')}</th></tr></thead><tbody>${rows.map(r=>`<tr><th>${date(r.week)}</th><td>${number(r.present)}</td><td>${number(r.absent)}</td><td>${number(r.unmarked)}</td></tr>`).join('')}</tbody></table>`:`<div class="mobile-chart" style="--weeks:${rows.length}"><span class="sr-only">${t('Weekly attendance percentages, zero to one hundred','نسب الحضور الأسبوعية من صفر إلى مئة')}</span>${rows.map(r=>{const value=Math.round(r.present/(r.present+r.absent)*100);return `<div class="mobile-bar"><strong>${number(value)}%</strong><div class="bar-track"><i style="height:${value}%"></i></div><small>${date(r.week)}</small></div>`;}).join('')}</div><svg class="attendance-chart" viewBox="0 0 610 198" role="img" aria-label="${t('Fictional weekly attendance rates. Exact counts are available in the data table.','نسب حضور أسبوعية خيالية. الأعداد الدقيقة متاحة في جدول البيانات.')}">${[0,50,100].map(n=>`<line x1="38" y1="${150-n*1.2}" x2="585" y2="${150-n*1.2}" class="chart-grid"/><text x="28" y="${154-n*1.2}" text-anchor="end">${n}%</text>`).join('')}<path d="${line} L570,150 L50,150 Z" class="chart-fill"/><path d="${line}" class="chart-line"/>${points.map(([x,y],i)=>`<g><circle cx="${x}" cy="${y}" r="4" class="chart-point"/><text x="${x}" y="${y-13}" text-anchor="middle" class="point-label">${Math.round(rows[i].present/(rows[i].present+rows[i].absent)*100)}%</text><text x="${x}" y="179" text-anchor="middle">${date(rows[i].week)}</text></g>`).join('')}</svg>`}</div></div><div class="chart-foot"><span>${t(`${present} present · ${absent} absent · ${unmarked} unmarked excluded`,`${number(present)} حاضر · ${number(absent)} غائب · استُبعدت ${number(unmarked)} حالة دون تحديد`)}</span><button id="chart-view-toggle" class="text-btn" data-action="chart-mode">${state.chartMode==='chart'?t('View data','عرض البيانات'):t('View chart','عرض الرسم')}${icon('chevron')}</button></div></section>`;
}
function sessionRows(items,compact=false){return items.length?`<div class="session-list ${compact?'compact':''}">${items.map(s=>`<button class="session-row ${state.selected===s.id?'selected':''}" data-session="${s.id}" aria-pressed="${state.selected===s.id}"><span class="session-time"><bdi>${s.start}</bdi><small><bdi>${s.end}</bdi></small></span><span class="session-symbol ${s.status==='draft'?'violet':'sky'}">${icon('activity')}</span><span class="session-copy"><strong>${name(s)}</strong><small>${state.view==='home'?t(s.trainer,s.trainerAr):`${date(s.date,{weekday:'short',day:'numeric',month:'short'})} · ${t(s.trainer,s.trainerAr)}`}</small></span><span class="session-status">${badge(s.status)}<small>${t(`${s.roster} players`,`${number(s.roster)} لاعبًا`)}</small></span>${icon('chevron','directional')}</button>`).join('')}</div>`:empty(t('No sessions in this period','لا توجد جلسات في هذه الفترة'),t('Choose another date or clear your search.','اختر تاريخًا آخر أو امسح البحث.'));}
function attention() {
  const queue = registersNeedingMarks().sort((first, second) =>
    first.date.localeCompare(second.date) || first.start.localeCompare(second.start));
  const all = queue.length ? button(t('View all','عرض الكل'),'needs-marks','text-btn',
    `aria-label="${t('View all registers needing marks','عرض جميع السجلات التي تحتاج إلى تحديد الحضور')}"`) : '';
  const items = queue.slice(0,3).map(session=>{
    const remaining = rosterFor(session).length - Object.keys(state.marks[session.id] || {}).length;
    const context = `${date(session.date)} · <bdi>${session.start}</bdi> · ${t(session.trainer,session.trainerAr)}`;
    const label = `${t('Open register','فتح السجل')} · ${name(session)} · ${date(session.date)} · ${session.start}`;
    return `<li>
      <div class="attention-session">
        <strong>${name(session)}</strong>
        <small>${context}</small>
      </div>
      <span class="attention-remaining">${t(`${number(remaining)} unmarked`,`${number(remaining)} دون تحديد`)}</span>
      ${button(t('Open register','فتح السجل')+icon('arrow','directional'),'open-register','secondary',
        `data-id="${session.id}" aria-label="${esc(label)}"`)}
    </li>`;
  }).join('');
  return `<section class="attention-section">
    ${sectionTitle(t('Needs your attention','يحتاج انتباهك'),all)}
    ${items ? `<ul class="attention-queue">${items}</ul>` :
      `<p class="attention-empty">${icon('check')}${t('No registers need action.','لا توجد سجلات تحتاج إلى إجراء.')}</p>`}
  </section>`;
}
function operationsRows(items) {
  const columns = [
    t('Time','الوقت'),
    t('Session','الجلسة'),
    t('Trainer','المدرب'),
    t('Roster','القائمة'),
    t('Schedule','الجدول'),
    t('Attendance','الحضور'),
  ];
  return `<div class="operations-schedule">
    <div class="schedule-columns" aria-hidden="true">
      ${columns.map(label=>`<span>${label}</span>`).join('')}
    </div>
    <div class="session-list compact">
      ${items.map(session=>`<button class="schedule-row ${programTone(session)}" data-session="${session.id}"
        aria-pressed="${state.selected===session.id}">
        <span class="schedule-time"><bdi>${session.start}–${session.end}</bdi></span>
        <span class="schedule-name"><i aria-hidden="true"></i><strong>${name(session)}</strong></span>
        <span class="schedule-trainer"><span class="sr-only">${columns[2]} </span>${t(session.trainer,session.trainerAr)}</span>
        <span class="schedule-roster"><span class="sr-only">${columns[3]} </span>${number(session.roster)}</span>
        <span class="schedule-status"><span class="sr-only">${columns[4]} </span>${badge(session.status)}</span>
        <span class="schedule-attendance"><span class="sr-only">${columns[5]} </span>
          ${canRecord(session) ? badge(regState(session)) : `<span class="badge">${t('Upcoming','قادمة')}</span>`}
        </span>
      </button>`).join('')}
    </div>
  </div>`;
}
function operationsSummary(items, playerCount) {
  const upcoming = items.filter(upcomingToday).length;
  const metrics = [
    ['sky', 'all-sessions', items.length, t('Sessions today','جلسات اليوم')],
    ['violet', 'upcoming-sessions', upcoming, t('Upcoming today','متبقية اليوم')],
    ['gold', 'all-players', playerCount, t('Players in branch','لاعبون في الفرع')],
    ['teal', 'needs-marks', registersNeedingMarks().length, t('Registers needing marks','سجلات بحاجة لتحديد الحضور')],
  ];
  return `<div class="operations-summary">${metrics.map(([tone,action,value,label])=>
    `<button class="summary-metric ${tone}" data-action="${action}" ${action.endsWith('-sessions')?'aria-controls="today-schedule"':''}>
      <strong>${number(value)}</strong><span>${label}</span>${icon('chevron','directional')}
    </button>`).join('')}</div>`;
}
function home() {
  const list = sessions.filter(session => session.branch === state.branch && session.date === TODAY)
    .sort((first, second) => first.start.localeCompare(second.start));
  const playerCount = players.filter(player => player.branch === state.branch).length;
  const title = state.variant ? t('Academy operations','عمليات الأكاديمية') : t('A clear view of your academy.','صورة واضحة لأكاديميتك.');
  const sub = date(TODAY,{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  const calendarLink = button(t('Open calendar','فتح التقويم')+icon('arrow','directional'),'calendar','secondary');
  const summary = state.variant ? operationsSummary(list, playerCount) :
    `<div class="overview-summary">
      <span><strong>${number(list.length)}</strong>${t('sessions today','جلسات اليوم')}</span>
      <span><strong>${number(playerCount)}</strong>${t('players in this branch','لاعبًا في هذا الفرع')}</span>
      <span class="timezone">${icon('clock')}<bdi>Africa/Cairo</bdi></span>
    </div>`;
  const visibleSessions = state.variant && state.scheduleFilter === 'upcoming' ? list.filter(upcomingToday) : list;
  const today = `<section class="today-section" id="today-schedule" tabindex="-1">
    ${sectionTitle(state.variant && state.scheduleFilter === 'upcoming'
      ? t('Upcoming today','الجلسات المتبقية اليوم') : t('Today’s sessions','جلسات اليوم'),
      state.variant && state.scheduleFilter === 'upcoming'
        ? button(t('Show all sessions','عرض كل الجلسات'),'all-sessions','text-btn')
        : `<span class="muted"><bdi>Africa/Cairo</bdi></span>`)}
    ${state.variant && visibleSessions.length ? operationsRows(visibleSessions) : sessionRows(visibleSessions)}
  </section>`;
  return heading(title,sub,calendarLink) + summary +
    `<div class="home-composition">${state.variant ? today+attention()+chart() : chart()+today+attention()}</div>`;
}
function calendar(){
 const d=new Date(state.anchor+'T12:00:00Z'),start=state.calendarMode==='week'?addDays(state.anchor,-((d.getUTCDay()+6)%7)):state.anchor.slice(0,8)+'01';
 const end=state.calendarMode==='week'?addDays(start,6):new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0,12)).toISOString().slice(0,10);
 const list=sessions.filter(s=>s.branch===state.branch&&s.date>=start&&s.date<=end&&`${s.en} ${s.ar} ${s.trainer}`.toLowerCase().includes(state.search.toLowerCase()));
 let body;
 if(state.calendarMode==='week')body=`<div class="week-board">${Array.from({length:7},(_,i)=>{const day=addDays(start,i),rows=list.filter(s=>s.date===day);return `<section class="day-column ${day===TODAY?'today':''}"><header><span>${date(day,{weekday:'short'})}</span><strong>${number(Number(day.slice(-2)))}</strong>${day===TODAY?`<span class="today-indicator">${t('Today','اليوم')}</span>`:''}</header><div class="day-events">${rows.map(s=>`<button class="calendar-event ${s.status} ${state.selected===s.id?'chosen':''}" data-session="${s.id}" aria-pressed="${state.selected===s.id}"><bdi>${s.start}</bdi><strong>${name(s)}</strong><small>${t(s.trainer,s.trainerAr)}</small><span>${badge(s.status)}</span></button>`).join('')||`<span class="day-empty">${t('No sessions','لا جلسات')}</span>`}</div></section>`;}).join('')}</div>`;
 else {const count=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).getUTCDate(),offset=(new Date(start+'T12:00:00Z').getUTCDay()+6)%7;body=`<div class="month-board">${Array.from({length:7},(_,i)=>`<div class="month-weekday">${date(addDays('2026-11-02',i),{weekday:'short'})}</div>`).join('')}${Array.from({length:offset},()=>'<div class="month-cell outside"></div>').join('')}${Array.from({length:count},(_,i)=>{const day=addDays(start,i);return `<div class="month-cell ${day===TODAY?'today':''}"><strong>${number(i+1)}</strong>${list.filter(s=>s.date===day).map(s=>`<button class="month-event ${s.status}" data-session="${s.id}"><bdi>${s.start}</bdi> ${name(s)}</button>`).join('')}</div>`;}).join('')}</div>`;}
 if(state.calendarMode==='month') body+=`<div class="month-agenda">${[...new Set(list.map(s=>s.date))].sort().map(day=>`<section>${sectionTitle(date(day,{weekday:'long',day:'numeric',month:'short'}))}${sessionRows(list.filter(s=>s.date===day),true)}</section>`).join('')||empty(t('No sessions this month','لا توجد جلسات هذا الشهر'),t('Choose another period.','اختر فترة أخرى.'))}</div>`;
 return heading(t('Your training calendar','تقويم التدريب'),t('Real dates. Clear context. One session at a time.','تواريخ واضحة وسياق مترابط لكل جلسة.'),button(icon('calendar')+t('Today','اليوم'),'today','secondary'))+`<div class="calendar-toolbar"><div class="period-nav">${button(icon('back','directional'),'previous','icon-btn',`aria-label="${t('Previous period','الفترة السابقة')}"`)}<h2>${state.calendarMode==='week'?`${date(start)} – ${date(end,{day:'numeric',month:'long',year:'numeric'})}`:date(start,{month:'long',year:'numeric'})}</h2>${button(icon('arrow','directional'),'next','icon-btn',`aria-label="${t('Next period','الفترة التالية')}"`)}</div><div class="segmented">${['week','month'].map(v=>button(v==='week'?t('Week','أسبوع'):t('Month','شهر'),'calendar-'+v,state.calendarMode===v?'selected':'',`aria-pressed="${state.calendarMode===v}"`)).join('')}</div></div><div class="filter-line"><label class="search-box" for="calendar-search">${icon('search')}<input id="calendar-search" value="${esc(state.search)}" placeholder="${t('Find a session or trainer','ابحث عن جلسة أو مدرب')}" aria-label="${t('Find a sample session','البحث عن جلسة تجريبية')}"></label><span class="muted">${t(`${list.length} sessions · complete sample period`,`${number(list.length)} جلسات · فترة النموذج كاملة`)}</span></div>${body}<div class="calendar-legend">${['published','draft','moved','cancelled'].map(badge).join('')}</div><p class="footnote">${t('Private drafts remain Owner-only. Moved and cancelled sessions keep their history.','المسودات الخاصة للمالك فقط. تحتفظ الجلسات المنقولة والملغاة بسجلها.')}</p>`;
}
function playerDirectory(){const list=players.filter(p=>p.branch===state.branch&&`${p.en} ${p.ar} ${p.code}`.toLowerCase().includes(state.search.toLowerCase())&&(state.playerGroup==='all'||p.group===state.playerGroup));return heading(t('People behind the progress.','اللاعبون وراء كل تقدّم.'),t('A clear directory, with the right detail close at hand.','دليل واضح وتفاصيل كل لاعب في مكانها.'))+`<div class="directory-summary"><span class="people-count">${number(players.filter(p=>p.branch===state.branch).length)}</span><span>${t('registered players','لاعبًا مسجلًا')}<small>${t('Fictional directory · complete sample','دليل خيالي · نموذج كامل')}</small></span><span class="directory-mark gold">${icon('users')}</span></div><div class="filter-line"><label class="search-box" for="player-search">${icon('search')}<input id="player-search" value="${esc(state.search)}" placeholder="${t('Search name or player ID','ابحث بالاسم أو رقم اللاعب')}" aria-label="${t('Search players','البحث عن اللاعبين')}"></label><label><span class="sr-only">${t('Program filter','تصفية البرنامج')}</span><select id="player-group"><option value="all">${t('All programs','كل البرامج')}</option>${[...new Map(players.map(p=>[p.group,p.groupAr])).entries()].map(([en,ar])=>`<option value="${en}" ${state.playerGroup===en?'selected':''}>${t(en,ar)}</option>`).join('')}</select></label></div><div class="directory-head"><span>${t('Player','اللاعب')}</span><span>${t('Training program','برنامج التدريب')}</span><span>${t('Player ID','رقم اللاعب')}</span></div><div class="player-list">${list.map((p,i)=>`<button class="player-row ${state.player===p.id?'selected':''}" data-player="${p.id}" aria-pressed="${state.player===p.id}"><span class="player-identity"><span class="avatar tone-${i%4}">${state.locale==='ar'?name(p).split(' ').map(x=>x[0]).slice(0,2).join(''):p.initials}</span><span><strong>${name(p)}</strong><small>${branchName(p.branch)}</small></span></span><span class="player-program">${t(p.group,p.groupAr)}</span><span class="player-code"><bdi>${p.code}</bdi>${icon('chevron','directional')}</span></button>`).join('')||empty(t('No matching players','لا يوجد لاعبون مطابقون'),t('Try another name or clear the program filter.','جرّب اسمًا آخر أو امسح تصفية البرنامج.'))}</div><div class="table-footer">${t(`Showing all ${list.length} matching sample players`,`عرض جميع اللاعبين المطابقين في النموذج: ${number(list.length)}`)}${state.search||state.playerGroup!=='all'?button(t('Clear filters','مسح التصفية'),'clear-filters','text-btn'):''}</div>`;}
function registers(){const list=state.registerFilter==='needs-marks'?registersNeedingMarks():branchRegisters();return heading(t('Every session, accounted for.','سجل واضح لكل جلسة.'),t('Recorded and unfinished attendance, kept distinct.','تمييز واضح بين الحضور المسجل وما لم يُسجل.'))+`<section>${sectionTitle(state.registerFilter==='needs-marks'?t('Registers needing marks','سجلات بحاجة لتحديد الحضور'):t('Attendance registers','سجلات الحضور'), state.registerFilter==='needs-marks'?button(t('Show all registers','عرض كل السجلات'),'all-registers','text-btn'):`<span class="muted">${number(list.length)}</span>`)}<div class="register-list">${list.map(s=>`<div class="register-row"><span class="register-day"><strong>${date(s.date,{day:'numeric'})}</strong><small>${date(s.date,{month:'short'})}</small></span><div><strong>${name(s)}</strong><small>${s.start}–${s.end} · ${t(s.trainer,s.trainerAr)}</small></div>${badge(regState(s))}${button(t('Open register','فتح السجل')+icon('arrow','directional'),'open-register','secondary',`data-id="${s.id}"`)}</div>`).join('')}</div>${!list.length?empty(t('No registers need action here','لا توجد سجلات تحتاج إجراءً هنا'),t('Upcoming sessions will remain scheduled. Choose another branch to explore its sample registers.','تبقى الجلسات القادمة مجدولة. اختر فرعًا آخر لاستكشاف سجلاته التجريبية.')):''}</section><p class="footnote">${t('Sample registers simulate the interaction only. Recording eligibility and deadlines must remain governed by the existing app contracts.','تحاكي السجلات التفاعل فقط. تبقى صلاحية التسجيل ومواعيده خاضعة لعقود التطبيق الحالية.')}</p>`;}
function counts(){const s=currentSession(),basis=state.marks[s.id]||{},merged={...basis,...state.draft};return rosterFor(s).reduce((a,p)=>{a[merged[p.id]||'unmarked']++;return a;},{present:0,absent:0,unmarked:0});}
function attendance(){const s=currentSession(),c=counts(),saved=state.marks[s.id]||{},roster=rosterFor(s),items=roster.filter(p=>`${p.en} ${p.ar}`.toLowerCase().includes(state.rosterSearch.toLowerCase())&&(state.rosterFilter==='all'||(state.draft[p.id]||saved[p.id]||'unmarked')===state.rosterFilter));return `<button class="text-btn back-link" data-action="back-register">${icon('back','directional')}${t('Back to sessions','العودة للجلسات')}</button>`+heading(t('The attendance register','سجل الحضور'),`${name(s)} · ${date(s.date)} · ${s.start}–${s.end}`)+`<div class="register-context"><span>${icon('pin')}${branchName(s.branch)}</span><span>${icon('clock')}<bdi>Africa/Cairo</bdi></span><span>${icon('users')}${t(`${roster.length} players · complete roster`,`${number(roster.length)} لاعبًا · القائمة كاملة`)}</span></div>${state.save==='unknown'?`<div class="notice warning" role="alert"><div>${icon('alert')}<strong>${t('The sample reply was lost. Outcome unknown.','فُقد رد النموذج. النتيجة غير معروفة.')}</strong></div><p>${t('Your original sample operation is retained. Check it before editing or sending another save.','احتُفظ بالعملية الأصلية في النموذج. تحقق منها قبل التعديل أو إرسال حفظ آخر.')}</p>${button(t('Check original operation','التحقق من العملية الأصلية'),'reconcile','primary')}</div>`:state.save==='confirmed'?`<div class="notice success" role="status">${icon('check')}<span>${t('Sample operation confirmed. This is a simulation, not a server receipt.','تأكدت عملية النموذج. هذه محاكاة وليست إيصالًا من الخادم.')}</span></div>`:state.save==='conflict'?`<div class="notice warning" role="alert"><strong>${t('Needs review · sample conflict','بحاجة للمراجعة · تعارض تجريبي')}</strong><p>${t('Another sample edit changed the basis. Your choices are retained; nothing was overwritten.','غيّر تعديل تجريبي آخر أساس المراجعة. احتُفظ باختياراتك دون الكتابة فوق أي تغيير.')}</p>${button(t('View retained choices','عرض الاختيارات المحتفَظ بها'),'review-conflict','secondary')}</div>`:''}<div class="section-title register-totals-title">
  <h2 id="register-totals-heading">${dirty()?t('Including unsaved selections','بما في ذلك الاختيارات غير المحفوظة'):t('Recorded attendance','الحضور المسجل')}</h2>
</div><div class="attendance-totals" role="group" aria-labelledby="register-totals-heading">${['present','absent','unmarked'].map(key=>`<button class="total ${key} ${state.rosterFilter===key?'chosen':''}" data-mark-filter="${key}" aria-pressed="${state.rosterFilter===key}"><span>${badge(key)}</span><strong>${number(c[key])}</strong></button>`).join('')}</div><div class="filter-line"><label class="search-box" for="roster-search">${icon('search')}<input id="roster-search" value="${esc(state.rosterSearch)}" placeholder="${t('Find a player in this roster','ابحث عن لاعب في القائمة')}" aria-label="${t('Search roster','البحث في القائمة')}"></label>${state.rosterFilter!=='all'?button(t('Show all players','عرض جميع اللاعبين'),'all-roster','text-btn'):''}<span class="muted">${t('Unmarked never means absent','دون تحديد لا تعني غائبًا')}</span></div><div class="roster-list">${items.map(p=>{const mark=state.draft[p.id]||saved[p.id]||'unmarked';return `<div class="roster-row"><span class="avatar small">${p.initials}</span><div class="roster-person"><strong>${name(p)}</strong><small>${state.draft[p.id]?t('Selected · not saved','محدد · لم يُحفظ'):saved[p.id]?t('Recorded in sample','مسجل في النموذج'):t('No mark selected','لم تُحدد حالة')}</small></div><div class="mark-controls" role="group" aria-label="${esc(name(p))}">${['present','absent'].map(m=>`<button class="mark ${m} ${mark===m?'chosen':''}" data-mark="${m}" data-person="${p.id}" aria-pressed="${mark===m}" ${locked()||saved[p.id]?'disabled':''}>${m==='present'?icon('check'):icon('close')}<span>${m==='present'?t('Present','حاضر'):t('Absent','غائب')}</span></button>`).join('')}${state.draft[p.id]?`<button class="btn icon-btn clear-mark" data-clear="${p.id}" aria-label="${t('Clear selection for','مسح اختيار')} ${name(p)}" ${locked()?'disabled':''}>${icon('back')}</button>`:''}</div></div>`;}).join('')||empty(t('No matching players','لا يوجد لاعبون مطابقون'),t('Clear the search or status filter.','امسح البحث أو تصفية الحالة.'))}</div><div class="save-bar"><span><strong>${dirty()?t(`${Object.keys(state.draft).length} selected · not saved`,`${number(Object.keys(state.draft).length)} محدد · لم يُحفظ`):t('No unsaved changes','لا توجد تغييرات غير محفوظة')}</strong><small>${t('Only selected new marks are included.','يشمل الحفظ الحالات الجديدة المحددة فقط.')}</small></span>${button(state.save==='pending'?t('Sending sample…','جارٍ إرسال النموذج…'):t('Review changes','مراجعة التغييرات')+icon('arrow','directional'),'review','primary',!dirty()||locked()?'disabled':'')}</div>`;}
function inspectorBody(){if(state.view==='players'){const p=currentPlayer();return `<div class="profile-header"><span class="avatar large gold">${p.initials}</span><h2 id="detail-heading" tabindex="-1">${name(p)}</h2><p><bdi>${p.code}</bdi> · ${t('Sample player','لاعب تجريبي')}</p></div><dl class="properties"><div><dt>${t('Branch','الفرع')}</dt><dd>${branchName(p.branch)}</dd></div><div><dt>${t('Program in this sample','البرنامج في النموذج')}</dt><dd>${t(p.group,p.groupAr)}</dd></div></dl><section class="inspector-section"><h3>${t('Profile, with purpose','ملف يوضح ما يهمك')}</h3><p>${t('Identification and branch context stay together. Personal contact, medical and financial information are outside this sample.','تجتمع هوية اللاعب وسياق الفرع هنا. بيانات الاتصال والبيانات الطبية والمالية خارج نطاق هذا النموذج.')}</p></section><div class="inspector-bottom">${button(t('View training calendar','عرض تقويم التدريب')+icon('arrow','directional'),'calendar','secondary')}<p>${t('The calendar shows branch sessions; this sample does not infer individual enrollment.','يعرض التقويم جلسات الفرع. لا يستنتج هذا النموذج تسجيل اللاعب في كل جلسة.')}</p></div>`;}
 const s=currentSession();
 const recorded = Object.values(state.marks[s.id] || {});
 const present = recorded.filter(mark => mark === 'present').length;
 const absent = recorded.length - present;
 const unmarked = rosterFor(s).length - recorded.length;
 const attendanceSummary = canRecord(s) ? `<dl class="inspector-marks">
   ${[['present',present,t('Present','حاضر')],['absent',absent,t('Absent','غائب')],['unmarked',unmarked,t('Unmarked','دون تحديد')]]
     .map(([status,count,label])=>`<div class="${status}"><dt>${label}</dt><dd>${number(count)}</dd></div>`).join('')}
   </dl>` : '';
 const nextStep = canRecord(s) ? (unmarked ? (state.view === 'register'
   ? t('This summary updates after a confirmed save.','يتحدّث هذا الملخص بعد تأكيد الحفظ.')
   : t('Open the register to review the remaining marks.','افتح السجل لمراجعة الحالات المتبقية.'))
   : t('All roster marks are recorded in this sample.','جميع حالات الحضور مسجلة في النموذج.'))
   : t('See timing and schedule details in the calendar.','راجع وقت الجلسة وتفاصيلها في التقويم.');
 return `<div class="inspector-intro"><span class="module-icon ${programTone(s)}">${icon('activity')}</span><span>${t('Selected session','الجلسة المحددة')}</span></div><h2 id="detail-heading" tabindex="-1">${name(s)}</h2><p class="detail-date">${date(s.date,{weekday:'long',day:'numeric',month:'long'})}</p><div class="detail-status">${badge(s.status)}</div><dl class="properties"><div><dt>${icon('clock')}${t('Time','الوقت')}</dt><dd><bdi>${s.start}–${s.end}</bdi><small><bdi>Africa/Cairo</bdi></small></dd></div><div><dt>${icon('pin')}${t('Branch','الفرع')}</dt><dd>${branchName(s.branch)}</dd></div><div><dt>${icon('users')}${t('Trainer','المدرب')}</dt><dd>${t(s.trainer,s.trainerAr)}</dd></div><div><dt>${icon('register')}${t('Roster','القائمة')}</dt><dd>${t(`${s.roster} players`,`${number(s.roster)} لاعبًا`)}</dd></div></dl>${s.status==='moved'?`<div class="notice info">${t('Moved from 6 Nov. Original session history is retained in this illustrative state.','نُقلت من ٦ نوفمبر. يُحتفظ بسجل الجلسة الأصلية في هذه الحالة التوضيحية.')}</div>`:''}${s.status==='cancelled'?`<div class="notice warning">${t('Cancelled sessions do not offer a new attendance action.','لا تتيح الجلسة الملغاة إجراء حضور جديدًا.')}</div>`:''}<section class="inspector-section"><h3>${canRecord(s)?t('Recorded attendance','الحضور المسجل'):t('Attendance','الحضور')}</h3>${canRecord(s)?badge(regState(s)):''}${attendanceSummary}<p>${nextStep}</p></section><div class="inspector-bottom">${state.view==='register'?'':canRecord(s)?button(t('Open register','فتح السجل')+icon('arrow','directional'),'open-register','primary',`data-id="${s.id}"`):button(t('View in calendar','عرض في التقويم')+icon('arrow','directional'),'show-session-calendar','secondary')}<span class="fineprint">${t('Fictional session · no live operating actions','جلسة خيالية · لا إجراءات تشغيل فعلية')}</span></div>`;}
function inspector(){return `<aside id="owner-inspector" class="inspector" aria-label="${t('Contextual details','التفاصيل السياقية')}">${inspectorBody()}</aside>`;}
function empty(title,copy){return `<div class="empty-state">${icon('calendar')}<h2>${title}</h2><p>${copy}</p></div>`;}
function exceptional(){if(state.scenario==='loading')return `<div class="loading-state" role="status"><div class="skeleton title"></div><div class="skeleton line"></div>${Array.from({length:4},()=>'<div class="skeleton row"></div>').join('')}<p>${t('Loading the fictional workspace…','جارٍ تحميل مساحة العمل الخيالية…')}</p>${button(t('Finish sample load','إكمال التحميل التجريبي'),'ready','secondary')}</div>`;if(state.scenario==='empty')return empty(t('A quieter day at the academy.','يوم هادئ في الأكاديمية.'),t('No sessions match this sample view. Try another date or branch.','لا توجد جلسات تطابق عرض النموذج. جرّب تاريخًا أو فرعًا آخر.'))+button(t('Return to sample data','العودة لبيانات النموذج'),'ready','secondary');if(state.scenario==='error')return empty(t('This view couldn’t load.','تعذر تحميل هذا العرض.'),t('A simulated read failed. Nothing has been saved or changed.','فشلت قراءة تجريبية. لم يُحفظ أو يُغيّر شيء.'))+button(icon('refresh')+t('Retry this view','إعادة تحميل هذا العرض'),'ready','primary');return empty(t('Access is no longer available.','لم يعد الوصول متاحًا.'),t('The sample clears the workspace and inspector together. A cached role must never grant access.','يمسح النموذج مساحة العمل والتفاصيل معًا. لا يمنح الدور المخزن وصولًا.'))+button(t('Reset access simulation','إعادة ضبط محاكاة الوصول'),'ready','secondary');}
function render(focus=false){
 const active=document.activeElement,id=active?.id,selection=active?.selectionStart,mainScroll=$('#main')?.scrollTop||0;
 document.documentElement.lang=state.locale;document.documentElement.dir=state.locale==='ar'?'rtl':'ltr';document.documentElement.dataset.theme=state.theme;document.body.dataset.variant=state.variant?'operations':'briefing';
 const views={home,calendar,players:playerDirectory,register:attendance,registers};
 host.innerHTML=header()+`<div class="workspace"${state.variant && !navigationOpen ? ' data-navigation-closed' : ''}>${nav()}${state.variant ? paneResizer('navigation') + paneResizer('details') : ''}<main id="main" tabindex="-1" class="main ${state.view} ${state.scenario!=='ready'?'exceptional':''}">${state.scenario==='ready'?(views[state.view]||home)():exceptional()}<footer class="workspace-footer"><span>${t('Design exploration · not connected to your academy','استكشاف تصميم · غير متصل بأكاديميتك')}</span><span>${state.variant?t('Operations treatment','تصميم العمليات'):t('Briefing treatment','تصميم الموجز')}</span></footer></main>${state.scenario==='ready'?inspector():`<aside id="owner-inspector" class="inspector cleared"><p>${t('Context unavailable','السياق غير متاح')}</p></aside>`}</div>${state.toast?`<div class="toast" role="status">${icon('info')}${state.toast}</div>`:''}`;
 syncPaneWidths();
 $('.skip').textContent=t('Skip to workspace','انتقل لمساحة العمل');
 if(focus){$('#page-title')?.focus({preventScroll:true});$('#main').scrollTop=viewScroll.get(routeHash())||0;}else {$('#main').scrollTop=mainScroll;if(id){const el=document.getElementById(id);el?.focus({preventScroll:true});if(typeof selection==='number'&&el?.setSelectionRange)el.setSelectionRange(selection,selection);}}
 updatePicker();
}
function showReview(){if(!dirty()||locked())return;const s=currentSession(),entries=Object.entries(state.draft);modal(t('Review this attendance save','مراجعة حفظ الحضور'),`<p>${name(s)} · ${date(s.date)} · <bdi>${s.start}</bdi></p><div class="review-list">${entries.map(([id,m])=>`<div><strong>${name(players.find(p=>p.id===id))}</strong>${badge(m)}</div>`).join('')}</div><p class="notice info">${t('Only these selected new marks will be saved together in browser memory. This is a design simulation.','ستُحفظ هذه الحالات الجديدة المحددة معًا في ذاكرة المتصفح. هذه محاكاة تصميم.')}</p>`,button(t('Keep editing','متابعة التعديل'),'close-dialog','secondary')+button(t('Confirm sample save','تأكيد حفظ النموذج'),'confirm-save','primary'));}
function saveSample(){if(!dirty()||locked())return;frozenDraft=structuredClone(state.draft);state.save='pending';dialog.close();render();setTimeout(()=>{if(state.outcome==='unknown'){state.save='unknown';}else if(state.outcome==='conflict'){state.save='conflict';}else{state.marks[state.selected]={...(state.marks[state.selected]||{}),...frozenDraft};state.draft={};state.save='confirmed';frozenDraft=null;}render();$('#announcer').textContent=state.save==='unknown'?t('Outcome unknown. Check original operation.','النتيجة غير معروفة. تحقق من العملية الأصلية.'):state.save==='conflict'?t('Sample conflict. Choices retained.','تعارض تجريبي. احتُفظ بالاختيارات.'):t('Sample operation confirmed.','تأكدت عملية النموذج.');},650);}
function statesDialog(){modal(t('Explore the exceptional states','استكشف الحالات الاستثنائية'),`<p>${t('These controls simulate design states. They do not contact the app, a server or an identity provider.','تحاكي هذه الأدوات حالات التصميم. لا تتصل بالتطبيق أو الخادم أو موفر الهوية.')}</p><div class="state-buttons">${[['ready',t('Normal view','العرض العادي')],['loading',t('Loading','جارٍ التحميل')],['empty',t('Empty view','عرض فارغ')],['error',t('Read failure','فشل القراءة')],['denied',t('Access removed','أُزيل الوصول')]].map(([value,label])=>button(label,'scenario','secondary',`data-value="${value}"`)).join('')}</div><label class="outcome-label" for="save-outcome">${t('Next sample save response','رد حفظ النموذج التالي')}</label><select id="save-outcome">${[['confirmed',t('Confirmed sample response','رد تجريبي مؤكد')],['unknown',t('Reply lost · unknown outcome','فقدان الرد · نتيجة غير معروفة')],['conflict',t('Conflicting change · needs review','تغيير متعارض · بحاجة للمراجعة')]].map(([v,l])=>`<option value="${v}" ${state.outcome===v?'selected':''}>${l}</option>`).join('')}</select><p class="fineprint">${t('To try a save response: open a register, select a new mark, review and confirm. Reload resets all sample records.','لتجربة الرد: افتح سجلًا، حدد حالة جديدة، ثم راجع وأكد. تعيد إعادة تحميل الصفحة ضبط جميع السجلات.')}</p>`,button(t('Return to workspace','العودة لمساحة العمل'),'close-dialog','primary'));}
function showSchedule(filter) {
  state.scheduleFilter = filter;
  if (filter === 'upcoming' && !upcomingToday(currentSession())) {
    const firstUpcoming = sessions.find(session => session.branch === state.branch && upcomingToday(session));
    if (firstUpcoming) state.selected = firstUpcoming.id;
  }
  render();
  const schedule = $('#today-schedule');
  schedule.focus({preventScroll:true});
  schedule.scrollIntoView({block:'nearest'});
}

const actions={
 'toggle-navigation':()=>{navigationOpen=!navigationOpen;render();},
 'all-sessions':()=>showSchedule('all'),
 'upcoming-sessions':()=>showSchedule('upcoming'),
 'all-players':()=>go('players',undefined,()=>{state.search='';state.playerGroup='all';viewScroll.delete('players');}),
 'needs-marks':()=>go('registers',undefined,()=>{state.registerFilter='needs-marks';viewScroll.delete('registers');}),
 'all-registers':()=>{state.registerFilter='all';render();},
 calendar:()=>go('calendar'),menu:()=>{
   state.mobileNav = !state.mobileNav;
   render();
   if (state.mobileNav) ($('#owner-sidebar [aria-current="page"]') || $('#owner-sidebar a'))?.focus();
   else $('#mobile-nav-toggle')?.focus();
 },language:()=>{state.locale=state.locale==='en'?'ar':'en';const url=new URL(location);url.searchParams.set('lang',state.locale);historyReplace(url);render();},theme:()=>{state.theme=state.theme==='dark'?'light':'dark';render();},
 about:()=>modal(t('A working design, with clear boundaries','تصميم تفاعلي بحدود واضحة'),`<p>${t('This is an isolated Owner design sample built with real HTML, CSS and JavaScript. Every person, count and session is fictional.','هذا نموذج تصميم مستقل للمالك مبني بعناصر ويب تفاعلية. جميع الأشخاص والأعداد والجلسات خيالية.')}</p><p>${t('Navigation, charts, filters and forms work locally. Saves are simulations held only in this tab’s memory. Reload clears them. No login, API, database, provider, protected storage or deployment is connected.','يعمل التنقل والرسوم والتصفية والنماذج محليًا. الحفظ محاكاة في ذاكرة هذا التبويب ويُمسح عند إعادة التحميل. لا اتصال بتسجيل الدخول أو قاعدة بيانات أو خدمات أو تخزين محمي أو نشر.')}</p><p>${t('Proposed analytics need engineering and business review. This prototype grants no authority and does not replace the factual current-app review.','تحتاج التحليلات المقترحة مراجعة هندسية وتجارية. لا يمنح النموذج أي صلاحيات ولا يستبدل مراجعة التطبيق الفعلية.')}</p>`,button(t('Continue exploring','متابعة الاستكشاف'),'close-dialog','primary')),
 states:statesDialog,'close-dialog':()=>dialog.close(),discard:()=>{state.draft={};state.save='idle';dialog.close();const next=pendingNavigation;pendingNavigation=null;next?.();},
 'chart-mode':()=>{state.chartMode=state.chartMode==='chart'?'table':'chart';render();},'clear-filters':()=>{state.search='';state.playerGroup='all';render();},
 'calendar-week':()=>{state.calendarMode='week';render();},'calendar-month':()=>{state.calendarMode='month';render();},today:()=>{state.anchor=TODAY;render();},previous:()=>changePeriod(-1),next:()=>changePeriod(1),
 'open-register':el=>{const s=sessions.find(s=>s.id===(el.dataset.id||state.selected));if(!s||!canRecord(s))return;const fromAttention=Boolean(el.closest('.attention-queue'));dialog.close();go('register',s.id,()=>{registerOpenedFromAttention=fromAttention;});},'back-register':()=>go(state.returnView==='register'?'registers':state.returnView,undefined,undefined,true),
 'show-session-calendar':()=>{state.anchor=currentSession().date;dialog.close();go('calendar');},review:showReview,'confirm-save':saveSample,
 reconcile:()=>{if(state.save!=='unknown')return;state.marks[state.selected]={...(state.marks[state.selected]||{}),...frozenDraft};state.draft={};state.save='confirmed';frozenDraft=null;render();notify(t('Original sample operation confirmed. No replacement save was sent.','تأكدت العملية التجريبية الأصلية دون إرسال حفظ بديل.'));},
 'review-conflict':()=>modal(t('Choices retained for review','اختيارات محفوظة للمراجعة'),`<div class="review-list">${Object.entries(state.draft).map(([id,m])=>`<div><strong>${name(players.find(p=>p.id===id))}</strong>${badge(m)}</div>`).join('')}</div><p>${t('Your selected marks remain unchanged. A competing edit is simulated, not silently merged. The production comparison must use the actual saved version and current authority.','تبقى اختياراتك دون تغيير. يُحاكى تعديل منافس دون دمج صامت. يجب أن تستخدم المقارنة الفعلية الإصدار المسجل والصلاحية الحالية.')}</p>`,button(t('Keep my choices for review','الاحتفاظ باختياراتي للمراجعة'),'close-dialog','primary')),
 'all-roster':()=>{state.rosterFilter='all';render();},ready:()=>{state.scenario='ready';render(true);},scenario:el=>guard(()=>{state.scenario=el.dataset.value;dialog.close();render(true);}),
};
function historyReplace(url){window.history.replaceState(null,'',url);}
function routeHash(){return state.view==='register'?`register/${state.selected}`:state.view;}
window.addEventListener('hashchange',()=>{
 const next=location.hash.slice(1);if(next===routeHash())return;
 if(next==='main')return;
 const [view,id]=next.split('/');if(!['home','calendar','players','registers','register'].includes(view))return;
 const old=routeHash();
 historyReplace(new URL(location.pathname+location.search+'#'+old,location.origin));
 guard(()=>{rememberView();state.returnView=state.view==='register'?state.returnView:state.view;state.view=view;if(view==='register'){const s=sessions.find(s=>s.id===id);if(s&&canRecord(s)){state.selected=id;state.branch=s.branch;}else state.view='registers';}state.scenario='ready';state.search=state.searches[state.view]||'';state.mobileNav=false;historyReplace(new URL(location.pathname+location.search+'#'+routeHash(),location.origin));render(true);});
});
function changePeriod(delta){if(state.calendarMode==='week')state.anchor=addDays(state.anchor,delta*7);else {const d=new Date(state.anchor+'T12:00:00Z');d.setUTCDate(1);d.setUTCMonth(d.getUTCMonth()+delta);state.anchor=d.toISOString().slice(0,10);}render();}
document.addEventListener('click',e=>{const el=e.target.closest('[data-action],[data-nav],[data-session],[data-player],[data-mark],[data-clear],[data-mark-filter]');if(!el||el.disabled)return;if(el.dataset.nav){e.preventDefault();go(el.dataset.nav,undefined,el.dataset.nav==='registers'?()=>{state.registerFilter='all';}:undefined);return;}if(el.dataset.session){selectSession(el.dataset.session);return;}if(el.dataset.player){guard(()=>{state.player=el.dataset.player;render();if(matchMedia('(max-width:1199px)').matches)openDetails();else $('#detail-heading')?.focus();});return;}if(el.dataset.mark){if(locked()||state.marks[state.selected]?.[el.dataset.person])return;state.draft[el.dataset.person]=el.dataset.mark;state.save='idle';render();document.querySelector(`[data-person="${el.dataset.person}"][data-mark="${el.dataset.mark}"]`)?.focus({preventScroll:true});return;}if(el.dataset.clear){if(!locked())delete state.draft[el.dataset.clear];render();return;}if(el.dataset.markFilter){state.rosterFilter=state.rosterFilter===el.dataset.markFilter?'all':el.dataset.markFilter;render();return;}actions[el.dataset.action]?.(el);});
document.addEventListener('input',e=>{if(e.target.id==='player-search'||e.target.id==='calendar-search'){state.search=e.target.value;render();}if(e.target.id==='roster-search'){state.rosterSearch=e.target.value;render();}});
document.addEventListener('change',e=>{const el=e.target;if(el.id==='branch'){const value=el.value;el.value=state.branch;guard(()=>{state.branch=value;state.scheduleFilter='all';state.selected=sessions.find(s=>s.branch===value).id;state.player=players.find(p=>p.branch===value).id;state.search='';state.rosterSearch='';state.save='idle';render();});}if(el.id==='chart-period'){state.chartWeeks=Number(el.value);render();}if(el.id==='player-group'){state.playerGroup=el.value;render();}if(el.id==='save-outcome'){state.outcome=el.value;}});
dialog.addEventListener('cancel',()=>{pendingNavigation=null;});
dialog.addEventListener('close',()=>{if(dialogReturnSelector)document.querySelector(dialogReturnSelector)?.focus({preventScroll:true});dialogReturnSelector=null;});
window.addEventListener('beforeunload',e=>{if(dirty()||locked()){e.preventDefault();e.returnValue='';}});
const picker=$('.proto-picker'),pickerItems=[...picker.querySelectorAll('.proto-picker-item')],highlight=picker.querySelector('.proto-picker-highlight');
function updatePicker(){pickerItems.forEach((el,i)=>{el.toggleAttribute('data-active',i===state.variant);if(i===state.variant)el.setAttribute('aria-current','true');else el.removeAttribute('aria-current');});const el=pickerItems[state.variant];highlight.style.width=el.offsetWidth+'px';highlight.style.transform=`translateX(${el.offsetLeft}px)`;}
function variant(i){if(i<0||i>1)return;guard(()=>{state.variant=i;const u=new URL(location);u.searchParams.set('v',i+1);historyReplace(u);render();});}
pickerItems.forEach((el,i)=>el.addEventListener('click',()=>variant(i)));window.addEventListener('resize',updatePicker);
document.addEventListener('keydown',e=>{if (e.key === 'Escape' && state.mobileNav && !dialog.open && matchMedia('(max-width: 767px)').matches) {
  e.preventDefault();
  actions.menu();
  return;
 }if(e.defaultPrevented||dialog.open||/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)||e.target.isContentEditable||e.metaKey||e.ctrlKey||e.altKey)return;const n=parseInt(e.key,10);if(n>=1&&n<=2){variant(n-1);}else if(e.key==='ArrowRight'){e.preventDefault();variant((state.variant+1)%2);}else if(e.key==='ArrowLeft'){e.preventDefault();variant((state.variant+1)%2);}});
function paneResizer(pane) {
  const label = pane === 'navigation'
    ? t('Resize navigation','تغيير عرض قائمة التنقل')
    : t('Resize details','تغيير عرض التفاصيل');
  const instructions = t('Drag or use the arrow keys. Press Enter to reset.','اسحب أو استخدم مفاتيح الأسهم. اضغط Enter لإعادة الضبط.');
  return `<div class="pane-resizer ${pane}-resizer" data-pane="${pane}" role="separator" tabindex="0"
    aria-label="${label}" aria-description="${instructions}" aria-orientation="vertical"
    aria-controls="${paneSizes[pane].controls}" title="${instructions}">
    <span aria-hidden="true"></span>
  </div>`;
}

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const paneDirection = pane => (state.locale === 'ar' ? -1 : 1) * (pane === 'navigation' ? 1 : -1);

function syncPaneWidths() {
  const navigation = $('[data-pane="navigation"]');
  const details = $('[data-pane="details"]');
  if (!navigation || !details) return;

  const desktop = matchMedia('(min-width: 1200px)').matches;
  const workspace = navigation.parentElement;
  // Reserve 620 px for desktop work. Tablets show the inspector in a dialog.
  const budget = workspace.clientWidth - (desktop ? 620 : 460);
  const nav = paneSizes.navigation;
  const info = paneSizes.details;
  const navWidth = navigationOpen
    ? clamp(preferredWidths.navigation, nav.min, Math.min(nav.max, budget - (desktop ? info.min : 0)))
    : 0;
  const detailsWidth = desktop
    ? clamp(preferredWidths.details, info.min, Math.min(info.max, budget - navWidth))
    : 0;

  workspace.style.setProperty('--operations-sidebar-width', `${navWidth}px`);
  workspace.style.setProperty('--operations-inspector-width', `${detailsWidth}px`);
  updateSeparator(navigation, nav, navWidth, budget - detailsWidth);
  updateSeparator(details, info, detailsWidth, budget - navWidth);
}

function updateSeparator(handle, size, width, available) {
  handle.setAttribute('aria-valuemin', size.min);
  handle.setAttribute('aria-valuemax', Math.max(size.min, Math.min(size.max, available)));
  handle.setAttribute('aria-valuenow', width || size.min);
}

function resizePane(handle, width) {
  preferredWidths[handle.dataset.pane] = clamp(width,
    Number(handle.getAttribute('aria-valuemin')), Number(handle.getAttribute('aria-valuemax')));
  syncPaneWidths();
}

let paneDrag = null;
host.addEventListener('pointerdown', event => {
  const handle = event.target.closest('[data-pane]');
  if (!handle || event.button !== 0) return;
  paneDrag = { handle, pointer:event.pointerId, x:event.clientX, width:Number(handle.getAttribute('aria-valuenow')) };
  handle.setPointerCapture(event.pointerId);
  handle.focus({preventScroll:true});
  event.preventDefault();
});
host.addEventListener('pointermove', event => {
  if (paneDrag?.pointer !== event.pointerId) return;
  const delta = (event.clientX - paneDrag.x) * paneDirection(paneDrag.handle.dataset.pane);
  resizePane(paneDrag.handle, Math.round(paneDrag.width + delta));
});
host.addEventListener('lostpointercapture', event => {
  if (paneDrag?.pointer === event.pointerId) paneDrag = null;
});
host.addEventListener('dblclick', event => {
  const handle = event.target.closest('[data-pane]');
  if (handle) resizePane(handle, paneSizes[handle.dataset.pane].initial);
});
host.addEventListener('keydown', event => {
  const pane = event.target.dataset.pane;
  if (!pane || event.metaKey || event.ctrlKey || event.altKey) return;
  const current = Number(event.target.getAttribute('aria-valuenow'));
  const step = (event.shiftKey ? 32 : 16) * paneDirection(pane);
  const sizes = {
    ArrowLeft: current - step,
    ArrowRight: current + step,
    Home: paneSizes[pane].min,
    End: Number(event.target.getAttribute('aria-valuemax')),
    Enter: paneSizes[pane].initial,
  };
  if (!Object.hasOwn(sizes, event.key)) return;
  event.preventDefault();
  resizePane(event.target, sizes[event.key]);
});
window.addEventListener('resize', syncPaneWidths);

// Direct entry is limited to this sample's known destinations and fixture identifiers.
const route=location.hash.slice(1).split('/');if(['home','calendar','players','registers','register'].includes(route[0]))state.view=route[0];if(route[0]==='register'){const s=sessions.find(s=>s.id===route[1]);if(s&&canRecord(s)){state.selected=s.id;state.branch=s.branch;}else state.view='registers';}
render();requestAnimationFrame(()=>requestAnimationFrame(()=>picker.setAttribute('data-ready','')));
