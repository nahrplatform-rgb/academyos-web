"""Disposable actual PG17 transaction tests. No hosted accounts or access grants."""
import runpy,json,uuid,unittest
from pathlib import Path
m=runpy.run_path(str(Path(__file__).resolve().parents[1]/'qr-attendance/test_boundary.py'));Base,ROOT=m['QrBoundary'],m['ROOT']
class RegisterBoundary(Base):
 extra_authenticated_calls={**Base.extra_authenticated_calls,'a10_register_v1':"a10_register_v1(gen_random_uuid(),gen_random_uuid(),'[]',clock_timestamp(),gen_random_uuid())"}
 @classmethod
 def setUpClass(cls):
  super().setUpClass();cls.sql((ROOT/'supabase/migrations/20261029035928_attendance_register_batch.sql').read_text())
 def pair(self):
  a,b,p,st,iv,x,dates,ev=self.attendance_fixture();y=self.sql(f"insert into academy.players(academy_id,branch_id,display_name,normalized_name)values('{a}','{b}','Synthetic second','synthetic second')returning id")
  self.sql(f"insert into academy.publication_rosters values('{ev}','{y}','Synthetic second');update academy.publication_events set roster_count=2,capacity=3 where id='{ev}'")
  return a,b,ev,x,y
 def batch(self,a,ev,players,op=None,who='user_trainer',ok=True):
  marks=players if players and isinstance(players[0],dict)else[{'player':x,'status':'present','version':0}for x in players]
  return self.sql(f"select public.a10_register_v1('{a}','{ev}','{json.dumps(marks)}','2026-10-29T00:00:00Z','{op or uuid.uuid4()}')",who,ok=ok)
 def test_register_01_all_commit_and_replay(self):
  a,b,ev,x,y=self.pair();op=str(uuid.uuid4());r=json.loads(self.batch(a,ev,[x,y],op));self.assertEqual(r['count'],2);self.assertEqual(r['kind'],'register');self.assertEqual(r,json.loads(self.batch(a,ev,[y,x],op)));self.assertEqual(self.roster(a,ev)['saved'],2);self.assertEqual(len(self.history(a,ev,x)['items']),1)
  self.assertEqual(json.loads(self.batch(a,ev,[x],op))['error'],'conflict');self.assertEqual(json.loads(self.sql(f"select public.a10_operation_v1('{a}','{ev}','{op}')",'user_trainer')),r)
 def test_register_02_stale_mixed_set_saves_none(self):
  a,b,ev,x,y=self.pair();self.mark(a,ev,x);self.assertEqual(json.loads(self.batch(a,ev,[x,y]))['error'],'stale');self.assertEqual(self.roster(a,ev)['saved'],1);self.assertEqual(self.history(a,ev,y)['items'],[])
 def test_register_03_duplicate_invalid_foreign_and_roles(self):
  a,b,ev,x,y=self.pair();self.batch(a,ev,[x,x],ok=False)
  self.batch(a,ev,[{'player':x,'status':'late','version':0}],ok=False)
  aa,bb=self.academy('user_other');z=self.person(aa,bb,subject='user_other');self.batch(a,ev,[x,z],ok=False)
  for who in ['user_platform','user_guardian','user_other','user_unknown']:self.batch(a,ev,[x,y],who=who,ok=False)
  self.sql(f"update academy.memberships set status='suspended'where academy_id='{a}'and role='trainer'");self.batch(a,ev,[x,y],ok=False);self.assertEqual(self.roster(a,ev,'user_owner')['saved'],0)
 def test_register_04_failures_roll_back_every_row(self):
  a,b,ev,x,y=self.pair();self.sql("create function academy.synthetic_register_fail()returns trigger language plpgsql as $$begin raise exception 'Synthetic failure';end$$")
  for table in ['attendance_history','attendance_operations','audit_events']:
   self.sql(f'create trigger synthetic_register before insert on academy.{table} for each row execute function academy.synthetic_register_fail()');self.batch(a,ev,[x,y],ok=False);self.assertEqual(self.roster(a,ev)['saved'],0);self.assertEqual(self.history(a,ev,x)['items'],[]);self.sql(f'drop trigger synthetic_register on academy.{table}')
 def test_register_05_fence_window_and_concurrent_mark(self):
  a,b,ev,x,y=self.pair();op=str(uuid.uuid4());self.sql(f"select public.a10_operation_v1('{a}','{ev}','{op}')",'user_trainer');self.assertEqual(json.loads(self.batch(a,ev,[x,y],op))['error'],'conflict')
  self.retime(ev,"clock_timestamp()-interval '26 hours'","clock_timestamp()-interval '25 hours'");self.assertEqual(json.loads(self.batch(a,ev,[x,y]))['error'],'window_closed');self.assertEqual(self.roster(a,ev)['saved'],0)
  self.retime(ev);mark=self.caller('user_trainer','/rpc/a10_mark_v1')+f"select public.a10_mark_v1('{a}','{ev}','{x}','absent',0,null,clock_timestamp(),'{uuid.uuid4()}')";batch=self.caller('user_trainer','/rpc/a10_register_v1')+f"select public.a10_register_v1('{a}','{ev}','{json.dumps([{'player':x,'status':'present','version':0},{'player':y,'status':'present','version':0}])}',clock_timestamp(),'{uuid.uuid4()}')";self.observed_order(mark,batch);self.assertEqual(self.roster(a,ev)['saved'],1);self.assertEqual(self.history(a,ev,y)['items'],[])
 def test_register_06_full_roster_scale_and_deadline_rollback(self):
  a,b,ev,x,y=self.pair();self.sql(f"insert into academy.players(academy_id,branch_id,display_name,normalized_name)select '{a}','{b}','Synthetic '||n,'synthetic '||n from generate_series(1,998)n;insert into academy.publication_rosters select '{ev}',id,display_name from academy.players p where academy_id='{a}'and not exists(select 1 from academy.publication_rosters r where r.event_id='{ev}'and r.player_id=p.id);update academy.publication_events set roster_count=1000,capacity=1000 where id='{ev}'")
  players=json.loads(self.sql(f"select json_agg(player_id)from academy.publication_rosters where event_id='{ev}'"));self.assertEqual(json.loads(self.batch(a,ev,players))['count'],1000);self.assertEqual(self.roster(a,ev)['saved'],1000);self.assertEqual(self.sql(f"select count(*)from academy.attendance_history where event_id='{ev}'"),'1000')
  a,b,ev,x,y=self.pair();self.retime(ev,"clock_timestamp()-interval '25 hours'","clock_timestamp()-interval '24 hours'+interval '500 milliseconds'")
  self.sql("create function academy.synthetic_register_slow()returns trigger language plpgsql as $$begin if new.action='attendance.register'then perform pg_sleep(0.8);end if;return new;end$$;create trigger synthetic_register_slow before insert on academy.audit_events for each row execute function academy.synthetic_register_slow()")
  self.batch(a,ev,[x,y],ok=False);self.assertEqual(self.roster(a,ev)['saved'],0);self.assertEqual(self.history(a,ev,x)['items'],[]);self.sql('drop trigger synthetic_register_slow on academy.audit_events')
 def test_register_07_simultaneous_batch_replay_and_revoke_order(self):
  a,b,ev,x,y=self.pair();op=str(uuid.uuid4());q=self.caller('user_trainer','/rpc/a10_register_v1')+f"select public.a10_register_v1('{a}','{ev}','{json.dumps([{'player':x,'status':'present','version':0},{'player':y,'status':'absent','version':0}])}','2026-10-29T00:00:00Z','{op}')"
  self.observed_order(q,q);self.assertEqual(self.roster(a,ev)['saved'],2);self.assertEqual(self.sql(f"select count(*)from academy.attendance_history where event_id='{ev}'"),'2')
  a,b,ev,x,y=self.pair();self.sql(f"update academy.memberships set status='suspended'where academy_id='{a}'and role='trainer'");self.batch(a,ev,[x,y],ok=False);self.assertEqual(self.roster(a,ev,'user_owner')['saved'],0)
 def test_register_08_acl_branch_and_foreign_scope(self):
  self.assertEqual(self.sql("select has_function_privilege('anon','public.a10_register_v1(uuid,uuid,jsonb,timestamptz,uuid)','execute')"),'f')
  a,b,ev,x,y=self.pair();aa,bb=self.academy('user_other');self.batch(aa,ev,[x,y],who='user_other',ok=False)
  branch=self.sql(f"insert into academy.branches(academy_id,name)values('{a}','Synthetic other branch')returning id")
  self.sql(f"update academy.players set branch_id='{branch}'where id='{y}'");self.batch(a,ev,[x,y],ok=False);self.assertEqual(self.roster(a,ev)['saved'],0)
  for role in ['manager','guardian','player']:
   self.sql(f"update academy.memberships set role='{role}'where academy_id='{a}'and role='trainer'");self.batch(a,ev,[x,y],ok=False);self.sql(f"update academy.memberships set role='trainer'where academy_id='{a}'and role='{role}'")
if __name__=='__main__':
 suite=unittest.TestSuite();suite.addTests(unittest.defaultTestLoader.loadTestsFromNames([n for n in unittest.defaultTestLoader.getTestCaseNames(RegisterBoundary)if n.startswith('test_register_')],RegisterBoundary));result=unittest.TextTestRunner(verbosity=2).run(suite);out=ROOT/'docs/07-handoff/evidence/attendance-refresh-local-2026-10-29';out.mkdir(parents=True,exist_ok=True);(out/'database.json').write_text(json.dumps({'passed':result.wasSuccessful(),'tests':result.testsRun,'failures':len(result.failures),'errors':len(result.errors),'scope':'Actual disposable PostgreSQL17; synthetic data, no hosted access. Includes 1000 marks, rollback, replay/fence, stale mixed set, roles/tenant/branch denial, deadline and observed concurrency.'},indent=2)+'\n');raise SystemExit(not result.wasSuccessful())
