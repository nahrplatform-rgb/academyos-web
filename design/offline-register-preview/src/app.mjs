import {RegisterReviewRepository} from './repository.mjs';
import {OWNER_SCOPE,OTHER_SCOPE,makeFixture} from './fixtures.mjs';
const el=id=>document.getElementById(id),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ui={locale:'en',theme:'dark',principal:OWNER_SCOPE,online:false,view:'register',draft:{},busy:false,notice:'',error:false,replica:null,work:null,storageFailure:false,receiptFailure:false,deny:false,clientSkew:0,audit:[]};
let repo,dialogAction=null,dialogTrigger=null,renderGeneration=0;
const t=(en,ar)=>ui.locale==='ar'?ar:en,name=row=>ui.locale==='ar'?row.nameAr:row.name;
const status=s=>({present:t('Present','حاضر'),absent:t('Absent','غائب'),unmarked:t('Unmarked','غير مسجل')})[s]??s;
const date=value=>new Intl.DateTimeFormat(ui.locale==='ar'?'ar-EG':'en-GB',{dateStyle:'medium',timeStyle:'short',timeZone:'Africa/Cairo'}).format(new Date(value));
const button=(id,en,ar,cls='',disabled=false)=>`<button id="${id}" class="${cls}" ${disabled?'disabled':''}>${t(en,ar)}</button>`;
const settingSnapshot=()=>({locale:ui.locale,theme:ui.theme,principal:ui.principal,online:ui.online});
const event=(kind,details={})=>ui.audit.push({kind,...details});
const tell=(en,ar,error=false)=>{ui.notice=t(en,ar);ui.error=error};
const channel=typeof BroadcastChannel==='function'?new BroadcastChannel('academyos-offline-register-fiction'):null;
const notify=()=>channel?.postMessage({kind:'changed'});
async function refresh(){
  const generation=++renderGeneration,principal=ui.principal;
  const denied=principal?await repo.read('control','denied:'+principal):false;
  const [replica,work]=principal&&!denied?await Promise.all([repo.read('replicas',principal),repo.read('work',principal)]):[null,null];
  if(generation!==renderGeneration||principal!==ui.principal)return;
  ui.replica=replica;ui.work=work;ui.deny=Boolean(denied);
  // Quiet cross-tab changes never discard another tab's unsaved choices.
  render();
}
function openDialog(title,body,action,{label=t('Confirm','تأكيد'),danger=false}={}){
  if(el('dialog').open)return;
  dialogTrigger=document.activeElement;dialogAction=action;
  el('dialog-body').innerHTML=`<h2 id="dialog-title">${title}</h2>${body}`;
  el('dialog-actions').innerHTML=`<div class="actions">${button('dialog-cancel','Back','رجوع') }<button id="dialog-confirm" class="${danger?'danger':'primary'}">${label}</button></div>`;
  el('dialog').showModal();el('dialog-cancel').focus();
}
function closeDialog(){el('dialog').close();dialogAction=null;const target=dialogTrigger?.id?el(dialogTrigger.id):dialogTrigger?.isConnected?dialogTrigger:null;if(target&&!target.disabled)target.focus();else el('main').focus()}
function dirtyThen(action){if(Object.keys(ui.draft).length)openDialog(t('Leave unsaved choices?','مغادرة الاختيارات غير المحفوظة؟'),`<p>${t('These choices have not been saved on this device. Leaving discards only these unsaved choices. Previously saved pending work is retained.','لم تحفظ هذه الاختيارات على الجهاز. المغادرة تتجاهل هذه الاختيارات فقط، وتبقي العمل المحفوظ بانتظار المزامنة.')}</p>`,async()=>{ui.draft={};await action()},{label:t('Discard choices and continue','تجاهل الاختيارات والمتابعة'),danger:true});else action()}
function flowPanel(){return `<section class="panel violet"><h2>${t('Your save has two steps','حفظك على مرحلتين')}</h2><ol class="flow"><li>${t('Save the selected marks together on this device.','احفظ العلامات المحددة معاً على هذا الجهاز.')}</li><li>${t('When connected, the academy checks and records the original save together.','عند الاتصال، تتحقق الأكاديمية من الحفظ الأصلي وتسجله معاً.')}</li></ol></section><section class="panel gold stack"><h2>${t('Keep your work','احتفظ بعملك')}</h2><p>${t('A conflict or expired deadline keeps the whole save for review. A local timestamp cannot overwrite another save.','التعارض أو انتهاء المهلة يبقي الحفظ كاملاً للمراجعة. وقت الجهاز لا يكتب فوق حفظ آخر.')}</p><p>${t('No inactivity lock. Logout or 30-day cleanup removes downloads, while pending work stays separately recoverable by the same verified account.','لا قفل بسبب عدم النشاط. الخروج أو تنظيف ٣٠ يوماً يزيل التنزيلات، ويبقي العمل المعلق قابلاً للاسترجاع للحساب نفسه بعد التحقق.')}</p></section>`}
function pendingPanel(){
  const w=ui.work;if(!w)return `<section class="panel empty"><h2>${t('No saved work waiting','لا عمل محفوظ معلق')}</h2><p>${t('Choose marks in the register, then review and save them on this device.','اختر العلامات في سجل الحضور، ثم راجعها واحفظها على هذا الجهاز.')}</p>${button('go-register','Open register','فتح السجل','primary')}</section>`;
  const states={pending:t('Saved on this device · Awaiting sync','محفوظ على هذا الجهاز · بانتظار المزامنة'),sending:t('Checking original save','جارٍ التحقق من الحفظ الأصلي'),unknown:t('Outcome not yet known','نتيجة الحفظ غير معروفة بعد'),review:t('Needs review · No marks from this save recorded','تحتاج مراجعة · لم تسجل أي علامة من هذا الحفظ'),confirmed:t('Recorded by the academy','تم التسجيل لدى الأكاديمية')};
  const reason=w.reason==='deadline'?t('The recording deadline passed before upload. Device time does not extend it. Your saved choices are retained; no late recording or automatic backdating is allowed.','انتهت مهلة التسجيل قبل الرفع. وقت الجهاز لا يمددها. اختياراتك محفوظة، ولا يسمح بتسجيل متأخر أو تغيير الوقت تلقائياً.'):t('A saved mark, roster or publication changed. The whole upload was refused. Compare the current record with your choices; no other selected mark was applied.','تغيرت علامة محفوظة أو القائمة أو النشر. رُفض الرفع كله. قارن السجل الحالي باختياراتك؛ لم تطبق أي علامة أخرى من هذا الحفظ.');
  return `<section class="panel ${w.state==='confirmed'?'receipt':''}" data-save-state="${w.state}"><div class="state-title"><h2>${states[w.state]}</h2></div><p class="muted">${t(`${w.packet.marks.length} selected marks · one original save`,`${w.packet.marks.length} علامة محددة · حفظ أصلي واحد`)}</p>
  ${w.state==='confirmed'?`<p>${t('All selected marks were recorded together. Unselected players are unchanged.','سجلت جميع العلامات المحددة معاً. لم يتغير اللاعبون غير المحددين.')}</p><p class="small">${date(w.receipt.recordedAt)} · ${esc(w.receipt.reference)}</p>`:`<p class="muted">${w.state==='review'?reason:w.state==='unknown'||w.state==='sending'?t('The original save may already be recorded. Check that save first; a replacement save is blocked.','قد يكون الحفظ الأصلي قد سجل. تحقق منه أولاً؛ إنشاء حفظ بديل محظور.'):t('These marks are safely stored in this fictional browser demonstration. They are not yet server records. Keep this browser data until the outcome is confirmed.','هذه العلامات محفوظة في متصفح هذا العرض الاصطناعي. ليست سجلاً على الخادم بعد. احتفظ ببيانات المتصفح حتى تتأكد النتيجة.')}</p>`}
  <div class="actions" style="margin-top:16px">${['pending','sending','unknown'].includes(w.state)?button('sync',w.state==='pending'?'Sync original save':'Check original outcome',w.state==='pending'?'مزامنة الحفظ الأصلي':'تحقق من النتيجة الأصلية','primary',!ui.online||ui.busy):''}${w.state==='review'?button('resolution','Review safe next action','مراجعة الخطوة الآمنة التالية'):''}${button('go-register','View register','عرض السجل')}</div>
  ${w.packet.marks.map(m=>`<article class="pending-entry"><strong>${esc(name(m))}</strong>${w.state==='review'?`<div class="compare"><div><span>${t('When you started','عند البدء')}</span>${status(m.baseStatus)}</div><div><span>${t('Your saved choice','اختيارك المحفوظ')}</span>${status(m.status)}</div><div><span>${t('Current academy record','سجل الأكاديمية الحالي')}</span>${status(w.current?.find(r=>r.id===m.id)?.status??m.baseStatus)}</div></div>`:`<p>${status(m.status)} · ${w.state==='confirmed'?t('Recorded','مسجل'):t('Saved locally','محفوظ محلياً')}</p>`}</article>`).join('')}
  <details class="diagnostics"><summary>${t('Save details','تفاصيل الحفظ')}</summary><p>${t('Original save ID','معرف الحفظ الأصلي')}: <bdi>${w.packet.id}</bdi></p><p>${t('Device capture time (not authority)','وقت الجهاز عند الحفظ (ليس صلاحية)')}: <bdi>${w.packet.clientTime}</bdi></p><p>${t('This identity is retained for retries and outcome checks.','يبقى هذا المعرف لإعادة المحاولة والتحقق من النتيجة.')}</p></details></section>`;
}
function registerPanel(){
  if(!ui.replica)return `<section class="panel empty stack"><h2>${t('Register not downloaded','لم يتم تنزيل السجل')}</h2><p>${t('A complete 18-player roster is needed before new local marks can be saved. Previously saved work can be recovered separately.','يلزم سجل كامل من ١٨ لاعباً قبل حفظ علامات محلية جديدة. يمكن استرجاع العمل المحفوظ سابقاً بشكل منفصل.')}</p>${button('prepare','Download fictional register','تنزيل السجل الاصطناعي','primary',!ui.online||ui.busy)}${ui.work?button('go-pending','Open recovered work','فتح العمل المسترجع'):''}</section>`;
  const w=ui.work,locked=Boolean(w&&w.state!=='confirmed');
  const staleDraft=Object.keys(ui.draft).some(id=>ui.replica.rows.find(r=>r.id===id)?.status!=='unmarked');
  const marks=Object.fromEntries((locked?w.packet.marks:[]).map(m=>[m.id,m.status]));
  const rows=ui.replica.rows;
  const counts={present:0,absent:0,unmarked:0};for(const row of rows)counts[row.status]++;
  return `<section class="panel session"><p class="eyebrow">${t('Published session · Complete downloaded roster','تدريب منشور · قائمة منزلة كاملة')}</p><h2>${t(ui.replica.session.name,ui.replica.session.nameAr)}</h2><p>${t(ui.replica.session.branch,ui.replica.session.branchAr)} · ${date(ui.replica.session.startsAt)}</p><p class="small muted">${t('Recording deadline','مهلة التسجيل')}: ${date(ui.replica.session.deadline)} · Africa/Cairo</p></section>
  ${locked?`<div class="notice"><strong>${w.state==='review'?t('Needs review','تحتاج مراجعة'):w.state==='unknown'||w.state==='sending'?t('Check the original outcome','تحقق من النتيجة الأصلية'):t('Saved on this device · Awaiting sync','محفوظ على هذا الجهاز · بانتظار المزامنة')}</strong><p>${t('New marks are paused for this register until the original save is resolved. The saved selections remain visible below.','توقف العلامات الجديدة لهذا السجل حتى تحل نتيجة الحفظ الأصلي. تبقى الاختيارات المحفوظة ظاهرة أدناه.')}</p>${button('go-pending','Open saved work','فتح العمل المحفوظ')}</div>`:''}
  ${Object.keys(ui.draft).length&&(locked||staleDraft)?`<div class="notice"><strong>${t('Your unsaved choices are retained','اختياراتك غير المحفوظة ما زالت محفوظة للعرض')}</strong><p>${t('This register changed in another tab. These choices were not silently saved or replaced. Compare them with the current record.','تغير هذا السجل في تبويب آخر. لم تحفظ هذه الاختيارات أو تستبدل بصمت. قارنها بالسجل الحالي.')}</p>${button('retained-choices','Review retained choices','مراجعة الاختيارات المحتفظ بها')}</div>`:''}
  <div class="summary"><div class="stat present"><strong>${counts.present}</strong><span>${t('Recorded Present','مسجل حاضر')}</span></div><div class="stat absent"><strong>${counts.absent}</strong><span>${t('Recorded Absent','مسجل غائب')}</span></div><div class="stat"><strong>${counts.unmarked}</strong><span>${t('Not recorded','لم يسجل')}</span></div><div class="stat pending"><strong id="unsaved-count">${Object.keys(ui.draft).length}</strong><span>${t('Unsaved choices','اختيارات غير محفوظة')}</span></div></div>
  <div class="roster-header"><h2>${t('18 players','١٨ لاعباً')}</h2><p class="muted">${t('Unmarked never means Absent.','غير مسجل لا يعني غائباً.')}</p></div>
  <ul class="roster">${rows.map((row,i)=>`<li id="row-${row.id}" class="player ${!locked&&ui.draft[row.id]?'unsaved':marks[row.id]?'local':''}"><div><div class="player-name">${String(i+1).padStart(2,'0')} · ${esc(name(row))}</div><p id="status-${row.id}" class="player-status">${!locked&&ui.draft[row.id]?t('Unsaved choice','اختيار غير محفوظ'):marks[row.id]?t('Saved locally','محفوظ محلياً')+' · '+status(marks[row.id]):row.status==='unmarked'?t('Not recorded','لم يسجل'):t('Recorded','مسجل')}</p></div>${row.status==='unmarked'?`<div class="choices" role="group" aria-label="${esc(name(row))}">${['present','absent'].map(s=>`<button id="${row.id}-${s}" data-player="${row.id}" data-status="${s}" aria-pressed="${locked?marks[row.id]===s:ui.draft[row.id]===s}" ${locked||ui.busy?'disabled':''}>${status(s)}</button>`).join('')}<button id="clear-${row.id}" class="clear" data-clear="${row.id}" aria-label="${esc(t('Clear unsaved choice for ','مسح الاختيار غير المحفوظ لـ ')+name(row))}" ${locked||ui.busy||!ui.draft[row.id]?'disabled':''}>↶</button></div>`:`<div class="actions"><span class="saved-mark">${status(row.status)}</span><button data-correction="${row.id}" class="ghost">${t('Correction','تصحيح')}</button></div>`}</li>`).join('')}</ul>
  <div class="save-bar"><div><strong id="selected-summary">${selectionSummary()}</strong><p>${t('Only your selected new marks are saved.','تحفظ العلامات الجديدة المحددة فقط.')}</p></div>${button('review-save','Review local save','مراجعة الحفظ المحلي','primary',!Object.keys(ui.draft).length||locked||staleDraft||ui.busy)}</div>`;
}
function selectionSummary(){return t(`${Object.keys(ui.draft).length} choices not yet saved`,`${Object.keys(ui.draft).length} اختيار لم يحفظ بعد`)}
function render(){
  const focus=document.activeElement?.id,top=window.scrollY;
  document.documentElement.lang=ui.locale;document.documentElement.dir=ui.locale==='ar'?'rtl':'ltr';document.documentElement.dataset.theme=ui.theme;
  el('skip').textContent=t('Skip to register','انتقل إلى السجل');
  el('review-label').textContent=t('FICTIONAL DESIGN REVIEW','مراجعة تصميم اصطناعية');el('review-toggle').textContent=t('Review controls','أدوات المراجعة');
  el('review-warning').textContent=t('Real browser storage, fictional records. Account, server and protected recovery are simulated. Nothing is encrypted. No AcademyOS API, sign-in or access grant.','تخزين متصفح حقيقي وسجلات اصطناعية. الحساب والخادم والاسترجاع المحمي محاكاة. لا تشفير هنا. لا اتصال بواجهة AcademyOS ولا دخول أو منح صلاحية.');
  el('review-limits').textContent=t('No inactivity lock or 24-hour reading cutoff. Sync needs an open, active page; closed-browser background work and offline cold launch are not demonstrated. Refresh/restart preserves only deliberately saved work.','لا قفل خمول أو حد قراءة ٢٤ ساعة. المزامنة تحتاج صفحة مفتوحة ونشطة؛ عمل المتصفح المغلق والتشغيل البارد دون شبكة غير مثبتين. إعادة الفتح تبقي العمل المحفوظ عمداً فقط.');
  el('scenario-label').textContent=t('Reconnect result','نتيجة إعادة الاتصال');
  const selected=el('scenario').value||'normal';
  el('scenario').innerHTML=[['normal','Normal · confirm together','عادي · تأكيد معاً'],['conflict','Another device saved Alex','حفظ جهاز آخر لأليكس'],['roster','Roster changed','تغيرت القائمة'],['withdrawn','Session withdrawn','سحب نشر التدريب'],['expired','Recording deadline passed','انتهت مهلة التسجيل'],['revoked','Owner access ended','انتهت صلاحية المالك'],['lost-reply','Committed · reply lost','تم التسجيل · ضاع الرد'],['offline-transfer','No receipt · original retry','لا إيصال · إعادة الأصل'],['bad-receipt','Receipt mismatch','إيصال غير مطابق'],['disk-abort','Local storage commit fails','فشل الحفظ المحلي'],['receipt-disk-abort','Receipt storage fails','فشل حفظ الإيصال'],['clock-skew','Device clock 3 days ahead','ساعة الجهاز متقدمة ٣ أيام']].map(([v,en,ar])=>`<option value="${v}" ${v===selected?'selected':''}>${t(en,ar)}</option>`).join('');
  el('apply-scenario').textContent=t('Apply scenario','تطبيق السيناريو');el('cleanup').textContent=t('Simulate 30-day cleanup','محاكاة تنظيف ٣٠ يوماً');el('reset').textContent=t('Reset fictional demonstration','إعادة ضبط العرض الاصطناعي');
  el('preview-tag').textContent=t('Preview · Attendance','عرض · الحضور');el('language').textContent=ui.locale==='en'?'العربية':'English';el('theme').textContent=ui.theme==='dark'?t('Light mode','الوضع الفاتح'):t('Dark mode','الوضع الداكن');
  el('account').textContent=ui.principal?t('Fictional Owner · Sign out','مالك اصطناعي · خروج'):t('Choose fictional account','اختيار حساب اصطناعي');
  el('navigation').innerHTML=`<div class="nav-caption">${t('Attendance workspace','مساحة الحضور')}</div><button data-nav="register" aria-current="${ui.view==='register'?'page':'false'}">${t('Session register','سجل التدريب')}</button><button data-nav="pending" aria-current="${ui.view==='pending'?'page':'false'}">${t('Saved work','العمل المحفوظ')}${ui.work&&ui.work.state!=='confirmed'?' · 1':''}</button><small>${t('Design simulation · Owner only','محاكاة تصميم · المالك فقط')}</small>`;
  el('role-label').textContent=t('Academy Owner · Fictional Main Academy','مالك الأكاديمية · أكاديمية رئيسية اصطناعية');el('title').textContent=ui.view==='register'?t('Session register','سجل التدريب'):t('Your saved work','عملك المحفوظ');el('subtitle').textContent=t('Keep taking attendance, even when the connection drops.','واصل تسجيل الحضور حتى عند انقطاع الاتصال.');
  el('connection').textContent=ui.online?t('Online · Go offline','متصل · قطع الاتصال'):t('Offline · Reconnect','غير متصل · إعادة الاتصال');el('connection').className=ui.online?'connection-online':'connection-offline';el('connection').setAttribute('aria-pressed',String(ui.online));el('connection').disabled=ui.busy;
  el('notice').className='notice'+(ui.error?' error':'');el('notice').textContent=ui.notice;
  el('inspector').innerHTML=flowPanel();
  if(!ui.principal)el('content').innerHTML=`<section class="panel empty"><h2>${t('Signed out of the demonstration','خرجت من العرض')}</h2><p>${t('Downloaded records are removed. Pending work is retained separately for the same verified account. These buttons simulate verification; they grant no real access.','أزيلت السجلات المنزلة. بقي العمل المعلق منفصلاً للحساب نفسه بعد التحقق. تحاكي الأزرار التحقق ولا تمنح صلاحية حقيقية.')}</p><div class="actions">${button('owner-login','Verify as original Owner','تحقق بصفتك المالك الأصلي','primary')}${button('other-login','Try a different account','تجربة حساب مختلف')}</div></section>`;
  else if(ui.principal===OTHER_SCOPE)el('content').innerHTML=`<section class="panel empty"><h2>${t('Different account · No pending work here','حساب مختلف · لا عمل معلق هنا')}</h2><p>${t('This account cannot open or send the original Owner’s pending register. No player names or selections are shown.','لا يستطيع هذا الحساب فتح أو إرسال سجل المالك الأصلي المعلق. لا تظهر أسماء اللاعبين أو اختياراتهم.')}</p>${button('original-account','Return to original account','العودة للحساب الأصلي','primary')}</section>`;
  else if(ui.deny)el('content').innerHTML=`<section class="panel empty"><h2>${t('Access is no longer available','لم تعد الصلاحية متاحة')}</h2><p>${t('Private records are hidden and sending has stopped. Pending work is retained for authorized same-account recovery; signing in alone does not restore academy access.','أخفيت السجلات الخاصة وتوقف الإرسال. بقي العمل المعلق لاسترجاع مصرح للحساب نفسه؛ الدخول وحده لا يعيد صلاحية الأكاديمية.')}</p></section>`;
  else if(ui.work?.quarantined)el('content').innerHTML=`<section class="panel empty"><h2>${t('Recover your saved work','استرجع عملك المحفوظ')}</h2><p>${t('Your downloads were removed. Recover the pending register after this simulated same-account verification. The save ID and original choices are unchanged. Device/key protection remains a separate engineering review.','أزيلت التنزيلات. استرجع السجل المعلق بعد محاكاة التحقق من الحساب نفسه. لم يتغير معرف الحفظ أو الاختيارات الأصلية. حماية الجهاز والمفاتيح تبقى مراجعة هندسية منفصلة.')}</p>${button('recover','Recover original saved work','استرجاع العمل الأصلي','primary')}</section>`;
  else el('content').innerHTML=ui.view==='register'?registerPanel():pendingPanel();
  if(focus&&el(focus)&&!el(focus).disabled)el(focus).focus({preventScroll:true});else if(focus&&!el('dialog').open)el('main').focus({preventScroll:true});window.scrollTo(0,top);
}
function updateDraft(id,value){
  if(ui.busy||ui.work&&ui.work.state!=='confirmed'||!ui.replica)return;
  if(value)ui.draft[id]=value;else delete ui.draft[id];
  const row=el('row-'+id);row.classList.toggle('unsaved',Boolean(value));el('status-'+id).textContent=value?t('Unsaved choice','اختيار غير محفوظ'):t('Not recorded','لم يسجل');
  for(const s of ['present','absent'])el(id+'-'+s).setAttribute('aria-pressed',String(ui.draft[id]===s));
  el('clear-'+id).disabled=!value;el('unsaved-count').textContent=Object.keys(ui.draft).length;el('selected-summary').textContent=selectionSummary();el('review-save').disabled=!Object.keys(ui.draft).length;
}
async function localSave(){
  const principal=ui.principal;ui.busy=true;render();
  try{await repo.capture(principal,ui.draft,{abort:ui.storageFailure,clientTime:new Date(Date.parse('2026-11-03T18:00:00Z')+ui.clientSkew).toISOString()});ui.draft={};ui.view='pending';tell('Saved on this device. Waiting for connection and current academy checks.','محفوظ على هذا الجهاز. بانتظار الاتصال والتحقق الحالي لدى الأكاديمية.');event('local-commit');notify()}
  catch(e){tell('Nothing was saved on this device. Your choices are still here. Try again when storage is available.','لم يحفظ شيء على هذا الجهاز. اختياراتك ما زالت هنا. أعد المحاولة عند توفر التخزين.',true);event('local-abort')}
  finally{ui.busy=false;await refresh()}
  if(ui.online&&ui.work?.state==='pending')await syncOriginal();
}
async function syncOriginal(){
  if(ui.busy||!ui.online||ui.principal!==OWNER_SCOPE||ui.deny)return;
  const principal=ui.principal;
  const perform=async()=>{
    if(principal!==ui.principal||!ui.online)return;
    const w=await repo.read('work',principal);
    if(!w||w.quarantined||['confirmed','review'].includes(w.state))return;
    ui.busy=true;try{
      await repo.transition(principal,w.packet.id,'sending');await refresh();event('sync-start',{id:w.packet.id});
      let result;
      if(['unknown','sending'].includes(w.state)){
        result=await repo.submit(principal,w.packet.id,{lookupOnly:true});
        if(result.type==='not_found')result=await repo.submit(principal,w.packet.id);
      }else result=await repo.submit(principal,w.packet.id);
      if(principal!==ui.principal)return;
      if(result.type==='receipt'){
        await repo.confirm(principal,w.packet.id,result.receipt,{abort:ui.receiptFailure});
        tell('Recorded by the academy. Every selected mark was saved together.','تم التسجيل لدى الأكاديمية. حُفظت كل العلامات المحددة معاً.');event('receipt-confirmed',{id:w.packet.id,replayed:result.replayed===true});
      }else if(result.type==='denied'){
        await repo.write('control','denied:'+principal,true);await repo.cleanup(principal);ui.deny=true;ui.draft={};tell('Access ended. Records are hidden; pending work is retained separately.','انتهت الصلاحية. أخفيت السجلات وبقي العمل المعلق منفصلاً.',true);event('known-denial');
      }else if(result.type==='review'){
        await repo.transition(principal,w.packet.id,'review',{reason:result.reason,current:result.current});tell('Needs review. None of the selected marks were uploaded. Your saved work is retained.','تحتاج مراجعة. لم ترفع أي علامة محددة. بقي عملك المحفوظ.',true);event('needs-review',{reason:result.reason});
      }else{
        await repo.transition(principal,w.packet.id,'unknown');tell('The result is not known. Check the original save before trying any replacement.','النتيجة غير معروفة. تحقق من الحفظ الأصلي قبل أي محاولة بديلة.',true);event('unknown-outcome');
      }
    }catch(e){
      const current=await repo.read('work',principal);
      if(current&&current.state!=='confirmed')await repo.transition(principal,w.packet.id,'unknown');
      tell('The original save needs an outcome check. No replacement was created.','يحتاج الحفظ الأصلي إلى تحقق من النتيجة. لم ينشأ حفظ بديل.',true);event('unconfirmed-receipt');
    }finally{ui.busy=false;notify();await refresh()}
  };
  if(navigator.locks)await navigator.locks.request('review-register-sync:'+principal,{ifAvailable:true},lock=>lock?perform():event('another-tab-syncing'));else{tell('This browser cannot coordinate sync tabs in this demonstration. Keep saved work and use a supported browser.','هذا المتصفح لا يدعم تنسيق تبويبات المزامنة في العرض. احتفظ بالعمل المحفوظ واستخدم متصفحاً مدعوماً.',true);render()}
}
async function signOut(){if(ui.principal)await repo.cleanup(ui.principal);ui.principal=null;ui.draft={};ui.deny=false;ui.notice='';await repo.settings(settingSnapshot());notify();await refresh()}
async function login(principal){ui.principal=principal;ui.deny=false;ui.notice='';ui.draft={};await repo.settings(settingSnapshot());await refresh()}
async function action(id){
  if(id==='language'){ui.locale=ui.locale==='en'?'ar':'en';await repo.settings(settingSnapshot());ui.notice='';render()}
  else if(id==='theme'){ui.theme=ui.theme==='dark'?'light':'dark';await repo.settings(settingSnapshot());render()}
  else if(id==='review-toggle'){el('review-options').hidden=!el('review-options').hidden;el(id).setAttribute('aria-expanded',String(!el('review-options').hidden))}
  else if(id==='review-save'){
    const entries=Object.entries(ui.draft),rows=ui.replica.rows;
    openDialog(t('Save these marks on this device?','حفظ هذه العلامات على هذا الجهاز؟'),`<p>${t(`${entries.length} new marks will be saved together. Unselected players stay unchanged. This is a local save, not confirmation that the academy recorded attendance.`,`${entries.length} علامة جديدة تحفظ معاً. لا يتغير اللاعبون غير المحددين. هذا حفظ محلي وليس تأكيداً لتسجيل الحضور لدى الأكاديمية.`)}</p><ol class="review-marks">${entries.map(([id,s])=>`<li>${esc(name(rows.find(r=>r.id===id)))} · ${status(s)}</li>`).join('')}</ol>`,localSave,{label:t('Save on this device','حفظ على هذا الجهاز')});
  }else if(id==='prepare'){
    await repo.prepare(ui.principal);tell('Complete fictional roster downloaded. You may now go offline and save new marks locally.','نُزل السجل الاصطناعي كاملاً. يمكنك قطع الاتصال وحفظ علامات جديدة محلياً.');await refresh();
  }else if(id==='connection'){
    ui.online=!ui.online;await repo.settings(settingSnapshot());render();if(ui.online)await syncOriginal();
  }else if(id==='go-register')dirtyThen(async()=>{ui.view='register';await refresh()});
  else if(id==='go-pending')dirtyThen(async()=>{ui.view='pending';await refresh()});
  else if(id==='sync')await syncOriginal();
  else if(id==='account'){
    if(ui.principal)dirtyThen(()=>openDialog(t('Sign out and remove downloads?','الخروج وإزالة التنزيلات؟'),`<p>${t('Downloaded player/register copies will be removed. Pending saved edits and unknown save IDs stay separately recoverable by the original verified account. They will not be sent while signed out.','ستزال نسخ اللاعبين والسجل المنزلة. يبقى العمل المعلق ومعرف الحفظ غير المعروف قابلاً للاسترجاع للحساب الأصلي بعد التحقق. لا يرسل أثناء الخروج.')}</p>`,signOut,{label:t('Sign out','خروج'),danger:true}));
    else{ui.notice='';render();el('owner-login')?.focus()}
  }else if(id==='owner-login'||id==='original-account')await login(OWNER_SCOPE);
  else if(id==='other-login')await login(OTHER_SCOPE);
  else if(id==='recover'){await repo.recover(ui.principal);ui.view='pending';tell('Original saved work recovered for this fictional account. Downloads can be prepared separately.','استرجع العمل الأصلي لهذا الحساب الاصطناعي. يمكن تحضير التنزيلات بشكل منفصل.');await refresh();if(ui.online)await syncOriginal()}
  else if(id==='apply-scenario'){
    const scenario=el('scenario').value;ui.storageFailure=scenario==='disk-abort';ui.receiptFailure=scenario==='receipt-disk-abort';ui.clientSkew=scenario==='clock-skew'?3*86400000:0;
    await repo.fixtureScenario(OWNER_SCOPE,scenario);tell('Review fixture changed. Your selections and saved operation identity are retained. Reconnect to exercise server checks.','تغير سيناريو المراجعة. بقيت الاختيارات ومعرف العملية المحفوظة. أعد الاتصال لتجربة فحوص الخادم.');render();
  }else if(id==='cleanup')dirtyThen(()=>openDialog(t('Simulate the 30-day cleanup?','محاكاة تنظيف ٣٠ يوماً؟'),`<p>${t('Only downloaded read copies are removed. Pending edits and original unknown save IDs are retained separately for same-account recovery. This control advances no real account clock.','تزال نسخ القراءة المنزلة فقط. يبقى العمل المعلق ومعرفات الحفظ الأصلي غير المعروف لاسترجاع الحساب نفسه. لا تغير هذه الأداة وقت حساب حقيقي.')}</p>`,async()=>{await repo.cleanup(OWNER_SCOPE);ui.draft={};await refresh();notify()},{label:t('Remove read copies','إزالة نسخ القراءة')}));
  else if(id==='reset')openDialog(t('Reset this fictional review?','إعادة ضبط هذا العرض الاصطناعي؟'),`<p>${t('This removes this demonstration’s fictional downloads, pending saves and simulated receipts for both fictional accounts. No AcademyOS or server record is affected.','يزيل هذا تنزيلات العرض الاصطناعية والحفظ المعلق وإيصالات المحاكاة للحسابين الاصطناعيين. لا يؤثر في سجلات AcademyOS أو أي خادم.')}</p>`,async()=>{await repo.reset();Object.assign(ui,{principal:OWNER_SCOPE,online:false,view:'register',draft:{},notice:'',deny:false,storageFailure:false,receiptFailure:false,clientSkew:0});await repo.prepare(OWNER_SCOPE);await repo.write('control','seeded',true);await repo.settings(settingSnapshot());await refresh();notify()},{label:t('Reset fictional data','إعادة ضبط البيانات الاصطناعية'),danger:true});
  else if(id==='resolution')openDialog(t('Keep this save for review','احتفظ بهذا الحفظ للمراجعة'),`<p>${t('The original save remains unchanged. If a player already has a recorded mark, use the existing online correction and reason/history workflow. A missed deadline does not grant permission to backdate. Contact the academy’s authorized review process; no new override is introduced here.','يبقى الحفظ الأصلي دون تغيير. إذا كانت للاعب علامة مسجلة فاستخدم مسار التصحيح المتصل الحالي مع السبب والتاريخ. فوات المهلة لا يمنح صلاحية تغيير وقت التسجيل. اتبع مراجعة الأكاديمية المصرح بها؛ لا يقدم هذا العرض تجاوزاً جديداً.')}</p>`,async()=>{},{label:t('Keep saved work','الاحتفاظ بالعمل المحفوظ')});
  else if(id==='retained-choices')openDialog(t('Your unsaved choices','اختياراتك غير المحفوظة'),`<p>${t('Review only. Existing saved marks still need the online correction workflow. Back keeps your unsaved input; clearing affects only these choices, not another tab’s saved work.','للمراجعة فقط. العلامات المسجلة تحتاج مسار التصحيح المتصل. رجوع يبقي المدخلات؛ المسح يمس هذه الاختيارات فقط ولا يغير العمل المحفوظ في تبويب آخر.')}</p><ol>${Object.entries(ui.draft).map(([id,s])=>`<li>${esc(name(ui.replica.rows.find(r=>r.id===id)))} · ${status(s)}</li>`).join('')}</ol>`,async()=>{ui.draft={};render()},{label:t('Clear these unsaved choices','مسح هذه الاختيارات غير المحفوظة'),danger:true});
}
document.addEventListener('click',async e=>{
  const b=e.target.closest('button');if(!b||b.disabled)return;
  try{
    if(b.id==='dialog-cancel'){closeDialog();return}
    if(b.id==='dialog-confirm'){const run=dialogAction;b.disabled=true;el('dialog-cancel').disabled=true;try{await run?.()}finally{closeDialog()}return}
    if(b.dataset.player){updateDraft(b.dataset.player,b.dataset.status);return}
    if(b.dataset.clear){updateDraft(b.dataset.clear,null);return}
    if(b.dataset.correction){openDialog(t('A recorded mark needs a correction','العلامة المسجلة تحتاج تصحيحاً'),`<p>${t('This saved mark cannot be overwritten by a new local register save. The existing online correction workflow keeps a reason, current versions and history. It is outside this fictional offline-save review.','لا يمكن الكتابة فوق هذه العلامة بحفظ سجل محلي جديد. مسار التصحيح المتصل الحالي يحتفظ بالسبب والنسخ الحالية والتاريخ. هو خارج مراجعة الحفظ دون شبكة هذه.')}</p>`,async()=>{},{label:t('Understood','فهمت')});return}
    if(b.dataset.nav){await action(b.dataset.nav==='register'?'go-register':'go-pending');return}
    await action(b.id);
  }catch(error){event('ui-error',{message:error.message});tell('This action could not finish. Existing saved work was not intentionally removed.','تعذر إكمال الإجراء. لم يحذف العمل المحفوظ عمداً.',true);ui.busy=false;render()}
});
el('dialog').addEventListener('cancel',e=>{e.preventDefault();if(!el('dialog-confirm').disabled)closeDialog()});
el('dialog').addEventListener('keydown',e=>{if(e.key!=='Tab')return;const buttons=[...el('dialog').querySelectorAll('button:not(:disabled)')];if(!buttons.length){e.preventDefault();return}const first=buttons[0],last=buttons.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}});
window.addEventListener('beforeunload',e=>{if(Object.keys(ui.draft).length){e.preventDefault();e.returnValue=''}});
window.addEventListener('online',()=>{if(ui.online)syncOriginal()});
channel?.addEventListener('message',async()=>{const settings=await repo.settings();if(settings&&settings.principal!==ui.principal){ui.principal=settings.principal;ui.draft={}}await refresh()});
try{
  repo=await RegisterReviewRepository.open();const settings=await repo.settings();if(settings)Object.assign(ui,settings);
  // Seed only a brand-new fictional demonstration; cleanup must not silently re-download.
  if(!await repo.read('control','seeded')){await repo.prepare(OWNER_SCOPE);await repo.write('control','seeded',true);await repo.settings(settingSnapshot())}
  await refresh();if(ui.online&&ui.work&&!ui.work.quarantined)await syncOriginal();
}catch(error){el('content').innerHTML=`<section class="panel empty"><h2>${t('Local storage unavailable','التخزين المحلي غير متاح')}</h2><p>${t('No local save is confirmed. Use a browser with available storage; existing private AcademyOS data is not involved.','لم يؤكد أي حفظ محلي. استخدم متصفحاً يتوفر فيه التخزين؛ لا تتأثر بيانات AcademyOS الخاصة.')}</p></section>`;event('storage-open-error')}
// Read-only diagnostics for the synthetic test harness; no app runtime authority.
window.offlineRegisterReview={get state(){return COPY(ui)}};
