"""I4a actual disposable PostgreSQL boundary. Synthetic data only, no hosted access."""
import runpy,json,uuid,datetime,subprocess,unittest
from pathlib import Path
m=runpy.run_path(str(Path(__file__).resolve().parents[1]/'session-changes/test_boundary.py'));Base,ROOT=m['SessionChangeBoundary'],m['ROOT']
class AttendanceBoundary(Base):
 extra_authenticated_calls={**Base.extra_authenticated_calls,'a10_roster_v1':'a10_roster_v1(gen_random_uuid(),gen_random_uuid())','a10_history_v1':'a10_history_v1(gen_random_uuid(),gen_random_uuid(),gen_random_uuid())','a10_mark_v1':"a10_mark_v1(gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),'present',0,null,clock_timestamp(),gen_random_uuid())",'a10_operation_v1':'a10_operation_v1(gen_random_uuid(),gen_random_uuid(),gen_random_uuid())'}
 @classmethod
 def setUpClass(cls):
  super().setUpClass();cls.sql((ROOT/'supabase/migrations/20261028024556_i4a_online_attendance.sql').read_text())
 def attendance_fixture(self):
  a,b,p,staff,iv,x,dates=self.fixture();j=self.prepare_pub(a,self.pub(a,p));self.mutate(a,j,'activate');ev=self.schedule(a)['items'][0]['id'];self.retime(ev);return a,b,p,staff,iv,x,dates,ev
 def retime(self,ev,start="clock_timestamp()-interval '15 minutes'",finish="clock_timestamp()+interval '45 minutes'"):
  # Test-only administrator fixture: align immutable publication time to real server now before any attendance.
  self.sql(f"begin;delete from academy.publication_heads where event_id='{ev}';update academy.publication_events set starts_at={start},ends_at={finish}where id='{ev}';update academy.training_dates d set starts_at=e.starts_at,ends_at=e.ends_at from academy.publication_events e where e.id='{ev}'and d.program_id=e.program_id and d.local_date=e.day;insert into academy.publication_heads select academy_id,program_id,day,id from academy.publication_events where id='{ev}';commit")
 def roster(self,a,ev,who='user_trainer',ok=True,after=None):
  raw=self.sql(f"select public.a10_roster_v1('{a}','{ev}',"+(f"'{after}'"if after else'null')+")",who,ok=ok);return json.loads(raw)if ok else raw
 def mark(self,a,ev,x,who='user_trainer',version=0,status='present',reason=None,op=None,ok=True,captured='2026-10-28T00:00:00Z'):
  quote=lambda v:"'"+v.replace("'","''")+"'" if v is not None else'null'
  raw=self.sql(f"select public.a10_mark_v1('{a}','{ev}','{x}',{quote(status)},{version},{quote(reason)},'{captured}','{op or uuid.uuid4()}')",who,ok=ok);return json.loads(raw)if ok else raw
 def history(self,a,ev,x,who='user_trainer'):
  return json.loads(self.sql(f"select public.a10_history_v1('{a}','{ev}','{x}')",who))
 def test_zz_attendance_01_mark_reopen_correction_history_and_replay(self):
  a,b,p,staff,iv,x,dates,ev=self.attendance_fixture();r=self.roster(a,ev);self.assertTrue(r['open']);self.assertFalse(r['owner']);self.assertEqual(r['saved'],0);self.assertEqual(r['count'],1);self.assertIsNone(r['players'][0]['status'])
  op=str(uuid.uuid4());first=self.mark(a,ev,x,op=op);self.assertEqual(first,self.mark(a,ev,x,op=op));self.assertEqual(self.mark(a,ev,x,op=op,status='absent')['error'],'conflict');self.assertEqual(self.mark(a,ev,x,version=0)['error'],'stale');self.assertEqual(self.mark(a,ev,x,version=1,status='absent')['error'],'owner_correction_required')
  self.mark(a,ev,x,'user_owner',version=1,status='absent',reason='Synthetic correction');h=self.history(a,ev,x);self.assertEqual(len(h['items']),2);self.assertEqual(h['items'][0]['before_status'],'present');self.assertEqual(h['items'][0]['status'],'absent');self.assertEqual(h['items'][1]['actor_role'],'trainer');self.assertNotIn('user_owner',json.dumps(h));r=self.roster(a,ev,'user_owner');self.assertTrue(r['owner']);self.assertTrue(r['protected']);self.assertEqual(r['saved'],1)
 def test_zz_attendance_02_denials_fence_eligibility_and_window(self):
  a,b,p,staff,iv,x,dates,ev=self.attendance_fixture();aa,bb=self.academy('user_other');other=self.person(aa,bb,subject='user_other')
  for who in ['user_other','user_platform','user_guardian','user_unknown']:
   self.roster(a,ev,who,ok=False);self.mark(a,ev,x,who,ok=False)
  self.mark(a,ev,other,ok=False);op=str(uuid.uuid4());self.sql(f"select public.a10_operation_v1('{a}','{ev}','{op}')",'user_trainer');self.assertEqual(self.mark(a,ev,x,op=op)['error'],'conflict')
  self.retime(ev,"clock_timestamp()+interval '1 hour'","clock_timestamp()+interval '2 hours'");self.assertFalse(self.roster(a,ev)['open']);self.assertEqual(self.mark(a,ev,x)['error'],'window_closed')
  self.retime(ev,"clock_timestamp()-interval '26 hours'","clock_timestamp()-interval '25 hours'");self.assertEqual(self.mark(a,ev,x)['error'],'window_closed');self.assertEqual(self.roster(a,ev)['saved'],0)
  self.retime(ev);self.sql(f"update academy.players set branch_id=(select branch_id from academy.initial_setup where academy_id='{aa}')where id='{x}'",ok=False)
  self.sql(f"update academy.trainer_assignments set state='ended'where staff_id='{staff}'");self.roster(a,ev,ok=False);self.mark(a,ev,x,ok=False);self.assertTrue(self.roster(a,ev,'user_owner')['owner'])
 def test_zz_attendance_03_atomic_failures_and_history_immutable(self):
  a,b,p,staff,iv,x,dates,ev=self.attendance_fixture();self.sql("create function academy.synthetic_attendance_fail()returns trigger language plpgsql as $$begin raise exception 'Synthetic attendance failure';end$$")
  for table in ['attendance_history','attendance_operations','audit_events']:
   self.sql(f'create trigger synthetic_attendance before insert on academy.{table} for each row execute function academy.synthetic_attendance_fail()');self.mark(a,ev,x,ok=False);self.assertEqual(self.roster(a,ev)['saved'],0);self.assertEqual(self.history(a,ev,x)['items'],[]);self.sql(f'drop trigger synthetic_attendance on academy.{table}')
  self.mark(a,ev,x);self.sql(f"delete from academy.attendance_history where event_id='{ev}'",ok=False);self.mark(a,ev,x,'user_owner',version=1,status='absent',reason='',ok=False);self.assertEqual(self.roster(a,ev)['players'][0]['status'],'present')
 def test_zz_attendance_04_existing_writers_guard_and_concurrent_marks(self):
  a,b,p,staff,iv,x,dates,ev=self.attendance_fixture();op=str(uuid.uuid4());stmt=self.caller('user_trainer','/rpc/a10_mark_v1')+f"select public.a10_mark_v1('{a}','{ev}','{x}','present',0,null,'2026-10-28T00:00:00Z','{op}')";self.observed_order(stmt,stmt);self.assertEqual(len(self.history(a,ev,x)['items']),1)
  for query in [f"update academy.training_dates set schedule_version=schedule_version+1 where program_id='{p['id']}'and local_date='{dates[0]}'",f"delete from academy.date_rosters where program_id='{p['id']}'and local_date='{dates[0]}'",f"update academy.date_plans set capacity=5 where program_id='{p['id']}'and local_date='{dates[0]}'",f"delete from academy.publication_heads where event_id='{ev}'"]:self.sql(query,ok=False)
  self.assertEqual(self.roster(a,ev)['saved'],1)
 def test_zz_attendance_05_correction_races_revoke_and_protected_snapshot(self):
  a,b,p,staff,iv,x,dates,ev=self.attendance_fixture();self.mark(a,ev,x)
  def correction():return self.caller('user_owner','/rpc/a10_mark_v1')+f"select public.a10_mark_v1('{a}','{ev}','{x}','absent',1,'Synthetic correction','2026-10-28T00:00:00Z','{uuid.uuid4()}')"
  self.observed_order(correction(),correction());self.assertEqual(len(self.history(a,ev,x)['items']),2);self.assertEqual(self.roster(a,ev)['players'][0]['version'],2)
  for q in [f"delete from academy.publication_rosters where event_id='{ev}'",f"update academy.publication_events set capacity=5 where id='{ev}'"]:self.sql(q,ok=False)
  self.sql(f"update academy.memberships set status='suspended'where academy_id='{a}'and role='trainer'");self.roster(a,ev,ok=False);self.sql(f"select public.a10_operation_v1('{a}','{ev}','{uuid.uuid4()}')",'user_trainer',ok=False);self.assertEqual(self.roster(a,ev,'user_owner')['saved'],1)
 def test_zz_attendance_06_mark_withdraw_order_and_commit_clock_rollback(self):
  for first in [True,False]:
   a,b,p,staff,iv,x,dates,ev=self.attendance_fixture();mark=self.caller('user_trainer','/rpc/a10_mark_v1')+f"select public.a10_mark_v1('{a}','{ev}','{x}','present',0,null,'2026-10-28T00:00:00Z','{uuid.uuid4()}')";withdraw=f"select academy.t4_lock('{a}');delete from academy.publication_heads where event_id='{ev}'"
   self.observed_order(mark if first else withdraw,withdraw if first else mark,second_ok=False);self.assertEqual(self.sql(f"select count(*)from academy.attendance_marks where event_id='{ev}'"),'1'if first else'0')
  a,b,p,staff,iv,x,dates,ev=self.attendance_fixture();self.retime(ev,"clock_timestamp()-interval '25 hours'","clock_timestamp()-interval '24 hours'+interval '500 milliseconds'")
  self.sql("create function academy.synthetic_attendance_slow()returns trigger language plpgsql as $$begin if new.action like 'attendance.%'then perform pg_sleep(0.8);end if;return new;end$$;create trigger synthetic_attendance_slow before insert on academy.audit_events for each row execute function academy.synthetic_attendance_slow()")
  self.mark(a,ev,x,ok=False);self.assertEqual(self.roster(a,ev)['saved'],0);self.assertEqual(self.history(a,ev,x)['items'],[]);self.sql('drop trigger synthetic_attendance_slow on academy.audit_events')
 def test_zz_attendance_07_large_roster_bytes_history_pages_and_timings(self):
  a,b,p,staff,iv,x,dates=self.fixture(False);day=dates[0]
  self.sql(f"insert into academy.players(academy_id,branch_id,display_name,normalized_name)select '{a}','{b}',repeat('界',160),'synthetic '||n from generate_series(1,1000)n;insert into academy.date_rosters select '{a}','{p['id']}','{day}',id from academy.players where academy_id='{a}'and id<>'{x}';update academy.date_plans set roster_count=1000,capacity=1000 where program_id='{p['id']}'and local_date='{day}'")
  j=self.prepare_pub(a,self.pub(a,p));self.mutate(a,j,'activate');ev=self.schedule(a)['items'][0]['id'];self.retime(ev);ids=[];after=None
  while True:
   r=self.roster(a,ev,after=after);self.assertLessEqual(len(r['players']),50);self.assertLess(len(json.dumps(r,ensure_ascii=False).encode()),32768);ids.extend(q['id']for q in r['players'])
   if not r['more']:break
   after=r['players'][-1]['id']
  self.assertEqual(len(ids),1000);self.assertEqual(len(set(ids)),1000);x=ids[0];self.mark(a,ev,x)
  for i in range(24):self.mark(a,ev,x,'user_owner',version=i+1,status='absent'if i%2==0 else'present',reason='界'*500)
  h=self.history(a,ev,x);self.assertTrue(h['more']);self.assertLessEqual(len(h['items']),20);self.assertLess(len(json.dumps(h,ensure_ascii=False).encode()),32768)
  seen=[r['version']for r in h['items']]
  while h['more']:
   h=json.loads(self.sql(f"select public.a10_history_v1('{a}','{ev}','{x}',{h['items'][-1]['version']})",'user_trainer'));seen.extend(r['version']for r in h['items'])
  self.assertEqual(seen,list(range(25,0,-1)))
  timing=json.loads(self.sql("create temporary table measured(ms double precision);do $$declare started timestamptz;begin for i in 1..50 loop started:=clock_timestamp();perform public.a10_roster_v1('"+a+"','"+ev+"');insert into measured values(extract(epoch from clock_timestamp()-started)*1000);end loop;end$$;select json_build_object('samples',count(*),'p95_ms',percentile_cont(0.95)within group(order by ms),'max_ms',max(ms))from measured",'user_trainer'));self.assertLess(timing['p95_ms'],300)
  out=ROOT/'docs/07-handoff/evidence/i4a-local-2026-10-28';out.mkdir(parents=True,exist_ok=True);(out/'sql-roster-scale.json').write_text(json.dumps({'scope':'Actual disposable PG17,1000-player Unicode roster,50 warm SQL reads; excludes hosted/HTTP/physical-device/WAL/cost proof','metrics':timing,'roster_count':1000,'history_events':25},indent=2)+'\n')
if __name__=='__main__':
 suite=unittest.TestSuite();suite.addTests(unittest.defaultTestLoader.loadTestsFromNames([n for n in unittest.defaultTestLoader.getTestCaseNames(AttendanceBoundary)if n.startswith('test_zz_attendance_')],AttendanceBoundary));result=unittest.TextTestRunner(verbosity=2).run(suite);raise SystemExit(not result.wasSuccessful())
