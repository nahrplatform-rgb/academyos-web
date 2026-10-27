"""Disposable PG17 actual planning functions and inherited program/people/M1 cases."""
import sys,json,uuid,runpy,concurrent.futures,subprocess,time,select
from pathlib import Path
base=Path(__file__).resolve().parents[1]
programs=runpy.run_path(str(base/'programs/test_boundary.py'));trainers=runpy.run_path(str(base/'trainers/test_boundary.py'))
ProgramBoundary,literal,ROOT=programs['ProgramBoundary'],programs['literal'],programs['ROOT']
TrainerBoundary=trainers['TrainerBoundary']
class PlanningBoundary(ProgramBoundary):
 extra_authenticated_calls={**ProgramBoundary.extra_authenticated_calls,**TrainerBoundary.extra_authenticated_calls,
 'q6_read_v1':"q6_read_v1(gen_random_uuid(),gen_random_uuid(),'2026-11-01')",'q6_candidates_v1':"q6_candidates_v1(gen_random_uuid(),gen_random_uuid(),'2026-11-01','player')",'q6_review_v1':"q6_review_v1(gen_random_uuid(),gen_random_uuid(),'2026-11-01',0,1,null,'{}','{}')",'q6_save_v1':"q6_save_v1(gen_random_uuid(),gen_random_uuid(),'2026-11-01',0,1,null,'{}','{}',gen_random_uuid())",'q6_operation_v1':'q6_operation_v1(gen_random_uuid(),gen_random_uuid())'}
 @classmethod
 def setUpClass(cls):
  super().setUpClass()
  for f in ['20261025111253_i2b_synthetic_guardian_appointments.sql','20261025123233_i2c_synthetic_trainer_appointments.sql','20261027004132_i3b_draft_session_planning.sql']:cls.sql((ROOT/'supabase/migrations'/f).read_text())
 def ready(self,a,definition=None):
  p=json.loads(self.command(a,definition=definition))
  for _ in range(p['windows']):p=json.loads(self.step(a,p))
  return json.loads(self.step(a,p,'finalize'))
 def person(self,a,b,name='Alex Demo',subject='user_owner'):
  rev=self.candidates(a,name,subject=subject)['revision'];return json.loads(self.register(a,b,name=name,revision=rev,different=True,subject=subject))['player_id']
 def plan(self,a,p,version=0,capacity=1,trainer=None,add=None,remove=None,op=None,day='2026-11-01',subject='user_owner',ok=True,review=False):
  ids=lambda v:literal('{'+','.join(v or [])+'}')+'::uuid[]'
  return self.sql(f"select public.q6_{'review' if review else 'save'}_v1('{a}','{p['id']}','{day}',{version},{capacity},{literal(trainer)+'::uuid' if trainer else 'null'},{ids(add)},{ids(remove)}"+(')' if review else f",'{op or uuid.uuid4()}')"),subject,ok=ok)
 def planning_read(self,a,p,day='2026-11-01',subject='user_owner',ok=True,after=None):return self.sql(f"select public.q6_read_v1('{a}','{p['id']}','{day}',{literal(after)+'::uuid' if after else 'null'})",subject,ok=ok)
 def staff(self,a,b):
  _,iv,tk,_,_=TrainerBoundary.command(self,a,b)
  TrainerBoundary.recipient(self,iv,tk,'accept',str(uuid.uuid4()))
  return self.sql(f"select staff_id from academy.trainer_invitations where id='{iv}'"),iv
 def test_planning_01_atomic_save_reopen_review_deltas_and_history(self):
  a,b=self.academy();p=self.ready(a);x=self.person(a,b);y=self.person(a,b,'Taylor Demo');staff,iv=self.staff(a,b)
  self.assertEqual(json.loads(self.planning_read(a,p))['version'],0)
  self.assertTrue(json.loads(self.plan(a,p,trainer=staff,add=[x],review=True))['reviewed'])
  self.assertEqual(self.sql('select count(*) from academy.date_plans'),'0')
  op=str(uuid.uuid4());r=self.plan(a,p,trainer=staff,add=[x],op=op);self.assertEqual(self.plan(a,p,trainer=staff,add=[x],op=op),r)
  q=json.loads(self.planning_read(a,p));self.assertEqual(q['count'],1);self.assertEqual(q['players'][0],{'id':x,'name':'Alex Demo'});self.assertTrue(q['trainer']['eligible']);self.assertNotIn('contact',json.dumps(q));self.assertNotIn('recipient',json.dumps(q))
  self.assertEqual(json.loads(self.plan(a,p,version=1,add=[y],remove=[x]))['version'],2)
  self.assertEqual(json.loads(self.planning_read(a,p))['players'][0]['id'],y)
  self.assertEqual(self.sql(f"select count(*) from academy.planning_operations where academy_id='{a}'"),'2')
  self.assertNotIn('Demo',self.sql(f"select details from academy.audit_events where academy_id='{a}' and action='planning.save'"))
  self.assertEqual(json.loads(self.planning_read(a,p,'2026-11-03'))['version'],0)
 def test_planning_02_capacity_duplicate_and_last_place_race(self):
  a,b=self.academy();p=self.ready(a);x=self.person(a,b);y=self.person(a,b,'Taylor Demo')
  self.plan(a,p,capacity=1)
  with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:r=list(pool.map(lambda v:json.loads(self.plan(a,p,version=1,add=[v])),[x,y]))
  self.assertEqual(sum('version' in v for v in r),1);self.assertIn('stale',[v.get('error') for v in r]);q=json.loads(self.planning_read(a,p));self.assertEqual(q['count'],1)
  enrolled=q['players'][0]['id'];other=y if enrolled==x else x
  self.assertEqual(json.loads(self.plan(a,p,version=2,add=[other]))['error'],'full')
  self.assertEqual(json.loads(self.plan(a,p,version=2,add=[enrolled]))['error'],'duplicate')
  self.plan(a,p,version=2,capacity=0,ok=False);self.plan(a,p,version=2,add=[other,other],ok=False)
 def test_planning_03_overlap_and_adjacent_intervals(self):
  a,b=self.academy();p=self.ready(a);x=self.person(a,b);staff,iv=self.staff(a,b);self.plan(a,p,trainer=staff,add=[x])
  d=self.definition();d['name']='Overlap';d['to']='2026-11-01';d['rules']=[{'day':0,'start':'17:30','end':'18:30'}];other=self.ready(a,d)
  self.assertEqual(json.loads(self.plan(a,other,trainer=staff))['error'],'overlap')
  self.assertEqual(json.loads(self.plan(a,other,add=[x]))['error'],'overlap')
  d['name']='Adjacent';d['rules']=[{'day':0,'start':'18:00','end':'19:00'}];adjacent=self.ready(a,d);self.assertEqual(json.loads(self.plan(a,adjacent,trainer=staff,add=[x]))['version'],1)
 def test_planning_04_scope_roles_staff_ending_and_direct_denial(self):
  a,b=self.academy();aa,bb=self.academy('user_other_owner');p=self.ready(a);x=self.person(a,b);foreign=self.person(aa,bb,subject='user_other_owner');staff,iv=self.staff(a,b)
  self.plan(a,p,trainer=staff,add=[x]);TrainerBoundary.command(self,a,act='end',iv=iv,version=2,reason='Synthetic end')
  self.assertFalse(json.loads(self.planning_read(a,p))['trainer']['eligible'])
  self.assertEqual(json.loads(self.plan(a,p,version=1,trainer=staff))['error'],'trainer_unavailable')
  self.plan(a,p,version=1,add=[foreign],ok=False)
  for who in ['user_other_owner','user_trainer','user_platform','user_signup']:
   self.planning_read(a,p,subject=who,ok=False);self.plan(a,p,subject=who,ok=False)
  for role in ['manager','guardian','player','trainer']:
   self.sql(f"update academy.memberships set role='{role}' where academy_id='{a}' and role='owner'");self.planning_read(a,p,ok=False);self.plan(a,p,ok=False);self.sql(f"update academy.memberships set role='owner' where academy_id='{a}' and role='{role}' and identity_id=(select id from academy.identities where clerk_subject='user_owner')")
  for t in ['date_plans','date_rosters','planning_operations']:self.sql('select * from academy.'+t,'user_other_owner',ok=False)
  self.sql(f"update academy.memberships set status='suspended' where academy_id='{a}' and role='owner'");self.planning_read(a,p,ok=False);self.plan(a,p,version=1,ok=False);self.sql(f"select public.q6_operation_v1('{a}',gen_random_uuid())",'user_owner',ok=False)
 def test_planning_05_fence_fingerprint_and_rollback(self):
  a,b=self.academy();p=self.ready(a);x=self.person(a,b);staff,iv=self.staff(a,b);op=str(uuid.uuid4());self.plan(a,p,trainer=staff,add=[x],op=op)
  self.assertEqual(json.loads(self.sql(f"select public.q6_operation_v1('{a}','{op}')",'user_owner'))['version'],1)
  self.plan(a,p,add=[x],capacity=2,op=op,ok=False)
  fence=str(uuid.uuid4());self.assertTrue(json.loads(self.sql(f"select public.q6_operation_v1('{a}','{fence}')",'user_owner'))['cancelled']);self.plan(a,p,version=1,op=fence,ok=False)
  self.sql("create function academy.q6_test_fail() returns trigger language plpgsql as $$begin raise exception 'synthetic failure';end$$;create trigger synthetic_failure before insert on academy.date_rosters for each row execute function academy.q6_test_fail()")
  y=self.person(a,b,'Taylor Demo');self.plan(a,p,version=1,capacity=2,add=[y],remove=[x],ok=False)
  q=json.loads(self.planning_read(a,p));self.assertEqual(q['capacity'],1);self.assertEqual(q['version'],1);self.assertEqual(q['players'][0]['id'],x);self.assertEqual(q['trainer']['id'],staff)
  self.sql('drop trigger synthetic_failure on academy.date_rosters;drop function academy.q6_test_fail()')
 def test_planning_06_concurrent_cross_date_conflict(self):
  a,b=self.academy();x=self.person(a,b);d=self.definition();d['to']='2026-11-01';first=self.ready(a,d);d['name']='Other';second=self.ready(a,d)
  with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:results=list(pool.map(lambda p:json.loads(self.plan(a,p,add=[x])),[first,second]))
  self.assertEqual(sum('version' in r for r in results),1);self.assertIn('overlap',[r.get('error') for r in results]);self.assertEqual(self.sql(f"select count(*) from academy.date_rosters where academy_id='{a}'"),'1')
 def test_planning_07_bounded_roster_and_candidates(self):
  a,b=self.academy();p=self.ready(a);self.plan(a,p,capacity=1001)
  self.sql(f"insert into academy.players(academy_id,branch_id,display_name,normalized_name) select '{a}','{b}','Demo '||n,'demo '||n from generate_series(1,1001)n;insert into academy.date_rosters(academy_id,program_id,local_date,player_id) select '{a}','{p['id']}','2026-11-01',id from academy.players where academy_id='{a}';update academy.date_plans set roster_count=1001 where program_id='{p['id']}'")
  result=json.loads(self.planning_read(a,p));self.assertEqual(result['count'],1001);self.assertEqual(len(result['players']),25);self.assertTrue(result['more']);self.assertLess(len(json.dumps(result).encode()),24576)
  next_page=json.loads(self.planning_read(a,p,after=result['players'][-1]['id']));self.assertTrue(set(x['id'] for x in result['players']).isdisjoint(x['id'] for x in next_page['players']))
  rows=json.loads(self.sql(f"select public.q6_candidates_v1('{a}','{p['id']}','2026-11-01','player','Demo')",'user_owner'));self.assertEqual(len(rows['items']),25);self.assertTrue(rows['more']);self.assertTrue(all(x['enrolled'] for x in rows['items']))
 def test_planning_08_sql_budgets(self):
  import statistics
  a,b=self.academy();p=self.ready(a);self.plan(a,p,capacity=1001)
  self.sql(f"insert into academy.players(academy_id,branch_id,display_name,normalized_name) select '{a}','{b}','Scale '||n,'scale '||n from generate_series(1,1001)n;insert into academy.date_rosters(academy_id,program_id,local_date,player_id) select '{a}','{p['id']}','2026-11-01',id from academy.players where academy_id='{a}';update academy.date_plans set roster_count=1001 where program_id='{p['id']}'")
  queries={'read':f"public.q6_read_v1('{a}','{p['id']}','2026-11-01')",'review':f"public.q6_review_v1('{a}','{p['id']}','2026-11-01',1,1001,null,'{{}}','{{}}')",'save_rolled_back':f"public.q6_save_v1('{a}','{p['id']}','2026-11-01',1,1001,null,'{{}}','{{}}',gen_random_uuid())"}
  metrics={}
  for name,expression in queries.items():
   action=f"perform {expression};"
   if name=='save_rolled_back':action="begin "+action+" raise exception 'rollback sample' using errcode='PZ001';exception when sqlstate 'PZ001' then null;end;"
   result=json.loads(self.sql("create temporary table measured(ms double precision);do $$declare started timestamptz;begin for i in 1..50 loop started:=clock_timestamp();"+action+" insert into measured values(extract(epoch from clock_timestamp()-started)*1000);end loop;end$$;select json_build_object('samples',count(*),'p95_ms',percentile_cont(0.95) within group(order by ms),'max_ms',max(ms)) from measured",'user_owner'))
   metrics[name]=result;self.assertLess(result['p95_ms'],300 if name=='save_rolled_back' else 150 if name=='review' else 100)
  response=self.planning_read(a,p);self.assertLess(len(response.encode()),24576);self.assertEqual(self.sql(f"select count(*) from academy.planning_operations where academy_id='{a}'"),'1')
  dest=ROOT/'docs/07-handoff/evidence/i3b-local-2026-10-27';dest.mkdir(parents=True,exist_ok=True);(dest/'sql-scale.json').write_text(json.dumps({'status':'passed','scope':'Actual disposable PG17 functions; excludes HTTP/identity/provider/hosted/device cost','roster':1001,'response_bytes':len(response.encode()),'measurements':metrics},indent=2)+'\n')
 def observed_order(self,first,second,second_ok=True):
  holder=subprocess.Popen(self.base,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,bufsize=1);waiter=None
  try:
   holder.stdin.write("\\o /dev/null\nbegin;"+first+";\n\\o\nselect pg_backend_pid();\n");holder.stdin.flush();pid=None;deadline=time.monotonic()+10
   while time.monotonic()<deadline:
    readable,_,_=select.select([holder.stdout],[],[],.1)
    if readable:
     line=holder.stdout.readline().strip()
     if line.isdigit():pid=int(line);break
   self.assertIsNotNone(pid,'First planning/lifecycle transaction did not reach held-lock boundary')
   name='q6_race_'+uuid.uuid4().hex;waiter=subprocess.Popen(self.base,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
   waiter.stdin.write(f"begin;set local application_name='{name}';"+second+";commit;\n");waiter.stdin.close();blocked=False;deadline=time.monotonic()+5
   while time.monotonic()<deadline:
    blocked=self.sql(f"select exists(select from pg_stat_activity where application_name='{name}' and {pid}=any(pg_blocking_pids(pid)))")=='t'
    if blocked:break
    self.assertIsNone(waiter.poll(),'Second transaction ended instead of waiting');time.sleep(.02)
   self.assertTrue(blocked,'Planning/lifecycle or cancellation lock dependency not observed')
   holder.stdin.write('commit;\n\\q\n');holder.stdin.flush();holder.wait(timeout=10);self.assertEqual(holder.returncode,0,holder.stderr.read());waiter.wait(timeout=10);self.assertEqual(waiter.returncode==0,second_ok,waiter.stderr.read())
  finally:
   if holder.poll() is None:holder.kill();holder.wait()
   if waiter is not None and waiter.poll() is None:waiter.kill();waiter.wait()
   for process in [holder,waiter]:
    if process is not None:
     for stream in [process.stdin,process.stdout,process.stderr]:
      if stream is not None and not stream.closed:stream.close()
 def test_planning_09_function_acl_and_small_payload(self):
  self.assertEqual(self.sql("select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='academy' and p.proname like 'q6_%' and has_function_privilege('authenticated',p.oid,'execute')"),'0')
  self.assertEqual(self.sql("select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'q6_%' and (has_function_privilege('anon',p.oid,'execute') or not has_function_privilege('authenticated',p.oid,'execute'))"),'0')
 def test_planning_10_observed_staff_end_both_orders(self):
  for save_first in [True,False]:
   a,b=self.academy();p=self.ready(a);staff,iv=self.staff(a,b)
   save=self.caller('user_owner','/rpc/q6_save_v1')+f"select public.q6_save_v1('{a}','{p['id']}','2026-11-01',0,1,'{staff}','{{}}','{{}}',gen_random_uuid())"
   end=self.caller('user_owner','/rpc/t4_command_v1')+f"select public.t4_command_v1('{a}',gen_random_uuid(),'end','{iv}',null,null,null,null,2,'Synthetic end')"
   self.observed_order(save if save_first else end,end if save_first else save)
   result=json.loads(self.planning_read(a,p));self.assertEqual(result['version'],1 if save_first else 0)
   if save_first:self.assertFalse(result['trainer']['eligible'])
 def test_planning_11_observed_save_cancel_both_orders(self):
  for save_first in [True,False]:
   a,b=self.academy();p=self.ready(a);op=str(uuid.uuid4())
   save=self.caller('user_owner','/rpc/q6_save_v1')+f"select public.q6_save_v1('{a}','{p['id']}','2026-11-01',0,1,null,'{{}}','{{}}','{op}')"
   cancel=self.caller('user_owner','/rpc/q6_operation_v1')+f"select public.q6_operation_v1('{a}','{op}')"
   self.observed_order(save if save_first else cancel,cancel if save_first else save,second_ok=save_first)
   self.assertEqual(json.loads(self.planning_read(a,p))['version'],1 if save_first else 0)
if __name__=='__main__':
 import unittest;unittest.main(defaultTest='PlanningBoundary')
