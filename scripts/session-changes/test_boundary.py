"""I3e actual disposable PG17; no hosted identities or writes."""
import runpy,json,uuid
from pathlib import Path
m=runpy.run_path(str(Path(__file__).resolve().parents[1]/'publication/test_boundary.py'));Base,ROOT=m['PublicationBoundary'],m['ROOT']
class SessionChangeBoundary(Base):
 extra_authenticated_calls={**Base.extra_authenticated_calls,'q6_review_v2':"q6_review_v2(gen_random_uuid(),gen_random_uuid(),current_date,1,0,1,null,'{}','{}')",'q6_save_v2':"q6_save_v2(gen_random_uuid(),gen_random_uuid(),current_date,1,0,1,null,'{}','{}',gen_random_uuid())",'t9_read_v1':'t9_read_v1(gen_random_uuid(),gen_random_uuid(),current_date)','t9_review_v1':"t9_review_v1(gen_random_uuid(),gen_random_uuid(),current_date,1,0,null,'cancel',null,null,null,'Synthetic reason')",'t9_save_v1':"t9_save_v1(gen_random_uuid(),gen_random_uuid(),current_date,1,0,null,'cancel',null,null,null,'Synthetic reason',gen_random_uuid())",'t9_operation_v1':'t9_operation_v1(gen_random_uuid(),gen_random_uuid())'}
 @classmethod
 def setUpClass(cls):
  super().setUpClass();cls.sql((ROOT/'supabase/migrations/20261028012453_i3e_session_changes.sql').read_text());cls.sql((ROOT/'supabase/migrations/20261028014046_i3e_effective_date_order.sql').read_text())
 def change_read(self,a,p,day,subject='user_owner',ok=True):
  r=self.sql(f"select public.t9_read_v1('{a}','{p['id']}','{day}')",subject,ok=ok);return json.loads(r)if ok else r
 def change(self,a,p,day,kind='move',new='2100-02-02',start='17:00',end='18:00',op=None,read=None,save=True,subject='user_owner',ok=True):
  from uuid import uuid4
  r=read or self.change_read(a,p,day);plan=r['plan'];args=f"'{a}','{p['id']}','{day}',{plan['schedule_version']},{plan['version']},"+(f"'{r['head']}'"if r['head']else'null')+f",'{kind}',"+(f"'{new}','{start}','{end}'"if kind=='move'else'null,null,null')+",'Synthetic change reason'";name='t9_save_v1'if save else't9_review_v1';args+=f",'{op or uuid4()}'"if save else'';raw=self.sql(f'select public.{name}({args})',subject,ok=ok);return json.loads(raw)if ok else raw
 def test_session_changes_01_move_preserves_identity_and_effective_discovery(self):
  a,b,p,staff,iv,x,dates=self.fixture();before=self.change_read(a,p,dates[0]);op=str(uuid.uuid4());review=self.change(a,p,dates[0],save=False);self.assertTrue(review['reviewed']);r=self.change(a,p,dates[0],op=op,read=before);self.assertTrue(r['changed']);self.assertEqual(self.change(a,p,dates[0],op=op,read=before),r)
  after=self.change_read(a,p,dates[0]);self.assertEqual(after['plan']['day'],dates[0]);self.assertEqual(after['plan']['scheduled_day'],'2100-02-02');self.assertEqual(after['plan']['count'],1);self.assertEqual(after['plan']['capacity'],3);self.assertEqual(after['plan']['trainer']['id'],staff);self.assertEqual(len(after['history']),1);self.assertEqual(self.change_read(a,p,dates[1])['plan']['schedule_version'],1)
  directory=json.loads(self.sql(f"select public.p5_dates_v1('{a}','2100-02-01')",'user_owner'));self.assertEqual(directory['items'][0]['date'],dates[0]);self.assertEqual(directory['items'][0]['scheduled_date'],'2100-02-02');j=self.prepare_pub(a,self.pub(a,p,first=dates[0],last=dates[0]));self.mutate(a,j,'activate');items=self.schedule(a,first='2100-02-01')['items'];self.assertEqual(items[0]['day'],'2100-02-02');self.assertEqual(self.schedule(a)['items'],[])
 def test_session_changes_02_cancel_locks_and_releases_occupancy(self):
  a,b,p,staff,iv,x,dates=self.fixture();j=self.prepare_pub(a,self.pub(a,p,first=dates[0],last=dates[0]));self.mutate(a,j,'activate');self.assertEqual(self.change(a,p,dates[0],kind='cancel')['error'],'published_locked');w=self.prepare_pub(a,self.pub(a,p,'withdraw',first=dates[0],last=dates[0]));self.mutate(a,w,'activate');self.change(a,p,dates[0],kind='cancel');r=self.change_read(a,p,dates[0]);self.assertTrue(r['plan']['canceled']);self.assertEqual(r['plan']['count'],1);self.assertEqual(self.change(a,p,dates[0])['error'],'canceled');self.assertEqual(json.loads(self.plan(a,p,day=dates[0],version=2,trainer=staff))['error'],'canceled')
  self.assertTrue(self.change(a,p,dates[1],new=dates[0])['changed']);self.pub(a,p,first=dates[0],last=dates[0],ok=False);j=self.pub(a,p);self.assertEqual(self.detail(a,j)['total'],len(dates)-1)
 def test_session_changes_03_stale_occupied_failed_audit_and_fence(self):
  a,b,p,staff,iv,x,dates=self.fixture();before=self.change_read(a,p,dates[0]);self.assertEqual(self.change(a,p,dates[0],new=dates[1])['error'],'occupied');self.plan(a,p,day=dates[0],version=1,capacity=4,trainer=staff);self.assertEqual(self.change(a,p,dates[0],read=before)['error'],'stale')
  self.sql("create function academy.synthetic_change_fail()returns trigger language plpgsql as $$begin raise exception 'Synthetic failure';end$$;create trigger synthetic_change_fail before insert on academy.session_changes for each row execute function academy.synthetic_change_fail()")
  self.change(a,p,dates[0],ok=False);self.assertEqual(self.change_read(a,p,dates[0])['plan']['scheduled_day'],dates[0]);self.sql('drop trigger synthetic_change_fail on academy.session_changes');op=str(uuid.uuid4());self.sql(f"select public.t9_operation_v1('{a}','{op}')",'user_owner');self.assertEqual(self.change(a,p,dates[0],op=op)['error'],'conflict')
 def test_session_changes_04_roles_scope_acl_and_actual_timezone(self):
  a,b,p,staff,iv,x,dates=self.fixture();r=self.change_read(a,p,dates[0])
  for who in ['user_trainer','user_platform','user_signup','user_other_owner']:
   self.change_read(a,p,dates[0],subject=who,ok=False);self.change(a,p,dates[0],read=r,subject=who,ok=False)
  aa,bb=self.academy('user_other_owner');self.change_read(aa,p,dates[0],ok=False)
  for table in ['session_changes','session_change_operations']:self.sql('select *from academy.'+table,'user_trainer',ok=False)
  self.assertEqual(self.sql("select bool_or(has_function_privilege('authenticated',p.oid,'execute'))from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='academy'and proname like 't9_%'"),'f')
  self.assertEqual(self.sql("select academy.p5_instant('2026-03-08 02:30','America/New_York')is null"),'t');self.assertEqual(self.sql("select academy.p5_instant('2026-11-01 01:30','America/New_York')is null"),'t')
  self.assertEqual(self.change(a,p,dates[0],new='2020-01-01')['error'],'started');self.change(a,p,dates[0],start='23:00',end='02:00',ok=False)
 def test_session_changes_05_observed_move_edit_publish_cancel_orders(self):
  for move_first in [False,True]:
   a,b,p,staff,iv,x,dates=self.fixture();j=self.prepare_pub(a,self.pub(a,p,first=dates[0],last=dates[0]));day=dates[0]
   move=self.caller('user_owner','/rpc/t9_save_v1')+f"select public.t9_save_v1('{a}','{p['id']}','{day}',1,1,null,'move','2100-02-02','17:00','18:00','Synthetic move','{uuid.uuid4()}')"
   publish=self.caller('user_owner','/rpc/s8_change_v1')+f"select public.s8_change_v1('{a}','{j['job']}','{uuid.uuid4()}',{j['version']},'activate')"
   self.observed_order(move if move_first else publish,publish if move_first else move);self.assertEqual(self.change_read(a,p,day)['plan']['scheduled_day'],'2100-02-02'if move_first else day);self.assertEqual(self.detail(a,j)['state'],'ready'if move_first else'committed')
  for move_first in [False,True]:
   a,b,p,staff,iv,x,dates=self.fixture();day=dates[0];move=self.caller('user_owner','/rpc/t9_save_v1')+f"select public.t9_save_v1('{a}','{p['id']}','{day}',1,1,null,'move','2100-02-02','17:00','18:00','Synthetic move','{uuid.uuid4()}')";cancel=self.caller('user_owner','/rpc/t9_save_v1')+f"select public.t9_save_v1('{a}','{p['id']}','{day}',1,1,null,'cancel',null,null,null,'Synthetic cancel','{uuid.uuid4()}')"
   self.observed_order(move if move_first else cancel,cancel if move_first else move);r=self.change_read(a,p,day);self.assertEqual(r['plan']['canceled'],not move_first);self.assertEqual(len(r['history']),1)
 def test_session_changes_06_unplanned_revision_and_atomic_audit_failure(self):
  a,b=self.academy();p=self.ready(a);day='2026-11-01';r=self.change_read(a,p,day);self.assertEqual(r['plan']['version'],0)
  # Unplanned program fixtures use near dates; choose a future destination and ensure no key rewrite.
  self.change(a,p,day,kind='cancel');self.assertEqual(self.change_read(a,p,day)['plan']['schedule_version'],2)
  a,b,p,staff,iv,x,dates=self.fixture();before=self.change_read(a,p,dates[0]);self.sql("create function academy.synthetic_change_audit_fail()returns trigger language plpgsql as $$begin if new.action like 'session.%'then raise exception 'Synthetic audit failure';end if;return new;end$$;create trigger synthetic_change_audit_fail before insert on academy.audit_events for each row execute function academy.synthetic_change_audit_fail()")
  self.addCleanup(lambda:self.sql('drop trigger synthetic_change_audit_fail on academy.audit_events'));self.change(a,p,dates[0],ok=False);self.assertEqual(self.change_read(a,p,dates[0])['plan']['schedule_version'],before['plan']['schedule_version']);self.assertEqual(len(self.change_read(a,p,dates[0])['history']),0)
 def test_session_changes_07_unplanned_planning_and_prepared_scope_stale(self):
  a,b=self.academy();p=self.ready(a);day='2026-11-01';job=self.prepared(a,self.proposal(a,p));self.change(a,p,day,new='2027-02-02');self.assertEqual(self.mutation(a,job,'activate')['error'],'stale');self.assertEqual(self.sql(f"select count(*)from academy.date_plans where academy_id='{a}'"),'0')
  args=f"'{a}','{p['id']}','{day}',1,0,3,null,'{{}}','{{}}'";self.assertEqual(json.loads(self.sql(f'select public.q6_review_v2({args})','user_owner'))['error'],'stale');self.assertEqual(json.loads(self.sql(f"select public.q6_save_v2({args},'{uuid.uuid4()}')",'user_owner'))['error'],'stale')
  args=f"'{a}','{p['id']}','{day}',2,0,3,null,'{{}}','{{}}'";r=json.loads(self.sql(f"select public.q6_save_v2({args},'{uuid.uuid4()}')",'user_owner'));self.assertNotIn('error',r);self.assertEqual(self.planning_read(a,p,day=day).count('2027-02-02'),1)
 def test_session_changes_08_overlap_ending_and_retained_history_paging(self):
  a,b,p,staff,iv,x,dates=self.fixture();r=self.change(a,p,dates[0],new=dates[1],start='17:00',end='18:00');self.assertEqual(r['error'],'occupied')
  # Different program: current Trainer or roster overlap blocks the move.
  d=self.definition();d['name']='Other synthetic program';d['from']='2100-02-01';d['to']='2100-02-03';other=self.ready(a,d);otherday=self.sql(f"select min(local_date)from academy.training_dates where program_id='{other['id']}'")
  self.plan(a,other,day=otherday,trainer=staff);timing=self.change_read(a,other,otherday)['plan'];self.assertEqual(self.change(a,p,dates[0],new=otherday,start=timing['start'],end=timing['end'])['error'],'overlap');self.change(a,other,otherday,kind='cancel');self.assertTrue(self.change(a,p,dates[0],new=otherday,start=timing['start'],end=timing['end'])['changed'])
  self.sql(f"update academy.trainer_assignments set state='ended'where staff_id='{staff}'");self.assertEqual(self.change(a,p,dates[0],new='2100-02-05')['error'],'trainer_unavailable')
  a,b=self.academy();p=self.ready(a);day='2026-11-01'
  for i in range(26):self.change(a,p,day,new='2027-02-02',start='17:00'if i%2 else'16:00')
  r=self.change_read(a,p,day);self.assertEqual(len(r['history']),25);self.assertTrue(r['more']);second=json.loads(self.sql(f"select public.t9_read_v1('{a}','{p['id']}','{day}','{r['history'][-1]['id']}')",'user_owner'));self.assertEqual(len(second['history']),1);self.assertFalse(second['more']);self.assertEqual(len({h['id']for h in r['history']+second['history']}),26)
 def test_session_changes_09_bounded_large_roster_timings(self):
  a,b=self.academy();p=self.ready(a);self.plan(a,p,capacity=1001)
  self.sql(f"insert into academy.players(academy_id,branch_id,display_name,normalized_name)select '{a}','{b}','Synthetic '||n,'synthetic '||n from generate_series(1,1001)n;insert into academy.date_rosters(academy_id,program_id,local_date,player_id)select '{a}','{p['id']}','2026-11-01',id from academy.players where academy_id='{a}';update academy.date_plans set roster_count=1001 where program_id='{p['id']}'")
  args=f"'{a}','{p['id']}','2026-11-01',1,1,null,'move','2027-02-02','17:00','18:00','Synthetic timing'";metrics={}
  for name,expression in {'read':f"public.t9_read_v1('{a}','{p['id']}','2026-11-01')",'review':f'public.t9_review_v1({args})','save_rolled_back':f'public.t9_save_v1({args},gen_random_uuid())'}.items():
   action=f'perform {expression};'
   if name=='save_rolled_back':action="begin "+action+"raise exception 'Synthetic sample rollback'using errcode='PZ001';exception when sqlstate 'PZ001'then null;end;"
   metrics[name]=json.loads(self.sql("create temporary table measured(ms double precision);do $$declare started timestamptz;begin for i in 1..50 loop started:=clock_timestamp();"+action+"insert into measured values(extract(epoch from clock_timestamp()-started)*1000);end loop;end$$;select json_build_object('samples',count(*),'p95_ms',percentile_cont(0.95)within group(order by ms),'max_ms',max(ms))from measured",'user_owner'));self.assertLess(metrics[name]['max_ms'],3000)
  response=self.change_read(a,p,'2026-11-01');self.assertEqual(len(response['plan']['players']),25);self.assertTrue(response['plan']['more']);self.assertEqual(self.sql(f"select count(*)from academy.session_changes where academy_id='{a}'"),'0')
  out=ROOT/'docs/07-handoff/evidence/i3e-local-2026-10-28';out.mkdir(parents=True,exist_ok=True);(out/'sql-large-roster.json').write_text(json.dumps({'scope':'Actual disposable PG17; 40-date program and1001-player roster; 50 warm samples each; save rollback; excludes HTTP/identity/provider/hosted/device/WAL/cost proof','roster':1001,'response_bytes':len(json.dumps(response).encode()),'metrics':metrics,'target_300ms_met':all(x['p95_ms']<300 for x in metrics.values())},indent=2)+'\n')
 def test_session_changes_10_failed_validation_and_commit_clock_rollback(self):
  a,b,p,staff,iv,x,dates=self.fixture();day=dates[0];before=self.change_read(a,p,day);original=json.loads(self.sql("select to_json(pg_get_functiondef('academy.p5_instant(timestamp without time zone,text)'::regprocedure))"))
  self.sql("create or replace function academy.p5_instant(w timestamp,z text)returns timestamptz language plpgsql stable set search_path=''as $$begin raise exception 'Synthetic validation unavailable';end$$")
  try:self.change(a,p,day,read=before,ok=False);self.assertEqual(self.change_read(a,p,day)['plan']['schedule_version'],1)
  finally:self.sql(original)
  self.sql("create function academy.synthetic_slow_session_audit()returns trigger language plpgsql as $$begin if new.action like 'session.%'then perform pg_sleep(1);end if;return new;end$$;create trigger synthetic_slow_session_audit before insert on academy.audit_events for each row execute function academy.synthetic_slow_session_audit()")
  self.addCleanup(lambda:self.sql('drop trigger synthetic_slow_session_audit on academy.audit_events'));self.sql(f"update academy.training_dates set starts_at=clock_timestamp()+interval '500 milliseconds'where program_id='{p['id']}'and local_date='{day}'")
  self.change(a,p,day,kind='cancel',read=before,ok=False);self.assertFalse(self.change_read(a,p,day)['plan']['canceled']);self.assertEqual(self.sql(f"select count(*)from academy.session_changes where academy_id='{a}'"),'0');self.assertEqual(self.sql(f"select count(*)from academy.session_change_operations where academy_id='{a}'"),'0')
 def test_session_changes_11_effective_order_original_key_paging(self):
  a,b=self.academy();programs=[]
  for i in range(3):
   d=self.definition();d['name']='Synthetic ordering '+str(i);programs.append(self.ready(a,d))
  p=programs[0];self.change(a,p,'2026-11-01',new='2026-11-27');self.change(a,p,'2026-11-03',kind='cancel');self.change(a,p,'2026-11-05',new='2026-11-03');rows=[];after=''
  while True:
   r=json.loads(self.sql(f"select public.p5_dates_v1('{a}','2026-11-01'{after})",'user_owner'));self.assertLessEqual(len(r['items']),25);rows+=r['items']
   if not r['more']:break
   last=r['items'][-1];after=f",'{last['date']}','{last['program_id']}'"
  keys=[(x['scheduled_date'],x['program_id'],x['date'])for x in rows];self.assertEqual(keys,sorted(keys));self.assertEqual(len(keys),len(set(keys)));self.assertTrue(any(x['date']=='2026-11-01'and x['scheduled_date']=='2026-11-27'for x in rows));self.assertEqual(sum(x['program_id']==p['id']and x['scheduled_date']=='2026-11-03'for x in rows),2)
if __name__=='__main__':
 import unittest
 result=unittest.TextTestRunner(verbosity=2).run(unittest.defaultTestLoader.loadTestsFromTestCase(SessionChangeBoundary));raise SystemExit(not result.wasSuccessful())
