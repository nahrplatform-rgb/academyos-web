"""Actual disposable PG17 development workflow. No hosted credentials, data or grants."""
import runpy,json,uuid,unittest,concurrent.futures
from pathlib import Path
m=runpy.run_path(str(Path(__file__).resolve().parents[1]/'qr-attendance/test_boundary.py'));Base,ROOT=m['QrBoundary'],m['ROOT']
F={'strengths':'Synthetic passing','focus':'Synthetic first touch','next':'Synthetic practice','private':'PRIVATE STAFF ONLY'}
class DevelopmentBoundary(Base):
 extra_authenticated_calls={**Base.extra_authenticated_calls,**{'e14_context_v1': 'e14_context_v1(gen_random_uuid())', 'e14_sessions_v1': 'e14_sessions_v1(gen_random_uuid(),current_date)', 'e14_roster_v1': 'e14_roster_v1(gen_random_uuid(),gen_random_uuid())', 'e14_queue_v1': 'e14_queue_v1(gen_random_uuid())', 'e14_detail_v1': 'e14_detail_v1(gen_random_uuid(),gen_random_uuid(),gen_random_uuid())', 'e14_command_v1': "e14_command_v1(gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),'save',0,'{}','en','',gen_random_uuid())", 'e14_operation_v1': 'e14_operation_v1(gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid())', 'e14_history_v1': 'e14_history_v1(gen_random_uuid(),gen_random_uuid(),gen_random_uuid())', 'e14_links_v1': 'e14_links_v1(gen_random_uuid())', 'e14_family_list_v1': 'e14_family_list_v1(gen_random_uuid(),gen_random_uuid())', 'e14_family_detail_v1': 'e14_family_detail_v1(gen_random_uuid(),gen_random_uuid(),gen_random_uuid())'}}
 @classmethod
 def setUpClass(cls):
  super().setUpClass();cls.sql((ROOT/'supabase/migrations/20261028233812_i5a_development_feedback.sql').read_text())
 def development_fixture(self,family=False):
  if family:
   a,b,p,staff,x,dates,ev,link,iv=self.family();self.retime(ev,"clock_timestamp()-interval '2 hours'","clock_timestamp()-interval '1 hour'");return a,b,p,staff,x,ev,link
  a,b,p,staff,iv,x,dates,ev=self.attendance_fixture();self.retime(ev,"clock_timestamp()-interval '2 hours'","clock_timestamp()-interval '1 hour'");return a,b,p,staff,x,ev,None
 def cmd(self,a,e,x,act='submit',version=0,who='user_trainer',fields=None,reason='',op=None,ok=True):
  f=(F if fields is None else fields)if act in('save','submit')else{}
  q=lambda s:"'"+str(s).replace("'","''")+"'"
  raw=self.sql(f"select public.e14_command_v1('{a}','{e}','{x}',{q(act)},{version},{q(json.dumps(f))}::jsonb,'en',{q(reason)},'{op or uuid.uuid4()}')",who,ok=ok);return json.loads(raw)if ok else raw
 def devdetail(self,a,e,x,who='user_trainer',ok=True):
  r=self.sql(f"select public.e14_detail_v1('{a}','{e}','{x}')",who,ok=ok);return json.loads(r)if ok else r
 def publishdev(self,a,e,x,version=1):return self.cmd(a,e,x,'publish',version,'user_owner')
 def familydev(self,a,l,r,ok=True):
  q=self.sql(f"select public.e14_family_detail_v1('{a}','{l}','{r}')",'user_guardian',ok=ok);return json.loads(q)if ok else q
 def test_development_01_roundtrip_return_review_successor_withdraw(self):
  a,b,p,st,x,e,l=self.development_fixture(True);self.sql(f"insert into academy.development_access values('{l}',true)")
  r=self.cmd(a,e,x);self.familydev(a,l,r['id'],False);self.cmd(a,e,x,'return',1,'user_owner',reason='PRIVATE RETURN')
  self.assertEqual(self.devdetail(a,e,x)['revision'],2);self.assertEqual(self.devdetail(a,e,x)['internal_reason'],'PRIVATE RETURN');r=self.cmd(a,e,x,version=2);self.publishdev(a,e,x,3)
  fam=self.familydev(a,l,r['id']);self.assertNotIn('private',fam['fields']);self.assertNotIn('PRIVATE',json.dumps(fam));self.assertEqual(fam['fields']['strengths'],F['strengths']);self.assertNotIn('publisher',fam)
  self.cmd(a,e,x,'amend',4);self.cmd(a,e,x,version=5,fields={**F,'strengths':'Changed synthetic strengths'});self.assertEqual(self.familydev(a,l,r['id'])['fields']['strengths'],F['strengths']);self.publishdev(a,e,x,6)
  self.assertEqual(self.familydev(a,l,r['id'])['fields']['strengths'],'Changed synthetic strengths');self.cmd(a,e,x,'withdraw',7,'user_owner',reason='PRIVATE WITHDRAWAL');self.familydev(a,l,r['id'],False)
  self.assertEqual(self.sql(f"select count(*)from academy.development_publications where assessment_id='{r['id']}'"),'2');self.assertEqual(self.sql(f"select count(*)from academy.development_submissions where assessment_id='{r['id']}'"),'3')
 def test_development_02_current_roles_scope_and_no_implicit_optin(self):
  a,b,p,st,x,e,l=self.development_fixture(True);r=self.cmd(a,e,x);self.publishdev(a,e,x);self.familydev(a,l,r['id'],False)
  self.sql(f"insert into academy.development_access values('{l}',true)");self.familydev(a,l,r['id']);self.sql(f"update academy.guardian_links set state='ended'where id='{l}'");self.familydev(a,l,r['id'],False)
  for who in ['user_guardian','user_platform','user_unknown']:
   self.devdetail(a,e,x,who,False);self.cmd(a,e,x,who=who,ok=False)
  aa,bb=self.academy('user_other_owner');self.devdetail(aa,e,x,'user_other_owner',False);self.devdetail(a,e,x,'user_other_owner',False)
  self.cmd(a,e,x,who='user_owner',ok=False);self.cmd(a,e,x,'publish',2,'user_trainer',ok=False)
  self.sql(f"update academy.memberships set status='suspended'where academy_id='{a}'and role='trainer'");self.devdetail(a,e,x,ok=False)
 def test_development_03_replay_fence_payload_and_concurrent_versions(self):
  a,b,p,st,x,e,l=self.development_fixture();op=str(uuid.uuid4());r=self.cmd(a,e,x,op=op);self.assertEqual(r,self.cmd(a,e,x,op=op));self.assertEqual(self.cmd(a,e,x,op=op,fields={**F,'next':'Different'})['error'],'conflict')
  self.assertEqual(self.cmd(a,e,x,'save',0)['error'],'stale');self.cmd(a,e,x,'return',1,'user_owner',reason='Revise')
  with concurrent.futures.ThreadPoolExecutor(max_workers=2)as pool:out=list(pool.map(lambda _:self.cmd(a,e,x,'save',2),range(2)))
  self.assertEqual(sum('error'not in q for q in out),1);self.assertEqual(sum(q.get('error')=='stale'for q in out),1)
  op=str(uuid.uuid4());self.sql(f"select public.e14_operation_v1('{a}','{e}','{x}','{op}')",'user_trainer');self.assertEqual(self.cmd(a,e,x,'save',3,op=op)['error'],'conflict')
 def test_development_04_assignment_epoch_and_self_review(self):
  a,b,p,st,x,e,l=self.development_fixture();r=self.cmd(a,e,x);self.sql(f"update academy.trainer_assignments set state='ended'where staff_id='{st}';update academy.trainer_assignments set state='active'where staff_id='{st}'")
  self.assertEqual(self.publishdev(a,e,x)['error'],'author_ineligible');self.cmd(a,e,x,'return',1,'user_owner',reason='Resubmit under current assignment');self.cmd(a,e,x,version=2);self.publishdev(a,e,x,3)
  a,b,p,st,x,e,l=self.development_fixture();self.cmd(a,e,x);self.sql(f"update academy.memberships set status='suspended'where academy_id='{a}'and role='owner';insert into academy.memberships(identity_id,academy_id,role,status)select identity_id,'{a}','owner','active'from academy.trainer_people where id='{st}'")
  self.cmd(a,e,x,'publish',1,'user_trainer',ok=False)
 def test_development_05_atomic_failure_and_snapshot_immutability(self):
  for table in ['development_submissions','development_history','development_operations','audit_events']:
   a,b,p,st,x,e,l=self.development_fixture();self.sql(f"create function academy.synthetic_dev_failure()returns trigger language plpgsql as $$begin raise exception 'synthetic failure';end$$;create trigger synthetic_dev_failure before insert on academy.{table} for each row execute function academy.synthetic_dev_failure()")
   try:self.cmd(a,e,x,ok=False)
   finally:self.sql(f'drop trigger synthetic_dev_failure on academy.{table};drop function academy.synthetic_dev_failure()')
   self.assertEqual(self.sql(f"select count(*)from academy.development_assessments where academy_id='{a}'"),'0')
  a,b,p,st,x,e,l=self.development_fixture();r=self.cmd(a,e,x);self.publishdev(a,e,x)
  for table in ['development_submissions','development_publications','development_history']:
   self.sql(f"delete from academy.{table}where assessment_id='{r['id']}'",ok=False)
  for table in ['development_access','development_assessments','development_submissions','development_publications','development_history','development_operations']:
   self.sql('select * from academy.'+table,'user_trainer',ok=False)
 def test_development_06_validation_session_and_boundary_grants(self):
  a,b,p,st,x,e,l=self.development_fixture()
  for f in [{**F,'extra':'unrecognized'},{**F,'next':''},{**F,'private':'x'*2001},{**F,'strengths':5}]:self.cmd(a,e,x,fields=f,ok=False)
  self.retime(e,"clock_timestamp()+interval '1 hour'","clock_timestamp()+interval '2 hours'");self.assertEqual(self.cmd(a,e,x)['error'],'not_ended')
  self.assertEqual(self.sql("select bool_or(has_function_privilege('authenticated',p.oid,'execute'))from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='academy'and proname like 'e14_%'"),'f')
  self.assertEqual(self.sql("select bool_or(has_function_privilege('anon',p.oid,'execute'))from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public'and proname like 'e14_%'"),'f')
 def test_development_07_pagination_history_retained_private(self):
  a,b,p,st,x,e,l=self.development_fixture();self.cmd(a,e,x);self.cmd(a,e,x,'return',1,'user_owner',reason='PRIVATE retained reason');self.cmd(a,e,x,version=2);self.publishdev(a,e,x,3)
  h=json.loads(self.sql(f"select public.e14_history_v1('{a}','{e}','{x}')",'user_owner'));self.assertEqual(len(h['items']),4);self.assertIn('PRIVATE retained reason',json.dumps(h));self.assertEqual(sum(q['submitted_fields'] is not None for q in h['items']),2)
  q=json.loads(self.sql(f"select public.e14_queue_v1('{a}','submitted')",'user_owner'));self.assertEqual(q['items'],[])
  self.assertLess(len(json.dumps(self.devdetail(a,e,x)).encode()),32768)
 def test_development_08_publish_rollback_and_conflicting_decisions(self):
  for table in ['development_publications','development_history','development_operations','audit_events']:
   a,b,p,st,x,e,l=self.development_fixture();self.cmd(a,e,x)
   self.sql(f"create function academy.synthetic_publish_fail()returns trigger language plpgsql as $$begin raise exception 'synthetic publish rollback';end$$;create trigger synthetic_publish_fail before insert on academy.{table} for each row execute function academy.synthetic_publish_fail()")
   try:self.cmd(a,e,x,'publish',1,'user_owner',ok=False)
   finally:self.sql(f'drop trigger synthetic_publish_fail on academy.{table};drop function academy.synthetic_publish_fail()')
   self.assertEqual(self.devdetail(a,e,x,'user_owner')['state'],'submitted');self.assertEqual(self.sql(f"select count(*)from academy.development_publications p join academy.development_assessments r on r.id=p.assessment_id where r.academy_id='{a}'"),'0')
  with concurrent.futures.ThreadPoolExecutor(max_workers=2)as pool:
   out=list(pool.map(lambda act:self.cmd(a,e,x,act,1,'user_owner',reason='Return reason'if act=='return'else''),['publish','return']))
  self.assertEqual(sum('error'not in q for q in out),1);self.assertEqual(self.sql(f"select count(*)from academy.development_history h join academy.development_assessments r on r.id=h.assessment_id where r.academy_id='{a}'"),'2')
 def test_development_09_history_pages_and_original_receipt_current_authority(self):
  a,b,p,st,x,e,l=self.development_fixture();op=str(uuid.uuid4());self.cmd(a,e,x,'save',op=op)
  for version in range(1,24):self.cmd(a,e,x,'save',version)
  h=json.loads(self.sql(f"select public.e14_history_v1('{a}','{e}','{x}')",'user_trainer'));self.assertEqual(len(h['items']),20);self.assertTrue(h['more'])
  tail=json.loads(self.sql(f"select public.e14_history_v1('{a}','{e}','{x}',{h['items'][-1]['version']})",'user_trainer'));self.assertEqual(len(tail['items']),4);self.assertFalse(tail['more'])
  self.assertEqual(self.sql(f"select(public.e14_operation_v1('{a}','{e}','{x}','{op}')->>'version')",'user_trainer'),'1')
  self.sql(f"update academy.trainer_assignments set state='ended'where staff_id='{st}'");self.sql(f"select public.e14_operation_v1('{a}','{e}','{x}','{op}')",'user_trainer',ok=False)
 def test_development_095_owner_withdrawal_is_not_self_review(self):
  a,b,p,st,x,e,l=self.development_fixture();self.cmd(a,e,x);self.publishdev(a,e,x)
  self.sql(f"update academy.memberships set status='suspended'where academy_id='{a}'and role='owner';insert into academy.memberships(identity_id,academy_id,role,status)select identity_id,'{a}','owner','active'from academy.trainer_people where id='{st}'")
  result=self.cmd(a,e,x,'withdraw',2,'user_trainer',reason='Current Owner withdrawal')
  self.assertEqual(result['state'],'withdrawn');self.assertIsNone(self.devdetail(a,e,x,'user_trainer')['publication'])
 def test_development_10_warm_queue_scale_and_complete_pages(self):
  import subprocess
  a,b,p,st,x,e,l=self.development_fixture();r=self.cmd(a,e,x)
  # Administrator-created disposable scale fixture only; restore the protected snapshot trigger immediately.
  self.sql(f"begin;insert into academy.players(academy_id,branch_id,display_name,normalized_name)select '{a}','{b}','Synthetic scale '||n,'synthetic scale '||n from generate_series(1,1000)n;alter table academy.publication_rosters disable trigger attendance_snapshot_guard;insert into academy.publication_rosters select '{e}',id,display_name from academy.players where academy_id='{a}'and id<>'{x}';alter table academy.publication_rosters enable trigger attendance_snapshot_guard;insert into academy.development_assessments(academy_id,event_id,program_id,day,player_id,author,staff_id,assignment_id,authority_revision,state,fields,language)select r.academy_id,r.event_id,r.program_id,r.day,p.id,r.author,r.staff_id,r.assignment_id,r.authority_revision,'draft',r.fields,r.language from academy.development_assessments r cross join academy.players p where r.id='{r['id']}'and p.academy_id='{a}'and p.id<>'{x}';commit")
  ids=[];after=None
  while True:
   q=json.loads(self.sql(f"select public.e14_queue_v1('{a}','all',"+("'"+after+"'"if after else'null')+")",'user_owner'));ids.extend(v['id']for v in q['items']);self.assertLess(len(json.dumps(q).encode()),32768)
   if not q['more']:break
   after=q['items'][-1]['id']
  self.assertEqual(len(ids),1001);self.assertEqual(len(set(ids)),1001)
  samples=[]
  for _ in range(30):
   raw=subprocess.run(self.base,input="begin;"+self.caller("user_owner","/rpc/e14_queue_v1")+f"set local role authenticated;explain(analyze,format json)select public.e14_queue_v1('{a}','all');commit;",text=True,capture_output=True,check=True);samples.append(json.loads(raw.stdout[raw.stdout.index('[\n'):])[0]['Execution Time'])
  metrics={'scope':'Disposable PG17 warm queue SQL only; no HTTP, device, cold start or WAL/cost proof','assessments':1001,'samples':len(samples),'p95_ms':sorted(samples)[28],'max_ms':max(samples)}
  self.assertLess(metrics['p95_ms'],300)
  out=ROOT/'docs/07-handoff/evidence/i5a-local-2026-10-28';out.mkdir(parents=True,exist_ok=True);(out/'sql-scale.json').write_text(json.dumps(metrics,indent=2)+'\n')
if __name__=='__main__':
 import sys
 names=unittest.defaultTestLoader.getTestCaseNames(DevelopmentBoundary)
 names=([n for n in names if not n.startswith('test_development_')]+[n for n in names if n.startswith('test_development_')])if '--all'in sys.argv else[n for n in names if n.startswith('test_development_')]
 suite=unittest.TestSuite(DevelopmentBoundary(n)for n in names)
 result=unittest.TextTestRunner(verbosity=2).run(suite);raise SystemExit(not result.wasSuccessful())
