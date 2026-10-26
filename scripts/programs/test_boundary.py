"""Disposable PG17 program contracts, plus inherited people/M1 boundaries. No hosted access."""
import sys,json,uuid,concurrent.futures,subprocess,time,select
from pathlib import Path
import importlib.util
base=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(base/'onboarding'))
spec=importlib.util.spec_from_file_location('people_boundary',base/'people/test_boundary.py');module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
PeopleBoundary,literal,ROOT=module.PeopleBoundary,module.literal,module.ROOT
class ProgramBoundary(PeopleBoundary):
 extra_authenticated_calls={**PeopleBoundary.extra_authenticated_calls,
 'p5_dates_v1':"p5_dates_v1(gen_random_uuid(),'2026-11-01')",'p5_list_v1':'p5_list_v1(gen_random_uuid())','p5_preview_v1':"p5_preview_v1(gen_random_uuid(),'{}',0,0)",
 'p5_create_v1':"p5_create_v1(gen_random_uuid(),gen_random_uuid(),'{}',0)",
 'p5_read_v1':'p5_read_v1(gen_random_uuid(),gen_random_uuid(),0)',
 'p5_step_v1':"p5_step_v1(gen_random_uuid(),gen_random_uuid(),1,'prepare')",'p5_operation_v1':'p5_operation_v1(gen_random_uuid(),gen_random_uuid())'}
 @classmethod
 def setUpClass(cls):
  super().setUpClass();cls.sql((ROOT/'supabase/migrations/20261026145710_i3a_draft_programs.sql').read_text())
 def definition(self):return {'name':'Synthetic program','from':'2026-11-01','to':'2027-01-31','rules':[{'day':0,'start':'17:00','end':'18:00'},{'day':2,'start':'19:00','end':'20:00'},{'day':4,'start':'18:00','end':'19:00'}]}
 def review(self,a,d,subject='user_owner'):
  receipt=None
  windows=1+( __import__('datetime').date.fromisoformat(d['to'])-__import__('datetime').date.fromisoformat(d['from'])).days//28
  for idx in range(windows):
   response=json.loads(self.sql(f"select public.p5_preview_v1('{a}',{literal(json.dumps(d))}::jsonb,3,{idx},{'null' if receipt is None else literal(json.dumps(receipt))+'::jsonb'})",subject))
   self.assertNotIn('error',response);receipt=response['receipt']
  return receipt
 def command(self,a,definition=None,op=None,subject='user_owner',ok=True):
  d=definition or self.definition();review=self.review(a,d,subject) if ok else None
  return self.sql(f"select public.p5_create_v1('{a}','{op or uuid.uuid4()}',{literal(json.dumps(d))}::jsonb,3,{literal(json.dumps(review))}::jsonb)",subject,ok=ok)
 def step(self,a,p,act='prepare',subject='user_owner',version=None,ok=True):
  return self.sql(f"select public.p5_step_v1('{a}','{p['id']}',{p['version'] if version is None else version},{literal(act)})",subject,ok=ok)
 def read(self,a,p,idx=0,subject='user_owner',ok=True):return self.sql(f"select public.p5_read_v1('{a}','{p['id']}',{idx})",subject,ok=ok)
 def test_program_01_exact_prepare_ready_projection_and_replay(self):
  a,b=self.academy();op=str(uuid.uuid4());p=json.loads(self.command(a,op=op));self.assertEqual(p['total'],40);self.assertEqual(p['windows'],4)
  self.assertEqual(json.loads(self.command(a,op=op))['id'],p['id']);d=self.definition();d['name']='Changed';self.command(a,d,op,ok=False)
  self.assertEqual(json.loads(self.read(a,p))['dates'],[])
  for i in range(4):
   old=p;p=json.loads(self.step(a,p));self.assertEqual(p['completed'],i+1);self.assertEqual(json.loads(self.step(a,old))['version'],p['version']);self.assertEqual(json.loads(self.read(a,p))['dates'],[])
  self.assertEqual(json.loads(self.sql(f"select public.p5_dates_v1('{a}','2026-11-01')",'user_owner'))['items'],[])
  self.assertEqual(p['prepared'],40);p=json.loads(self.step(a,p,'finalize'));self.assertEqual(p['state'],'ready');self.assertEqual(len(json.loads(self.sql(f"select public.p5_dates_v1('{a}','2026-11-01')",'user_owner'))['items']),12)
  rows=[]
  for i in range(4):rows+=json.loads(self.read(a,p,i))['dates']
  self.assertEqual(len(rows),40);self.assertEqual(len(set(r['date'] for r in rows)),40)
  self.assertEqual(next(r['start'] for r in rows if r['date']=='2026-11-03'),'19:00')
  self.assertEqual(len(json.loads(self.sql(f"select public.p5_list_v1('{a}')",'user_owner'))['items']),1)
  self.assertNotIn('Synthetic',self.sql(f"select details from academy.audit_events where action like 'program.%' and academy_id='{a}'"))
 def test_program_02_tenants_roles_revocation_direct_tables(self):
  a,b=self.academy();aa,bb=self.academy('user_other_owner');p=json.loads(self.command(a));op=str(uuid.uuid4())
  for subject in ['user_other_owner','user_platform','user_signup']:
   for q in [f"select public.p5_list_v1('{a}')",f"select public.p5_dates_v1('{a}','2026-11-01')",f"select public.p5_operation_v1('{a}','{op}')"]:self.sql(q,subject,ok=False)
   self.read(a,p,subject=subject,ok=False);self.step(a,p,subject=subject,ok=False);self.command(a,subject=subject,ok=False)
  self.read(aa,p,subject='user_other_owner',ok=False)
  for role in ['manager','trainer','guardian','player']:
   self.sql(f"update academy.memberships set role='{role}' where academy_id='{a}' and role='owner'");self.read(a,p,ok=False);self.step(a,p,ok=False);self.command(a,ok=False)
   self.sql(f"update academy.memberships set role='owner' where academy_id='{a}' and role='{role}'")
  self.sql(f"update academy.memberships set status='suspended' where academy_id='{a}' and role='owner'");self.step(a,p,ok=False);self.read(a,p,ok=False)
  for t in ['training_programs','training_dates','training_operations']:self.sql('select * from academy.'+t,'user_other_owner',ok=False)
 def test_program_03_concurrent_create_and_step(self):
  a,b=self.academy();op=str(uuid.uuid4())
  with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:results=list(pool.map(lambda _:self.command(a,op=op),range(6)))
  self.assertTrue(all(r==results[0] for r in results));p=json.loads(results[0])
  with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:results=list(pool.map(lambda _:self.step(a,p),range(6)))
  self.assertTrue(all(r==results[0] for r in results));current=json.loads(results[0]);self.assertEqual(current['completed'],1);self.assertEqual(current['prepared'],12)
  self.assertEqual(self.sql(f"select count(*) from academy.training_dates where program_id='{p['id']}'"),'12')
  for _ in range(3):current=json.loads(self.step(a,current))
  with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:results=list(pool.map(lambda _:self.step(a,current,'finalize'),range(6)))
  self.assertTrue(all(r==results[0] for r in results));self.assertEqual(json.loads(results[0])['state'],'ready')
  self.assertEqual(self.sql(f"select count(*) from academy.audit_events where action='program.finalize' and operation_id='{p['id']}'"),'1')

 def test_program_04_pause_resume_stale_context_and_no_early_finalize(self):
  a,b=self.academy();p=json.loads(self.command(a));self.step(a,p,'finalize',ok=False)
  p=json.loads(self.step(a,p,'pause'));self.assertEqual(p['state'],'paused');self.step(a,p,ok=False)
  p=json.loads(self.step(a,p,'resume'));p=json.loads(self.step(a,p));self.assertEqual(p['completed'],1)
  self.sql(f"update academy.academies set setup_version=setup_version+1 where id='{a}'")
  self.step(a,p,ok=False);self.command(a,ok=False)
  self.assertEqual(json.loads(self.read(a,p))['dates'],[])
 def test_program_05_gap_fold_and_later_failure_atomicity(self):
  self.assertEqual(self.sql("select academy.p5_instant('2026-11-01 01:30','America/New_York') is null"),'t')
  self.assertEqual(self.sql("select academy.p5_instant('2026-03-08 02:30','America/New_York') is null"),'t')
  self.assertEqual(self.sql("select academy.p5_instant('2026-11-02 17:00','Africa/Cairo')='2026-11-02 15:00Z'::timestamptz"),'t')
  a,b=self.academy();self.sql(f"update academy.academies set timezone='America/New_York' where id='{a}'")
  d={'name':'DST demo','from':'2026-10-01','to':'2026-11-15','rules':[{'day':0,'start':'01:30','end':'02:30'}]}
  first=json.loads(self.sql(f"select public.p5_preview_v1('{a}',{literal(json.dumps(d))}::jsonb,3,0)",'user_owner'))
  last=json.loads(self.sql(f"select public.p5_preview_v1('{a}',{literal(json.dumps(d))}::jsonb,3,1,{literal(json.dumps(first['receipt']))}::jsonb)",'user_owner'));self.assertEqual(last['error'],'invalid_time');self.assertNotIn('receipt',last)
  self.sql(f"select public.p5_create_v1('{a}',gen_random_uuid(),{literal(json.dumps(d))}::jsonb,3,{literal(json.dumps(first['receipt']))}::jsonb)",'user_owner',ok=False)
  self.sql(f"update academy.academies set timezone='Africa/Cairo' where id='{a}'");p=json.loads(self.command(a,d))
  original=json.loads(self.sql("select jsonb_build_object('sql',pg_get_functiondef('academy.p5_window(jsonb,text,integer)'::regprocedure))"))['sql']
  changed=original.replace("begin\n if idx", "begin\n if idx=1 then return jsonb_build_object('error','invalid_time','date','2026-11-01');end if;\n if idx",1);self.assertNotEqual(original,changed);self.sql(changed)
  try:
   p=json.loads(self.step(a,p));self.assertEqual(p['completed'],1);p=json.loads(self.step(a,p));self.assertEqual(p['state'],'failed');self.assertEqual(p['failure_date'],'2026-11-01');self.assertEqual(p['completed'],1)
   self.assertEqual(self.sql(f"select count(*) from academy.training_dates where program_id='{p['id']}'"),str(p['prepared']))
   self.assertEqual(json.loads(self.read(a,p))['dates'],[]);self.step(a,p,'resume',ok=False)
  finally:self.sql(original)
 def test_program_06_input_limits_and_cancel_fence(self):
  a,b=self.academy();op=str(uuid.uuid4());r=json.loads(self.sql(f"select public.p5_operation_v1('{a}','{op}')",'user_owner'));self.assertTrue(r['cancelled']);self.command(a,op=op,ok=False)
  for change in [{'rules':[]},{'from':'2026-02-31'},{'to':'2026-01-01'},{'name':''},{'name':'x'*161},{'actor':'user_platform'},{'rules':[{'day':0,'start':'20:00','end':'19:00'}]},{'rules':[{'day':0,'start':'17:00','end':'18:00'}]*2}]:
   d=self.definition();d.update(change);self.command(a,d,ok=False)
  self.assertEqual(self.sql(f"select count(*) from academy.training_programs where academy_id='{a}'"),'0')
 def test_program_07_rollback_and_metadata(self):
  a,b=self.academy();op=str(uuid.uuid4());review=self.review(a,self.definition());q=f"select public.p5_create_v1('{a}','{op}',{literal(json.dumps(self.definition()))}::jsonb,3,{literal(json.dumps(review))}::jsonb)"
  self.sql('begin;'+self.caller('user_owner','/rpc/p5_create_v1')+q+';rollback;');self.assertEqual(self.sql(f"select count(*) from academy.training_programs where academy_id='{a}'"),'0')
  p=json.loads(self.command(a));q=f"select public.p5_step_v1('{a}','{p['id']}',1,'prepare')"
  self.sql('begin;'+self.caller('user_owner','/rpc/p5_step_v1')+q+';rollback;');self.assertEqual(self.sql(f"select count(*) from academy.training_dates where program_id='{p['id']}'"),'0')
  self.assertEqual(self.sql("select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'p5_%' and p.proconfig @> array['statement_timeout=3s','lock_timeout=2s']"),'7')
 def test_program_08_bounded_directories_and_date_cursor(self):
  a,b=self.academy();d=self.definition();d['rules']=[{'day':i,'start':'17:00','end':'18:00'} for i in range(7)]
  p=json.loads(self.command(a,d))
  for _ in range(p['windows']):p=json.loads(self.step(a,p))
  p=json.loads(self.step(a,p,'finalize'))
  first=json.loads(self.sql(f"select public.p5_dates_v1('{a}','2026-11-01')",'user_owner'));self.assertEqual(len(first['items']),25);self.assertTrue(first['more']);last=first['items'][-1]
  second=json.loads(self.sql(f"select public.p5_dates_v1('{a}','2026-11-01','{last['date']}','{last['program_id']}')",'user_owner'));self.assertEqual(len(second['items']),3);self.assertFalse(second['more'])
  self.assertEqual(len(set(r['date'] for r in first['items']+second['items'])),28)
  later=json.loads(self.sql(f"select public.p5_dates_v1('{a}','2026-12-27')",'user_owner'));self.assertEqual(later['items'][0]['window'],2)
  for i in range(26):self.command(a,{**d,'name':'Synthetic directory '+str(i)})
  first=json.loads(self.sql(f"select public.p5_list_v1('{a}')",'user_owner'));self.assertEqual(len(first['items']),25);self.assertTrue(first['more'])
  second=json.loads(self.sql(f"select public.p5_list_v1('{a}','{first['items'][-1]['id']}')",'user_owner'));self.assertEqual(len(second['items']),2);self.assertFalse(second['more'])
  self.assertEqual(len(set(r['id'] for r in first['items']+second['items'])),27)
 def test_program_09_injected_chunk_failure_rolls_back_every_row(self):
  a,b=self.academy();p=json.loads(self.command(a))
  self.sql("create function academy.test_p5_reject() returns trigger language plpgsql as $$begin if new.local_date='2026-11-03' then raise exception 'Synthetic chunk failure' using errcode='40001';end if;return new;end$$;create trigger test_p5_reject before insert on academy.training_dates for each row execute function academy.test_p5_reject();")
  try:
   self.step(a,p,ok=False)
   self.assertEqual(self.sql(f"select count(*) from academy.training_dates where program_id='{p['id']}'"),'0')
   current=json.loads(self.read(a,p))['program'];self.assertEqual(current['version'],1);self.assertEqual(current['completed'],0);self.assertEqual(current['prepared'],0)
  finally:self.sql('drop trigger test_p5_reject on academy.training_dates;drop function academy.test_p5_reject();')
  current=json.loads(self.step(a,p));self.assertEqual(current['completed'],1);self.assertEqual(current['prepared'],12)
 def test_people_09_local_skewed_scale_and_function_limits(self):
  # Preserve the earlier people receipt; retain this run under the new slice.
  target=ROOT/'docs/07-handoff/evidence/i2a-local-2026-10-24/sql-scale.json';original=target.read_bytes()
  try:
   super().test_people_09_local_skewed_scale_and_function_limits()
   dest=ROOT/'docs/07-handoff/evidence/i3a-local-2026-10-26';dest.mkdir(parents=True,exist_ok=True);(dest/'inherited-people-scale.json').write_bytes(target.read_bytes())
  finally:target.write_bytes(original)
 def test_program_10_prepare_revocation_both_lock_orders(self):
     # Hold a real transaction open, not a timed sleep. Observe the second
     # connection blocked by this exact backend before releasing the first.
     for first_action in ['save', 'suspend']:
         with self.subTest(first_action=first_action):
             a,b=self.academy()
             p=json.loads(self.command(a))
             save=f"select public.p5_step_v1('{a}','{p['id']}',1,'prepare')"
             suspend = f"update academy.memberships set status='suspended' where academy_id='{a}' and role='owner'"
             caller = self.caller("user_owner","/rpc/p5_step_v1")
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
                 name = 'p5_race_' + uuid.uuid4().hex
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
                 self.assertEqual(self.sql(f"select next_window from academy.training_programs where id='{p['id']}'"), expected)
                 self.assertEqual(self.sql(f"select count(*) from academy.branches where academy_id='{a}'"), '1')
                 self.assertEqual(self.sql(f"select status from academy.memberships where academy_id='{a}' and role='owner'"), 'suspended')
                 self.sql(f"select public.m1_setup_v1('{a}')", 'user_owner', ok=False)
                 # Previously successful receipts must not bypass current authority.
                 self.sql(save, 'user_owner', ok=False)
                 self.command(a,ok=False)
                 self.assertEqual(self.sql(f"select next_window from academy.training_programs where id='{p['id']}'"), expected)
             finally:
                 for session in [holder, waiter]:
                     if session is not None and session.poll() is None:
                         session.kill()
                         session.communicate(timeout=5)

 def test_program_11_local_function_budgets_at_skewed_scale(self):
  a,b=self.academy();d=self.definition();d['rules']=[{'day':i,'start':'17:00','end':'18:00'} for i in range(7)];p=json.loads(self.command(a,d))
  for _ in range(p['windows']):p=json.loads(self.step(a,p))
  p=json.loads(self.step(a,p,'finalize'));work=json.loads(self.command(a,d))
  self.sql(f"insert into academy.training_programs(id,academy_id,branch_id,sport_id,context_version,timezone,definition,starts_on,ends_on,expected_count,window_count,created_by,review_root,prepared_root) select gen_random_uuid(),academy_id,branch_id,sport_id,context_version,timezone,definition,starts_on,ends_on,expected_count,window_count,created_by,review_root,academy.p5_seed(academy_id,definition,jsonb_build_object('branch_id',branch_id,'sport_id',sport_id,'timezone',timezone,'version',context_version)) from academy.training_programs cross join generate_series(1,1000) where id='{p['id']}';analyze academy.training_programs;analyze academy.training_dates;")
  calls=[f"select public.p5_list_v1('{a}')",f"select public.p5_preview_v1('{a}',{literal(json.dumps(d))}::jsonb,3,0)",f"select public.p5_read_v1('{a}','{p['id']}',0)",f"select public.p5_dates_v1('{a}','2026-11-01')",f"select public.p5_step_v1('{a}','{work['id']}',1,'prepare')"]
  measurements=[]
  for q in calls:
   path='/rpc/'+q.split('public.')[1].split('(')[0];result=json.loads(subprocess.run(self.base,input='begin;'+self.caller('user_owner',path)+q+';rollback;',text=True,capture_output=True,check=True).stdout);size=len(json.dumps(result).encode());size_limit=32768 if 'list_v1' in q or 'dates_v1' in q else 24576;self.assertLess(size,size_limit);samples=[]
   for _ in range(50):
    path='/rpc/'+q.split('public.')[1].split('(')[0];raw=subprocess.run(self.base,input='begin;'+self.caller('user_owner',path)+'explain (analyze,format json) '+q+';rollback;',text=True,capture_output=True,check=True);samples.append(json.loads(raw.stdout)[0]['Execution Time'])
   p95=sorted(samples)[47];limit=300 if 'step_v1' in q else 150 if 'preview_v1' in q else 100;self.assertLess(p95,limit);measurements.append({'operation':path,'observations':50,'serverExecutionP95Ms':p95,'targetP95Ms':limit,'responseBytes':size,'responseBudgetBytes':size_limit,'writeRolledBack':'step_v1' in q})
  dest=ROOT/'docs/07-handoff/evidence/i3a-local-2026-10-26';dest.mkdir(parents=True,exist_ok=True);(dest/'sql-scale.json').write_text(json.dumps({'status':'passed','scope':'Disposable PG17 function execution only; excludes HTTP, Clerk, limiter, cold starts, devices and hosted cost','programHeaders':1002,'readyDates':92,'targetServerExecutionP95Ms':150,'responseBudgetBytes':32768,'measurements':measurements},indent=2)+'\n')
 def test_program_12_review_receipts_reject_skip_tamper_and_changed_generation(self):
  a,b=self.academy();d=self.definition();raw=literal(json.dumps(d));op=str(uuid.uuid4())
  self.sql(f"select public.p5_preview_v1('{a}',{raw}::jsonb,3,1)",'user_owner',ok=False)
  first=json.loads(self.sql(f"select public.p5_preview_v1('{a}',{raw}::jsonb,3,0)",'user_owner'))['receipt']
  alternate=json.loads(self.sql('begin;'+self.caller('user_owner','/rpc/p5_preview_v1')+"set local timezone='America/Los_Angeles';"+f"select public.p5_preview_v1('{a}',{raw}::jsonb,3,0);rollback;"))['receipt'];self.assertEqual(first,alternate)

  self.sql(f"select public.p5_create_v1('{a}','{op}',{raw}::jsonb,3,{literal(json.dumps(first))}::jsonb)",'user_owner',ok=False)
  forged={**first,'through':3};self.sql(f"select public.p5_create_v1('{a}','{op}',{raw}::jsonb,3,{literal(json.dumps(forged))}::jsonb)",'user_owner',ok=False)
  self.sql("select academy.p5_review_signature('user_owner',repeat('a',64),3,repeat('b',64))",'user_owner',ok=False)
  receipt=self.review(a,d);other={**d,'name':'Changed after review'}
  self.sql(f"select public.p5_create_v1('{a}','{op}',{literal(json.dumps(other))}::jsonb,3,{literal(json.dumps(receipt))}::jsonb)",'user_owner',ok=False)
  aa,bb=self.academy('user_other_owner');self.sql(f"select public.p5_create_v1('{aa}','{op}',{raw}::jsonb,3,{literal(json.dumps(receipt))}::jsonb)",'user_other_owner',ok=False)
  self.assertEqual(self.sql(f"select count(*) from academy.training_programs where academy_id='{a}'"),'0')
  p=json.loads(self.command(a,d))
  # Model changed authoritative timezone rules after preview, without trusting caller UTC.
  original=json.loads(self.sql("select jsonb_build_object('sql',pg_get_functiondef('academy.p5_window(jsonb,text,integer)'::regprocedure))"))['sql']
  changed=original.replace(" if st is null", " st:=st+interval '1 hour';en:=en+interval '1 hour';\n if st is null",1);self.assertNotEqual(original,changed);self.sql(changed)
  try:
   for _ in range(p['windows']):p=json.loads(self.step(a,p))
   p=json.loads(self.step(a,p,'finalize'));self.assertEqual(p['state'],'failed');self.assertEqual(p['failure'],'preview_changed');self.assertEqual(json.loads(self.read(a,p))['dates'],[]);self.step(a,p,'resume',ok=False)
   self.assertEqual(json.loads(self.sql(f"select public.p5_dates_v1('{a}','2026-11-01')",'user_owner'))['items'],[])
  finally:self.sql(original)
 def test_program_13_create_cancel_both_observed_lock_orders(self):
  for create_first in [True,False]:
   with self.subTest(create_first=create_first):
    a,b=self.academy();d=self.definition();op=str(uuid.uuid4());review=self.review(a,d)
    create=self.caller('user_owner','/rpc/p5_create_v1')+f"select public.p5_create_v1('{a}','{op}',{literal(json.dumps(d))}::jsonb,3,{literal(json.dumps(review))}::jsonb)"
    cancel=self.caller('user_owner','/rpc/p5_operation_v1')+f"select public.p5_operation_v1('{a}','{op}')"
    first,second=(create,cancel) if create_first else (cancel,create);holder=subprocess.Popen(self.base,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,bufsize=1);waiter=None
    try:
     holder.stdin.write("\\o /dev/null\nbegin;"+first+";\n\\o\nselect pg_backend_pid();\n");holder.stdin.flush();pid=None;deadline=time.monotonic()+10
     while time.monotonic()<deadline:
      readable,_,_=select.select([holder.stdout],[],[],.1)
      if readable:
       line=holder.stdout.readline().strip()
       if line.isdigit():pid=int(line);break
     self.assertIsNotNone(pid,'First operation did not reach the held lock')
     name='p5_cancel_'+uuid.uuid4().hex;waiter=subprocess.Popen(self.base+['--set=VERBOSITY=verbose'],stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
     waiter.stdin.write(f"begin;set local application_name='{name}';"+second+";commit;\n");waiter.stdin.flush();blocked=False;deadline=time.monotonic()+5
     while time.monotonic()<deadline:
      blocked=self.sql(f"select exists(select from pg_stat_activity where application_name='{name}' and {pid}=any(pg_blocking_pids(pid)))")=='t'
      if blocked:break
      self.assertIsNone(waiter.poll(),'Second operation did not wait');time.sleep(.02)
     self.assertTrue(blocked,'Expected operation advisory-lock dependency')
     holder.stdin.write('commit;\n');holder.stdin.flush();_,error=holder.communicate(timeout=10);self.assertEqual(holder.returncode,0,error);_,error=waiter.communicate(timeout=10)
     if create_first:self.assertEqual(waiter.returncode,0,error)
     else:self.assertNotEqual(waiter.returncode,0);self.assertIn('23505',error)
     self.assertEqual(self.sql(f"select count(*) from academy.training_programs where academy_id='{a}'"),'1' if create_first else '0')
     self.assertEqual(self.sql(f"select cancelled from academy.training_operations where actor='user_owner' and id='{op}'"),'f' if create_first else 't')
    finally:
     for process in [holder,waiter]:
      if process is not None and process.poll() is None:process.kill();process.communicate(timeout=5)
if __name__=='__main__':
 import unittest;result=unittest.TextTestRunner(verbosity=2).run(unittest.defaultTestLoader.loadTestsFromTestCase(ProgramBoundary));sys.exit(not result.wasSuccessful())
