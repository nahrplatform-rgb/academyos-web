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
  cls.sql((ROOT/'supabase/migrations/20261024100827_i2a_synthetic_player_registration.sql').read_text())
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

class AlternateNameBoundary(PeopleBoundary):
 def test_player_name_correction(self):
  academy,branch=self.academy()
  self.academy('user_other_owner')
  first=json.loads(self.register(academy,branch,'Original Fixture'))['player_id']
  match=json.loads(self.register(academy,branch,'Matching Fixture'))['player_id']
  for suffix in ('player_alternate_name','player_academy_member_number','player_private_profile_details','player_private_photo','player_name_correction'):
   migration,=ROOT.glob(f'supabase/migrations/*_{suffix}.sql')
   self.sql('begin;'+migration.read_text()+'\ncommit;')
  def profile():
   return json.loads(self.sql(f"select public.i2_profile_v1('{academy}','{first}')",'user_owner'))
  def correct(name='Matching Fixture',alias='اسم تجريبي',version=1,revision=1,different=True,op=None,
              subject='user_owner',role='authenticated',ok=True):
   q=(f"select public.i2_correct_player_names_v1('{academy}','{first}','{op or uuid.uuid4()}',{version},"
      f"{literal(name)},{literal(alias)},{revision},{str(different).lower()})")
   output=self.sql(q,subject,role=role,ok=ok)
   return json.loads(output) if ok else None
  starting=profile()
  operation=str(uuid.uuid4())
  self.assertEqual(self.candidates(academy,'Matching Fixture')['items'][0]['id'],match)
  correct(revision=0,ok=False)
  correct(different=False,ok=False)
  correct(subject='user_other_owner',ok=False)
  correct(role='anon',ok=False)
  self.assertEqual(profile(),starting)
  receipt=correct(op=operation)
  self.assertEqual(receipt,{'player_id':first,'name_version':2})
  self.assertEqual(correct(op=operation),receipt)
  self.assertEqual(json.loads(self.sql(f"select public.i2_operation_v1('{academy}','{operation}')",'user_owner')),receipt)
  correct(op=operation,alias='Different payload',ok=False)
  correct(revision=2,ok=False)
  updated=profile()
  self.assertEqual(updated,{**starting,'display_name':'Matching Fixture','alternate_name':'اسم تجريبي','version':2})
  def search(query):
   page=json.loads(self.sql(f"select public.i2_people_v1('{academy}',null,{literal(query)})",'user_owner'))
   return {row['id'] for row in page['items']}
  self.assertEqual(search('اسم تجريبي'),{first})
  self.assertEqual(search('Matching Fixture'),{first,match})
  self.assertEqual(search('Original Fixture'),set())
  self.assertEqual(self.sql(f"select count(*) from academy.audit_events where operation_id='{operation}'"),'1')
  self.assertNotIn('Matching Fixture',self.sql(f"select details from academy.audit_events where operation_id='{operation}'"))
  old=self.candidates(academy,'Original Fixture')
  self.assertEqual(old['items'],[])
  self.assertGreater(old['revision'],0)
  self.register(academy,branch,'Original Fixture',revision=old['revision'])
  cleared=correct(alias='',version=2,revision=2)
  self.assertEqual(cleared,{'player_id':first,'name_version':3})
  self.assertNotIn('alternate_name',profile())
  self.assertEqual(profile()['academy_member_number'],starting['academy_member_number'])

 def test_private_profile_details(self):
  a,b=self.academy()
  foreign,branch=self.academy('user_other_owner')
  first=json.loads(self.register(a,b,name='First Fixture'))['player_id']
  second=json.loads(self.register(a,b,name='Second Fixture'))['player_id']
  third=json.loads(self.register(foreign,branch,name='Other Fixture',subject='user_other_owner'))['player_id']
  for suffix in ('player_alternate_name','player_academy_member_number','player_private_profile_details','player_private_photo'):
   migration,=ROOT.glob(f'supabase/migrations/*_{suffix}.sql')
   self.sql('begin;'+migration.read_text()+'\ncommit;')
  def read(academy,player,reveal=False,subject='user_owner',ok=True):
   output=self.sql(f"select public.i2_private_profile_v1('{academy}','{player}',{str(reveal).lower()})",subject,ok=ok)
   return json.loads(output) if ok else None
  def save(academy,player,version,changes,op=None,subject='user_owner',ok=True):
   q=f"select public.i2_save_private_profile_v1('{academy}','{player}','{op or uuid.uuid4()}',{version},{literal(json.dumps(changes))}::jsonb)"
   output=self.sql(q,subject,ok=ok)
   return json.loads(output) if ok else None
  operation=str(uuid.uuid4())
  changes={'legacyId':'  00Ref  ','schoolName':'Fixture School','address':'Fixture Address',
           'medicalNotes':'Fixture Note','nationalId':'000031'}
  self.assertEqual(read(a,first)['version'],0)
  receipt=save(a,first,0,changes,operation)
  self.assertEqual(save(a,first,0,changes,operation),receipt)
  self.assertEqual(json.loads(self.sql(f"select public.i2_operation_v1('{a}','{operation}')",'user_owner')),receipt)
  masked=read(a,first)
  def lookup(kind,reference,subject='user_owner',ok=True):
   response=self.sql(f"select public.i2_find_member_v1('{a}',{literal(kind)},{literal(reference)})",subject,ok=ok)
   return json.loads(response)['player_id'] if ok else None
  self.assertEqual(lookup('existing','  00ref '),first)
  lookup('existing','00ref','user_other_owner',ok=False)
  save(a,second,0,{'legacyId':'1'})
  self.assertEqual(lookup('existing','1'),second)
  generated=self.sql(f"select academy_member_number from academy.players where id='{first}'")
  self.assertEqual(lookup('generated',generated),first)
  self.assertIsNone(lookup('existing','missing'))
  lookup('generated','9999999999999999999',ok=False)
  self.assertEqual(masked['legacyId'],'00Ref')
  self.assertEqual(masked['medicalNotes'],'Fixture Note')
  self.assertTrue(masked['nationalIdPresent'])
  self.assertNotIn('nationalId',masked)
  self.assertEqual(read(a,first,True)['nationalId'],'000031')
  read(a,first,True,'user_other_owner',ok=False)
  save(a,first,1,{'nationalId':None},subject='user_other_owner',ok=False)
  save(a,second,1,{'legacyId':'00ref','address':'Must not write'},ok=False)
  self.assertEqual(read(a,second)['version'],1)
  self.assertIsNone(read(a,second)['address'])
  save(foreign,third,0,{'legacyId':'00ref'},subject='user_other_owner')
  save(a,first,0,{'nationalId':None},ok=False)
  save(a,first,1,{'unexpected':'Fixture'},ok=False)
  direct=self.sql("select * from academy.player_private_details",'user_owner',ok=False)
  self.assertIsNotNone(direct)
  self.assertNotIn('Fixture Note', self.sql(f"select details from academy.audit_events where operation_id='{operation}'"))
  original_profile=json.loads(self.sql(f"select public.i2_profile_v1('{a}','{first}')",'user_owner'))
  self.assertFalse(set(changes)&original_profile.keys())
  save(a,first,1,{'nationalId':None,'address':None})
  self.assertFalse(read(a,first)['nationalIdPresent'])
  self.assertEqual(read(a,first)['schoolName'],'Fixture School')
  def photo_read(subject='user_owner',ok=True):
   raw=self.sql(f"select public.i2_private_photo_v1('{a}','{first}')",subject,ok=ok)
   return json.loads(raw) if ok else None
  photo_op=str(uuid.uuid4())
  def photo_save(version,image,op=None,subject='user_owner',ok=True):
   q=f"select public.i2_save_private_photo_v1('{a}','{first}','{op or uuid.uuid4()}',{version},{literal(image) if image is not None else 'null'})"
   raw=self.sql(q,subject,ok=ok)
   return json.loads(raw) if ok else None
  self.assertEqual(photo_read(),{'version':0,'image':None})
  photo_read('user_other_owner',ok=False)
  photo_save(0,'/9j/AA==',subject='user_other_owner',ok=False)
  photo_save(0,'bm90IGFuIGltYWdl',ok=False)
  receipt=photo_save(0,'/9j/AA==',photo_op)
  self.assertEqual(photo_save(0,'/9j/AA==',photo_op),receipt)
  self.assertEqual(json.loads(self.sql(f"select public.i2_operation_v1('{a}','{photo_op}')",'user_owner')),receipt)
  photo_save(0,None,ok=False)
  self.assertEqual(photo_read(),{'version':1,'image':'/9j/AA=='})
  photo_save(1,'/9j/AQ==')
  self.assertEqual(photo_read(),{'version':2,'image':'/9j/AQ=='})
  photo_save(2,None)
  self.assertEqual(photo_read(),{'version':3,'image':None})
  self.sql("select * from academy.player_private_photos",'user_owner',ok=False)
  self.assertNotIn('/9j/',self.sql(f"select details from academy.audit_events where operation_id='{photo_op}'"))

 def test_alternate_name(self):
  a,b=self.academy()
  legacy_op=str(uuid.uuid4())
  legacy=json.loads(self.register(a,b,name='Legacy Demo',op=legacy_op))
  migration,=ROOT.glob('supabase/migrations/*_player_alternate_name.sql')
  self.sql(migration.read_text())
  self.assertEqual(json.loads(self.register(a,b,name='Legacy Demo',op=legacy_op)),legacy)

  display='ليلى عادل'
  alternate='Layla Adel'
  op=str(uuid.uuid4())
  def create(alias,subject='user_owner',operation=op,ok=True):
   sql=f"select public.i2_register_v2('{a}','{b}','{operation}',{literal(display)},'',0,false,{literal(alias)})"
   return self.sql(sql,subject,ok=ok)

  create('x'*161,operation=str(uuid.uuid4()),ok=False)
  create(alternate,'user_platform',ok=False)
  created=json.loads(create('  Layla   Adel  '))
  self.assertEqual(json.loads(create(alternate)),created)
  create('Changed Alias',ok=False)
  self.register(a,b,name=display,contact='',op=op,ok=False)
  self.assertEqual(json.loads(self.sql(f"select public.i2_operation_v1('{a}','{op}')",'user_owner')),created)
  self.assertEqual(self.sql(f"select count(*) from academy.audit_events where operation_id='{op}'"),'1')

  player=created['player_id']
  profile=f"select public.i2_profile_v1('{a}','{player}')"
  self.assertEqual(json.loads(self.sql(profile,'user_owner'))['alternate_name'],alternate)
  self.assertNotIn('alternate_name',json.loads(self.sql(f"select public.i2_profile_v1('{a}','{legacy['player_id']}')",'user_owner')))
  for query in ['ليلى','ＬＡＹＬＡ']:
   directory=f"select public.i2_people_v1('{a}',null,{literal(query)})"
   items=json.loads(self.sql(directory,'user_owner'))['items']
   self.assertEqual([(row['id'],row['display_name']) for row in items],[(player,display)])
   self.assertNotIn('alternate_name',items[0])
   self.sql(directory,'user_other_owner',ok=False)
  self.assertEqual(self.candidates(a,alternate)['items'],[])
  self.sql(profile,'user_other_owner',ok=False)
  self.sql(f"select academy.i2_register_player('{a}','{b}','{op}',{literal(display)},'',0,false,'Layla')",'user_owner',ok=False)
  self.assertEqual(self.sql(f"select count(*) from academy.players where academy_id='{a}'"),'2')

 def test_generated_academy_member_numbers(self):
  academy,b=self.academy()
  other,other_branch=self.academy('user_other_owner')
  original=str(uuid.uuid4())
  existing=json.loads(self.register(academy,b,name='Existing Demo',op=original))
  other_existing=json.loads(self.register(other,other_branch,name='Other Demo',subject='user_other_owner'))
  for suffix in ('player_alternate_name','player_academy_member_number'):
   migration,=ROOT.glob(f'supabase/migrations/*_{suffix}.sql')
   self.sql('begin;'+migration.read_text()+'\ncommit;')
  def profile(a,player,subject='user_owner',ok=True):
   result=self.sql(f"select public.i2_profile_v1('{a}','{player}')",subject,ok=ok)
   return json.loads(result) if ok else None
  self.assertEqual(profile(academy,existing['player_id'])['academy_member_number'],'1')
  self.assertEqual(profile(other,other_existing['player_id'],'user_other_owner')['academy_member_number'],'1')
  self.assertEqual(json.loads(self.register(academy,b,name='Existing Demo',op=original)),existing)
  profile(academy,existing['player_id'],'user_other_owner',ok=False)
  self.sql('select * from academy.player_member_counters','user_owner',ok=False)
  alias_id=str(uuid.uuid4())
  def register_alias():
   query=f"select public.i2_register_v2('{academy}','{b}','{alias_id}','New Alternate Demo','',0,false,'Alias Demo')"
   return json.loads(self.sql(query,'user_owner'))
  with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
   legacy_future=pool.submit(self.register,academy,b,name='New Legacy Demo')
   alias_future=pool.submit(register_alias)
   legacy=json.loads(legacy_future.result())
   alias=alias_future.result()
  self.assertEqual({profile(academy,r['player_id'])['academy_member_number'] for r in (legacy,alias)},{'2','3'})
  self.assertEqual(register_alias(),alias)
  self.assertEqual(self.sql(f"select last_number from academy.player_member_counters where academy_id='{academy}'"),'3')
  rolled_back=str(uuid.uuid4())
  self.sql('begin;'+self.caller('user_owner','/rpc/i2_register_v1')+
   f"select public.i2_register_v1('{academy}','{b}','{rolled_back}','Aborted Demo','',0,false);rollback;")
  self.assertEqual(self.sql(f"select last_number from academy.player_member_counters where academy_id='{academy}'"),'3')
  self.assertEqual(self.sql(f"select count(*) from academy.people_operations where id='{rolled_back}'"),'0')
  next_player=json.loads(self.register(academy,b,name='After Rollback Demo'))
  self.assertEqual(profile(academy,next_player['player_id'])['academy_member_number'],'4')
  self.sql(f"update academy.players set academy_member_number=99 where id='{existing['player_id']}'",ok=False)
  self.assertEqual(profile(academy,existing['player_id'])['academy_member_number'],'1')
  self.assertNotIn('academy_member_number',json.dumps(self.candidates(academy,'Existing Demo')))
  directory=json.loads(self.sql(f"select public.i2_people_v1('{academy}')",'user_owner'))
  self.assertNotIn('academy_member_number',json.dumps(directory))

if __name__=='__main__':
 import unittest
 suite=unittest.defaultTestLoader.loadTestsFromTestCase(PeopleBoundary)
 suite.addTest(AlternateNameBoundary('test_alternate_name'))
 # The member-number rehearsal builds on the alternate-name migration. Give
 # it a fresh database rather than applying that migration twice in one class.
 result=unittest.TextTestRunner(verbosity=2).run(suite)
 member_suite=unittest.TestSuite([AlternateNameBoundary('test_generated_academy_member_numbers')])
 member_result=unittest.TextTestRunner(verbosity=2).run(member_suite)
 profile_result=unittest.TextTestRunner(verbosity=2).run(
  unittest.TestSuite([AlternateNameBoundary('test_private_profile_details')]))
 correction_result=unittest.TextTestRunner(verbosity=2).run(
  unittest.TestSuite([AlternateNameBoundary('test_player_name_correction')]))
 sys.exit(not all(run.wasSuccessful() for run in (result,member_result,profile_result,correction_result)))
