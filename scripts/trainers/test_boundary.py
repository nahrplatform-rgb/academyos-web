"""Disposable PG17 Trainer boundary and regression tests; no hosted connection."""
import sys,json,uuid,hashlib,concurrent.futures,runpy
from pathlib import Path
people=runpy.run_path(str(Path(__file__).resolve().parents[1]/'people/test_boundary.py'))
PeopleBoundary,literal,ROOT=people['PeopleBoundary'],people['literal'],people['ROOT']
class TrainerBoundary(PeopleBoundary):
 extra_authenticated_calls={**PeopleBoundary.extra_authenticated_calls,
 'g3_owner_list_v1':'g3_owner_list_v1(gen_random_uuid(),gen_random_uuid())','g3_command_v1':"g3_command_v1(gen_random_uuid(),gen_random_uuid(),'appoint',gen_random_uuid())",'g3_operation_v1':'g3_operation_v1(gen_random_uuid(),gen_random_uuid())','g3_invitation_v1':"g3_invitation_v1(gen_random_uuid(),repeat('a',64),'{}')",'g3_links_v1':'g3_links_v1(gen_random_uuid())',
 't4_owner_list_v1':'t4_owner_list_v1(gen_random_uuid())','t4_command_v1':"t4_command_v1(gen_random_uuid(),gen_random_uuid(),'appoint',gen_random_uuid())",'t4_operation_v1':'t4_operation_v1(gen_random_uuid(),gen_random_uuid())','t4_invitation_v1':"t4_invitation_v1(gen_random_uuid(),repeat('a',64),'{}')",'t4_profile_v1':'t4_profile_v1(gen_random_uuid())'}
 @classmethod
 def setUpClass(cls):
  super().setUpClass()
  for name in ['20261025111253_i2b_synthetic_guardian_appointments.sql','20261025123233_i2c_synthetic_trainer_appointments.sql']:cls.sql((ROOT/'supabase/migrations'/name).read_text())
 def command(self,a,b=None,act='appoint',iv=None,op=None,email='trainer@example.invalid',name='Casey Demo',version=None,reason=None,subject='user_owner',ok=True):
  iv,op=iv or str(uuid.uuid4()),op or str(uuid.uuid4());tk='e'*64
  q=f"select public.t4_command_v1('{a}','{op}',{literal(act)},'{iv}',{literal(b)+'::uuid' if b and act=='appoint' else 'null'},{literal(name) if act=='appoint' else 'null'},{literal(email) if act=='appoint' else 'null'},{literal(hashlib.sha256(tk.encode()).hexdigest()) if act=='appoint' else 'null'},{version if version else 'null'},{literal(reason) if reason else 'null'})"
  r=self.sql(q,subject,ok=ok);return (json.loads(r) if ok else r),iv,tk,op,q
 def recipient(self,iv,tk,act='review',op=None,subject='user_trainer',email='trainer@example.invalid',ok=True):
  return self.sql(f"select public.t4_invitation_v1('{iv}','{tk}',{self.proof(iv,tk,subject,email)},{literal(act)},{literal(op)+'::uuid' if op else 'null'})",subject,ok=ok)
 def test_trainer_01_lifecycle_projection_and_role_separation(self):
  a,b=self.academy();_,iv,tk,op,q=self.command(a,b)
  self.assertEqual(json.loads(self.sql(q,'user_owner'))['state'],'pending')
  self.sql(f"select public.t4_profile_v1('{a}')",'user_trainer',ok=False)
  self.assertNotIn('recipient',self.recipient(iv,tk))
  accept=str(uuid.uuid4());saved=self.recipient(iv,tk,'accept',accept)
  self.assertEqual(self.recipient(iv,tk,'accept',accept),saved)
  profile=json.loads(self.sql(f"select public.t4_profile_v1('{a}')",'user_trainer'))
  self.assertEqual(profile,dict(display_name='Casey Demo',role='trainer',branch_name='Synthetic branch'))
  self.sql(f"insert into academy.memberships(identity_id,academy_id,role,status) select id,'{a}','guardian','active' from academy.identities where clerk_subject='user_trainer'")
  self.command(a,act='end',iv=iv,version=2,reason='Synthetic end')
  self.sql(f"select public.t4_profile_v1('{a}')",'user_trainer',ok=False)
  self.recipient(iv,tk,'accept',accept,ok=False)
  self.assertEqual(self.sql(f"select status from academy.memberships where academy_id='{a}' and role='trainer'"),'ended')
  self.assertEqual(self.sql(f"select status from academy.memberships where academy_id='{a}' and role='guardian'"),'active')
  self.assertEqual(self.sql(f"select end_reason from academy.trainer_assignments where invitation_id='{iv}'"),'Synthetic end')
  self.command(a,b,ok=False)
  audit=self.sql(f"select json_agg(details) from academy.audit_events where academy_id='{a}'")
  self.assertNotIn('trainer@example',audit);self.assertNotIn('Casey Demo',audit);self.assertNotIn('Synthetic end',audit)
  for table in ['trainer_people','trainer_invitations','trainer_assignments','trainer_operations']:self.sql('select * from academy.'+table,'user_trainer',ok=False)
 def test_trainer_02_cross_scope_role_receipt_and_gateway(self):
  a,b=self.academy();aa,bb=self.academy('user_other_owner');_,iv,tk,op,q=self.command(a,b)
  self.command(a,bb,email='other@example.invalid',ok=False)
  for subject in ['user_signup','user_platform','user_other_owner']:
   self.command(a,b,subject=subject,ok=False)
   self.sql(f"select public.t4_owner_list_v1('{a}')",subject,ok=False)
   self.sql(f"select public.t4_operation_v1('{a}','{op}')",subject,ok=False)
  for role in ['manager','trainer','guardian','player']:
   self.sql(f"update academy.memberships set role='{role}' where academy_id='{a}' and role='owner'")
   self.command(a,b,ok=False);self.sql(f"select public.t4_owner_list_v1('{a}')",'user_owner',ok=False)
   self.sql(f"update academy.memberships set role='owner' where academy_id='{a}' and role='{role}'")
  for rpc in ['i2_operation_v1','g3_operation_v1']:self.assertTrue(json.loads(self.sql(f"select public.{rpc}('{a}','{op}')",'user_owner'))['cancelled'])
  self.assertFalse(json.loads(self.sql(f"select public.m1_operation_v1('{op}')",'user_owner'))['found'])
  self.recipient(iv,tk,email='wrong@example.invalid',ok=False);self.recipient(iv,tk,email='',ok=False);self.recipient(iv,'f'*64,ok=False)
  self.sql(f"select public.t4_invitation_v1('{iv}','{tk}','{{}}')",'user_trainer',ok=False)
  self.recipient(iv,tk,'accept',str(uuid.uuid4()))
  self.sql(f"select public.t4_profile_v1('{aa}')",'user_trainer',ok=False)
  for query in [f"select public.i2_people_v1('{a}')",f"select public.t4_owner_list_v1('{a}')",f"select public.g3_links_v1('{a}')"]:self.sql(query,'user_trainer',ok=False)
  self.sql(f"select public.t4_owner_list_v1('{a}',null,'{uuid.uuid4()}')",'user_owner',ok=False)
 def test_trainer_03_duplicates_suspended_approver_expired_and_replay(self):
  a,b=self.academy();_,iv,tk,op,q=self.command(a,b)
  self.command(a,b,ok=False);self.sql(q.replace('Casey Demo','Changed'),'user_owner',ok=False)
  self.sql(f"update academy.memberships set status='suspended' where academy_id='{a}' and role='owner'")
  self.recipient(iv,tk,'accept',str(uuid.uuid4()),ok=False);self.sql(q,'user_owner',ok=False)
  self.sql(f"update academy.memberships set status='active' where academy_id='{a}' and role='owner'")
  self.sql(f"update academy.trainer_invitations set expires_at=now()-interval '1 second' where id='{iv}'")
  self.recipient(iv,tk,ok=False)
  _,iv,tk,_,_=self.command(a,b,email='second@example.invalid')
  self.sql(f"insert into academy.identities(clerk_subject) values('user_trainer') on conflict(clerk_subject) do nothing;insert into academy.memberships(identity_id,academy_id,role,status) select id,'{a}','trainer','suspended' from academy.identities where clerk_subject='user_trainer'")
  self.recipient(iv,tk,'accept',str(uuid.uuid4()),email='second@example.invalid',ok=False)
  self.assertEqual(self.sql(f"select status from academy.memberships where academy_id='{a}' and role='trainer'"),'suspended')
  self.assertEqual(self.sql(f"select count(*) from academy.trainer_assignments where academy_id='{a}'"),'0')
 def test_trainer_04_reconcile_fence_atomic_rollback_and_current_authority(self):
  a,b=self.academy();_,iv,tk,op,q=self.command(a,b)
  self.assertEqual(json.loads(self.sql(f"select public.t4_operation_v1('{a}','{op}')",'user_owner'))['state'],'pending')
  missing=str(uuid.uuid4());self.assertTrue(json.loads(self.sql(f"select public.t4_operation_v1('{a}','{missing}')",'user_owner'))['cancelled'])
  self.command(a,b,op=missing,email='cancel@example.invalid',ok=False)
  cancel=str(uuid.uuid4());self.assertTrue(json.loads(self.recipient(iv,tk,'reconcile',cancel))['cancelled'])
  self.recipient(iv,tk,'accept',cancel,ok=False)
  accept=str(uuid.uuid4());self.recipient(iv,tk,'accept',accept)
  self.sql(f"update academy.memberships set status='suspended' where academy_id='{a}' and role='trainer'")
  self.recipient(iv,tk,'accept',accept,ok=False);self.sql(f"select public.t4_profile_v1('{a}')",'user_trainer',ok=False)
  # Consequential appointment creates profile, invitation, audit and receipt in one transaction.
  iv2,op2=str(uuid.uuid4()),str(uuid.uuid4());q2=q.replace(iv,iv2).replace(op,op2).replace('trainer@example.invalid','rollback@example.invalid')
  self.sql('begin;'+self.caller('user_owner','/rpc/t4_command_v1')+q2+';rollback;')
  self.assertEqual(self.sql(f"select count(*) from academy.trainer_invitations where id='{iv2}'"),'0')
 def test_trainer_05_concurrent_duplicate_accept_and_end(self):
  a,b=self.academy()
  def approve(_):
   try:return self.command(a,b)
   except AssertionError as e:self.assertIn('Existing appointment',str(e));return None
  with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:results=list(pool.map(approve,range(6)))
  winners=[r for r in results if r];self.assertEqual(len(winners),1);_,iv,tk,_,_=winners[0]
  op=str(uuid.uuid4())
  with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:r=list(pool.map(lambda _:self.recipient(iv,tk,'accept',op),range(6)))
  self.assertTrue(all(x==r[0] for x in r));self.assertEqual(self.sql(f"select count(*) from academy.trainer_assignments where invitation_id='{iv}'"),'1')
  self.command(a,act='revoke',iv=iv,version=1,reason='stale',ok=False)
  end=str(uuid.uuid4())
  with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:r=list(pool.map(lambda _:self.command(a,act='end',iv=iv,op=end,version=2,reason='done')[0],range(4)))
  self.assertTrue(all(x==r[0] for x in r));self.recipient(iv,tk,'accept',op,ok=False)
 def test_trainer_06_bounded_list_and_validation(self):
  a,b=self.academy()
  for i in range(28):self.command(a,b,email=f'trainer{i}@example.invalid')
  r=json.loads(self.sql(f"select public.t4_owner_list_v1('{a}')",'user_owner'));self.assertEqual(len(r['items']),25);self.assertTrue(r['more']);self.assertNotIn('trainer0@',json.dumps(r))
  r2=json.loads(self.sql(f"select public.t4_owner_list_v1('{a}','{r['items'][-1]['id']}')",'user_owner'));self.assertEqual(len(r2['items']),3)
  selected=r['items'][0]['id'];r=json.loads(self.sql(f"select public.t4_owner_list_v1('{a}',null,'{selected}')",'user_owner'));self.assertNotIn('***',r['items'][0]['recipient'])
  for name in ['', ' '*3,'x'*161]:self.command(a,b,email='invalid@example.invalid',name=name,ok=False)
  for email in ['x,y@example.invalid','a b@example.invalid','x'*255]:self.command(a,b,email=email,ok=False)
 def test_trainer_07_delivery_proof_lease_retry_and_stop(self):
  import hmac,time
  a,b=self.academy();_,iv,tk,_,_=self.command(a,b)
  def deliver(lease=None,outcome=None,valid=True):
   target='trainer:'+iv+':1:'+(lease or 'claim')+':'+(outcome or '');stamp=int(time.time())
   msg='\n'.join(['delivery',target,'user_delivery_worker',str(stamp),''])
   proof=dict(purpose='delivery',target=target,subject='user_delivery_worker',issued=stamp,emails='',signature=hmac.new(('a'*64).encode(),msg.encode(),hashlib.sha256).hexdigest() if valid else '0'*64)
   q=f"select public.t4_delivery_v1('{iv}',{literal(json.dumps(proof))}::jsonb,{literal(lease)+'::uuid' if lease else 'null'},{literal(outcome) if outcome else 'null'})"
   return json.loads(self.sql('set role anon;'+q,ok=valid)) if valid else self.sql('set role anon;'+q,ok=False)
  deliver(valid=False);claim=deliver();self.assertTrue(claim['send']);self.assertTrue(deliver()['retry'])
  deliver(claim['lease'],'failed');self.assertTrue(deliver()['send'])
  lease=self.sql(f"select lease_id from academy.trainer_invitations where id='{iv}'");deliver(lease,'unknown');self.assertFalse(deliver()['send'])
  self.command(a,act='retry',iv=iv,version=1,ok=False)
  self.assertEqual(self.sql(f"select attempts from academy.trainer_invitations where id='{iv}'"),'2')
 def test_trainer_08_read_end_lock_boundary_and_accept_revoke(self):
  import subprocess,select,time
  for action in ['read-first','end-first','accept-first','revoke-first']:
   with self.subTest(order=action):
    a,b=self.academy();_,iv,tk,_,_=self.command(a,b)
    if action in ['read-first','end-first']:self.recipient(iv,tk,'accept',str(uuid.uuid4()))
    end=f"select public.t4_command_v1('{a}','{uuid.uuid4()}','end','{iv}',null,null,null,null,2,'Test end')"
    revoke=end.replace("'end'","'revoke'").replace(",2,'Test end'",",1,'Test end'")
    read=f"select public.t4_profile_v1('{a}')"
    accept=f"select public.t4_invitation_v1('{iv}','{tk}',{self.proof(iv,tk,'user_trainer','trainer@example.invalid')},'accept','{uuid.uuid4()}')"
    if action=='read-first':one=('user_trainer','t4_profile_v1',read);two=('user_owner','t4_command_v1',end);success=True
    elif action=='end-first':one=('user_owner','t4_command_v1',end);two=('user_trainer','t4_profile_v1',read);success=False
    elif action=='accept-first':one=('user_trainer','t4_invitation_v1',accept);two=('user_owner','t4_command_v1',revoke);success=False
    else:one=('user_owner','t4_command_v1',revoke);two=('user_trainer','t4_invitation_v1',accept);success=False
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
     tag='trainer_race_'+uuid.uuid4().hex;waiter=subprocess.Popen(self.base,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
     waiter.stdin.write("begin;set local application_name="+literal(tag)+";"+self.caller(two[0],'/rpc/'+two[1])+two[2]+";commit;\n");waiter.stdin.flush()
     blocked=False;deadline=time.monotonic()+1.5
     while time.monotonic()<deadline:
      blocked=self.sql(f"select exists(select from pg_stat_activity where application_name='{tag}' and {pid}=any(pg_blocking_pids(pid)))")=='t'
      if blocked:break
      self.assertIsNone(waiter.poll());time.sleep(.01)
     self.assertTrue(blocked,'lifecycle lock dependency not observed')
     holder.stdin.write('commit;\n');holder.stdin.flush();_,err=holder.communicate(timeout=5);self.assertEqual(holder.returncode,0,err)
     _,err=waiter.communicate(timeout=5);self.assertEqual(waiter.returncode==0,success,err)
     if action!='accept-first':self.assertEqual(self.sql(f"select count(*) from academy.trainer_assignments where invitation_id='{iv}' and state='active'"),'0')
    finally:
     for session in [holder,waiter]:
      if session is not None and session.poll() is None:session.kill();session.communicate(timeout=5)
if __name__=='__main__':
 import unittest;result=unittest.TextTestRunner(verbosity=2).run(unittest.defaultTestLoader.loadTestsFromTestCase(TrainerBoundary));sys.exit(not result.wasSuccessful())
