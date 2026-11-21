"""Disposable PG17 guardian contract; never uses hosted data."""
import sys,json,uuid,hashlib,concurrent.futures
from pathlib import Path
import runpy
people=runpy.run_path(str(Path(__file__).resolve().parents[1]/'people/test_boundary.py'))
PeopleBoundary,literal,ROOT=people['PeopleBoundary'],people['literal'],people['ROOT']
class GuardianBoundary(PeopleBoundary):
 extra_authenticated_calls={**PeopleBoundary.extra_authenticated_calls,
 'g3_owner_list_v1':'g3_owner_list_v1(gen_random_uuid(),gen_random_uuid())',
 'g3_command_v1':"g3_command_v1(gen_random_uuid(),gen_random_uuid(),'appoint',gen_random_uuid())",
 'g3_operation_v1':'g3_operation_v1(gen_random_uuid(),gen_random_uuid())',
 'g3_invitation_v1':"g3_invitation_v1(gen_random_uuid(),repeat('a',64),'{}')",
 'g3_links_v1':'g3_links_v1(gen_random_uuid())'}
 @classmethod
 def setUpClass(cls):
  super().setUpClass()
  cls.sql((ROOT/'supabase/migrations/20261025111253_i2b_synthetic_guardian_appointments.sql').read_text())
 def fixture(self):
  a,b=self.academy();p=json.loads(self.register(a,b))['player_id'];return a,p
 def command(self,a,act='appoint',iv=None,p=None,email='guardian@example.invalid',op=None,version=None,reason=None,ok=True,subject='user_owner'):
  iv=iv or str(uuid.uuid4());op=op or str(uuid.uuid4());tk='c'*64
  q=f"select public.g3_command_v1('{a}','{op}',{literal(act)},'{iv}',{literal(p)+'::uuid' if p else 'null'},{literal(email) if act=='appoint' else 'null'},{literal(hashlib.sha256(tk.encode()).hexdigest()) if act=='appoint' else 'null'},{version if version else 'null'},{literal(reason) if reason else 'null'})"
  raw=self.sql(q,subject,ok=ok);return (json.loads(raw) if ok else raw),iv,tk,op,q
 def recipient(self,iv,tk,act='review',op=None,subject='user_guardian',email='guardian@example.invalid',ok=True):
  return self.sql(f"select public.g3_invitation_v1('{iv}','{tk}',{self.proof(iv,tk,subject,email)},{literal(act)},{literal(op)+'::uuid' if op else 'null'})",subject,ok=ok)
 def test_guardian_01_persist_minimal_projection_and_end(self):
  a,p=self.fixture();r,iv,tk,op,q=self.command(a,p=p)
  self.assertEqual(json.loads(self.sql(q,'user_owner')),r)
  review=json.loads(self.recipient(iv,tk));self.assertEqual(review['display_name'],'Alex Demo');self.assertNotIn('recipient',review)
  accepted=json.loads(self.recipient(iv,tk,'accept',str(uuid.uuid4())))
  page=json.loads(self.sql(f"select public.g3_links_v1('{a}')",'user_guardian'))
  self.assertEqual(set(page['items'][0]),{'id','display_name','branch_name'})
  self.command(a,'end',iv,version=2,reason='Synthetic test ended')
  self.sql(f"select public.g3_links_v1('{a}',null,'{accepted['link_id']}')",'user_guardian',ok=False)
  self.recipient(iv,tk,'accept',str(uuid.uuid4()),ok=False)
  self.assertEqual(json.loads(self.sql(f"select public.g3_links_v1('{a}')",'user_guardian'))['items'],[])
  self.assertEqual(self.sql(f"select end_reason from academy.guardian_links where invitation_id='{iv}'"),'Synthetic test ended')
  self.assertNotIn('guardian@example',self.sql(f"select json_agg(details) from academy.audit_events where academy_id='{a}'"))
  for t in ['guardian_people','guardian_invitations','guardian_links','guardian_operations']:self.sql('select * from academy.'+t,'user_guardian',ok=False)
 def test_guardian_02_wrong_account_scope_roles_and_receipts(self):
  a,p=self.fixture();aa,bb=self.academy('user_other_owner');foreign=json.loads(self.register(aa,bb,subject='user_other_owner'))['player_id']
  r,iv,tk,op,q=self.command(a,p=p)
  self.command(a,p=foreign,ok=False)
  for subject in ['user_platform','user_other_owner','user_signup']:
   self.command(a,p=p,subject=subject,ok=False)
   self.sql(f"select public.g3_owner_list_v1('{a}','{p}')",subject,ok=False)
   self.sql(f"select public.g3_operation_v1('{a}','{op}')",subject,ok=False)
  self.recipient(iv,tk,email='wrong@example.invalid',ok=False)
  self.recipient(iv,'d'*64,ok=False)
  self.sql(f"select public.g3_invitation_v1('{iv}','{tk}','{{}}')",'user_guardian',ok=False)
  r=json.loads(self.recipient(iv,tk,'accept',str(uuid.uuid4())))
  self.sql(f"select public.g3_links_v1('{aa}')",'user_guardian',ok=False)
  for subject in ['user_owner','user_other_owner','user_platform']:self.sql(f"select public.g3_links_v1('{a}')",subject,ok=False)
  other=json.loads(self.register(a,self.sql(f"select branch_id from academy.players where id='{p}'"),name='Sibling Example'))['player_id']
  self.sql(f"select public.g3_links_v1('{a}',null,'{other}')",'user_guardian',ok=False)
  for role in ['manager','trainer','guardian','player']:
   self.sql(f"update academy.memberships set role='{role}' where academy_id='{a}' and role='owner'")
   self.command(a,'end',iv,version=2,reason='Denied',ok=False)
   self.sql(f"update academy.memberships set role='owner' where academy_id='{a}' and role='{role}' and identity_id=(select id from academy.identities where clerk_subject='user_owner')")
 def test_guardian_03_expiry_approver_revocation_and_suspended_membership(self):
  a,p=self.fixture();_,iv,tk,_,_=self.command(a,p=p)
  self.sql(f"update academy.guardian_invitations set expires_at=now()-interval '1 second' where id='{iv}'")
  self.recipient(iv,tk,ok=False)
  _,iv,tk,_,_=self.command(a,p=p)
  self.sql(f"update academy.memberships set status='suspended' where academy_id='{a}' and role='owner'")
  self.recipient(iv,tk,'accept',str(uuid.uuid4()),ok=False)
  self.sql(f"update academy.memberships set status='active' where academy_id='{a}' and role='owner'")
  acceptop=str(uuid.uuid4());self.recipient(iv,tk,'accept',acceptop)
  self.sql(f"update academy.memberships set status='suspended' where academy_id='{a}' and role='guardian'")
  self.sql(f"select public.g3_links_v1('{a}')",'user_guardian',ok=False);self.recipient(iv,tk,'accept',acceptop,ok=False)
  self.command(a,'end',iv,version=2,reason='Fresh appointment needed');_,fresh,token,_,_=self.command(a,p=p)
  self.recipient(fresh,token,'accept',str(uuid.uuid4()),ok=False)
  self.assertEqual(self.sql(f"select status from academy.memberships where academy_id='{a}' and role='guardian'"),'suspended')
 def test_guardian_04_replay_changed_intent_unknown_cancel_and_m1_isolation(self):
  a,p=self.fixture();r,iv,tk,op,q=self.command(a,p=p)
  self.sql(q.replace('guardian@example.invalid','different@example.invalid'),'user_owner',ok=False)
  self.assertEqual(json.loads(self.sql(f"select public.g3_operation_v1('{a}','{op}')",'user_owner')),r)
  self.assertFalse(json.loads(self.sql(f"select public.m1_operation_v1('{op}')",'user_owner'))['found'])
  missing=str(uuid.uuid4());self.assertTrue(json.loads(self.sql(f"select public.g3_operation_v1('{a}','{missing}')",'user_owner'))['cancelled'])
  self.command(a,p=p,op=missing,ok=False)
  cancel=str(uuid.uuid4());self.assertTrue(json.loads(self.recipient(iv,tk,'reconcile',cancel))['cancelled'])
  self.recipient(iv,tk,'accept',cancel,ok=False)
  accept=str(uuid.uuid4());saved=json.loads(self.recipient(iv,tk,'accept',accept));self.assertEqual(json.loads(self.recipient(iv,tk,'reconcile',accept)),saved)
  self.assertEqual(json.loads(self.recipient(iv,tk,'accept',accept)),saved)
  self.assertEqual(self.sql(f"select count(*) from academy.guardian_links where academy_id='{a}'"),'1')
 def test_guardian_05_simultaneous_duplicate_approval_and_accept_revoke(self):
  a,p=self.fixture()
  def approve(_):
   try:return self.command(a,p=p)
   except AssertionError as e:self.assertIn('Existing appointment',str(e));return None
  with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:results=list(pool.map(approve,range(6)))
  winners=[x for x in results if x];self.assertEqual(len(winners),1);_,iv,tk,_,_=winners[0]
  accept=str(uuid.uuid4())
  with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:r=list(pool.map(lambda _:self.recipient(iv,tk,'accept',accept),range(6)))
  self.assertTrue(all(x==r[0] for x in r));self.assertEqual(self.sql(f"select count(*) from academy.guardian_links where invitation_id='{iv}'"),'1')
  self.command(a,'revoke',iv,version=1,reason='Stale',ok=False)
  self.command(a,'end',iv,version=2,reason='Done')
  self.recipient(iv,tk,'accept',accept,ok=False)
  _,fresh,token,_,_=self.command(a,p=p)
  self.command(a,'revoke',fresh,version=1,reason='Cancelled')
  self.recipient(fresh,token,'accept',str(uuid.uuid4()),ok=False)
 def test_guardian_06_independent_links_and_pagination(self):
  a,p=self.fixture();branch=self.sql(f"select branch_id from academy.players where id='{p}'")
  appointments=[]
  for n in range(27):
   player=p if n==0 else json.loads(self.register(a,branch,name='Other Demo '+str(n)))['player_id']
   _,iv,tk,_,_=self.command(a,p=player);self.recipient(iv,tk,'accept',str(uuid.uuid4()));appointments.append(iv)
  page=json.loads(self.sql(f"select public.g3_links_v1('{a}')",'user_guardian'));self.assertEqual(len(page['items']),25);self.assertTrue(page['more'])
  rest=json.loads(self.sql(f"select public.g3_links_v1('{a}','{page['items'][-1]['id']}')",'user_guardian'));self.assertEqual(len(rest['items']),2)
  self.command(a,'end',appointments[0],version=2,reason='One only')
  self.assertEqual(self.sql(f"select count(*) from academy.guardian_links where academy_id='{a}' and state='active'"),'26')
 def test_guardian_07_delivery_proof_lease_retry_and_stop(self):
  import hmac,time
  a,p=self.fixture();_,iv,tk,_,_=self.command(a,p=p)
  def deliver(lease=None,outcome=None,valid=True):
   target='guardian:'+iv+':1:'+(lease or 'claim')+':'+(outcome or '');stamp=int(time.time())
   msg='\n'.join(['delivery',target,'user_delivery_worker',str(stamp),''])
   proof=dict(purpose='delivery',target=target,subject='user_delivery_worker',issued=stamp,emails='',signature=hmac.new(('a'*64).encode(),msg.encode(),hashlib.sha256).hexdigest() if valid else '0'*64)
   q=f"select public.g3_delivery_v1('{iv}',{literal(json.dumps(proof))}::jsonb,{literal(lease)+'::uuid' if lease else 'null'},{literal(outcome) if outcome else 'null'})"
   return json.loads(self.sql('set role anon;'+q,ok=valid)) if valid else self.sql('set role anon;'+q,ok=False)
  deliver(valid=False);claim=deliver();self.assertTrue(claim['send']);self.assertTrue(deliver()['retry'])
  deliver(claim['lease'],'failed');self.assertTrue(deliver()['send'])
  lease=self.sql(f"select lease_id from academy.guardian_invitations where id='{iv}'");deliver(lease,'unknown');self.assertFalse(deliver()['send'])
  self.command(a,'retry',iv,version=1,ok=False)
  self.assertEqual(self.sql(f"select attempts from academy.guardian_invitations where id='{iv}'"),'2')
 def test_guardian_08_read_end_lock_boundary_and_accept_revoke(self):
  import subprocess,select,time
  for action in ['read-first','end-first','accept-first','revoke-first']:
   with self.subTest(order=action):
    a,p=self.fixture();_,iv,tk,_,_=self.command(a,p=p)
    if action in ['read-first','end-first']:self.recipient(iv,tk,'accept',str(uuid.uuid4()))
    end=f"select public.g3_command_v1('{a}','{uuid.uuid4()}','end','{iv}',null,null,null,2,'Test end')"
    revoke=end.replace("'end'","'revoke'").replace(",2,'Test end'",",1,'Test end'")
    read=f"select public.g3_links_v1('{a}',null,(select id from academy.guardian_links where invitation_id='{iv}'))"
    # Resolve link as operator before caller switches roles; no private-table grant.
    if action in ['read-first','end-first']:
     lid=self.sql(f"select id from academy.guardian_links where invitation_id='{iv}'")
     read=f"select public.g3_links_v1('{a}',null,'{lid}')"
    accept=f"select public.g3_invitation_v1('{iv}','{tk}',{self.proof(iv,tk,'user_guardian','guardian@example.invalid')},'accept','{uuid.uuid4()}')"
    if action=='read-first':one=('user_guardian','g3_links_v1',read);two=('user_owner','g3_command_v1',end);success=True
    elif action=='end-first':one=('user_owner','g3_command_v1',end);two=('user_guardian','g3_links_v1',read);success=False
    elif action=='accept-first':one=('user_guardian','g3_invitation_v1',accept);two=('user_owner','g3_command_v1',revoke);success=False
    else:one=('user_owner','g3_command_v1',revoke);two=('user_guardian','g3_invitation_v1',accept);success=False
    holder=subprocess.Popen(self.base,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,bufsize=1);waiter=None
    try:
     holder.stdin.write("\\o /dev/null\nbegin;"+self.caller(one[0],'/rpc/'+one[1])+one[2]+";\n\\o\nselect pg_backend_pid();\n");holder.stdin.flush()
     pid=None;deadline=time.monotonic()+10
     while time.monotonic()<deadline:
      ready,_,_=select.select([holder.stdout],[],[],.1)
      if ready:
       line=holder.stdout.readline().strip()
       if line.isdigit():pid=int(line);break
     self.assertIsNotNone(pid,'first transaction did not reach lifecycle lock')
     tag='guardian_race_'+uuid.uuid4().hex;waiter=subprocess.Popen(self.base,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
     waiter.stdin.write("begin;set local application_name="+literal(tag)+";"+self.caller(two[0],'/rpc/'+two[1])+two[2]+";commit;\n");waiter.stdin.flush()
     blocked=False;deadline=time.monotonic()+1.5
     while time.monotonic()<deadline:
      blocked=self.sql(f"select exists(select from pg_stat_activity where application_name='{tag}' and {pid}=any(pg_blocking_pids(pid)))")=='t'
      if blocked:break
      self.assertIsNone(waiter.poll());time.sleep(.01)
     self.assertTrue(blocked,'lifecycle lock dependency not observed')
     holder.stdin.write('commit;\n');holder.stdin.flush();_,err=holder.communicate(timeout=5);self.assertEqual(holder.returncode,0,err)
     _,err=waiter.communicate(timeout=5);self.assertEqual(waiter.returncode==0,success,err)
     if action!='accept-first':self.assertEqual(self.sql(f"select count(*) from academy.guardian_links where invitation_id='{iv}' and state='active'"),'0')
    finally:
     for session in [holder,waiter]:
      if session is not None and session.poll() is None:session.kill();session.communicate(timeout=5)
 def test_guardian_09_atomic_rollback_multirole_projection_and_budgets(self):
  import subprocess
  a,p=self.fixture();_,iv,tk,_,q=self.command(a,p=p,email='owner@academy.example')
  op=str(uuid.uuid4());self.recipient(iv,tk,'accept',op,subject='user_owner',email='owner@academy.example')
  self.recipient(iv,tk,'accept',op,subject='user_owner',email='owner@academy.example')
  self.assertEqual(self.sql(f"select count(*) from academy.audit_events where operation_id='{op}'"),'1')
  result=json.loads(self.sql(f"select public.g3_links_v1('{a}')",'user_owner'))
  self.assertEqual(set(result['items'][0]),{'id','display_name','branch_name'})
  self.assertNotIn('contact',json.dumps(result))
  fresh=str(uuid.uuid4());rollback=f"select public.g3_command_v1('{a}','{uuid.uuid4()}','appoint','{fresh}','{p}','rollback@example.invalid','{'e'*64}')"
  self.sql('begin;'+self.caller('user_owner','/rpc/g3_command_v1')+rollback+';rollback;')
  self.assertEqual(self.sql(f"select count(*) from academy.guardian_invitations where id='{fresh}'"),'0')
  for after in [None]:
   queries=[('g3_links_v1',f"select public.g3_links_v1('{a}')"),('g3_owner_list_v1',f"select public.g3_owner_list_v1('{a}','{p}')")]
   metrics=[]
   for name,query in queries:
    samples=[];raw=self.sql(query,'user_owner');self.assertLess(len(raw.encode()),32768)
    for _ in range(50):
     execution=subprocess.run(self.base,input='begin;'+self.caller('user_owner','/rpc/'+name)+'explain (analyze,format json) '+query+';commit;',capture_output=True,text=True,check=True)
     samples.append(json.loads(execution.stdout)[0]['Execution Time'])
    metrics.append(dict(operation=name,observations=50,executionP95Ms=sorted(samples)[47],responseBytes=len(raw.encode())))
  dest=ROOT/'docs/07-handoff/evidence/i2b-local-2026-10-25';dest.mkdir(parents=True,exist_ok=True)
  (dest/'sql-measurements.json').write_text(json.dumps(dict(scope='Disposable local PostgreSQL17 function only; one link/player. Excludes HTTP, provider, cold starts, hosted contention and device performance.',measurements=metrics),indent=2)+'\n')
  limits=json.loads(self.sql("select jsonb_agg(p.proconfig) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'g3_%'"))
  self.assertEqual(len(limits),6)
  for config in limits:self.assertTrue(all(value in config for value in ['search_path=\"\"','statement_timeout=3s','lock_timeout=2s']))
if __name__=='__main__':
 import unittest;result=unittest.TextTestRunner(verbosity=2).run(unittest.defaultTestLoader.loadTestsFromTestCase(GuardianBoundary));sys.exit(not result.wasSuccessful())
