"""Real disposable PostgreSQL 17 tests; never uses a hosted connection."""
import sys,json,uuid,concurrent.futures,time,subprocess,select
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'onboarding'))
from test_boundary import Boundary,literal,ROOT
class PeopleBoundary(Boundary):
 extra_authenticated_calls={
  'i2_people_v1':"i2_people_v1(gen_random_uuid())",
  'i2_candidates_v1':"i2_candidates_v1(gen_random_uuid(),'Demo')",
  'i2_profile_v1':"i2_profile_v1(gen_random_uuid(),gen_random_uuid())",
  'i2_register_v1':"i2_register_v1(gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),'Demo','',0,false)",
  'i2_operation_v1':"i2_operation_v1(gen_random_uuid(),gen_random_uuid())"}

 @classmethod
 def setUpClass(cls):
  super().setUpClass()
  cls.sql((ROOT/'supabase/migrations/20261024095215_i2a_synthetic_player_registration.sql').read_text())
 def academy(self,subject='user_owner'):
  r,_,iv,tk,_=self.create();a=r['academy_id'];self.accept(iv,tk,subject=subject)
  self.save(a,0,'branch',{'name':'Synthetic branch','timezone':'Africa/Cairo'},subject=subject)
  self.save(a,1,'sport',{'label_en':'Synthetic Sport','label_ar':'رياضة'},subject=subject)
  self.save(a,2,'complete',{},subject=subject)
  b=json.loads(self.sql(f"select public.i2_people_v1('{a}')",subject))['branch_id'];return a,b
 def candidates(self,a,name='Alex Demo',subject='user_owner',after=None):
  return json.loads(self.sql(f"select public.i2_candidates_v1('{a}',{literal(name)},{literal(after)+'::uuid' if after else 'null'})",subject))
 def register(self,a,b,name='Alex Demo',revision=0,different=False,op=None,contact='contact@example.invalid',subject='user_owner',ok=True):
  op=op or str(uuid.uuid4())
  q=f"select public.i2_register_v1('{a}','{b}','{op}',{literal(name)},{literal(contact)},{revision},{'true' if different else 'false'})"
  return self.sql(q,subject,ok=ok)
 def test_people_01_persist_projection_replay_and_redacted_audit(self):
  a,b=self.academy();op=str(uuid.uuid4());r=json.loads(self.register(a,b,op=op))
  self.assertEqual(json.loads(self.register(a,b,op=op)),r)
  self.register(a,b,op=op,name='Changed',ok=False)
  profile=json.loads(self.sql(f"select public.i2_profile_v1('{a}','{r['player_id']}')",'user_owner'))
  self.assertEqual(profile['contact_email'],'contact@example.invalid')
  directory=json.loads(self.sql(f"select public.i2_people_v1('{a}')",'user_owner'));self.assertEqual(len(directory['items']),1)
  self.assertNotIn('contact',json.dumps(directory));self.assertNotIn('contact',json.dumps(self.candidates(a)))
  self.assertEqual(self.sql(f"select count(*) from academy.players where academy_id='{a}'"),'1')
  self.assertEqual(self.sql(f"select count(*) from academy.audit_events where operation_id='{op}'"),'1')
  self.assertNotIn('Alex',self.sql(f"select row_to_json(o) from academy.people_operations o where id='{op}'"))
  self.assertFalse(json.loads(self.sql(f"select public.m1_operation_v1('{op}')",'user_owner'))['found'])
  for table in ['players','people_operations','player_name_revisions']:self.sql('select * from academy.'+table,'user_owner',ok=False)
 def test_people_02_isolation_roles_revocation_and_receipt(self):
  a,b=self.academy();aa,bb=self.academy('user_other_owner');op=str(uuid.uuid4());r=json.loads(self.register(a,b,op=op))
  for subject in ['user_other_owner','user_platform','user_signup']:
   for q in [f"select public.i2_people_v1('{a}')",f"select public.i2_candidates_v1('{a}','Alex Demo')",f"select public.i2_profile_v1('{a}','{r['player_id']}')",f"select public.i2_operation_v1('{a}','{op}')"]:self.sql(q,subject,ok=False)
   self.register(a,b,subject=subject,ok=False)
  self.register(a,bb,ok=False)
  self.sql(f"select public.i2_profile_v1('{aa}','{r['player_id']}')",'user_other_owner',ok=False)
  for role in ['manager','trainer','guardian','player']:
   self.sql(f"update academy.memberships set role='{role}' where academy_id='{a}' and role='owner'")
   self.sql(f"select public.i2_people_v1('{a}')",'user_owner',ok=False);self.register(a,b,ok=False)
   self.sql(f"update academy.memberships set role='owner' where academy_id='{a}' and role='{role}'")
  self.sql(f"update academy.memberships set status='suspended' where academy_id='{a}' and role='owner'")
  self.sql(f"select public.i2_operation_v1('{a}','{op}')",'user_owner',ok=False)
  self.register(a,b,op=op,ok=False)
 def test_people_03_simultaneous_name_and_exact_retry(self):
  a,b=self.academy();ops=[str(uuid.uuid4()) for _ in range(8)]
  def create(op):
   try:return json.loads(self.register(a,b,op=op))
   except AssertionError as e:self.assertIn('Review required',str(e));return None
  with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:r=list(pool.map(create,ops))
  self.assertEqual(sum(x is not None for x in r),1)
  self.assertEqual(self.candidates(a)['revision'],1)
  self.register(a,b,revision=1,ok=False)
  op=str(uuid.uuid4())
  with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:r=list(pool.map(lambda _:self.register(a,b,revision=1,different=True,op=op),range(8)))
  self.assertTrue(all(x==r[0] for x in r));self.assertEqual(self.sql(f"select count(*) from academy.players where academy_id='{a}'"),'2')
 def test_people_04_unknown_result_and_cancel_fence(self):
  a,b=self.academy();op=str(uuid.uuid4());result=json.loads(self.register(a,b,op=op))
  self.assertEqual(json.loads(self.sql(f"select public.i2_operation_v1('{a}','{op}')",'user_owner')),result)
  empty=str(uuid.uuid4());self.assertTrue(json.loads(self.sql(f"select public.i2_operation_v1('{a}','{empty}')",'user_owner'))['cancelled'])
  self.register(a,b,name='Delayed',op=empty,ok=False)
  self.assertEqual(self.sql(f"select count(*) from academy.players where academy_id='{a}'"),'1')
 def test_people_05_pagination_normalization_and_stale_review(self):
  a,b=self.academy()
  for revision in range(28):self.register(a,b,name='  Ａlex   Demo ',revision=revision,different=revision>0)
  c=self.candidates(a,'alex demo');self.assertEqual(len(c['items']),25);self.assertTrue(c['more']);self.assertEqual(c['revision'],28)
  rest=self.candidates(a,'ALEX DEMO',after=c['items'][-1]['id']);self.assertEqual(len(rest['items']),3);self.assertFalse(rest['more'])
  self.register(a,b,revision=27,different=True,ok=False)
  page=json.loads(self.sql(f"select public.i2_people_v1('{a}',null,'al')",'user_owner'));self.assertTrue(page['more']);self.assertEqual(len(page['items']),25)
  self.sql(f"select public.i2_people_v1('{a}',null,'a')",'user_owner',ok=False)
 def test_people_06_atomic_rollback_validation_and_missing_setup(self):
  a,b=self.academy()
  for contact in ['real@example.org','a,b@example.invalid','x'*255+'@example.invalid']:self.register(a,b,contact=contact,ok=False)
  for name in ['', ' '*5,'x'*161]:self.register(a,b,name=name,ok=False)
  op=str(uuid.uuid4());q=f"select public.i2_register_v1('{a}','{b}','{op}','Abort','',0,false)"
  self.sql('begin;'+self.caller('user_owner','/rpc/i2_register_v1')+q+';rollback;')
  self.assertEqual(self.sql(f"select count(*) from academy.players where academy_id='{a}'"),'0')
  self.sql(f"update academy.academies set setup_complete=false where id='{a}'")
  self.sql(f"select public.i2_people_v1('{a}')",'user_owner',ok=False)
 def test_people_07_missing_forged_gateway_and_acl(self):
  a,b=self.academy()
  for func,args in [('i2_people_v1',f"'{a}'"),('i2_candidates_v1',f"'{a}','Name'"),('i2_profile_v1',f"'{a}','{uuid.uuid4()}'"),('i2_operation_v1',f"'{a}','{uuid.uuid4()}'")]:
   self.sql('begin;'+self.caller('user_owner','/rpc/'+func,delta=-90)+f'select public.{func}({args});commit;',ok=False)
   self.sql('begin;'+self.caller('user_owner','/rpc/'+func)+"set local request.headers='{}';"+f'select public.{func}({args});commit;',ok=False)
  self.assertEqual(self.sql("select bool_and(c.relrowsecurity) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='academy' and c.relkind='r'"),'t')
 def test_people_08_write_revocation_both_lock_orders(self):
     # Hold a real transaction open, not a timed sleep. Observe the second
     # connection blocked by this exact backend before releasing the first.
     for first_action in ['save', 'suspend']:
         with self.subTest(first_action=first_action):
             a,b=self.academy()
             op=str(uuid.uuid4())
             save=f"select public.i2_register_v1('{a}','{b}','{op}','Race Demo','',0,false)"
             suspend = f"update academy.memberships set status='suspended' where academy_id='{a}' and role='owner'"
             caller = self.caller("user_owner","/rpc/i2_register_v1")
             holder = subprocess.Popen(self.base, stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                                       stderr=subprocess.PIPE, text=True, bufsize=1)
             waiter = None
             try:
                 first = caller + save if first_action == 'save' else suspend
                 holder.stdin.write("\\o /dev/null\nbegin;set local statement_timeout='10s';" + first + ";\n\\o\nselect pg_backend_pid();\n")
                 holder.stdin.flush()
                 # Suppress the first result so only the held backend PID is read.
                 deadline = time.monotonic() + 10
                 pid = None
                 while time.monotonic() < deadline:
                     ready, _, _ = select.select([holder.stdout], [], [], 0.1)
                     if ready:
                         line = holder.stdout.readline().strip()
                         if line.isdigit():
                             pid = int(line)
                             break
                 self.assertIsNotNone(pid, 'First transaction did not reach its held-lock boundary')
                 name = 'i2_race_' + uuid.uuid4().hex
                 second = suspend if first_action == 'save' else caller + save
                 waiter = subprocess.Popen(self.base + ['--set=VERBOSITY=verbose'], stdin=subprocess.PIPE,
                                           stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
                 waiter.stdin.write(f"begin;set local statement_timeout='10s';set local application_name='{name}';" + second + ";commit;\n")
                 waiter.stdin.flush()
                 blocked = False
                 deadline = time.monotonic() + 5
                 while time.monotonic() < deadline:
                     blocked = self.sql(f"select exists(select from pg_stat_activity where application_name='{name}' and {pid}=any(pg_blocking_pids(pid)))") == 't'
                     if blocked:
                         break
                     self.assertIsNone(waiter.poll(), 'Second transaction ended instead of waiting')
                     time.sleep(0.02)
                 self.assertTrue(blocked, 'Expected membership-row lock dependency was not observed')
                 holder.stdin.write('commit;\n')
                 holder.stdin.flush()
                 _, first_error = holder.communicate(timeout=10)
                 self.assertEqual(holder.returncode, 0, first_error)
                 _, second_error = waiter.communicate(timeout=10)
                 if first_action == 'save':
                     self.assertEqual(waiter.returncode, 0, second_error)
                     expected = '1'
                 else:
                     self.assertNotEqual(waiter.returncode, 0)
                     self.assertIn('42501', second_error)
                     self.assertIn('Access denied', second_error)
                     expected = '0'
                 self.assertEqual(self.sql(f"select count(*) from academy.players where academy_id='{a}'"), expected)
                 self.assertEqual(self.sql(f"select count(*) from academy.branches where academy_id='{a}'"), '1')
                 self.assertEqual(self.sql(f"select count(*) from academy.people_operations where id='{op}'"), expected)
                 self.assertEqual(self.sql(f"select count(*) from academy.audit_events where operation_id='{op}'"), expected)
                 self.assertEqual(self.sql(f"select status from academy.memberships where academy_id='{a}' and role='owner'"), 'suspended')
                 self.sql(f"select public.m1_setup_v1('{a}')", 'user_owner', ok=False)
                 # Previously successful receipts must not bypass current authority.
                 self.sql(save, 'user_owner', ok=False)
                 self.register(a,b,name='Denied after revoke',ok=False)
                 self.assertEqual(self.sql(f"select count(*) from academy.people_operations where academy_id='{a}'"), expected)
             finally:
                 for session in [holder, waiter]:
                     if session is not None and session.poll() is None:
                         session.kill()
                         session.communicate(timeout=5)


 def test_people_09_local_skewed_scale_and_function_limits(self):
  a,b=self.academy()
  self.sql(f"insert into academy.players(academy_id,branch_id,display_name,normalized_name) select '{a}','{b}',case when x<=800 then 'Common Demo' else 'Unique Demo '||x end,case when x<=800 then 'common demo' else 'unique demo '||x end from generate_series(1,1000) x;insert into academy.player_name_revisions select academy_id,normalized_name,count(*) from academy.players where academy_id='{a}' group by academy_id,normalized_name;analyze academy.players;")
  calls=[f"select public.i2_people_v1('{a}')",f"select public.i2_people_v1('{a}',null,'common')",f"select public.i2_candidates_v1('{a}','Common Demo')"]
  metrics=[]
  for q in calls:
   result=json.loads(self.sql(q,'user_owner'));self.assertEqual(len(result['items']),25);self.assertTrue(result['more']);self.assertLess(len(json.dumps(result).encode()),32768)
   samples=[]
   for _ in range(50):
    path='/rpc/'+q.split('public.')[1].split('(')[0];raw=subprocess.run(self.base,input='begin;'+self.caller('user_owner',path)+'explain (analyze,format json) '+q+';commit;',text=True,capture_output=True,check=True);plan=json.loads(raw.stdout);samples.append(plan[0]['Execution Time'])
   metrics.append({'operation':q.split('public.')[1].split('(')[0],'observations':50,'serverExecutionP95Ms':sorted(samples)[47],'responseBytes':len(json.dumps(result).encode())})
  meta=json.loads(self.sql("select json_agg(json_build_object('name',p.proname,'limits',p.proconfig)) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'i2_%'"))
  self.assertEqual(len(meta),5)
  for row in meta:self.assertTrue(all(x in row['limits'] for x in ['search_path=\"\"','statement_timeout=3s','lock_timeout=2s']))
  dest=ROOT/'docs/07-handoff/evidence/i2a-local-2026-10-24';dest.mkdir(parents=True,exist_ok=True)
  (dest/'sql-scale.json').write_text(json.dumps({'scope':'Disposable local PG17 function execution only; excludes HTTP, identity, limiter, cold starts and physical devices','players':1000,'sameNamePlayers':800,'measurements':metrics},indent=2)+'\n')

if __name__=='__main__':
 import unittest;result=unittest.TextTestRunner(verbosity=2).run(unittest.defaultTestLoader.loadTestsFromTestCase(PeopleBoundary));sys.exit(not result.wasSuccessful())
