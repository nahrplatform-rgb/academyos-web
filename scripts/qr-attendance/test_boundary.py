"""Actual disposable PG17 QR boundary; synthetic local data only."""
import runpy,json,uuid,unittest,concurrent.futures
from pathlib import Path
m=runpy.run_path(str(Path(__file__).resolve().parents[1]/'corrections/test_boundary.py'));Base,ROOT=m['CorrectionBoundary'],m['ROOT']
class QrBoundary(Base):
 extra_authenticated_calls={**Base.extra_authenticated_calls,**{n:q for n,q in [('q13_context_v1','q13_context_v1(gen_random_uuid())'),('q13_sessions_v1','q13_sessions_v1(gen_random_uuid(),gen_random_uuid(),current_date)'),('q13_card_v1','q13_card_v1(gen_random_uuid(),gen_random_uuid())'),('q13_card_change_v1',"q13_card_change_v1(gen_random_uuid(),gen_random_uuid(),'issue',0,'aos:qr:1:'||repeat('a',43),gen_random_uuid())"),('q13_window_change_v1','q13_window_change_v1(gen_random_uuid(),null,0,30,30,gen_random_uuid())'),('q13_resolve_v1',"q13_resolve_v1(gen_random_uuid(),gen_random_uuid(),array[gen_random_uuid()],'aos:qr:1:'||repeat('a',43))"),('q13_capture_v1',"q13_capture_v1(gen_random_uuid(),gen_random_uuid(),array[gen_random_uuid()],'aos:qr:1:'||repeat('a',43),null,gen_random_uuid())"),('q13_operation_v1',"q13_operation_v1(gen_random_uuid(),'settings',gen_random_uuid())")]}}
 @classmethod
 def setUpClass(cls):
  super().setUpClass();cls.sql((ROOT/'supabase/migrations/20261028184008_i4d_qr_attendance.sql').read_text())
 def credential(self,a,x,act='issue',v=0,code=None,op=None,who='user_owner',ok=True):
  token=code or 'aos:qr:1:'+uuid.uuid4().hex+uuid.uuid4().hex[:11];r=self.sql(f"select public.q13_card_change_v1('{a}','{x}','{act}',{v},"+('null'if act=='revoke'else "'"+token+"'")+f",'{op or uuid.uuid4()}')",who,ok=ok);return (json.loads(r)if ok else r),token
 def capture(self,a,b,ev,code,who='user_trainer',op=None,chosen=None,ok=True):
  evs=ev if isinstance(ev,list)else[ev];raw=self.sql(f"select public.q13_capture_v1('{a}','{b}',array["+','.join("'"+e+"'::uuid"for e in evs)+f"],'{code}',"+("'"+chosen+"'"if chosen else'null')+f",'{op or uuid.uuid4()}')",who,ok=ok);return json.loads(raw)if ok else raw
 def window(self,a,ev=None,version=0,before=30,after=30,who='user_owner',ok=True):
  raw=self.sql(f"select public.q13_window_change_v1('{a}',"+("'"+ev+"'"if ev else'null')+f",{version},{before},{after},'{uuid.uuid4()}')",who,ok=ok);return json.loads(raw)if ok else raw
 def test_zzzzz_qr_01_capture_duplicate_rotation_replay(self):
  a,b,p,st,iv,x,dates,ev=self.attendance_fixture();r,code=self.credential(a,x);self.assertNotIn(code,json.dumps(r));op=str(uuid.uuid4());q=self.capture(a,b,ev,code,op=op);self.assertEqual(q['status'],'present');self.assertFalse(q['already']);self.assertEqual(q,self.capture(a,b,ev,code,op=op));self.assertTrue(self.capture(a,b,ev,code)['already']);self.assertEqual(len(self.history(a,ev,x)['items']),1)
  r,new=self.credential(a,x,'replace',1);self.assertEqual(r['version'],2);self.assertEqual(self.capture(a,b,ev,code)['error'],'card_unavailable');self.assertTrue(self.capture(a,b,ev,new)['already']);self.credential(a,x,'revoke',2);self.assertEqual(self.capture(a,b,ev,new)['error'],'card_unavailable');self.assertEqual(q,self.capture(a,b,ev,code,op=op));self.assertEqual(self.sql(f"select count(*)from academy.qr_cards where academy_id='{a}'and revoked_at is null"),'0')
 def test_zzzzz_qr_02_roles_scope_missing_and_fence(self):
  a,b,p,st,iv,x,dates,ev=self.attendance_fixture();_,code=self.credential(a,x)
  for who in ['user_platform','user_guardian','user_unknown']:
   self.capture(a,b,ev,code,who,ok=False);self.credential(a,x,who=who,ok=False);self.window(a,who=who,ok=False)
  self.credential(a,x,who='user_trainer',ok=False);self.window(a,who='user_trainer',ok=False)
  aa,bb=self.academy('user_other');self.capture(aa,bb,ev,code,'user_other',ok=False)
  self.capture(a,b,str(uuid.uuid4()),code,ok=False);self.assertEqual(self.capture(a,b,ev,'aos:qr:1:'+'x'*43)['error'],'card_unavailable');self.capture(a,b,ev,'https://example.invalid/card',ok=False)
  op=str(uuid.uuid4());self.sql(f"select public.q13_operation_v1('{a}','scan:{b}','{op}')",'user_trainer');self.assertEqual(self.capture(a,b,ev,code,op=op)['error'],'conflict')
  self.sql(f"update academy.memberships set status='suspended'where academy_id='{a}'and role='trainer'");self.capture(a,b,ev,code,ok=False)
 def test_zzzzz_qr_03_early_window_manual_unchanged_settings(self):
  a,b,p,st,iv,x,dates,ev=self.attendance_fixture();_,code=self.credential(a,x);self.retime(ev,"clock_timestamp()+interval '15 minutes'","clock_timestamp()+interval '75 minutes'");self.assertEqual(self.mark(a,ev,x)['error'],'window_closed');self.window(a,before=0);self.assertEqual(self.capture(a,b,ev,code)['error'],'no_match');self.window(a,ev,1,30,0);self.window(a,version=2,before=0,after=180);self.assertEqual(self.window(a,version=2)['error'],'stale');q=self.capture(a,b,ev,code);self.assertEqual(q['status'],'present');self.assertEqual(len(self.history(a,ev,x)['items']),1)
  self.window(a,version=3,before=181,ok=False);self.window(a,version=3,after=-1,ok=False)
 def test_zzzzz_qr_04_absent_and_atomic_rollbacks(self):
  a,b,p,st,iv,x,dates,ev=self.attendance_fixture();_,code=self.credential(a,x);self.mark(a,ev,x,status='absent');self.assertEqual(self.capture(a,b,ev,code)['error'],'correction_required');self.assertEqual(len(self.history(a,ev,x)['items']),1)
  for table in ['attendance_history','attendance_operations','qr_operations','audit_events']:
   a,b,p,st,iv,x,dates,ev=self.attendance_fixture();_,code=self.credential(a,x);self.sql(f"create function academy.synthetic_qr_fail()returns trigger language plpgsql as $$begin raise exception 'synthetic QR rollback';end$$;create trigger synthetic_qr_fail before insert on academy.{table} for each row execute function academy.synthetic_qr_fail()")
   try:self.capture(a,b,ev,code,ok=False)
   finally:self.sql(f'drop trigger synthetic_qr_fail on academy.{table};drop function academy.synthetic_qr_fail()')
   self.assertEqual(self.sql(f"select count(*)from academy.attendance_marks where event_id='{ev}'"),'0');self.assertEqual(self.history(a,ev,x)['items'],[])
 def test_zzzzz_qr_05_duplicate_parallel_manual_and_revocation_order(self):
  a,b,p,st,iv,x,dates,ev=self.attendance_fixture();_,code=self.credential(a,x)
  with concurrent.futures.ThreadPoolExecutor(max_workers=2)as pool:r=list(pool.map(lambda _:self.capture(a,b,ev,code),range(2)))
  self.assertEqual(sum(not q['already']for q in r),1);self.assertEqual(len(self.history(a,ev,x)['items']),1)
  a,b,p,st,iv,x,dates,ev=self.attendance_fixture();_,code=self.credential(a,x)
  with concurrent.futures.ThreadPoolExecutor(max_workers=2)as pool:
   f=pool.submit(self.capture,a,b,ev,code);g=pool.submit(self.mark,a,ev,x);f.result();g.result()
  self.assertEqual(len(self.history(a,ev,x)['items']),1)
  a,b,p,st,iv,x,dates,ev=self.attendance_fixture();_,code=self.credential(a,x);self.credential(a,x,'revoke',1);self.assertEqual(self.capture(a,b,ev,code)['error'],'card_unavailable');self.assertEqual(self.roster(a,ev)['saved'],0)
 def test_zzzzz_qr_06_card_settings_rollbacks_and_storage_minimal(self):
  a,b,p,st,iv,x,dates,ev=self.attendance_fixture();r,code=self.credential(a,x);self.sql("create function academy.synthetic_qr_fail()returns trigger language plpgsql as $$begin raise exception 'synthetic QR rollback';end$$;create trigger synthetic_qr_fail before insert on academy.audit_events for each row execute function academy.synthetic_qr_fail()")
  try:self.credential(a,x,'replace',1,ok=False);self.window(a,ok=False)
  finally:self.sql('drop trigger synthetic_qr_fail on academy.audit_events;drop function academy.synthetic_qr_fail()')
  self.assertTrue(self.sql(f"select public.q13_card_v1('{a}','{x}')",'user_owner'));self.assertEqual(self.capture(a,b,ev,code)['status'],'present');self.assertNotIn(code,self.sql(f"select coalesce(jsonb_agg(r)::text,'')from academy.qr_operations r where academy_id='{a}'"));self.assertEqual(self.sql(f"select count(*)from academy.qr_window_settings where academy_id='{a}'"),'0')
 def test_zzzzz_qr_07_ambiguity_complete_scope_choice_and_final_clock(self):
  a,b,p,st,iv,x,dates,ev=self.attendance_fixture();_,code=self.credential(a,x);second=self.sql(f"select id from academy.publication_events where academy_id='{a}'and program_id='{p['id']}'and id<>'{ev}'and published order by day limit 1")
  self.retime(ev,"clock_timestamp()-interval '45 minutes'","clock_timestamp()+interval '15 minutes'");self.retime(second,"clock_timestamp()+interval '15 minutes'","clock_timestamp()+interval '75 minutes'")
  self.assertEqual(self.capture(a,b,[ev,second],code)['error'],'ambiguous');self.assertEqual(self.sql(f"select count(*)from academy.attendance_marks where academy_id='{a}'"),'0');self.assertEqual(self.capture(a,b,[ev,second],code,chosen=second)['event'],second);self.assertEqual(len(self.history(a,ev,x)['items']),0)
  a,b,p,st,iv,x,dates,ev=self.attendance_fixture();_,code=self.credential(a,x);self.retime(ev,"clock_timestamp()-interval '61 minutes'","clock_timestamp()-interval '30 minutes'+interval '2 seconds'")
  self.sql("create function academy.synthetic_qr_slow()returns trigger language plpgsql as $$begin perform pg_sleep(2.2);return new;end$$;create trigger synthetic_qr_slow before insert on academy.qr_operations for each row execute function academy.synthetic_qr_slow()")
  try:self.capture(a,b,ev,code,ok=False)
  finally:self.sql('drop trigger synthetic_qr_slow on academy.qr_operations;drop function academy.synthetic_qr_slow()')
  self.assertEqual(self.sql(f"select count(*)from academy.attendance_marks where academy_id='{a}'"),'0');self.assertEqual(self.history(a,ev,x)['items'],[])
 def test_zzzzz_qr_08_sessions_minimal_current_and_exact_receipt_denial(self):
  a,b,p,st,iv,x,dates,ev=self.attendance_fixture();_,code=self.credential(a,x);op=str(uuid.uuid4());self.capture(a,b,ev,code,op=op);self.assertNotIn('token_hash',self.sql(f"select public.q13_card_v1('{a}','{x}')",'user_owner'))
  day=self.sql(f"select(starts_at at time zone (select timezone from academy.academies where id='{a}'))::date from academy.publication_events where id='{ev}'")
  r=json.loads(self.sql(f"select public.q13_sessions_v1('{a}','{b}','{day}')",'user_trainer'));self.assertEqual(len(r['items']),1);self.assertEqual(r['items'][0]['present'],1);self.assertNotIn(code,json.dumps(r));self.assertLess(len(json.dumps(r).encode()),32768)
  self.sql(f"update academy.trainer_assignments set state='ended'where staff_id='{st}'");self.sql(f"select public.q13_operation_v1('{a}','scan:{b}','{op}')",'user_trainer',ok=False);self.sql(f"select public.q13_sessions_v1('{a}','{b}','{day}')",'user_trainer',ok=False)
 def test_zzzzz_qr_09_thousand_players_bounded_resolution_and_warm_samples(self):
  a,b,p,st,iv,original,dates=self.fixture(False);day=dates[0]
  self.sql(f"insert into academy.players(academy_id,branch_id,display_name,normalized_name)select '{a}','{b}',repeat('界',160),'qr synthetic '||n from generate_series(1,1000)n;insert into academy.date_rosters select '{a}','{p['id']}','{day}',id from academy.players where academy_id='{a}'and id<>'{original}';update academy.date_plans set roster_count=1000,capacity=1000 where program_id='{p['id']}'and local_date='{day}'")
  j=self.prepare_pub(a,self.pub(a,p));self.mutate(a,j,'activate');ev=self.schedule(a)['items'][0]['id'];self.retime(ev);x=self.sql(f"select player_id from academy.publication_rosters where event_id='{ev}'order by player_id limit 1");_,code=self.credential(a,x)
  self.sql(f"insert into academy.qr_cards select gen_random_uuid(),'{a}',p.id,extensions.digest('local synthetic hash:'||p.id::text,'sha256'),clock_timestamp(),null from academy.players p where p.academy_id='{a}'and p.id not in('{original}','{x}');insert into academy.qr_card_heads select academy_id,player_id,1,id from academy.qr_cards where academy_id='{a}'and player_id<>'{x}'")
  q=f"public.q13_resolve_v1('{a}','{b}',array['{ev}'::uuid],'{code}')";result=json.loads(self.sql('select '+q,'user_trainer'));self.assertEqual(len(result['items']),1);self.assertEqual(result['items'][0]['player'],x);self.assertLess(len(json.dumps(result,ensure_ascii=False).encode()),4096)
  timing=json.loads(self.sql("create temp table qr_measured(ms numeric);do $$declare n integer;v timestamptz;begin for n in 1..50 loop v:=clock_timestamp();perform "+q+";insert into qr_measured values(extract(epoch from clock_timestamp()-v)*1000);end loop;end$$;select jsonb_build_object('samples',count(*),'p95_ms',percentile_cont(0.95)within group(order by ms),'max_ms',max(ms))from qr_measured",'user_trainer'));self.assertLess(timing['p95_ms'],300)
  out=ROOT/'docs/07-handoff/evidence/i4d-local-2026-10-28';out.mkdir(parents=True,exist_ok=True);(out/'sql-scale.json').write_text(json.dumps({'scope':'Actual disposable PG17,1000 fictional players/cards and50 warm indexed resolve reads; excludes hosted HTTP/camera/Upstash/cost/WAL acceptance','metrics':timing,'response_bytes':len(json.dumps(result,ensure_ascii=False).encode())},indent=2)+'\n')
if __name__=='__main__':
 suite=unittest.TestSuite();suite.addTests(unittest.defaultTestLoader.loadTestsFromNames([n for n in unittest.defaultTestLoader.getTestCaseNames(QrBoundary)if n.startswith('test_zzzzz_qr_')],QrBoundary));r=unittest.TextTestRunner(verbosity=2).run(suite);raise SystemExit(not r.wasSuccessful())
