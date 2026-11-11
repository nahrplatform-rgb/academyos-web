"""I4c actual disposable PG17. Never hosted data or real access grants."""
import runpy,json,uuid,unittest,concurrent.futures
from pathlib import Path
m=runpy.run_path(str(Path(__file__).resolve().parents[1]/'guardian-training/test_boundary.py'));Base,ROOT=m['FamilyBoundary'],m['ROOT']
class CorrectionBoundary(Base):
 extra_authenticated_calls={**Base.extra_authenticated_calls,'c12_context_v1':'c12_context_v1(gen_random_uuid(),gen_random_uuid(),gen_random_uuid())',**{n:q for n,q in [('c12_list_v1','c12_list_v1(gen_random_uuid())'),('c12_detail_v1','c12_detail_v1(gen_random_uuid(),gen_random_uuid(),gen_random_uuid())'),('c12_history_v1','c12_history_v1(gen_random_uuid(),gen_random_uuid(),gen_random_uuid())'),('c12_submit_v1',"c12_submit_v1(gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),1,'reason',gen_random_uuid())"),('c12_decide_v1',"c12_decide_v1(gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),'approved','reason',gen_random_uuid())"),('c12_operation_v1','c12_operation_v1(gen_random_uuid(),gen_random_uuid(),gen_random_uuid())')]}}
 @classmethod
 def setUpClass(cls):
  super().setUpClass();cls.sql((ROOT/'supabase/migrations/20261028153040_i4c_attendance_correction_requests.sql').read_text())
 def request(self,a,ev,x,version=1,op=None,who='user_trainer',ok=True):
  raw=self.sql(f"select public.c12_submit_v1('{a}','{ev}','{x}',{version},'Synthetic request','{op or uuid.uuid4()}')",who,ok=ok);return json.loads(raw)if ok else raw
 def decide(self,a,ev,r,choice='approved',op=None,who='user_owner',ok=True):
  raw=self.sql(f"select public.c12_decide_v1('{a}','{ev}','{r}','{choice}','Synthetic decision','{op or uuid.uuid4()}')",who,ok=ok);return json.loads(raw)if ok else raw
 def correction_detail(self,a,ev,r,who='user_owner',ok=True):
  raw=self.sql(f"select public.c12_detail_v1('{a}','{ev}','{r}')",who,ok=ok);return json.loads(raw)if ok else raw
 def test_zzzz_correction_01_roundtrip_replay_reject_duplicate(self):
  a,b,p,staff,iv,x,dates,ev=self.attendance_fixture();self.mark(a,ev,x);ctx=json.loads(self.sql(f"select public.c12_context_v1('{a}','{ev}','{x}')",'user_trainer'));self.assertEqual(ctx['current'],'present');self.assertFalse(ctx['owner']);op=str(uuid.uuid4());r=self.request(a,ev,x,op=op);self.assertEqual(r,self.request(a,ev,x,op=op));self.assertEqual(r,self.request(a,ev,x));d=self.correction_detail(a,ev,r['request']);self.assertEqual(d['current'],'present');self.assertEqual(len(self.history(a,ev,x)['items']),1)
  self.decide(a,ev,r['request'],'rejected');self.assertEqual(self.correction_detail(a,ev,r['request'])['current'],'present');r2=self.request(a,ev,x);self.assertNotEqual(r,r2);op=str(uuid.uuid4());v=self.decide(a,ev,r2['request'],op=op);self.assertEqual(v,self.decide(a,ev,r2['request'],op=op));self.assertEqual(self.decide(a,ev,r2['request'],op=op,choice='rejected')['error'],'conflict');d=self.correction_detail(a,ev,r2['request']);self.assertEqual((d['current'],d['version'],d['state']),('absent',2,'approved'));self.assertEqual(len(self.history(a,ev,x)['items']),2)
 def test_zzzz_correction_02_denials_stale_and_fence(self):
  a,b,p,staff,iv,x,dates,ev=self.attendance_fixture();self.assertEqual(self.request(a,ev,x)['error'],'stale');self.mark(a,ev,x);r=self.request(a,ev,x)['request']
  for who in ['user_platform','user_guardian','user_unknown']:
   self.request(a,ev,x,who=who,ok=False);self.correction_detail(a,ev,r,who,False);self.decide(a,ev,r,who=who,ok=False)
  self.request(a,ev,x,who='user_owner',ok=False);self.decide(a,ev,r,who='user_trainer',ok=False)
  aa,bb=self.academy('user_foreign_owner');self.correction_detail(aa,ev,r,'user_foreign_owner',False)
  self.mark(a,ev,x,'user_owner',version=1,status='absent',reason='Direct correction');self.assertEqual(self.decide(a,ev,r)['error'],'stale')
  op=str(uuid.uuid4());self.sql(f"select public.c12_operation_v1('{a}','{ev}','{op}')",'user_trainer');self.assertEqual(self.request(a,ev,x,version=2,op=op)['error'],'conflict')
 def test_zzzz_correction_03_original_authority_never_revives(self):
  for mode in ['assignment','membership','invitation']:
   a,b,p,staff,iv,x,dates,ev=self.attendance_fixture();self.mark(a,ev,x);r=self.request(a,ev,x)['request']
   if mode=='assignment':self.sql(f"update academy.trainer_assignments set state='ended'where staff_id='{staff}';update academy.trainer_assignments set state='active'where staff_id='{staff}'")
   elif mode=='membership':self.sql(f"update academy.memberships set status='suspended'where academy_id='{a}'and role='trainer';update academy.memberships set status='active'where academy_id='{a}'and role='trainer'")
   else:self.sql(f"update academy.trainer_invitations set version=version+1 where id='{iv}'")
   self.assertEqual(self.correction_detail(a,ev,r)['state'],'ineligible');self.assertEqual(self.decide(a,ev,r)['error'],'ineligible');self.assertNotEqual(self.request(a,ev,x)['request'],r)
 def test_zzzz_correction_04_race_and_atomic_failure(self):
  a,b,p,staff,iv,x,dates,ev=self.attendance_fixture();self.mark(a,ev,x);r=self.request(a,ev,x)['request']
  self.sql("create function academy.synthetic_c12_fail()returns trigger language plpgsql as $$begin raise exception 'Synthetic failure';end$$;create trigger synthetic_c12_fail before insert on academy.correction_history for each row when(new.kind='approved')execute function academy.synthetic_c12_fail()")
  try:self.decide(a,ev,r,ok=False);self.assertEqual(self.correction_detail(a,ev,r)['state'],'pending');self.assertEqual(self.correction_detail(a,ev,r)['current'],'present');self.assertEqual(len(self.history(a,ev,x)['items']),1)
  finally:self.sql('drop trigger synthetic_c12_fail on academy.correction_history;drop function academy.synthetic_c12_fail()')
  with concurrent.futures.ThreadPoolExecutor(max_workers=2)as pool:out=list(pool.map(lambda c:self.decide(a,ev,r,c),['approved','rejected']))
  self.assertEqual(sum('error'not in q for q in out),1);d=self.correction_detail(a,ev,r);self.assertEqual(d['current'],'absent'if d['state']=='approved'else'present')
 def test_zzzz_correction_05_window_and_self_review(self):
  a,b,p,staff,iv,x,dates,ev=self.attendance_fixture();self.mark(a,ev,x);r=self.request(a,ev,x)['request']
  # Test-only admin deadline fixture, restoring the protected guard immediately.
  self.sql(f"alter table academy.publication_events disable trigger attendance_event_guard;update academy.publication_events set ends_at=clock_timestamp()-interval '25 hours'where id='{ev}';alter table academy.publication_events enable trigger attendance_event_guard")
  self.assertEqual(self.correction_detail(a,ev,r)['state'],'expired');self.assertEqual(self.decide(a,ev,r)['error'],'expired')
  a,b,p,staff,iv,x,dates,ev=self.attendance_fixture();self.mark(a,ev,x);r=self.request(a,ev,x)['request'];self.sql(f"update academy.memberships set status='suspended'where academy_id='{a}'and role='owner';insert into academy.memberships(identity_id,academy_id,role,status)select identity_id,'{a}','owner','active'from academy.trainer_people where id='{staff}'")
  self.decide(a,ev,r,who='user_trainer',ok=False);self.request(a,ev,x,who='user_trainer',ok=False)
 def test_zzzz_correction_06_request_history_and_receipt_failure_rollback(self):
  for target in ['correction_history','correction_operations','audit_events']:
   a,b,p,staff,iv,x,dates,ev=self.attendance_fixture();self.mark(a,ev,x)
   self.sql(f"create function academy.synthetic_request_fail()returns trigger language plpgsql as $$begin raise exception 'Synthetic request failure';end$$;create trigger synthetic_request_fail before insert on academy.{target} for each row execute function academy.synthetic_request_fail()")
   try:self.request(a,ev,x,ok=False)
   finally:self.sql(f"drop trigger synthetic_request_fail on academy.{target};drop function academy.synthetic_request_fail()")
   self.assertEqual(self.sql(f"select count(*)from academy.correction_requests where academy_id='{a}'"),'0');self.assertEqual(len(self.history(a,ev,x)['items']),1)
 def test_zzzz_correction_07_duplicate_race_direct_correction_and_revocation(self):
  a,b,p,staff,iv,x,dates,ev=self.attendance_fixture();self.mark(a,ev,x)
  with concurrent.futures.ThreadPoolExecutor(max_workers=2)as pool:out=list(pool.map(lambda _:self.request(a,ev,x),range(2)))
  self.assertEqual(out[0]['request'],out[1]['request']);r=out[0]['request']
  # Observe both lock orders for approval versus direct correction; the loser cannot overwrite.
  for first in ['request','direct']:
   aa,bb,pp,st,ii,xx,dd,ee=self.attendance_fixture();self.mark(aa,ee,xx);rr=self.request(aa,ee,xx)['request']
   if first=='request':self.decide(aa,ee,rr);self.assertEqual(self.mark(aa,ee,xx,'user_owner',version=1,status='absent',reason='Concurrent')['error'],'stale')
   else:self.mark(aa,ee,xx,'user_owner',version=1,status='absent',reason='Concurrent');self.assertEqual(self.decide(aa,ee,rr)['error'],'stale')
  self.sql(f"update academy.trainer_assignments set state='ended'where staff_id='{staff}'");self.correction_detail(a,ev,r,'user_trainer',False);self.assertEqual(self.decide(a,ev,r)['error'],'ineligible');self.sql(f"update academy.memberships set status='suspended'where academy_id='{a}'and role='owner'");self.correction_detail(a,ev,r,ok=False)
 def test_zzzz_correction_075_window_closes_during_commit(self):
  a,b,p,staff,iv,x,dates,ev=self.attendance_fixture();self.mark(a,ev,x);r=self.request(a,ev,x)['request']
  self.sql(f"begin;alter table academy.publication_events disable trigger attendance_event_guard;alter table academy.training_dates disable trigger attendance_date_guard;alter table academy.training_dates disable trigger session_change_date_guard;update academy.publication_events set starts_at=clock_timestamp()-interval '25 hours',ends_at=clock_timestamp()-interval '24 hours'+interval '2 seconds'where id='{ev}';update academy.training_dates d set starts_at=e.starts_at,ends_at=e.ends_at from academy.publication_events e where e.id='{ev}'and d.program_id=e.program_id and d.local_date=e.day;alter table academy.publication_events enable trigger attendance_event_guard;alter table academy.training_dates enable trigger attendance_date_guard;alter table academy.training_dates enable trigger session_change_date_guard;commit;create function academy.synthetic_slow_review()returns trigger language plpgsql as $$begin perform pg_sleep(2.2);return new;end$$;create trigger synthetic_slow_review before insert on academy.correction_history for each row when(new.kind='approved')execute function academy.synthetic_slow_review()")
  try:self.decide(a,ev,r,ok=False)
  finally:self.sql('drop trigger synthetic_slow_review on academy.correction_history;drop function academy.synthetic_slow_review()')
  self.assertEqual(self.sql(f"select decision is null from academy.correction_requests where id='{r}'"),'t');self.assertEqual(self.sql(f"select status from academy.attendance_marks where event_id='{ev}'and player_id='{x}'"),'present');self.assertEqual(self.sql(f"select count(*)from academy.attendance_history where event_id='{ev}'"),'1')
 def test_zzzz_correction_08_bounded_queue_scale_and_family_projection(self):
  a,b,p,staff,x,dates,ev,link,iv=self.family();self.mark(a,ev,x);r=self.request(a,ev,x)['request'];self.decide(a,ev,r)
  payload=self.family_read(a,link,'2026-10-28',event=ev);self.assertEqual(payload['item']['status'],'absent');self.assertNotIn('Synthetic decision',json.dumps(payload));self.assertNotIn('request',json.dumps(payload));self.assertNotIn('reason',json.dumps(payload))
  self.sql(f"insert into academy.correction_requests(id,academy_id,event_id,program_id,day,player_id,requester,assignment_id,authority_revision,before_status,proposed,base_version,reason,created_at)select gen_random_uuid(),academy_id,event_id,program_id,day,player_id,requester,assignment_id,authority_revision,before_status,proposed,base_version,repeat('界',500),created_at+n*interval '1 second'from academy.correction_requests cross join generate_series(1,999)n where id='{r}'")
  seen=[];cursor='null,null'
  while True:
   q=json.loads(self.sql(f"select public.c12_list_v1('{a}',null,'all',{cursor})",'user_owner'));self.assertLessEqual(len(q['items']),25);self.assertLess(len(json.dumps(q,ensure_ascii=False).encode()),32768);self.assertNotIn('reason',json.dumps(q));seen.extend(x['id']for x in q['items'])
   if not q['more']:break
   last=q['items'][-1];cursor=f"'{last['created_at']}','{last['id']}'"
  self.assertEqual(len(seen),1000);self.assertEqual(len(set(seen)),1000)
  timing=json.loads(self.sql("create temporary table measured(ms double precision);do $$declare started timestamptz;begin for i in 1..50 loop started:=clock_timestamp();perform public.c12_list_v1('"+a+"',null,'all');insert into measured values(extract(epoch from clock_timestamp()-started)*1000);end loop;end$$;select json_build_object('samples',count(*),'p95_ms',percentile_cont(0.95)within group(order by ms))from measured",'user_owner'));self.assertLess(timing['p95_ms'],300)
  out=ROOT/'docs/07-handoff/evidence/i4c-local-2026-10-28';out.mkdir(parents=True,exist_ok=True);(out/'sql-scale.json').write_text(json.dumps({'scope':'Actual disposable PG17,1000 requests,50 warm SQL queue reads; not HTTP, hosted device/load/cost proof','metrics':timing,'unique_requests':len(seen)},indent=2)+'\n')
 def test_zzzz_correction_09_each_approval_write_rolls_back(self):
  for target in ['attendance_marks','attendance_history','correction_operations','audit_events']:
   a,b,p,staff,iv,x,dates,ev=self.attendance_fixture();self.mark(a,ev,x);r=self.request(a,ev,x)['request'];event='update'if target=='attendance_marks'else'insert';body='return null;'if target=='attendance_marks'else"raise exception 'Synthetic approval failure';"
   self.sql(f"create function academy.synthetic_approval_fail()returns trigger language plpgsql as $$begin {body}end$$;create trigger synthetic_approval_fail before {event} on academy.{target} for each row execute function academy.synthetic_approval_fail()")
   try:self.decide(a,ev,r,ok=False)
   finally:self.sql(f"drop trigger synthetic_approval_fail on academy.{target};drop function academy.synthetic_approval_fail()")
   self.assertEqual(self.correction_detail(a,ev,r)['state'],'pending');self.assertEqual(self.correction_detail(a,ev,r)['current'],'present');self.assertEqual(len(self.history(a,ev,x)['items']),1)
 def test_zzzz_correction_10_approval_vs_direct_actual_race(self):
  a,b,p,staff,iv,x,dates,ev=self.attendance_fixture();self.mark(a,ev,x);r=self.request(a,ev,x)['request']
  with concurrent.futures.ThreadPoolExecutor(max_workers=2)as pool:
   one=pool.submit(self.decide,a,ev,r);two=pool.submit(self.mark,a,ev,x,'user_owner',1,'absent','Concurrent direct');out=[one.result(),two.result()]
  self.assertEqual(sum('error'not in value for value in out),1);self.assertEqual(self.correction_detail(a,ev,r)['current'],'absent');self.assertEqual(len(self.history(a,ev,x)['items']),2)
if __name__=='__main__':
 suite=unittest.TestSuite();suite.addTests(unittest.defaultTestLoader.loadTestsFromNames([n for n in unittest.defaultTestLoader.getTestCaseNames(CorrectionBoundary)if n.startswith('test_zzzz_correction_')],CorrectionBoundary));result=unittest.TextTestRunner(verbosity=2).run(suite);raise SystemExit(not result.wasSuccessful())
