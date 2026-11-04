// Deliberately fictional, browser-memory-only design fixtures. No app/API imports.
export const TODAY = '2026-11-03';
export const players = [
  ['p1','Alex Morgan','أليكس مورغان','AM','cairo','Football foundations','أساسيات كرة القدم'],
  ['p2','Sam Taylor','سام تايلور','ST','cairo','Football foundations','أساسيات كرة القدم'],
  ['p3','Noor Hassan','نور حسن','NH','cairo','Football foundations','أساسيات كرة القدم'],
  ['p4','Omar Ali','عمر علي','OA','cairo','Development group','مجموعة التطوير'],
  ['p5','Maya Khalil','مايا خليل','MK','cairo','Development group','مجموعة التطوير'],
  ['p6','Adam Farid','آدم فريد','AF','cairo','Football foundations','أساسيات كرة القدم'],
  ['p7','Leila Samir','ليلى سمير','LS','cairo','Skills practice','تدريب المهارات'],
  ['p8','Youssef Amin','يوسف أمين','YA','cairo','Skills practice','تدريب المهارات'],
  ['p9','Salma Adel','سلمى عادل','SA','cairo','Football foundations','أساسيات كرة القدم'],
  ['p10','Ziad Nabil','زياد نبيل','ZN','cairo','Development group','مجموعة التطوير'],
  ['p11','Hana Tarek','هنا طارق','HT','cairo','Skills practice','تدريب المهارات'],
  ['p12','Karim Said','كريم عبد الرحمن سعيد محمود','KS','cairo','Football foundations','أساسيات كرة القدم'],
  ['p13','Nadine Emad','نادين عماد','NE','alex','Football foundations','أساسيات كرة القدم'],
  ['p14','Amir Fawzy','أمير فوزي','AF','alex','Development group','مجموعة التطوير'],
  ['p15','Lina Mostafa','لينا مصطفى','LM','alex','Skills practice','تدريب المهارات'],
  ['p16','Malek Sherif','مالك شريف','MS','alex','Football foundations','أساسيات كرة القدم'],
  ['p17','Farah Ibrahim','فرح إبراهيم','FI','alex','Development group','مجموعة التطوير'],
  ['p18','Ali Mahmoud','علي محمود','AM','alex','Skills practice','تدريب المهارات'],
].map(([id,en,ar,initials,branch,group,groupAr],i)=>({id,en,ar,initials,branch,group,groupAr,code:`PL-${String(i+1).padStart(3,'0')}`}));

export const sessions = [
  ['s1',TODAY,'16:00','17:00','Football foundations','أساسيات كرة القدم','cairo','A. Demo','أ. تجريبي','published',12],
  ['s2',TODAY,'17:30','18:30','Development group','مجموعة التطوير','cairo','M. Demo','م. تجريبي','published',10],
  ['s3',TODAY,'19:00','20:00','Skills practice','تدريب المهارات','cairo','A. Demo','أ. تجريبي','published',8],
  ['s4','2026-11-02','16:00','17:00','Football foundations','أساسيات كرة القدم','cairo','A. Demo','أ. تجريبي','published',12],
  ['s5','2026-11-04','16:00','17:00','Football foundations','أساسيات كرة القدم','cairo','A. Demo','أ. تجريبي','published',12],
  ['s6','2026-11-05','17:30','18:30','Development group','مجموعة التطوير','cairo','M. Demo','م. تجريبي','draft',10],
  ['s7','2026-11-07','16:00','17:00','Skills practice','تدريب المهارات','cairo','A. Demo','أ. تجريبي','moved',8],
  ['s8',TODAY,'17:00','18:00','Football foundations','أساسيات كرة القدم','alex','S. Demo','س. تجريبي','published',6],
  ['s9','2026-11-05','16:00','17:00','Development group','مجموعة التطوير','alex','S. Demo','س. تجريبي','cancelled',6],
  ['s10','2026-11-09','16:00','17:00','Football foundations','أساسيات كرة القدم','cairo','A. Demo','أ. تجريبي','published',12],
  ['s11','2026-11-12','17:30','18:30','Development group','مجموعة التطوير','cairo','M. Demo','م. تجريبي','published',10],
  ['s13',TODAY,'09:00','10:00','Skills practice','تدريب المهارات','cairo','M. Demo','م. تجريبي','published',8],
  ['s14',TODAY,'11:00','12:00','Development group','مجموعة التطوير','cairo','A. Demo','أ. تجريبي','published',10],
  ['s15',TODAY,'20:15','21:00','Football foundations','أساسيات كرة القدم','cairo','M. Demo','م. تجريبي','published',12],
  ['s12','2026-11-14','16:00','17:00','Skills practice','تدريب المهارات','alex','S. Demo','س. تجريبي','published',6],
].map(([id,date,start,end,en,ar,branch,trainer,trainerAr,status,roster])=>({id,date,start,end,en,ar,branch,trainer,trainerAr,status,roster}));

export const history = [
  {branch:'cairo',week:'2026-09-21',present:42,absent:10,unmarked:4},
  {branch:'cairo',week:'2026-09-28',present:45,absent:9,unmarked:2},
  {branch:'cairo',week:'2026-10-05',present:44,absent:10,unmarked:2},
  {branch:'cairo',week:'2026-10-12',present:47,absent:7,unmarked:2},
  {branch:'cairo',week:'2026-10-19',present:46,absent:8,unmarked:2},
  {branch:'cairo',week:'2026-10-26',present:48,absent:6,unmarked:2},
];
history.push(...history.map((r,i)=>({branch:'alex',week:r.week,present:20+i,absent:5,unmarked:1})));
export const initialMarks = {s4:Object.fromEntries(players.filter(p=>p.branch==='cairo').map((p,i)=>[p.id,i<10?'present':'absent']))};
initialMarks.s13 = Object.fromEntries(players.filter(p=>p.branch==='cairo').slice(0,8)
  .map((p,i)=>[p.id,i<7?'present':'absent']));
initialMarks.s14 = {p1:'present',p2:'present',p3:'absent'};
export function addDays(day,n){const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);}
export function rosterFor(session){return players.filter(p=>p.branch===session.branch).slice(0,session.roster);}
